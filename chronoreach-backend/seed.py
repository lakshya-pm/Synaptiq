import asyncio
import datetime
import json
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, get_db, init_db
from models import Lead, Workflow, WorkflowNode, WorkflowEdge, Campaign, CampaignLead, Event, ClawbotPending

async def seed_data():
    await init_db()
    async for session in get_db():
        # Leads
        leads_data = [
            {"first_name": "Priya", "last_name": "Sharma", "email": "priya.s@acmesaas.com", "company": "AcmeSaaS", "title": "CTO", "insight": "Fintech"},
            {"first_name": "Rahul", "last_name": "Mehta", "email": "rahul.m@razorpay.com", "company": "Razorpay", "title": "VP Engineering", "insight": "Just raised Series F — $160M"},
            {"first_name": "Ananya", "last_name": "Krishnan", "email": "ananya.k@zepto.com", "company": "Zepto", "title": "Head of Product", "insight": "Expanding to 100 cities by Q2 2026"},
            {"first_name": "Vikram", "last_name": "Nair", "email": "vikram.n@phonepe.com", "company": "PhonePe", "title": "CTO", "custom_fields": {"language_preference": "hi"}},
            {"first_name": "Arjun", "last_name": "Patel", "email": "arjun.p@cred.com", "company": "CRED", "title": "Founder", "insight": "Launched vehicle management feature"},
            {"first_name": "Deepika", "last_name": "Rao", "email": "deepika.r@groww.com", "company": "Groww", "title": "Engineering Director"},
            {"first_name": "Siddharth", "last_name": "Kumar", "email": "siddharth.k@meesho.com", "company": "Meesho", "title": "CTO"},
            {"first_name": "Kavya", "last_name": "Menon", "email": "kavya.m@slice.com", "company": "Slice", "title": "VP Product"},
            {"first_name": "Rohan", "last_name": "Gupta", "email": "rohan.g@bharatpe.com", "company": "BharatPe", "title": "Head of Tech"},
            {"first_name": "Neha", "last_name": "Joshi", "email": "neha.j@cashfree.com", "company": "Cashfree", "title": "CTO", "insight": "Launched instant bank verification API"},
            {"first_name": "Amit", "last_name": "Singh", "email": "amit.s@juspay.com", "company": "Juspay", "title": "Founder", "insight": "Processing 80M transactions/day"},
            {"first_name": "Rohit", "last_name": "Shah", "email": "rohit@zoho.com", "company": "Zoho", "title": "Engineering"},
            {"first_name": "Preethi", "last_name": "Nair", "email": "p.nair@salesforce.com", "company": "Salesforce India", "title": "CTO"},
            {"first_name": "Maya", "last_name": "Reddy", "email": "maya.r@freshworks.com", "company": "FreshWorks", "title": "VP Engineering"},
            {"first_name": "Karan", "last_name": "Malhotra", "email": "karan.m@policybazaar.com", "company": "PolicyBazaar", "title": "CTO"},
        ]
        
        db_leads = []
        for l in leads_data:
            lead = Lead(**l)
            session.add(lead)
            db_leads.append(lead)
        await session.commit()
        for l in db_leads: await session.refresh(l)

        # Workflow
        wf = Workflow(name="Fintech Founders Outreach", description="3-step outreach with clawbot and meeting check")
        session.add(wf)
        await session.commit()
        await session.refresh(wf)

        # Nodes
        nodes = [
            WorkflowNode(id="n1", workflow_id=wf.id, node_type="trigger", position_x=100.0, position_y=100.0),
            WorkflowNode(id="n2", workflow_id=wf.id, node_type="blocklist", position_x=300.0, position_y=100.0),
            WorkflowNode(id="n3", workflow_id=wf.id, node_type="ai_message", config={"step_number": 1}, position_x=500.0, position_y=100.0),
            WorkflowNode(id="n4", workflow_id=wf.id, node_type="delay", config={"hours": 36}, position_x=700.0, position_y=100.0),
            WorkflowNode(id="n5", workflow_id=wf.id, node_type="send_email", position_x=900.0, position_y=100.0),
            WorkflowNode(id="n6", workflow_id=wf.id, node_type="condition", config={"check": "reply_received"}, position_x=1100.0, position_y=100.0),
            WorkflowNode(id="n7_reply", workflow_id=wf.id, node_type="ai_message", config={"step_number": 2}, position_x=1300.0, position_y=0.0),
            WorkflowNode(id="n7_noreply", workflow_id=wf.id, node_type="clawbot", config={"threshold": 3}, position_x=1300.0, position_y=200.0),
            WorkflowNode(id="n8", workflow_id=wf.id, node_type="send_email", position_x=1500.0, position_y=100.0),
            WorkflowNode(id="n9", workflow_id=wf.id, node_type="ai_message", config={"step_number": 3}, label="meeting_check", position_x=1700.0, position_y=100.0)
        ]
        session.add_all(nodes)

        # Edges
        edges = [
            WorkflowEdge(id="e1", workflow_id=wf.id, source="n1", target="n2"),
            WorkflowEdge(id="e2", workflow_id=wf.id, source="n2", target="n3"),
            WorkflowEdge(id="e3", workflow_id=wf.id, source="n3", target="n4"),
            WorkflowEdge(id="e4", workflow_id=wf.id, source="n4", target="n5"),
            WorkflowEdge(id="e5", workflow_id=wf.id, source="n5", target="n6"),
            WorkflowEdge(id="e6_reply", workflow_id=wf.id, source="n6", target="n7_reply", condition_label="replied"),
            WorkflowEdge(id="e6_noreply", workflow_id=wf.id, source="n6", target="n7_noreply", condition_label="no_reply"),
            WorkflowEdge(id="e7_1", workflow_id=wf.id, source="n7_reply", target="n8"),
            WorkflowEdge(id="e7_2", workflow_id=wf.id, source="n7_noreply", target="n8"),
            WorkflowEdge(id="e8", workflow_id=wf.id, source="n8", target="n9"),
        ]
        session.add_all(edges)
        await session.commit()

        # Campaign
        camp = Campaign(
            name="Q1 FinTech Leaders",
            workflow_id=wf.id,
            status="completed", # Already run for demo
            persona_config={"tone": "casual-professional"},
            cal_url="https://cal.com/ravi/15min",
            user_phone="whatsapp:+919876543210"
        )
        session.add(camp)
        await session.commit()
        await session.refresh(camp)

        # Campaign Leads
        camp_leads = []
        for l in db_leads:
            cl = CampaignLead(campaign_id=camp.id, lead_id=l.id, status="completed", current_node_id=nodes[-1].id)
            camp_leads.append(cl)
        session.add_all(camp_leads)
        await session.commit()

        # Events
        t_base = datetime.datetime.utcnow() - datetime.timedelta(hours=48)
        events = []
        
        # Priya
        priya = next(l for l in db_leads if l.first_name == "Priya")
        events.extend([
            Event(campaign_id=camp.id, lead_id=priya.id, event_type="message_generated", created_at=t_base, payload={"subject":"Intro"}),
            Event(campaign_id=camp.id, lead_id=priya.id, event_type="email_sent", created_at=t_base+datetime.timedelta(hours=1)),
            Event(campaign_id=camp.id, lead_id=priya.id, event_type="email_opened", created_at=t_base+datetime.timedelta(hours=5)),
            Event(campaign_id=camp.id, lead_id=priya.id, event_type="email_opened", created_at=t_base+datetime.timedelta(hours=10)),
            Event(campaign_id=camp.id, lead_id=priya.id, event_type="email_opened", created_at=t_base+datetime.timedelta(hours=15)),
            Event(campaign_id=camp.id, lead_id=priya.id, event_type="clawbot_triggered", created_at=t_base+datetime.timedelta(hours=16)),
        ])

        # Rahul
        rahul = next(l for l in db_leads if l.first_name == "Rahul")
        events.extend([
            Event(campaign_id=camp.id, lead_id=rahul.id, event_type="message_generated", created_at=t_base, payload={"subject":"Series F"}),
            Event(campaign_id=camp.id, lead_id=rahul.id, event_type="email_sent", created_at=t_base+datetime.timedelta(hours=1)),
            Event(campaign_id=camp.id, lead_id=rahul.id, event_type="email_opened", created_at=t_base+datetime.timedelta(hours=2)),
            Event(campaign_id=camp.id, lead_id=rahul.id, event_type="reply_received", created_at=t_base+datetime.timedelta(hours=3), payload={"text": "Looks interesting, can we chat?"}),
            Event(campaign_id=camp.id, lead_id=rahul.id, event_type="meeting_booked", created_at=t_base+datetime.timedelta(hours=4)),
        ])

        # Ananya
        ananya = next(l for l in db_leads if l.first_name == "Ananya")
        events.extend([
            Event(campaign_id=camp.id, lead_id=ananya.id, event_type="message_generated", created_at=t_base, payload={"subject":"100 cities expansion"}),
            Event(campaign_id=camp.id, lead_id=ananya.id, event_type="email_sent", created_at=t_base+datetime.timedelta(hours=1)),
            Event(campaign_id=camp.id, lead_id=ananya.id, event_type="email_opened", created_at=t_base+datetime.timedelta(hours=6)),
            Event(campaign_id=camp.id, lead_id=ananya.id, event_type="reply_received", created_at=t_base+datetime.timedelta(hours=7), payload={"text": "We're locked in with HubSpot but next quarter maybe"}),
        ])

        # Rohit (blocked context)
        rohit = next(l for l in db_leads if l.first_name == "Rohit")
        events.extend([
            Event(campaign_id=camp.id, lead_id=rohit.id, event_type="shield_activated", created_at=t_base),
            Event(campaign_id=camp.id, lead_id=rohit.id, event_type="blocked", created_at=t_base, payload={"reason": "competitor domain"}),
        ])

        # Vikram
        vikram = next(l for l in db_leads if l.first_name == "Vikram")
        events.extend([
            Event(campaign_id=camp.id, lead_id=vikram.id, event_type="message_generated", created_at=t_base, payload={"language": "hi", "subject": "PhonePe"}),
            Event(campaign_id=camp.id, lead_id=vikram.id, event_type="email_sent", created_at=t_base+datetime.timedelta(hours=1)),
            Event(campaign_id=camp.id, lead_id=vikram.id, event_type="email_opened", created_at=t_base+datetime.timedelta(hours=3)),
        ])

        session.add_all(events)
        await session.commit()

        # Clawbot Pending
        amit = next(l for l in db_leads if l.first_name == "Amit")
        neha = next(l for l in db_leads if l.first_name == "Neha")
        c_pendings = [
            ClawbotPending(campaign_id=camp.id, lead_id=priya.id, action_type="high_intent", draft_message="Noticed you opened the email 3 times. Want to chat?", status="pending"),
            ClawbotPending(campaign_id=camp.id, lead_id=amit.id, action_type="high_intent", draft_message="Draft follow-up 1", status="approved"),
            ClawbotPending(campaign_id=camp.id, lead_id=neha.id, action_type="high_intent", draft_message="Draft follow-up 2", status="approved"),
        ]
        session.add_all(c_pendings)
        await session.commit()

        print("Database seeded successfully!")
        
if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_data())
