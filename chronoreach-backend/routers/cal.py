"""
Synaptiq — Cal.com Integration
Handles booking notifications from Cal.com.
Two methods:
1. Webhook (if Cal.com can reach us) — POST /api/cal/webhook
2. Email polling (via inbox monitor) — detects Cal.com confirmation emails
"""
import os
from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Lead, Event, CampaignLead
from engine.executor import event_bus
from services.clawbot_service import send_whatsapp

router = APIRouter(prefix="/api/cal", tags=["cal"])

USER_PHONE = os.getenv("USER_PHONE", "").replace("whatsapp:", "")
CAL_URL = os.getenv("CAL_URL", "app.cal.com/synaptiq")


@router.post("/webhook")
async def cal_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Cal.com calls this when a booking is created/cancelled.
    Payload shape: { triggerEvent: "BOOKING_CREATED", payload: { attendees: [...], ... } }
    """
    try:
        payload = await request.json()
    except Exception:
        return {"status": "invalid_json"}

    trigger = payload.get("triggerEvent", "")
    booking = payload.get("payload", {})
    attendees = booking.get("attendees", [])
    title = booking.get("title", "Meeting")
    start_time = booking.get("startTime", "")

    print(f"[Cal] 📅 Webhook received: {trigger} — {title}")

    if trigger != "BOOKING_CREATED":
        return {"status": "ignored", "trigger": trigger}

    for attendee in attendees:
        email = attendee.get("email", "").lower()
        name = attendee.get("name", "")

        if not email:
            continue

        # Find matching lead by email
        lead = await _find_lead_by_email(email, db)
        if lead:
            lead_name = f"{lead.first_name} {lead.last_name}".strip()
            await _record_meeting_booked(lead, start_time, db)
            # WhatsApp notification
            if USER_PHONE:
                msg = f"🎉 Meeting Booked!\n─────────────────\n{lead_name} ({lead.company}) just booked a call!\n📅 {start_time}\n\nCheck your calendar for the invite."
                send_whatsapp(USER_PHONE, msg)
                print(f"[Cal] 📱 WhatsApp alert sent for {lead_name}")
        else:
            print(f"[Cal] ⚠️ No matching lead for {email}")

    return {"status": "ok"}


async def process_cal_booking_email(subject: str, body: str, db: AsyncSession):
    """
    Called from inbox_monitor when a Cal.com confirmation email is detected.
    Parses attendee email from the confirmation and logs the event.
    """
    import re

    print(f"[Cal] 📧 Processing booking email: {subject}")

    # Extract attendee email from Cal.com confirmation body
    # Cal.com emails contain patterns like "Priya Sharma (igotthis123421@gmail.com)"
    email_matches = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', body)

    for email in email_matches:
        email = email.lower()
        # Skip our own email
        if email in ["synaptiqmail@gmail.com", "noreply@cal.com", "notifications@cal.com"]:
            continue

        lead = await _find_lead_by_email(email, db)
        if lead:
            lead_name = f"{lead.first_name} {lead.last_name}".strip()

            # Check if we already logged a meeting for this lead
            existing = await db.scalar(
                select(Event.id).where(
                    Event.lead_id == lead.id,
                    Event.event_type == "meeting_booked"
                ).limit(1)
            )
            if existing:
                print(f"[Cal] ⏭️ Meeting already logged for {lead_name}")
                continue

            # Extract time from subject if possible
            time_match = re.search(r'(\w+ \d+, \d{4}.*?)(?:\s*[-–]\s*|$)', subject)
            start_time = time_match.group(1) if time_match else "Check your calendar"

            await _record_meeting_booked(lead, start_time, db)

            # WhatsApp notification
            if USER_PHONE:
                msg = f"🎉 Meeting Booked!\n─────────────────\n{lead_name} ({lead.company}) just booked a call!\n📅 {start_time}\n\nCheck your calendar for the invite."
                send_whatsapp(USER_PHONE, msg)
                print(f"[Cal] 📱 WhatsApp alert sent for {lead_name}")
            return True

    return False


async def _find_lead_by_email(email: str, db: AsyncSession):
    """Find a lead by email."""
    result = await db.execute(select(Lead).where(Lead.email == email).limit(1))
    return result.scalar_one_or_none()


async def _record_meeting_booked(lead: Lead, start_time: str, db: AsyncSession):
    """Log meeting_booked event."""
    lead_name = f"{lead.first_name} {lead.last_name}".strip()

    # Find campaign for this lead
    cl = await db.scalar(
        select(CampaignLead.campaign_id).where(CampaignLead.lead_id == lead.id).limit(1)
    )
    campaign_id = cl or 1

    ev = Event(
        campaign_id=campaign_id, lead_id=lead.id, node_id="cal",
        event_type="meeting_booked",
        payload={
            "lead_name": lead_name,
            "company": lead.company,
            "start_time": start_time,
            "cal_url": CAL_URL,
            "via": "cal.com"
        }
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)

    event_bus.publish({
        "id": ev.id, "campaign_id": campaign_id, "lead_id": lead.id,
        "node_id": "cal", "event_type": "meeting_booked",
        "payload": ev.payload, "created_at": ev.created_at.isoformat()
    })
    print(f"[Cal] ✅ Meeting booked event logged for {lead_name}")
