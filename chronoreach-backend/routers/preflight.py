from fastapi import APIRouter
from services.llm_service import llm_service

router = APIRouter(prefix="/api/preflight", tags=["preflight"])

@router.post("")
async def run_preflight(payload: dict):
    # Mock preflight check 
    return {
        "score": 7.2,
        "risk": "HIGH",
        "issues": [
            "Spammy phrase in step 2: 'click here'",
            "Cadence too aggressive: 3 touches in 3 days"
        ]
    }

@router.post("/fix")
async def fix_preflight(payload: dict):
    issues = payload.get("issues", [])
    fixed = await llm_service.fix_message("Original body with click here", issues)
    return {
        "score": 2.1,
        "risk": "LOW",
        "fixed_content": fixed
    }
