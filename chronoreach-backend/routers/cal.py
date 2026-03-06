from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db

router = APIRouter(prefix="/api/cal", tags=["cal"])

@router.post("/webhook")
async def cal_webhook(payload: dict, db: AsyncSession = Depends(get_db)):
    # Extract attendee email, log 'meeting_booked' event
    attendees = payload.get("payload", {}).get("attendees", [])
    for a in attendees:
        email = a.get("email")
        print(f"Meeting booked with: {email}")
        
    return {"status": "ok"}
