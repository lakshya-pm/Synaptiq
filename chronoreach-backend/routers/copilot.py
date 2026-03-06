from fastapi import APIRouter, File, UploadFile
from services.llm_service import llm_service

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

@router.post("")
async def generate_workflow(payload: dict):
    desc = payload.get("description", "")
    wf_json = await llm_service.natural_language_to_workflow(desc)
    return wf_json

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    res = await llm_service.transcribe_voice(audio_bytes)
    return res
