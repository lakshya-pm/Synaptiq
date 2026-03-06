"""
Synaptiq — Demo Simulation Triggers
POST endpoints to simulate email opens, replies, and positive intents for live demo.
"""
import os
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import Event, Lead, ClawbotPending
from engine.executor import event_bus
from services.clawbot_service import send_whatsapp, build_hot_lead_alert, build_objection_alert, build_meeting_alert

router = APIRouter(prefix="/api/simulate", tags=["simulate"])


@router.post("/open/{lead_id}")
async def simulate_open(lead_id: int, campaign_id: int = 1, db: AsyncSession = Depends(get_db)):
    """Simulate an email open for a lead. Call 3 times to trigger ClawBot."""
    lead = await db.get(Lead, lead_id)
    if not lead:
        return {"error": "Lead not found"}

    ev = Event(
        campaign_id=campaign_id, lead_id=lead_id,
        node_id="tracking_pixel", event_type="email_opened",
        payload={"lead_name": f"{lead.first_name} {lead.last_name}", "company": lead.company, "source": "simulation"}
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)

    event_bus.publish({
        "id": ev.id, "campaign_id": campaign_id, "lead_id": lead_id,
        "node_id": "tracking_pixel", "event_type": "email_opened",
        "payload": ev.payload, "created_at": ev.created_at.isoformat()
    })

    # Count opens
    opens = await db.scalar(
        select(func.count(Event.id)).where(
            Event.campaign_id == campaign_id, Event.lead_id == lead_id,
            Event.event_type == "email_opened"
        )
    )

    result = {"status": "open_recorded", "total_opens": opens, "lead": f"{lead.first_name} {lead.last_name}"}

    # Trigger ClawBot after 2+ opens
    if opens >= 2:
        # Check if already triggered
        existing = await db.scalar(
            select(func.count(ClawbotPending.id)).where(
                ClawbotPending.campaign_id == campaign_id,
                ClawbotPending.lead_id == lead_id,
                ClawbotPending.action_type == "high_intent"
            )
        )
        if existing == 0:
            from services.llm_service import llm_service
            lead_dict = {"first_name": lead.first_name, "last_name": lead.last_name, "title": lead.title, "company": lead.company}
            
            draft = f"Hi {lead.first_name}, noticed you've been thinking about our intro — would love to continue the conversation."
            try:
                msg = await llm_service.generate_message(lead_dict, 2, {"tone": "casual"})
                draft = msg.get("body", draft)
            except:
                pass

            cp = ClawbotPending(
                campaign_id=campaign_id, lead_id=lead_id,
                action_type="high_intent", draft_message=draft,
                user_phone=os.getenv("USER_PHONE", ""), status="pending"
            )
            db.add(cp)
            await db.commit()

            alert = build_hot_lead_alert(lead_dict, draft, opens)
            phone = os.getenv("USER_PHONE", "").replace("whatsapp:", "")
            if phone:
                send_whatsapp(phone, alert)

            # Log event
            clawbot_ev = Event(
                campaign_id=campaign_id, lead_id=lead_id,
                node_id="clawbot", event_type="clawbot_triggered",
                payload={"lead_name": f"{lead.first_name} {lead.last_name}", "opens": opens, "type": "high_intent"}
            )
            db.add(clawbot_ev)
            await db.commit()
            await db.refresh(clawbot_ev)
            event_bus.publish({
                "id": clawbot_ev.id, "campaign_id": campaign_id, "lead_id": lead_id,
                "node_id": "clawbot", "event_type": "clawbot_triggered",
                "payload": clawbot_ev.payload, "created_at": clawbot_ev.created_at.isoformat()
            })
            result["clawbot"] = "WhatsApp alert sent!"

    return result


@router.post("/reply/{lead_id}")
async def simulate_reply(lead_id: int, campaign_id: int = 1, db: AsyncSession = Depends(get_db)):
    """Simulate a lead replying with an objection. Triggers ClawBot objection handler."""
    lead = await db.get(Lead, lead_id)
    if not lead:
        return {"error": "Lead not found"}

    reply_text = "We're locked in with HubSpot but open to revisiting next quarter."

    # Record reply event
    ev = Event(
        campaign_id=campaign_id, lead_id=lead_id,
        node_id="inbox", event_type="reply_received",
        payload={"reply_text": reply_text, "lead_name": f"{lead.first_name} {lead.last_name}"}
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)

    event_bus.publish({
        "id": ev.id, "campaign_id": campaign_id, "lead_id": lead_id,
        "node_id": "inbox", "event_type": "reply_received",
        "payload": ev.payload, "created_at": ev.created_at.isoformat()
    })

    # Classify objection
    from services.llm_service import llm_service
    classification = await llm_service.classify_objection(reply_text)
    obj_type = classification.get("type", "timing")
    confidence = classification.get("confidence", 0.94)

    # Generate response draft
    lead_dict = {"first_name": lead.first_name, "last_name": lead.last_name, "title": lead.title, "company": lead.company}
    draft = await llm_service.generate_objection_response(lead_dict, obj_type, reply_text)

    # Save pending action
    cp = ClawbotPending(
        campaign_id=campaign_id, lead_id=lead_id,
        action_type="objection", draft_message=draft,
        user_phone=os.getenv("USER_PHONE", ""), status="pending"
    )
    db.add(cp)
    await db.commit()

    # Send WhatsApp
    label = f"⏰ {obj_type.upper()} ({int(confidence * 100)}% confidence)"
    alert = build_objection_alert(lead_dict, reply_text, label, draft)
    phone = os.getenv("USER_PHONE", "").replace("whatsapp:", "")
    if phone:
        send_whatsapp(phone, alert)

    # Log event
    obj_ev = Event(
        campaign_id=campaign_id, lead_id=lead_id,
        node_id="clawbot", event_type="objection_detected",
        payload={"type": obj_type, "confidence": confidence, "reply_text": reply_text,
                 "lead_name": f"{lead.first_name} {lead.last_name}"}
    )
    db.add(obj_ev)
    await db.commit()
    await db.refresh(obj_ev)
    event_bus.publish({
        "id": obj_ev.id, "campaign_id": campaign_id, "lead_id": lead_id,
        "node_id": "clawbot", "event_type": "objection_detected",
        "payload": obj_ev.payload, "created_at": obj_ev.created_at.isoformat()
    })

    return {"status": "objection_handled", "type": obj_type, "confidence": confidence, "whatsapp": "sent"}


@router.post("/positive/{lead_id}")
async def simulate_positive(lead_id: int, campaign_id: int = 1, db: AsyncSession = Depends(get_db)):
    """Simulate a lead replying positively. Triggers meeting booking flow."""
    lead = await db.get(Lead, lead_id)
    if not lead:
        return {"error": "Lead not found"}

    reply_text = "Yes, I'd be open to a quick call this week."

    # Record reply event
    ev = Event(
        campaign_id=campaign_id, lead_id=lead_id,
        node_id="inbox", event_type="reply_received",
        payload={"reply_text": reply_text, "lead_name": f"{lead.first_name} {lead.last_name}", "intent": "positive"}
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)

    event_bus.publish({
        "id": ev.id, "campaign_id": campaign_id, "lead_id": lead_id,
        "node_id": "inbox", "event_type": "reply_received",
        "payload": ev.payload, "created_at": ev.created_at.isoformat()
    })

    # Save pending meeting action
    cal_url = os.getenv("CAL_URL", "cal.com/ravi/intro")
    cp = ClawbotPending(
        campaign_id=campaign_id, lead_id=lead_id,
        action_type="meeting",
        draft_message=f"Send your booking link?\n{cal_url}",
        user_phone=os.getenv("USER_PHONE", ""), status="pending"
    )
    db.add(cp)
    await db.commit()

    # Send WhatsApp
    lead_dict = {"first_name": lead.first_name, "last_name": lead.last_name, "title": lead.title, "company": lead.company}
    alert = f"""🦅 Positive Intent — {lead.first_name} {lead.last_name}
─────────────────────────────────────
💬 "{reply_text}"

Send your booking link?
{cal_url}

Reply: ✅ YES  📅 SLOTS  ✏️ CUSTOM"""

    phone = os.getenv("USER_PHONE", "").replace("whatsapp:", "")
    if phone:
        send_whatsapp(phone, alert)

    # Log event
    pos_ev = Event(
        campaign_id=campaign_id, lead_id=lead_id,
        node_id="clawbot", event_type="positive_intent",
        payload={"reply_text": reply_text, "lead_name": f"{lead.first_name} {lead.last_name}"}
    )
    db.add(pos_ev)
    await db.commit()
    await db.refresh(pos_ev)
    event_bus.publish({
        "id": pos_ev.id, "campaign_id": campaign_id, "lead_id": lead_id,
        "node_id": "clawbot", "event_type": "positive_intent",
        "payload": pos_ev.payload, "created_at": pos_ev.created_at.isoformat()
    })

    return {"status": "positive_intent_triggered", "whatsapp": "sent", "cal_url": cal_url}
