import json
from collections import deque
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import AsyncSessionLocal
from models import Campaign, Lead, CampaignLead, Event, WorkflowNode, WorkflowEdge, ClawbotPending
from engine.timing import compute_next_send_time
from engine.email_sender import email_sender
from services.llm_service import llm_service
from apscheduler.triggers.date import DateTrigger
import asyncio

class EventBus:
    def __init__(self):
        self.queues = []

    def subscribe(self):
        q = asyncio.Queue()
        self.queues.append(q)
        return q

    def unsubscribe(self, q):
        if q in self.queues:
            self.queues.remove(q)

    def publish(self, data: dict):
        for q in self.queues:
            try:
                q.put_nowait(data)
            except asyncio.QueueFull:
                pass

event_bus = EventBus()

class WorkflowExecutor:
    def __init__(self, campaign_id: int, scheduler):
        self.campaign_id = campaign_id
        self.scheduler = scheduler
        self.nodes = {}
        self.edges = []
        self.workflow_id = None
        
    async def load_workflow(self, session: AsyncSession):
        camp = await session.get(Campaign, self.campaign_id)
        if not camp: return False
        self.workflow_id = camp.workflow_id
        self.safe_mode = camp.safe_mode
        self.campaign_config = {"daily_send_cap": camp.daily_send_cap, "timezone": camp.timezone}
        
        res_nodes = await session.execute(select(WorkflowNode).where(WorkflowNode.workflow_id == self.workflow_id))
        for nd in res_nodes.scalars().all():
            self.nodes[nd.id] = {"id": nd.id, "node_type": nd.node_type, "label": nd.label, "config": nd.config or {}}
            
        res_edges = await session.execute(select(WorkflowEdge).where(WorkflowEdge.workflow_id == self.workflow_id))
        self.edges = res_edges.scalars().all()
        return True

    def get_topological_order(self) -> list[str]:
        in_degree = {nid: 0 for nid in self.nodes}
        adj = {nid: [] for nid in self.nodes}
        for edge in self.edges:
            if edge.source in adj and edge.target in in_degree:
                adj[edge.source].append(edge.target)
                in_degree[edge.target] += 1

        queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
        order = []
        while queue:
            nid = queue.popleft()
            order.append(nid)
            for neighbor in adj[nid]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        return order

    async def execute_campaign(self):
        async with AsyncSessionLocal() as session:
            if not await self.load_workflow(session): return
            res = await session.execute(select(CampaignLead).where(CampaignLead.campaign_id == self.campaign_id))
            cleads = res.scalars().all()
            for cl in cleads:
                if cl.status in ("completed", "blocked"): continue
                asyncio.create_task(self.execute_for_lead_task(cl.lead_id, cl.current_node_id))
                
    async def execute_for_lead_task(self, lead_id: int, start_node_id: str):
        async with AsyncSessionLocal() as session:
            try:
                await self.execute_for_lead(lead_id, start_node_id, session)
            except Exception as e:
                print(f"Error executing lead {lead_id}: {e}")

    async def execute_for_lead(self, lead_id: int, start_node_id: str, session: AsyncSession):
        if not self.nodes:
            await self.load_workflow(session)
        order = self.get_topological_order()
        
        if start_node_id:
            try:
                start_idx = order.index(start_node_id)
                order = order[start_idx:]
            except ValueError:
                pass
                
        lead = await session.get(Lead, lead_id)
        
        for node_id in order:
            node = self.nodes.get(node_id)
            if not node: continue
            node_type = node["node_type"]
            
            if node_type == "trigger":
                await self._handle_trigger(node, lead, session)
            elif node_type == "blocklist":
                if await self._handle_blocklist(node, lead, session): return
            elif node_type == "ai_message":
                await self._handle_ai_message(node, lead, session)
            elif node_type == "delay":
                await self._handle_delay(node, lead, session)
                return # Paused
            elif node_type == "send_email":
                await self._handle_send_email(node, lead, session)
            elif node_type == "condition":
                next_node_id = await self._handle_condition(node, lead, session)
                if next_node_id:
                    await self.execute_for_lead(lead_id, next_node_id, session)
                return
            elif node_type == "clawbot":
                if await self._handle_clawbot(node, lead, session): return
                
            cl_stmt = select(CampaignLead).where(CampaignLead.campaign_id==self.campaign_id, CampaignLead.lead_id==lead.id)
            cl = (await session.execute(cl_stmt)).scalar_one_or_none()
            if cl:
                cl.current_node_id = node_id
                await session.commit()
                
        cl_stmt = select(CampaignLead).where(CampaignLead.campaign_id==self.campaign_id, CampaignLead.lead_id==lead.id)
        cl = (await session.execute(cl_stmt)).scalar_one_or_none()
        if cl:
            cl.status = "completed"
            await session.commit()

    async def _handle_trigger(self, node, lead, session):
        await self._log_event(lead.id, node["id"], "trigger_started", {}, session)

    async def _handle_blocklist(self, node, lead, session):
        domains = ["zoho.com", "salesforce.com", "hubspot.com", "freshworks.com", "pipedrive.com"]
        if any(d in (lead.email or "").lower() for d in domains):
            await self._log_event(lead.id, node["id"], "shield_activated", {"reason": "competitor domain"}, session)
            await self._log_event(lead.id, node["id"], "blocked", {"reason": "competitor domain"}, session)
            cl_stmt = select(CampaignLead).where(CampaignLead.campaign_id==self.campaign_id, CampaignLead.lead_id==lead.id)
            cl = (await session.execute(cl_stmt)).scalar_one_or_none()
            if cl:
                cl.status = "blocked"
                await session.commit()
            return True
        return False
        
    async def _handle_ai_message(self, node, lead, session):
        ld_dict = {"first_name": lead.first_name, "last_name": lead.last_name, "company": lead.company, "title": lead.title, "custom_fields": lead.custom_fields}
        msg = await llm_service.generate_message(ld_dict, node["config"].get("step_number", 1), {"tone": "casual"})
        
        cl_stmt = select(CampaignLead).where(CampaignLead.campaign_id==self.campaign_id, CampaignLead.lead_id==lead.id)
        cl = (await session.execute(cl_stmt)).scalar_one_or_none()
        if cl:
            cl.current_message = json.dumps(msg)
            await session.commit()
            
        await self._log_event(lead.id, node["id"], "message_generated", {"subject": msg.get("subject"), "body": msg.get("body","")[:50], "hooks_used": msg.get("hooks_used")}, session)

    async def _handle_delay(self, node, lead, session):
        send_at, jitter = compute_next_send_time(node["config"], sends_today=0, campaign_day=1)
        await self._log_event(lead.id, node["id"], "scheduled", {"scheduled_for": send_at.isoformat(), "jitter_applied": jitter}, session)
        
        def resume_callback(camp_id, l_id, n_id):
            asyncio.run(self.execute_for_lead_task(l_id, n_id))
            
        next_node_id = None
        for edge in self.edges:
            if edge.source == node["id"]:
                next_node_id = edge.target
                break
                
        if next_node_id and self.scheduler:
            self.scheduler.add_job(resume_callback, trigger=DateTrigger(run_date=send_at), args=[self.campaign_id, lead.id, next_node_id])

    async def _handle_send_email(self, node, lead, session):
        cl_stmt = select(CampaignLead).where(CampaignLead.campaign_id==self.campaign_id, CampaignLead.lead_id==lead.id)
        cl = (await session.execute(cl_stmt)).scalar_one_or_none()
        msg = {}
        if cl and cl.current_message:
            try: msg = json.loads(cl.current_message)
            except: pass
            
        subject = msg.get("subject", "Following up")
        body = msg.get("body", "Hi, taking a look.")
        
        success = await email_sender.send(lead.email, subject, body)
        if success:
            await self._log_event(lead.id, node["id"], "email_sent", {"subject": subject}, session)
            
    async def _handle_condition(self, node, lead, session):
        check = node["config"].get("check", "reply_received")
        if check == "reply_received":
            stmt = select(func.count(Event.id)).where(Event.campaign_id==self.campaign_id, Event.lead_id==lead.id, Event.event_type=="reply_received")
            cnt = await session.scalar(stmt)
            matched_label = "replied" if cnt > 0 else "no_reply"
        else:
            matched_label = "no_reply"
            
        for edge in self.edges:
            if edge.source == node["id"] and edge.condition_label == matched_label:
                await self._log_event(lead.id, node["id"], "condition_evaluated", {"check": check, "result": matched_label, "next_node": edge.target}, session)
                return edge.target
        return None

    async def _handle_clawbot(self, node, lead, session):
        stmt = select(func.count(Event.id)).where(Event.campaign_id==self.campaign_id, Event.lead_id==lead.id, Event.event_type=="email_opened")
        cnt = await session.scalar(stmt)
        threshold = node["config"].get("threshold", 3)
        if cnt >= threshold:
            cp = ClawbotPending(campaign_id=self.campaign_id, lead_id=lead.id, action_type="high_intent", draft_message="AI suggests customized reply.", user_phone="")
            session.add(cp)
            await session.commit()
            await self._log_event(lead.id, node["id"], "clawbot_triggered", {"threshold_met": True, "opens": cnt}, session)
            return True 
        return False

    async def _log_event(self, lead_id: int, node_id: str, event_type: str, payload: dict, session: AsyncSession):
        ev = Event(campaign_id=self.campaign_id, lead_id=lead_id, node_id=node_id, event_type=event_type, payload=payload)
        session.add(ev)
        await session.commit()
        await session.refresh(ev)
        
        msg = {
            "id": ev.id, "campaign_id": self.campaign_id, "lead_id": lead_id, "node_id": node_id,
            "event_type": event_type, "payload": payload, "created_at": ev.created_at.isoformat()
        }
        event_bus.publish(msg)
