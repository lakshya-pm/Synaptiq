import pandas as pd
from fastapi import APIRouter, File, UploadFile, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Lead

router = APIRouter(prefix="/api/leads", tags=["leads"])

INSIGHTS = {
    "Razorpay": "Just raised Series F — $160M",
    "Zepto": "Expanding to 100 cities by Q2 2026",
    "CRED": "Launched vehicle management feature",
    "Cashfree": "Launched instant bank verification API",
    "Juspay": "Processing 80M transactions/day"
}

@router.post("/upload")
async def upload_leads(file: UploadFile = File(...)):
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file.file)
    else:
        df = pd.read_excel(file.file)
        
    columns = list(df.columns)
    email_col = next((c for c in columns if '@' in c or 'email' in c.lower()), None)
    
    preview = df.head(5).to_dict(orient="records")
    insights_found = 0
    
    company_col = next((c for c in columns if 'company' in c.lower()), None)
    if company_col:
        for val in df[company_col].dropna():
            if val in INSIGHTS:
                insights_found += 1
                
    return {
        "columns_detected": columns,
        "email_col": email_col,
        "preview_rows": preview,
        "insights_found": insights_found
    }

@router.post("/confirm")
async def confirm_leads(payload: dict, db: AsyncSession = Depends(get_db)):
    rows = payload.get("rows", [])
    mappings = payload.get("field_mapping", {})
    
    saved = 0
    insights_cnt = 0
    
    for row in rows:
        email = row.get(mappings.get("email", "email"))
        if not email: continue
        
        company = row.get(mappings.get("company", "company"))
        first_name = row.get(mappings.get("first_name", "first_name"))
        last_name = row.get(mappings.get("last_name", "last_name"))
        title = row.get(mappings.get("title", "title"))
        
        insight = INSIGHTS.get(company) if company else None
        if insight: insights_cnt += 1
        
        db.add(Lead(
            email=email,
            company=company,
            first_name=first_name,
            last_name=last_name,
            title=title,
            insight=insight,
            custom_fields=row
        ))
        saved += 1
        
    await db.commit()
    return {"saved_count": saved, "leads_with_insights": insights_cnt}

@router.get("")
async def list_leads(page: int = 1, limit: int = 20, search: str = "", db: AsyncSession = Depends(get_db)):
    offset = (page - 1) * limit
    stmt = select(Lead)
    if search:
        stmt = stmt.where(Lead.email.ilike(f"%{search}%") | Lead.company.ilike(f"%{search}%"))
    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()
