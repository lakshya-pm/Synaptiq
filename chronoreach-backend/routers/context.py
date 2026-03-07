"""
Unified Context — cross-channel conversation history for leads.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Event, Lead, BlandCall

router = APIRouter(prefix="/api/context", tags=["context"])


@router.get("/leads/{lead_id}")
async def get_lead_context(lead_id: int, db: AsyncSession = Depends(get_db)):
    """Return all events for a lead across all campaigns, grouped chronologically."""
    # Get lead info
    lead = (await db.execute(select(Lead).where(Lead.id == lead_id))).scalar_one_or_none()
    if not lead:
        return {"error": "Lead not found"}

    # Get all events
    events = (await db.execute(
        select(Event).where(Event.lead_id == lead_id).order_by(Event.created_at.asc())
    )).scalars().all()

    # Get call data
    calls = (await db.execute(
        select(BlandCall).where(BlandCall.lead_id == lead_id).order_by(BlandCall.created_at.asc())
    )).scalars().all()

    # Build timeline
    timeline = []

    for ev in events:
        channel = "system"
        if ev.event_type in ("email_sent", "email_opened", "email_failed", "message_generated"):
            channel = "email"
        elif ev.event_type in ("reply_received", "followup_sent"):
            channel = "email"
        elif ev.event_type in ("clawbot_triggered",):
            channel = "whatsapp"
        elif ev.event_type in ("meeting_booked", "meeting_confirmed"):
            channel = "calendar"

        timeline.append({
            "id": ev.id,
            "type": ev.event_type,
            "channel": channel,
            "payload": ev.payload or {},
            "timestamp": ev.created_at.isoformat() if ev.created_at else None,
            "campaign_id": ev.campaign_id,
        })

    # Add call records
    for call in calls:
        timeline.append({
            "id": f"call_{call.id}",
            "type": "call_made",
            "channel": "call",
            "payload": {
                "to_phone": call.to_phone,
                "status": call.status,
                "transcript": call.transcript[:300] if call.transcript else None,
                "meeting_booked": call.meeting_booked,
            },
            "timestamp": call.created_at.isoformat() if call.created_at else None,
            "campaign_id": call.campaign_id,
        })

    # Sort by timestamp
    timeline.sort(key=lambda x: x["timestamp"] or "")

    return {
        "lead": {
            "id": lead.id,
            "name": f"{lead.first_name or ''} {lead.last_name or ''}".strip(),
            "email": lead.email,
            "company": lead.company,
            "phone": lead.phone,
            "title": lead.title,
        },
        "timeline": timeline,
        "summary": {
            "total_events": len(timeline),
            "email_count": sum(1 for t in timeline if t["channel"] == "email"),
            "whatsapp_count": sum(1 for t in timeline if t["channel"] == "whatsapp"),
            "call_count": sum(1 for t in timeline if t["channel"] == "call"),
        },
    }


@router.get("/companies/{company}")
async def get_company_context(company: str, db: AsyncSession = Depends(get_db)):
    """Return all leads and events for a company."""
    leads = (await db.execute(
        select(Lead).where(Lead.company == company)
    )).scalars().all()

    if not leads:
        return {"error": "No leads found for this company", "leads": []}

    lead_contexts = []
    for lead in leads:
        events = (await db.execute(
            select(Event).where(Event.lead_id == lead.id).order_by(Event.created_at.desc())
        )).scalars().all()

        lead_contexts.append({
            "lead": {
                "id": lead.id,
                "name": f"{lead.first_name or ''} {lead.last_name or ''}".strip(),
                "email": lead.email,
                "title": lead.title,
            },
            "event_count": len(events),
            "last_event": events[0].event_type if events else None,
            "last_activity": events[0].created_at.isoformat() if events else None,
        })

    return {
        "company": company,
        "leads": lead_contexts,
        "total_events": sum(l["event_count"] for l in lead_contexts),
    }
