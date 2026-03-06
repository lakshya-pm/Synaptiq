from fastapi import APIRouter, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db

router = APIRouter(prefix="/api/clawbot", tags=["clawbot"])

@router.post("/webhook")
async def twilio_webhook(Body: str = Form(...), From: str = Form(...), db: AsyncSession = Depends(get_db)):
    # Parse reply (YES/NO/SKIP/PAUSE)
    # Stub action handler
    print(f"Received Clawbot reply from {From}: {Body}")
    return {"status": "received"}

@router.post("/trigger")
async def trigger_clawbot(payload: dict, db: AsyncSession = Depends(get_db)):
    # Internal trigger test
    return {"status": "triggered"}
