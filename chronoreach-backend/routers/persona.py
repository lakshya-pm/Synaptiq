from fastapi import APIRouter
from services.llm_service import llm_service

router = APIRouter(prefix="/api/persona", tags=["persona"])

@router.post("/preview")
async def persona_preview(payload: dict):
    res = await llm_service.get_persona_preview(payload)
    return res

@router.post("/ghost-voice")
async def ghost_voice(payload: dict):
    emails = payload.get("sample_emails", [])
    res = await llm_service.extract_ghost_voice(emails)
    return res

@router.post("/save")
async def save_persona(payload: dict):
    return {"status": "saved"}
