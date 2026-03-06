import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import database

scheduler = AsyncIOScheduler(timezone=os.getenv("TZ", "Asia/Kolkata"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (creates WAL mode + tables)
    await database.init_db()
    # Start the scheduler
    scheduler.start()
    yield
    # Shutdown scheduler
    scheduler.shutdown()

app = FastAPI(title="ChronoReach API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import leads, workflows, campaigns, preflight, copilot, monitor, clawbot, cal, persona, autopsy

app.include_router(leads.router)
app.include_router(workflows.router)
app.include_router(campaigns.router)
app.include_router(preflight.router)
app.include_router(copilot.router)
app.include_router(monitor.router)
app.include_router(clawbot.router)
app.include_router(cal.router)
app.include_router(persona.router)
app.include_router(autopsy.router)

@app.get("/")
def read_root():
    return {"status": "ChronoReach API is running"}
