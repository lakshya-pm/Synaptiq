# SECTION 4 — PRODUCT THESIS & POSITIONING

## Product Name & Tagline

> **ChronoReach** — *The AI outreach engine that thinks before it sends.*

## Target User (Demo Persona)

**Ravi**, founder of a 12-person B2B SaaS startup. He exported 150 CTO leads from LinkedIn Sales Navigator into an Excel sheet. He has no dedicated SDR — he does outreach himself between product calls. He needs to run a 3-step email sequence without sounding like a bot, without getting spam-flagged, and without spending 6 hours setting it up.

## What Makes ChronoReach UNIQUELY Compelling

1. **Natural-language campaign creation** — Ravi *describes* what he wants; ChronoReach *builds* the workflow. No drag-and-drop tutorial needed.
2. **Behavioral intelligence, not random timers** — sends are modeled on real SDR patterns: business-hour clustering, per-lead jitter, timezone awareness, daily caps.
3. **Preventive compliance** — a Preflight Check catches spam risk *before* the first email fires, with one-click AI fixes.
4. **Self-optimizing campaigns** — the AI Coach analyzes what's working and generates an optimized v2 of the workflow automatically.
5. **Full execution transparency** — every lead has a timeline showing exactly what happened, when, and *why the AI chose this message*.
6. **Visual workflow DAG** — not a flat list, but a real drag-and-drop DAG with AI nodes, conditions, delays, and branches.
7. **Safe Mode** — one toggle to activate all safety rails: throttling, cadence heatmap, soft caps, and compliance warnings.
8. **Zero-to-launch in under 2 minutes** — upload Excel → describe campaign → run preflight → launch. Demo-perfect flow.

## Mapping to Judging Criteria

| Judging Criterion | How ChronoReach Excels | Key Feature(s) |
|---|---|---|
| **Innovation** | NL-to-workflow generation + AI Coach are novel in the outreach space, especially at student-hackathon level | Campaign Copilot, AI Coach |
| **Technical Depth** | DAG execution engine, behavioral timing algorithms, structured LLM output, event-sourced replay | Timing Engine, Workflow Executor, Replay |
| **Real-World Impact** | Directly solves founder/SDR pain: saves hours, improves deliverability, prevents spam blacklisting | Preflight, Safe Mode, Personalization |
| **Feasibility (20h)** | Each feature has a clear MVP that demos well; smart use of mocked data where needed | All features scoped to MVPs |
| **Demo WOW Factor** | 5 distinct "aha moments" in a 3-min demo; visual heatmap + timeline + one-click fixes are inherently visual | Heatmap, Preflight Fix-It, Replay Timeline |

---

# SECTION 5 — FEATURE SET & PRIORITY MATRIX

## A. Must-Have (Critical for Coherent Demo)

| Feature | Demo Impact | Effort | Owner |
|---|---|---|---|
| Import leads from Excel/CSV with auto-detected fields | 6/10 | Low | Backend |
| Visual workflow builder (ReactFlow) with custom nodes: AI Message, Send Email, Delay, Condition/Branch | 8/10 | High | Frontend |
| LLM personalized message generation using lead fields | 7/10 | Low | AI |
| Workflow execution engine (DAG traversal + job scheduling) | 5/10 | High | Backend |
| Basic throttle + rate limit + "Safe Mode" toggle | 6/10 | Low | Backend |
| Monitoring dashboard: per-lead progression + campaign metrics | 7/10 | Med | Frontend |

## B. Strong Nice-to-Have

| Feature | Demo Impact | Effort | Owner |
|---|---|---|---|
| Campaign Copilot: NL → workflow JSON → rendered on canvas | 9/10 | Med | AI + Frontend |
| Spam/compliance preflight with risk score + "Fix It" | 9/10 | Low-Med | AI |
| Reply sentiment classification to drive branch conditions | 5/10 | Low | AI |
| Timezone-aware scheduling windows | 4/10 | Low | Backend |

## C. Stretch / WOW Features (Time Permitting)

| Feature | Demo Impact | Effort | Owner |
|---|---|---|---|
| AI SDR Coach with auto-optimizer + v2 workflow generation | 8/10 | Med-High | AI + Backend |
| Execution Replay timeline for single lead with AI explanations | 9/10 | Med | Frontend + AI |
| A/B testing of email nodes within workflow | 6/10 | Med | Backend |
| Visual cadence heatmap showing 48h send schedule | 8/10 | Med | Frontend |

---

# SECTION 6 — SYSTEM ARCHITECTURE & TECH STACK

## Tech Stack Decisions

| Layer | Choice | Justification |
|---|---|---|
| **Frontend** | React + TypeScript + Vite + ReactFlow | ReactFlow is the gold standard for visual DAG editors; Vite for fast dev builds |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid prototyping with polished UI components — critical when you have 20h |
| **Backend** | Python + FastAPI | Team has AI/LLM member — Python is native for LLM integration (langchain, openai SDK). FastAPI is async, fast, typed. |
| **Database** | SQLite (WAL mode) / PostgreSQL (if time) | SQLite requires zero setup — critical for hackathon speed. **Must enable WAL mode** (`PRAGMA journal_mode=WAL;`) at DB init to prevent write-lock collisions when SSE + APScheduler write events concurrently. One line, zero overhead. |
| **Queue / Jobs** | APScheduler (in-process) | No infra overhead. Schedule jobs with cron-like timing from Python. For hackathon, in-process is fine. |
| **LLM Provider** | OpenAI GPT-4o-mini (primary), Gemini Flash (fallback) | GPT-4o-mini: fast, cheap, reliable structured output. Gemini as backup if rate-limited. |
| **Email Delivery** | Mock provider + optional SendGrid | Demo with mock provider that logs emails to DB. Switch to SendGrid if API key available. |
| **Real-time Updates** | Server-Sent Events (SSE) | Simpler than WebSockets; one-way server→client push for live dashboard updates. |

## Component Architecture (Text Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                  │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Lead     │ │ Workflow   │ │Campaign  │ │ Dashboard &  │  │
│  │ Import   │ │ Designer   │ │ Copilot  │ │ Analytics    │  │
│  │ (CSV)    │ │ (ReactFlow)│ │ (NL→DAG) │ │ + Heatmap    │  │
│  └────┬─────┘ └─────┬──────┘ └────┬─────┘ └──────┬───────┘  │
│       │              │             │               │          │
│  ┌────┴──────────────┴─────────────┴───────────────┴───────┐ │
│  │              REST API Client + SSE Listener              │ │
│  └──────────────────────────┬──────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────┘
                              │ HTTP / SSE
┌─────────────────────────────┼────────────────────────────────┐
│                     BACKEND (FastAPI)                         │
│  ┌──────────────────────────┴──────────────────────────────┐ │
│  │                    API Gateway (FastAPI Router)           │ │
│  └──┬────────┬────────┬─────────┬────────┬────────┬───────┘ │
│     │        │        │         │        │        │          │
│  ┌──┴───┐ ┌──┴────┐ ┌─┴──────┐ ┌┴──────┐ ┌┴─────┐ ┌┴─────┐ │
│  │Lead  │ │Work-  │ │LLM     │ │Timing │ │Safety│ │Coach │ │
│  │Ingest│ │flow   │ │Person- │ │Engine │ │&     │ │&     │ │
│  │Svc   │ │Exec-  │ │aliz-   │ │(Human │ │Spam  │ │Optim │ │
│  │      │ │utor   │ │ation   │ │-like) │ │Check │ │izer  │ │
│  └──┬───┘ └──┬────┘ └──┬─────┘ └──┬────┘ └──┬───┘ └──┬───┘ │
│     │        │         │          │         │        │      │
│  ┌──┴────────┴─────────┴──────────┴─────────┴────────┴───┐  │
│  │            SQLite Database + APScheduler               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Lead Ingestion Service
- **Responsibilities:** Parse CSV/Excel, auto-detect columns (name, email, company, title, etc.), validate emails, store leads.
- **Key Data:** `leads` table with flexible JSON `custom_fields` column.
- **API:** `POST /api/leads/upload` (multipart file), `GET /api/leads` (list), `GET /api/leads/:id`.
- **Real vs Mock:** Fully real — CSV parsing is straightforward.

### 2. Workflow Designer (Frontend) + Workflow API
- **Responsibilities:** Drag-and-drop DAG builder with 4 node types. Save/load workflows. Campaign Copilot integration.
- **Key Data:** `workflows` table → `workflow_nodes` + `workflow_edges` tables (normalized graph).
- **API:** `POST /api/workflows`, `GET /api/workflows/:id`, `PUT /api/workflows/:id`, `POST /api/copilot/generate` (NL → validated workflow JSON).
- **JSON Validation Guardrail:** All Copilot-generated workflow JSON passes through `validate_workflow_json()` before reaching the frontend. Checks: every node has `id` + `node_type` (from allowed set: `ai_message`, `send_email`, `delay`, `condition`), all edge `source`/`target` IDs exist in node list, and DAG has at least one root node. Returns 422 with error detail if invalid → frontend shows "Regenerating..." toast instead of crashing.
- **Real vs Mock:** Fully real frontend; API is CRUD.

### 3. LLM Personalization Service
- **Responsibilities:** Generate personalized email content given a lead record + campaign template + node config.
- **Key Data:** Prompt templates stored in code; lead data from DB.
- **API:** `POST /api/generate-message` (lead_id, node_id, campaign_context).
- **Real vs Mock:** Real LLM calls (GPT-4o-mini). Fallback: pre-generated messages in DB for demo reliability.

### 4. Behavioral Timing Engine
- **Responsibilities:** Compute `next_send_time` with human-like characteristics. Expose schedule as heatmap data.
- **Key Data:** Timing config (working_hours, jitter_range, daily_cap, timezone), schedule records.
- **API:** `GET /api/schedule/heatmap?campaign_id=X` (returns 48h grid data).
- **Real vs Mock:** Algorithm is real; schedule visualization is real.

### 5. Safety & Throttling Layer (Spam/Compliance Preflight)
- **Responsibilities:** Pre-launch content + cadence analysis. Risk scoring. "Fix It" rewrites.
- **Key Data:** Spam phrase list, scoring weights, cadence rules.
- **API:** `POST /api/preflight` (campaign_id) → returns risk report. `POST /api/preflight/fix` → returns rewritten content.
- **Real vs Mock:** Scoring logic is real (regex + rules + LLM). "Fix It" uses real LLM.

### 6. Workflow Executor / Orchestrator
- **Responsibilities:** Topological sort of DAG, enqueue nodes as jobs, execute in order, handle conditions/branches.
- **Key Data:** `executions` table (campaign × lead state machine), `events` table (every action logged).
- **API:** `POST /api/campaigns/:id/execute` (start), `GET /api/campaigns/:id/status`.
- **Real vs Mock:** Core execution engine is real. Email sending is mocked (logged to DB + console).

### 7. AI SDR Coach & Optimization Service
- **Responsibilities:** Aggregate campaign metrics, feed to LLM for analysis, generate optimization suggestions, create v2 workflow.
- **API:** `POST /api/coach/analyze` (campaign_id) → suggestions. `POST /api/coach/apply` → cloned optimized workflow.
- **Real vs Mock:** LLM analysis is real; mock/pre-seeded campaign data feeds the analysis for demo.

## Core Database Schema

> ⚠️ **CRITICAL:** Run `PRAGMA journal_mode=WAL;` immediately after opening the SQLite connection in your FastAPI `lifespan` or `startup` event. This is non-negotiable for SSE + APScheduler concurrent writes.

```sql
CREATE TABLE leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    title TEXT,
    custom_fields JSON,  -- flexible key-value for any extra CSV columns
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER REFERENCES workflows(id),
    node_type TEXT NOT NULL,  -- 'ai_message', 'send_email', 'delay', 'condition'
    label TEXT,
    config JSON,  -- node-specific config: template, delay params, condition rules
    position_x REAL,
    position_y REAL
);

CREATE TABLE workflow_edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER REFERENCES workflows(id),
    source_node_id INTEGER REFERENCES workflow_nodes(id),
    target_node_id INTEGER REFERENCES workflow_nodes(id),
    condition_label TEXT  -- 'replied', 'no_reply', 'opened', NULL (unconditional)
);

CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER REFERENCES workflows(id),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft',  -- 'draft', 'preflight', 'running', 'paused', 'completed'
    safe_mode BOOLEAN DEFAULT TRUE,
    daily_send_cap INTEGER DEFAULT 50,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaign_leads (
    campaign_id INTEGER REFERENCES campaigns(id),
    lead_id INTEGER REFERENCES leads(id),
    current_node_id INTEGER REFERENCES workflow_nodes(id),
    status TEXT DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'errored'
    PRIMARY KEY (campaign_id, lead_id)
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER REFERENCES campaigns(id),
    lead_id INTEGER REFERENCES leads(id),
    node_id INTEGER REFERENCES workflow_nodes(id),
    event_type TEXT NOT NULL,  -- 'message_generated', 'email_sent', 'email_opened',
                               -- 'reply_received', 'delay_started', 'delay_completed',
                               -- 'condition_evaluated', 'error'
    payload JSON,  -- event-specific data: generated_text, ai_reasoning, error_msg
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
