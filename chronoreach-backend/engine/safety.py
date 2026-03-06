from datetime import datetime, timedelta
from sqlalchemy import select, func
from models import Event

async def is_send_allowed(campaign_id, session) -> tuple[bool, str]:
    """
    Validates per min, per hour, per day caps.
    """
    now = datetime.utcnow()
    
    # 3 sends per minute check
    stmt_min = select(func.count(Event.id)).where(
        Event.campaign_id == campaign_id,
        Event.event_type == 'email_sent',
        Event.created_at >= now - timedelta(minutes=1)
    )
    sends_min = await session.scalar(stmt_min)
    if sends_min >= 3:
        return False, "Rate limit: max 3 sends/minute"
        
    # 20 sends per hour check
    stmt_hr = select(func.count(Event.id)).where(
        Event.campaign_id == campaign_id,
        Event.event_type == 'email_sent',
        Event.created_at >= now - timedelta(hours=1)
    )
    sends_hr = await session.scalar(stmt_hr)
    if sends_hr >= 20:
        return False, "Rate limit: max 20 sends/hour"
        
    # 150 sends per day check
    stmt_day = select(func.count(Event.id)).where(
        Event.campaign_id == campaign_id,
        Event.event_type == 'email_sent',
        Event.created_at >= now - timedelta(days=1)
    )
    sends_day = await session.scalar(stmt_day)
    if sends_day >= 150:
        return False, "Rate limit: max 150 sends/day"
        
    # Assume bounce_rate is OK for demo
    return True, "ok"
