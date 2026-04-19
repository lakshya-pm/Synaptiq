<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_2.0-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

# ⚡ Synaptiq — Autonomous AI Sales Outreach Engine

> **A full-stack, multi-channel sales automation platform that builds AI agents, designs workflow DAGs, sends hyper-personalized emails, detects replies, handles objections via WhatsApp, and makes autonomous AI phone calls — all from a single dashboard.**

**🔗 Live Demo:** [synaptiq-frontend.onrender.com](https://synaptiq-frontend.onrender.com)
**📦 Backend API:** [synaptiq-backend.onrender.com](https://synaptiq-backend-6may.onrender.com)

---

## 🧠 Problem Statement

Sales teams spend **60%+ of their time** on repetitive outreach tasks — drafting cold emails, following up, tracking replies, handling objections, and scheduling calls. Existing CRM tools automate the *sending* but leave the *thinking* to humans.

**Synaptiq solves this** by creating a fully autonomous AI agent that handles the entire outreach lifecycle: from personalized email generation to real-time reply detection, intelligent objection handling, WhatsApp command center alerts, and even AI-powered phone calls — reducing the human-hours-per-campaign by over 85%.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 FRONTEND                         │
│  Landing → Agent Setup → Lead Import → DAG Canvas → Live Monitor   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ REST + SSE
┌────────────────────────────────▼────────────────────────────────────┐
│                        FASTAPI BACKEND                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐   │
│  │ 14 API   │  │  DAG     │  │  Event    │  │   Background     │   │
│  │ Routers  │  │ Executor │  │  Bus/SSE  │  │   Workers        │   │
│  └──────────┘  └──────────┘  └───────────┘  │ • Inbox Monitor  │   │
│                                              │ • WhatsApp Poller│   │
│                                              └──────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  SQLAlchemy (Async) │ SQLite WAL │ APScheduler │ Rate Limiter      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
       ┌─────────────┬───────────┼──────────┬──────────────┐
       ▼             ▼           ▼          ▼              ▼
  ┌─────────┐  ┌──────────┐ ┌────────┐ ┌────────┐  ┌───────────┐
  │ Gemini  │  │  Groq    │ │ Twilio │ │Gmail   │  │ Bland.ai  │
  │ 2.0     │  │ Llama-3  │ │WhatsApp│ │ SMTP   │  │ AI Calls  │
  │ Flash   │  │  70B/8B  │ │Sandbox │ │+IMAP   │  │           │
  └─────────┘  └──────────┘ └────────┘ └────────┘  └───────────┘
```

---

## ✨ Key Features

### 🤖 AI Agent Persona Builder
- **DiceBear avatar generation** from agent name with 6+ art styles
- **3 personality sliders** (Aggression, Empathy, CTA style) that shape email tone
- **Ghost Voice**: Upload sample emails → Gemini extracts writing fingerprint → all future emails mirror the user's style

### 📊 Intelligent Lead Management
- **CSV/XLSX import** with auto-detection of email, name, company columns
- **Tavily API enrichment** — real-time web research on each lead's company
- **10 pre-built Indian company profiles** (Razorpay, Zepto, CRED, etc.) for instant demos

### 🧩 NL-to-Workflow Copilot
- Describe your campaign in plain English → **Gemini converts it into a visual DAG**
- **7 node types**: Trigger, Blocklist Guard, AI Email Draft, Smart Delay, Send, Condition, ClawBot Alert
- Drag-and-drop canvas with port-based edge connections

### 🛡 Preflight Spam Engine
- **21-phrase spam blacklist**, ALL-CAPS detection, excessive link count, cadence gap analysis
- Returns **LOW / MEDIUM / HIGH** risk score with per-line breakdown
- **"Fix It" button** → Gemini Flash-Lite rewrites flagged content below spam thresholds

### ⚙️ DAG Execution Engine
- **Kahn's topological sort** for deterministic execution order
- **Async per-lead pipeline** with APScheduler
- **Three-tier rate limiting**: 3/min, 20/hr, 150/day (production-safe)
- **Gaussian jitter delays** (±30 min) with IST working-hours snap to avoid robotic send patterns
- Every action logged to events table + **SSE-streamed to frontend in real-time**

### 🔒 Competitor Shield (Blocklist Guard)
- Fires before every email send — blocks competitor domains (Salesforce, HubSpot, Zoho, Freshworks, Pipedrive)
- Monitoring page flashes **RED** with shield icon when a lead is blocked
- Prevents accidental outreach to competitor employees

### 📡 Real-Time Monitoring Dashboard
- **Server-Sent Events (SSE)** for zero-latency event streaming
- **4 live stat cards**: Emails Sent, ClawBot Alerts, Reply Rate, Booked Calls
- **Per-lead milestone pipeline** (Sent → Opened → Replied → ClawBot → Meeting)
- Execution log terminal with color-coded timestamps

### 🐾 ClawBot — WhatsApp Command Center
- **Gmail IMAP polling** (30s interval) detects incoming replies
- **Intent classification** (positive / objection / neutral) via Groq Llama-3.1-8B
- **6-type objection classifier** with specialized response playbooks (budget, timing, competitor, authority, need, generic)
- **WhatsApp alerts** via Twilio with actionable buttons: YES / SKIP / PAUSE / custom reply
- **Hot lead detection**: 3+ email opens triggers priority WhatsApp alert

### 📞 Agentic AI Phone Calls (Bland.ai)
- One-click **"Call Lead"** button initiates an AI phone call
- Bland.ai agent introduces itself, qualifies the lead, and books meetings
- **Gemini transcript analysis** → auto-generates post-call WhatsApp summary
- Call records persisted in `bland_calls` table with transcript + booking status

### 🤖 Smart Follow-Up Automation
- Detects replied leads on the Monitoring page
- **Auto-Reply**: Sends a personalized follow-up email asking for best call time
- **Schedule AI Call**: Pick a time slot → Bland.ai agent calls at that exact time
- Full backend integration with `/api/leads/{id}/auto-reply` endpoint

### 📋 Cross-Channel Context Window
- Unified timeline showing **email, WhatsApp, and call interactions** per lead
- Enables informed decisions before every follow-up
- Accessible from the monitoring page per lead

### 🔬 Campaign Autopsy Report
- End-of-campaign analytics with **8 performance metrics**
- **Human hours saved** calculation (emails × 0.06 hrs)
- Exportable insights for team review

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI |
| **Backend** | FastAPI, SQLAlchemy 2.0 (async), SQLite (WAL mode), APScheduler, SSE-Starlette |
| **LLM Orchestration** | Gemini 2.0 Flash, Gemini 2.0 Flash-Lite, Groq Llama-3.3-70B, Groq Llama-3.1-8B |
| **Voice & Transcription** | Sarvam Saarika V2, Sarvam-M (multilingual) |
| **Lead Research** | Tavily Search API |
| **Messaging** | Twilio WhatsApp Sandbox |
| **Voice Calls** | Bland.ai (agentic AI calls) |
| **Email** | Gmail SMTP (TLS) + 1×1 tracking pixel + IMAP polling |
| **Scheduling** | Cal.com webhooks |
| **Cloud Deployment** | Render (IaC via `render.yaml` Blueprint) |
| **Avatars** | DiceBear API |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+, Node.js 20+
- API keys: Gemini, Groq (free), Twilio (free sandbox)
- Optional: Tavily, Bland.ai, Sarvam

### 1. Clone & Install

```bash
git clone https://github.com/lakshya-pm/Synaptiq.git
cd Synaptiq

# Frontend
npm install

# Backend
cd chronoreach-backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` in the project root:

```env
# LLM Providers
GEMINI_API_KEY=your_gemini_key          # aistudio.google.com (free)
GROQ_API_KEY=your_groq_key              # console.groq.com (free)
SARVAM_API_KEY=your_sarvam_key          # app.sarvam.ai

# Lead Research
TAVILY_API_KEY=your_tavily_key          # tavily.com (1000 free/month)

# Email (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# Twilio WhatsApp Sandbox
TWILIO_SID=your_sid
TWILIO_AUTH=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
USER_PHONE=whatsapp:+91XXXXXXXXXX

# Agentic Calls
BLAND_API_KEY=your_bland_key

# Scheduling
CAL_URL=app.cal.com/yourname/15min

# Mode
MOCK_MODE=false
DEMO_MODE=true
```

### 3. Run Locally

```bash
# Terminal 1 — Backend (port 8000)
cd chronoreach-backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend (port 3000)
npm run dev
```

Open **http://localhost:3000** 🎉

---

## ☁️ Cloud Deployment (Render)

This project uses **Infrastructure as Code** via a `render.yaml` Blueprint for one-click cloud deployment.

### Architecture on Render

| Service | Runtime | Build | Start |
|---------|---------|-------|-------|
| `synaptiq-backend` | Python 3.11 | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| `synaptiq-frontend` | Node 20 | `npm install && npm run build` | `npm run start` |

### Key Deployment Details

1. **IaC Blueprint** — `render.yaml` declaratively defines both microservices, environment variables, and inter-service linking
2. **Python Version Pinning** — `.python-version` file pins Python 3.11 to prevent C-extension compilation failures with newer runtimes
3. **Secret Injection** — API keys are injected as Render environment variables (`sync: false`), never committed to source
4. **Auto-linking** — Frontend's `NEXT_PUBLIC_API_URL` automatically resolves to the backend's Render URL via `fromService` config
5. **Continuous Deployment** — Every push to `main` triggers automatic builds and zero-downtime deploys

### Deploy Your Own Instance

```bash
# 1. Fork this repo
# 2. Go to dashboard.render.com → New → Blueprint
# 3. Connect your fork → Render detects render.yaml
# 4. Fill in secret env vars → Apply
# 5. Both services deploy automatically
```

---

## 📁 Project Structure

```
Synaptiq/
├── app/                              # Next.js 16 pages (App Router)
│   ├── page.tsx                      # Landing page with feature showcase
│   ├── login/ & signup/              # Authentication pages
│   ├── main/page.tsx                 # Agent setup + lead import wizard
│   ├── dashboard/page.tsx            # Workflow DAG canvas + Copilot
│   ├── monitoring/page.tsx           # Live SSE monitoring + Smart Follow-Up
│   └── autopsy/page.tsx              # Campaign analytics report
│
├── components/                       # Reusable React components
│   ├── AgentSidebar.tsx              # Agent panel + navigation
│   └── ui/                           # shadcn/ui primitives
│
├── chronoreach-backend/              # FastAPI backend
│   ├── main.py                       # App entry + lifespan (scheduler, pollers)
│   ├── models.py                     # 8 SQLAlchemy models
│   ├── database.py                   # Async SQLite engine (WAL mode)
│   │
│   ├── engine/                       # Core execution layer
│   │   ├── executor.py               # DAG executor + EventBus (SSE)
│   │   ├── safety.py                 # 3-tier rate limiter (3/min, 20/hr, 150/day)
│   │   ├── timing.py                 # Gaussian jitter + IST working-hours snap
│   │   └── email_sender.py           # Gmail SMTP + 1×1 tracking pixel
│   │
│   ├── routers/                      # 14 API routers
│   │   ├── leads.py                  # CSV/XLSX upload, confirm, auto-reply
│   │   ├── workflows.py              # CRUD for DAG workflows
│   │   ├── campaigns.py              # Launch, status, heatmap, timeline
│   │   ├── preflight.py              # Spam scoring + AI content fix
│   │   ├── copilot.py                # NL → DAG + voice transcription
│   │   ├── monitor.py                # SSE real-time event streaming
│   │   ├── clawbot.py                # WhatsApp webhook + command processing
│   │   ├── calls.py                  # Bland.ai call initiation + webhooks
│   │   ├── cal.py                    # Cal.com booking detection
│   │   ├── track.py                  # Email open tracking pixel
│   │   ├── simulate.py               # Demo simulation endpoints
│   │   ├── persona.py                # Agent persona + ghost voice
│   │   ├── context.py                # Cross-channel lead context
│   │   └── autopsy.py                # Campaign performance metrics
│   │
│   └── services/                     # Business logic layer
│       ├── llm_service.py            # Multi-model LLM orchestrator (Gemini + Groq + Sarvam)
│       ├── call_service.py           # Bland.ai API integration
│       ├── clawbot_service.py        # WhatsApp message builder
│       ├── ghost_voice.py            # Writing fingerprint extractor
│       ├── research_service.py       # Tavily + hardcoded company insights
│       ├── voice_service.py          # Sarvam speech-to-text
│       ├── preflight_ai.py           # Spam scorer + AI fixer
│       ├── copilot_service.py        # NL-to-workflow template generator
│       ├── objection_handler.py      # 6-type objection classifier + playbooks
│       ├── inbox_monitor.py          # Gmail IMAP reply poller (30s interval)
│       ├── whatsapp_poller.py        # Twilio message poller (15s interval)
│       └── coach_service.py          # Campaign performance coaching
│
├── render.yaml                       # Render IaC Blueprint (2 services)
├── .python-version                   # Python 3.11 pin for cloud builds
└── package.json                      # Next.js 16 + React 19
```

---

## 🔑 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/leads/upload` | Upload CSV/XLSX and parse leads |
| `POST` | `/api/leads/confirm` | Confirm and persist parsed leads |
| `POST` | `/api/leads/{id}/auto-reply` | Send automated follow-up email |
| `POST` | `/api/workflows` | Create/update workflow DAG |
| `POST` | `/api/campaigns/launch` | Execute campaign across all leads |
| `GET` | `/api/campaigns/{id}/status` | Real-time campaign metrics |
| `GET` | `/api/monitor/events/{id}` | SSE stream of live campaign events |
| `POST` | `/api/copilot/generate` | NL → workflow DAG generation |
| `POST` | `/api/preflight/scan` | Spam risk analysis + AI fix |
| `POST` | `/api/calls/initiate` | Trigger Bland.ai AI phone call |
| `POST` | `/api/clawbot/webhook` | Process WhatsApp command responses |
| `GET` | `/api/context/{lead_id}` | Cross-channel interaction timeline |
| `GET` | `/api/autopsy/{campaign_id}` | Campaign performance report |

---

## 📊 Database Schema (8 Tables)

| Table | Purpose |
|-------|---------|
| `leads` | Contact records with company, phone, enrichment data |
| `workflows` | Named workflow DAG definitions |
| `workflow_nodes` | Individual DAG nodes (type, config, position) |
| `workflow_edges` | Directed edges between nodes (with condition labels) |
| `campaigns` | Campaign instances linking workflows to leads |
| `campaign_leads` | Per-lead execution state within a campaign |
| `events` | Immutable event log (every action timestamped) |
| `clawbot_pending` | Queued WhatsApp actions awaiting user response |
| `bland_calls` | AI phone call records with transcripts |

---

## 🧪 Industry Use Cases

1. **B2B SaaS Sales** — Automate cold email sequences and schedule demo calls when prospects reply
2. **Real Estate** — AI voice agents pre-qualify property leads 24/7 via phone
3. **Recruitment** — Screen candidates via automated WhatsApp alerts and AI phone interviews
4. **Event Management** — Track RSVPs and send personalized itinerary follow-ups
5. **Marketing Agencies** — Run multi-channel outreach campaigns with real-time intent analysis

---

## 👤 Author

**Lakshya Paliwal**
- GitHub: [@lakshya-pm](https://github.com/lakshya-pm)

---

<p align="center">
  <sub>Built with ❤️ using Next.js, FastAPI, and Gemini AI</sub>
</p>
