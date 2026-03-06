import asyncio
import json
from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Event

router = APIRouter(prefix="/api", tags=["monitor"])

@router.get("/campaigns/{camp_id}/stream")
async def event_stream(camp_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    from engine.executor import event_bus
    q = event_bus.subscribe()
    
    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(q.get(), timeout=5.0)
                    if data["campaign_id"] == camp_id:
                        yield {"event": "campaign_event", "data": json.dumps(data)}
                except asyncio.TimeoutError:
                    from engine.timing import get_behavioral_pulse
                    pulse = await get_behavioral_pulse(camp_id, db)
                    yield {"event": "behavioral_pulse", "data": json.dumps(pulse)}
        finally:
            event_bus.unsubscribe(q)
            
    return EventSourceResponse(event_generator())

@router.get("/campaigns/{camp_id}/replay/{lead_id}")
async def replay_lead(camp_id: int, lead_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Event).where(Event.campaign_id==camp_id, Event.lead_id==lead_id).order_by(Event.created_at))
    return res.scalars().all()
