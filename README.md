<div align="center">

# 🦅 ChronoReach

### *AI-Powered Intelligent Outreach Workflow Automation Engine*

> Built for the Microsoft Learn Student Club Hackathon — Track 3: Sales & Outreach Systems

[![Built with Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Sarvam AI](https://img.shields.io/badge/India--First-Sarvam%20AI-FF6B35?style=for-the-badge)](https://sarvam.ai)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

**ChronoReach is not a tool. It's a digital SDR.**

It researches your leads, writes in your voice, times sends like a human,
blocks compliance violations before they happen, books meetings automatically,
and asks you on WhatsApp before making critical decisions.

---

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Team](#-team)

</div>

---

## 🎯 Problem Statement

Manual outreach is broken. SDRs spend **6–8 hours a day** writing personalised emails, deciding when to send, managing follow-ups, and handling replies — leaving no time for what actually matters: closing.

Existing automation tools treat every lead the same, send at robotic intervals, get flagged as spam, and give zero visibility into why things work or don't.

**ChronoReach solves this end to end.**

---

## ✨ Features

### 🔍 Intelligent Lead Research
- Upload any Excel/CSV — ChronoReach auto-detects and maps your columns
- **Deep Search Engine** instantly enriches each lead with real-time company news
- Insight badges appear inline: *"Razorpay just raised Series F — $160M"*
- 10 major Indian companies hardcoded for zero-latency demo reliability

### 🎭 Your Personal AI Agent
- **Agent Setup Onboarding** — build your personalised outreach persona
- 4 personality sliders (Tone, Aggression, Empathy, CTA Style) with live email preview
- **Ghost Voice Mode** — upload 3 of your own emails and ChronoReach learns your exact writing style
- AI-generated avatar powered by DiceBear — your face on every campaign

### 🧠 Campaign Copilot
- Describe your campaign in **plain English or by voice** (Sarvam Saarika V2)
- Copilot generates the entire workflow — animated node by node on the canvas
- *"3-step outreach to fintech CTOs, soft intro referencing company news, follow-up with case study, final nudge with calendar link"* → full DAG in 3 seconds

### 🔀 Visual Workflow Builder (DAG Canvas)
Built on ReactFlow. 7 node types:

| Node | Purpose |
|------|---------|
| ⚡ Trigger | Campaign entry point |
| 🛡️ Blocklist | Competitor domain interception |
| 🤖 AI Message | LLM-generated personalised email |
| ⏳ Delay | Human-like timing with Gaussian jitter |
| 📧 Send Email | Actual dispatch with safety checks |
| 🔀 Condition | Branch on reply / no-reply |
| 🦅 ClawBot Approval | Pause for human WhatsApp review |

### 🧪 Spam Preflight Engine
- Analyses campaign before a single email is sent
- Detects: spam phrases, excessive links, aggressive cadence, ALL-CAPS abuse
- Risk score: **LOW / MEDIUM / HIGH** with specific issue list
- **✨ Fix It** button rewrites flagged content in one click — score updates live

### ⏱️ Behavioral Timing Engine
- **Gaussian jitter** — randomised ±30 min offset so no two sends look automated
- **Working hours snap** — emails only queue in 9–11 AM and 2–4 PM IST windows
- **Ramp-up schedule** — Day 1: 30% capacity, Day 2: 60%, Day 3+: 100%
- **Behavioral Pulse panel** — live visual showing send velocity, active window, last jitter applied

### 🛡️ Competitor Shield
- Blocklist node intercepts leads from competitor domains before any email is sent
- Canvas flashes red when triggered — live execution log confirms the block
- Configurable per campaign: add any domain to the blocklist

### 🦅 ClawBot — WhatsApp Command Center
- Monitors campaign 24/7 while Ravi is away from his laptop
- **Hot lead alert** — lead opened email 3× in 2 hours → WhatsApp ping with draft
- **Objection alert** — reply classified → WhatsApp with suggested response
- **Meeting alert** — lead booked a call → instant notification
- **Daily digest** — campaign summary every morning
- Reply `YES` / `SKIP` / `PAUSE` or type a custom message — all from WhatsApp

### 🧠 Objection Intelligence Engine
5-archetype classifier with specialised response playbooks:
- ⏰ **Timing** — 90-day reconnect with useful resource
- 👤 **Wrong Person** — warm intro request with forwardable pitch
- ⚔️ **Competitor Loyal** — one specific gap, no bashing
- 💰 **Budget** — ROI reframe with pilot offer
- 🚫 **No Interest** — graceful DNC exit, never follow up again

### 💬 Conversation Memory
Every follow-up email acknowledges what the lead previously said.
*"Following up on your point about HubSpot..."* — not a generic template.

### 📅 Meeting Scheduler (Cal.com Integration)
- Positive intent detected → ClawBot asks: *"Send your booking link?"*
- Lead receives Cal.com link → books → Google Calendar invite fires automatically
- Lead card updates: **📅 Meeting Booked — Tue 3PM**
- Campaign Autopsy tracks: **Meetings booked: 4**

### 📺 Live Monitoring Dashboard
- SSE-powered real-time lead progression table
- 4 stat cards: Sent / Opened / Replied / Meetings Booked
- **ChronoReach Health Score** — circular gauge 0–100
- **Cadence Heatmap** — 48-hour send schedule grid, colour-coded by density
- Safe Mode toggle — throttles sends instantly if anomalies detected

### 🕵️ Execution Replay Timeline
Per-lead full transparency:
- Every event: email sent, opened, replied, blocked, meeting booked
- AI Message events expand to show: *"Hooks used: funding_stage, linkedin_headline"*
- Delay events show: *"Jitter applied: +23 min"*
- No black box. Every decision explained.

### 📊 Campaign Autopsy
End-of-campaign report card:
```
Leads processed:       150     Meetings booked:    4
Emails sent:           142     ClawBot actions:    7
Blocked (Competitor):    3     Objections handled: 9
Hindi emails (Sarvam):  12     Spam score:         LOW (1.9/10)
                               Human time saved:   8.5 hrs
```

### 🌐 India-First: Sarvam AI Integration
- Hindi email generation via **Sarvam-M** — native Devanagari script
- Voice campaign input via **Sarvam Saarika V2** — Indian English accent-optimised
- Regional language toggle per lead based on LinkedIn data

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ChronoReach                              │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Next.js 16  │    │   FastAPI    │    │   AI/LLM Layer   │  │
│  │  + ReactFlow  │◄──►│ + APScheduler│◄──►│  Gemini + Sarvam │  │
│  │  + Tailwind   │    │ + SQLite WAL │    │  + Groq + Tavily  │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│         │                   │                      │            │
│         │              SSE Stream              WhatsApp         │
│         ▼                   ▼                      ▼            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  DAG Canvas   │    │  DAG Executor│    │  ClawBot (Twilio) │  │
│  │  (ReactFlow)  │    │  (Kahn's    │    │  Cal.com Webhooks │  │
│  │               │    │  Algorithm)  │    │                  │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 + TypeScript | App Router, SSE support, type safety |
| UI Components | shadcn/ui + Tailwind | Dark glassmorphism theme, rapid development |
| Workflow Canvas | ReactFlow | Industry-standard DAG visualisation |
| Backend | FastAPI (Python) | Async-first, clean DI, great for SSE |
| Database | SQLite + WAL mode | Zero setup, hackathon-reliable, no data loss during SSE |
| Job Scheduler | APScheduler | In-process async scheduler for delayed sends |
| Primary LLM | Gemini 2.5 Flash | Free tier (1000 RPD), best quality/speed ratio |
| Fast Inference | Groq Llama-3.3-70B | Free tier (14,400 RPD), used for classification |
| India LLM | Sarvam-M + Saarika V2 | Native Hindi generation + Indian English STT |
| Research | Tavily API | Real-time web search (1000 free/month) |
| WhatsApp | Twilio Sandbox | Free tier, webhook-based ClawBot |
| Calendar | Cal.com | Free, open-source, Google Calendar native |
| Avatars | DiceBear | Free, URL-based, no API key |

---

## 🗄️ Database Schema

```
leads ──────────────────┐
workflows               │
  └── workflow_nodes    │
  └── workflow_edges    │
campaigns ──────────────┤
  └── campaign_leads ───┘
  └── events
  └── clawbot_pending
```

8 tables. SQLite with WAL mode enabled at startup.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- API keys for: Gemini, Groq, Sarvam AI, Tavily, Twilio

### 1. Clone the Repository

```bash
git clone https://github.com/[your-org]/chronoreach.git
cd chronoreach
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in your API keys in .env

python seed.py                  # Seeds demo data (run once)
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### 4. Open the App

```
http://localhost:3000
```

Complete the Agent Setup onboarding (takes 90 seconds), import `demo_leads.xlsx`, and launch your first campaign.

---

## 📁 Project Structure

```
chronoreach/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Dashboard overview
│   │   ├── leads/page.tsx           # Lead import + field mapping
│   │   ├── workflows/page.tsx       # DAG canvas builder
│   │   ├── campaigns/page.tsx       # Campaign list + launch
│   │   ├── monitor/page.tsx         # Live monitoring dashboard
│   │   └── replay/[leadId]/page.tsx # Execution replay timeline
│   └── components/
│       ├── nodes/                   # 7 ReactFlow custom node types
│       ├── panels/                  # Preflight, config, behavioral pulse
│       └── ui/                      # shadcn/ui components
│
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── database.py                  # SQLAlchemy async engine
│   ├── models.py                    # 8 ORM models
│   ├── seed.py                      # Demo data seeder
│   ├── routers/                     # 10 API route modules
│   ├── engine/
│   │   ├── executor.py              # DAG workflow runner
│   │   ├── timing.py                # Gaussian jitter engine
│   │   └── safety.py                # Rate limit + auto-pause
│   └── services/
│       ├── llm_service.py           # Core LLM functions
│       ├── ghost_voice.py           # Style extraction
│       ├── objection_handler.py     # 5-archetype classifier
│       ├── research_service.py      # Tavily + insight injection
│       ├── clawbot_service.py       # WhatsApp sender
│       ├── voice_service.py         # Sarvam Saarika V2
│       ├── preflight_ai.py          # Spam scoring
│       └── coach_service.py         # AI SDR Coach
│
├── fixtures/                        # Pre-generated demo data (offline fallback)
├── cache/                           # Persisted Tavily research results
└── demo_leads.xlsx                  # Sample lead file for demo
```

---

## 🔌 API Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/leads/upload` | Parse Excel/CSV, detect columns, inject insights |
| POST | `/api/leads/confirm` | Save leads with field mapping |
| POST | `/api/workflows` | Create workflow with nodes + edges |
| POST | `/api/campaigns/:id/launch` | Start DAG executor for all leads |
| GET | `/api/campaigns/:id/stream` | SSE live event stream |
| GET | `/api/campaigns/:id/status` | Per-lead progression + stats |
| GET | `/api/campaigns/:id/heatmap` | 48-hour cadence grid |
| GET | `/api/campaigns/:id/autopsy` | End-of-campaign report |
| POST | `/api/preflight` | Spam score + issue detection |
| POST | `/api/preflight/fix` | AI rewrite of flagged content |
| POST | `/api/copilot` | NL description → workflow JSON |
| POST | `/api/copilot/transcribe` | Voice audio → text (Sarvam) |
| POST | `/api/persona/preview` | Slider values → live email preview |
| POST | `/api/persona/ghost-voice` | Sample emails → style fingerprint |
| POST | `/api/clawbot/webhook` | Twilio incoming WhatsApp handler |
| POST | `/api/cal/webhook` | Cal.com booking confirmation |

---

## 🌍 Environment Variables

```env
# backend/.env

# LLMs (all free tier)
GEMINI_API_KEY=          # aistudio.google.com
GROQ_API_KEY=            # console.groq.com
SARVAM_API_KEY=          # app.sarvam.ai (₹1000 free credits)
TAVILY_API_KEY=          # tavily.com (1000 free searches/month)

# Communications
TWILIO_SID=
TWILIO_AUTH=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
USER_PHONE=whatsapp:+91XXXXXXXXXX

# Calendar
CAL_WEBHOOK_SECRET=

# Config
MOCK_MODE=true           # Set false for live demo
```

---

## 🎬 Demo Flow (5 Minutes)

1. **Agent Setup** — Build your personalised agent with sliders + Ghost Voice upload
2. **Import Leads** — Drop `demo_leads.xlsx` → insight badges appear instantly
3. **Campaign Copilot** — Click 🎤, speak your campaign → DAG builds on canvas
4. **Preflight** — Run scan → MEDIUM risk → click Fix It → score drops to LOW
5. **Launch** — Hit Execute → canvas lights up → execution log streams
6. **Competitor Shield** — `rohit@zoho.com` triggers red flash → BLOCKED in logs
7. **Live Dashboard** — Leads move through stages in real time via SSE
8. **Phone Buzzes** — ClawBot WhatsApp alert for hot lead → reply YES on phone
9. **Meeting Booked** — Ananya books via Cal.com → green badge on her card
10. **Autopsy** — Campaign complete → report card → *"8.5 human hours saved"*

---

## 👥 Team

| Role | Responsibilities |
|------|----------------|
| **Frontend** | Next.js 16, ReactFlow canvas, shadcn/ui, SSE dashboard, agent onboarding |
| **Backend** | FastAPI, SQLite, DAG executor, APScheduler, Twilio, Cal.com webhooks |
| **AI/LLM** | Gemini, Sarvam AI, Groq, Ghost Voice, Objection Engine, Campaign Copilot |

---

## 🏆 Hackathon

**Event:** Microsoft Learn Student Club Hackathon
**Track:** Track 3 — Sales & Outreach Systems
**Problem Statement:** AI-Powered Intelligent Outreach Workflow Automation Engine
**Institution:** Vidyavardhini's College of Engineering & Technology

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**ChronoReach** — *From cold lead to booked meeting. Zero manual steps.*

Built with 🦅 by Team ChronoReach

</div>
