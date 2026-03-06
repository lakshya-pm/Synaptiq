from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import Campaign, CampaignLead, Event, WorkflowNode, Lead
from engine.executor import WorkflowExecutor
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])

@router.post("")
async def create_campaign(payload: dict, db: AsyncSession = Depends(get_db)):
    camp = Campaign(
        name=payload["name"],
        workflow_id=payload["workflow_id"],
        persona_config=payload.get("persona_config"),
        cal_url=payload.get("cal_url"),
        user_phone=payload.get("user_phone")
    )
    db.add(camp)
    await db.commit()
    await db.refresh(camp)
    
    lead_ids = payload.get("lead_ids", [])
    for lid in lead_ids:
        db.add(CampaignLead(campaign_id=camp.id, lead_id=lid))
        
    await db.commit()
    return {"id": camp.id}

@router.post("/{camp_id}/launch")
async def launch_campaign(camp_id: int, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    camp = await db.get(Campaign, camp_id)
    if not camp: raise HTTPException(404)
    camp.status = 'running'
    await db.commit()
    
    # We delay dynamic importing scheduler to main logic later, or get from app state
    from main import scheduler
    executor = WorkflowExecutor(camp_id, scheduler)
    
    def exec_sync():
        import asyncio
        asyncio.run(executor.execute_campaign())
        
    background_tasks.add_task(exec_sync)
    return {"status": "launching"}

@router.get("/{camp_id}/status")
async def get_c_status(camp_id: int, db: AsyncSession = Depends(get_db)):
    camp = await db.get(Campaign, camp_id)
    if not camp: raise HTTPException(404)
    
    # Count stats
    total_leads = await db.scalar(select(func.count(CampaignLead.id)).where(CampaignLead.campaign_id==camp_id))
    sent = await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="email_sent"))
    opened = await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="email_opened"))
    replied = await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="reply_received"))
    blocked = await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="blocked"))
    booked = await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="meeting_booked"))
    errors = await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="error"))
    
    res = await db.execute(select(CampaignLead).where(CampaignLead.campaign_id==camp_id))
    cls = res.scalars().all()
    leads_out = []
    for cl in cls:
        ld = await db.get(Lead, cl.lead_id)
        leads_out.append({
            "id": ld.id, "name": ld.first_name, "company": ld.company,
            "current_stage": cl.current_node_id, "status": cl.status
        })
        
    return {
        "status": camp.status, "total_leads": total_leads, "sent": sent,
        "opened": opened, "replied": replied, "blocked": blocked, 
        "meetings_booked": booked, "errors": errors, "leads": leads_out
    }

@router.get("/{camp_id}/heatmap")
async def get_c_heatmap(camp_id: int, db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    # 96 cells of 30 min length = 48 hours
    cells = []
    
    res = await db.execute(select(Event).where(Event.campaign_id==camp_id, Event.event_type.in_(["scheduled", "email_sent"])))
    events = res.scalars().all()
    
    for i in range(96):
        start = now + timedelta(minutes=30*i)
        end = start + timedelta(minutes=30)
        
        # count events in window
        status = "empty"
        count = 0
        for e in events:
            t = e.created_at # Mock: For scheduled events, payload has scheduled_for. But for simplicity let's use created_at as mock data.
            try:
                if e.event_type == "scheduled" and "scheduled_for" in e.payload:
                    t = datetime.fromisoformat(e.payload["scheduled_for"])
            except: pass
            
            if start <= t < end:
                count += 1
                status = "scheduled" if e.event_type == "scheduled" else "sent"
                
        cells.append({"window_start": start.isoformat(), "count": count, "status": status})
        
    return cells

@router.get("/{camp_id}/autopsy")
async def autopsy(camp_id: int, db: AsyncSession = Depends(get_db)):
    sent = await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="email_sent"))
    booked = await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="meeting_booked"))
    return {
        "leads_processed": await db.scalar(select(func.count(CampaignLead.id)).where(CampaignLead.campaign_id==camp_id)),
        "emails_sent": sent,
        "blocked_competitor": await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="blocked")),
        "meetings_booked": booked,
        "clawbot_interventions": await db.scalar(select(func.count(Event.id)).where(Event.campaign_id==camp_id, Event.event_type=="clawbot_triggered")),
        "human_hours_saved": sent * 0.06
    }
