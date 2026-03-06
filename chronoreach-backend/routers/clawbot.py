"""
Synaptiq ClawBot — Interactive WhatsApp Webhook
Handles YES/SKIP/PAUSE replies from Twilio WhatsApp.
"""
import os
from fastapi import APIRouter, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import ClawbotPending, Lead, Event
from engine.email_sender import email_sender
from engine.executor import event_bus
from services.clawbot_service import send_whatsapp

router = APIRouter(prefix="/api/clawbot", tags=["clawbot"])


@router.post("/webhook")
async def twilio_webhook(Body: str = Form(...), From: str = Form(...), db: AsyncSession = Depends(get_db)):
    """
    Twilio calls this when user replies on WhatsApp.
    Body = user's reply text, From = user's phone number.
    """
    reply = Body.strip().upper()
    print(f"[ClawBot] 📱 Received WhatsApp reply from {From}: {Body}")

    # Find the latest pending action for this user
    stmt = (
        select(ClawbotPending)
        .where(ClawbotPending.status == "pending")
        .order_by(ClawbotPending.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    pending = result.scalar_one_or_none()

    if not pending:
        phone = From.replace("whatsapp:", "")
        send_whatsapp(phone, "🦅 No pending actions right now. Campaign is running smoothly!")
        return {"status": "no_pending"}

    lead = await db.get(Lead, pending.lead_id)
    lead_name = f"{lead.first_name} {lead.last_name}" if lead else "Lead"
    phone = From.replace("whatsapp:", "")

    if reply in ("YES", "✅", "Y"):
        await _handle_yes(pending, lead, phone, db)
    elif reply in ("SKIP", "⏭️", "⏭"):
        pending.status = "skipped"
        await db.commit()
        send_whatsapp(phone, f"⏭️ Skipped action for {lead_name}.")
        await _log_event(pending.campaign_id, pending.lead_id, "clawbot_skipped",
                        {"lead_name": lead_name}, db)
    elif reply in ("PAUSE", "🛑", "STOP"):
        pending.status = "paused"
        await db.commit()
        send_whatsapp(phone, f"🛑 Campaign paused. Reply RESUME to continue.")
        await _log_event(pending.campaign_id, pending.lead_id, "campaign_paused",
                        {"lead_name": lead_name}, db)
    else:
        # Custom reply — use user's text as the email body
        if lead and lead.email:
            subject = f"Re: Following up"
            success = await email_sender.send(lead.email, subject, Body.strip())
            pending.status = "completed"
            await db.commit()
            if success:
                send_whatsapp(phone, f"✅ Your custom reply sent to {lead_name} ({lead.email})!")
                await _log_event(pending.campaign_id, pending.lead_id, "custom_reply_sent",
                                {"lead_name": lead_name, "body_preview": Body[:50]}, db)

    return {"status": "processed"}


async def _handle_yes(pending: ClawbotPending, lead: Lead, phone: str, db: AsyncSession):
    """Handle YES reply based on action type."""

    if pending.action_type == "high_intent":
        # Send follow-up email
        if lead and lead.email and pending.draft_message:
            subject = f"Following up — {lead.company or 'your team'}"
            success = await email_sender.send(lead.email, subject, pending.draft_message)
            pending.status = "completed"
            await db.commit()
            if success:
                send_whatsapp(phone, f"✅ Follow-up sent to {lead.first_name} ({lead.email})!\nDashboard updated live.")
                await _log_event(pending.campaign_id, pending.lead_id, "followup_sent",
                                {"lead_name": f"{lead.first_name} {lead.last_name}", "subject": subject,
                                 "via": "whatsapp_approval"}, db)
            else:
                send_whatsapp(phone, f"❌ Failed to send to {lead.email}. Check SMTP config.")

    elif pending.action_type == "objection":
        # Send objection response email
        if lead and lead.email and pending.draft_message:
            subject = f"Re: {lead.company or 'our conversation'}"
            success = await email_sender.send(lead.email, subject, pending.draft_message)
            pending.status = "completed"
            await db.commit()
            if success:
                send_whatsapp(phone, f"✅ Objection response sent to {lead.first_name}!\n🧠 AI handled it gracefully.")
                await _log_event(pending.campaign_id, pending.lead_id, "objection_response_sent",
                                {"lead_name": f"{lead.first_name} {lead.last_name}",
                                 "via": "whatsapp_approval"}, db)

    elif pending.action_type == "meeting":
        # Send cal.com booking link email
        cal_url = os.getenv("CAL_URL", "cal.com/ravi/intro")
        if lead and lead.email:
            body = f"Hi {lead.first_name},\n\nGreat to hear you're interested! Here's my calendar link to book a time that works:\n\nhttps://{cal_url}\n\nLooking forward to connecting!\n\nBest"
            subject = f"Let's connect — booking link inside"
            success = await email_sender.send(lead.email, subject, body)
            pending.status = "completed"
            await db.commit()
            if success:
                send_whatsapp(phone, f"📅 Booking link sent to {lead.first_name} ({lead.email})!\nWaiting for them to pick a slot.")
                # Log meeting_booked event
                await _log_event(pending.campaign_id, pending.lead_id, "meeting_booked",
                                {"lead_name": f"{lead.first_name} {lead.last_name}",
                                 "cal_url": cal_url, "via": "whatsapp_approval"}, db)


async def _log_event(campaign_id: int, lead_id: int, event_type: str, payload: dict, db: AsyncSession):
    """Log event and publish to SSE bus."""
    ev = Event(campaign_id=campaign_id, lead_id=lead_id, node_id="clawbot",
               event_type=event_type, payload=payload)
    db.add(ev)
    await db.commit()
    await db.refresh(ev)
    event_bus.publish({
        "id": ev.id, "campaign_id": campaign_id, "lead_id": lead_id,
        "node_id": "clawbot", "event_type": event_type,
        "payload": payload, "created_at": ev.created_at.isoformat()
    })


@router.post("/trigger")
async def trigger_clawbot(payload: dict, db: AsyncSession = Depends(get_db)):
    """Manual trigger for testing."""
    return {"status": "triggered"}
