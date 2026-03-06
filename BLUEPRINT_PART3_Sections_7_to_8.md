# SECTION 7 — ALGORITHMIC DETAIL: BEHAVIOR, SAFETY, PERSONALIZATION

## 1. Human-Like Delay / Cadence Engine

### Intuition
Real SDRs don't send at exactly 8:00 AM, 8:05 AM, 8:10 AM. They send in bursts during focus periods, skip lunch, slow down in the afternoon, and never send at 2 AM. Our engine models this:

- **Working-hour windows:** Define per-timezone send windows (e.g., 9–11 AM, 2–4 PM).
- **Gaussian jitter:** Each send gets a random offset drawn from a normal distribution (μ=0, σ=15 min), capped at ±30 min.
- **Per-lead pacing:** Minimum 18h gap between touches to the same lead.
- **Campaign-level daily cap:** Max N sends per day across all leads (e.g., 50/day).
- **Gradual ramp-up:** Day 1 sends 30%, Day 2 sends 60%, Day 3+ sends 100% of daily cap.

### Pseudocode

```python
import random
from datetime import datetime, timedelta
import math

def compute_next_send_time(
    previous_send_time: datetime | None,
    campaign_config: dict,
    lead_timezone: str,
    sends_today: int,
    campaign_day: int
) -> datetime:
    """
    Returns the next allowed send time with human-like characteristics.
    """
    now = datetime.now(tz=lead_timezone)

    # 1. Determine daily cap with ramp-up
    base_cap = campaign_config["daily_send_cap"]  # e.g., 50
    ramp_factor = min(1.0, 0.3 + (campaign_day - 1) * 0.35)
    effective_cap = int(base_cap * ramp_factor)

    if sends_today >= effective_cap:
        # Push to next day's first window
        return get_next_window_start(now + timedelta(days=1), campaign_config)

    # 2. Respect minimum inter-send gap for this lead
    min_gap_hours = campaign_config.get("min_lead_gap_hours", 18)
    if previous_send_time:
        earliest = previous_send_time + timedelta(hours=min_gap_hours)
    else:
        earliest = now

    # 3. Find next business-hour window
    send_windows = campaign_config["send_windows"]  # e.g., [(9,11), (14,16)]
    candidate = max(earliest, now)
    candidate = snap_to_next_window(candidate, send_windows)

    # 4. Add Gaussian jitter (μ=0, σ=15 min, clamp to ±30 min)
    jitter_minutes = random.gauss(0, 15)
    jitter_minutes = max(-30, min(30, jitter_minutes))
    candidate += timedelta(minutes=jitter_minutes)

    # 5. Ensure still within a valid window after jitter
    if not is_in_window(candidate, send_windows):
        candidate = snap_to_next_window(candidate, send_windows)

    return candidate


def snap_to_next_window(dt: datetime, windows: list) -> datetime:
    """Snap a datetime to the start of the next available send window."""
    for start_hour, end_hour in windows:
        window_start = dt.replace(hour=start_hour, minute=0, second=0)
        window_end = dt.replace(hour=end_hour, minute=0, second=0)
        if dt < window_end:
            return max(dt, window_start)
    # No more windows today — go to first window tomorrow
    next_day = dt + timedelta(days=1)
    first_start = windows[0][0]
    return next_day.replace(hour=first_start, minute=0, second=0)
```

## 2. Safety & Throttling

### Rate Limiting Strategy
- **Per-minute:** Max 3 sends (prevents burst detection)
- **Per-hour:** Max 20 sends
- **Per-day:** Configurable cap (default 50), with ramp-up
- **Panic Switch:** If bounce rate > 10% or error rate > 5% in last hour → auto-pause campaign

### Pseudocode

```python
def is_send_allowed(campaign_id: int, db) -> tuple[bool, str]:
    """Check whether another send is allowed right now."""
    now = datetime.utcnow()

    # Per-minute check
    sends_last_min = db.count_events(
        campaign_id=campaign_id, event_type="email_sent",
        since=now - timedelta(minutes=1)
    )
    if sends_last_min >= 3:
        return False, "Rate limit: max 3 sends/minute"

    # Per-hour check
    sends_last_hour = db.count_events(
        campaign_id=campaign_id, event_type="email_sent",
        since=now - timedelta(hours=1)
    )
    if sends_last_hour >= 20:
        return False, "Rate limit: max 20 sends/hour"

    # Bounce/error panic switch
    errors_last_hour = db.count_events(
        campaign_id=campaign_id, event_type="error",
        since=now - timedelta(hours=1)
    )
    if sends_last_hour > 0 and (errors_last_hour / sends_last_hour) > 0.10:
        pause_campaign(campaign_id)
        return False, "PANIC: Error rate >10%. Campaign auto-paused."

    return True, "OK"
```

## 3. Spam & Compliance Preflight Scoring

### Checks Performed

| Category | Check | Weight |
|---|---|---|
| **Content** | Spammy phrases ("Buy now", "Limited offer", "Act fast", ALL CAPS) | +2 per phrase |
| **Content** | Link density (>2 links per email) | +1.5 per extra link |
| **Content** | Missing unsubscribe / opt-out | +2 |
| **Content** | Excessive exclamation marks (>2) | +1 |
| **Cadence** | More than 3 touches in 5 days | +2 |
| **Cadence** | Sends outside business hours (before 8 AM / after 7 PM lead local time) | +1.5 |
| **Cadence** | No minimum gap between emails (<12h) | +2.5 |

### Scoring Algorithm

```python
def compute_spam_score(campaign) -> dict:
    score = 0.0
    issues = []

    # Content checks (per AI-generated message in workflow)
    for node in campaign.workflow.get_message_nodes():
        text = node.generated_text or node.template

        spam_phrases = ["buy now", "limited offer", "act fast", "click here",
                        "free trial", "don't miss", "exclusive deal"]
        found = [p for p in spam_phrases if p.lower() in text.lower()]
        if found:
            score += len(found) * 2
            issues.append(f"Spammy phrases in '{node.label}': {', '.join(found)}")

        link_count = text.count("http://") + text.count("https://")
        if link_count > 2:
            score += (link_count - 2) * 1.5
            issues.append(f"Too many links in '{node.label}': {link_count}")

        if text.count("!") > 2:
            score += 1
            issues.append(f"Excessive exclamation marks in '{node.label}'")

    # Cadence checks
    delays = campaign.workflow.get_total_delay_hours()
    touch_count = len(campaign.workflow.get_message_nodes())
    if touch_count > 3 and delays < 120:  # 3+ touches in under 5 days
        score += 2
        issues.append("Cadence too aggressive: too many touches in a short window")

    # Risk level
    if score <= 3:
        risk = "LOW"
    elif score <= 6:
        risk = "MEDIUM"
    else:
        risk = "HIGH"

    return {
        "score": round(score, 1),
        "risk": risk,
        "issues": issues,
        "max_score": 15.0
    }
```

## 4. LLM Personalization

### System Prompt

```
You are an expert B2B sales copywriter. Your job is to write a single personalized
outreach email for a specific lead based on their profile and the campaign context.

Rules:
- Be conversational, not corporate. Write like a thoughtful human, not a template.
- Reference at least 2 specific details from the lead's profile (company, role, recent news, industry).
- Keep it under 120 words. Short paragraphs. No bullet lists.
- DO NOT use phrases like "I hope this email finds you well" or "I wanted to reach out".
- Include a clear, low-pressure CTA (e.g., "Would a 15-min call next week make sense?").
- Match the specified tone: {tone}.
- This is email #{step_number} of {total_steps} in the sequence. Adjust warmth accordingly:
  - Step 1: Cold intro. Build curiosity.
  - Step 2: Add value. Reference a case study or insight.
  - Step 3+: Gentle nudge. Acknowledge you've been in touch.
```

### Input JSON Schema

```json
{
  "lead": {
    "first_name": "Priya",
    "last_name": "Sharma",
    "email": "priya@acmesaas.com",
    "company": "AcmeSaaS",
    "title": "CTO",
    "custom_fields": {
      "funding_stage": "Series A",
      "team_size": "45",
      "industry": "FinTech",
      "linkedin_headline": "Building the future of UPI payments"
    }
  },
  "campaign_context": {
    "sender_name": "Ravi",
    "sender_company": "ChronoReach",
    "value_proposition": "AI-powered outreach that books meetings without spam",
    "tone": "casual-professional",
    "step_number": 1,
    "total_steps": 3
  }
}
```

### Prompt Variants

| Step | Goal | Prompt Tweak |
|---|---|---|
| **1 – Cold Intro** | Build curiosity, earn the right to follow up | "Write a brief intro email. Lead with a relevant insight about their company/industry. End with a soft ask." |
| **2 – Value Add** | Provide substance | "Write a follow-up that references the previous email briefly, then shares a concrete insight, stat, or case study relevant to their role." |
| **3 – Final Nudge** | Close or part gracefully | "Write a short final follow-up. Acknowledge you've sent a couple messages. Make it easy to say yes or no. Be respectful of their time." |

---

# SECTION 8 — HACKATHON IMPLEMENTATION PLAN (20 HOURS, 3 PEOPLE)

> **Team HeavyWeight:** Person A (Frontend), Person B (Backend), Person C (AI/LLM)
> **Time Remaining:** ~20 hours

## Timeline

> [!IMPORTANT]
> **Person B's VERY FIRST task (before any other code):** Create `seed_demo.py` that populates: 15 realistic leads, 1 complete workflow, 1 already-executed campaign with 40+ events (for Replay Timeline demo), and pre-generated LLM response fixtures. Run this script before writing any other backend code. This ensures every team member has demo-ready data from Hour 0.

### Block 1: Hours 0–3 — Foundation & Skeleton

| Person | Tasks | Checkpoint |
|---|---|---|
| **A (Frontend)** | Scaffold React+Vite+TypeScript, install ReactFlow + Tailwind + shadcn/ui. Build basic layout: sidebar + canvas + top nav. Create 4 custom ReactFlow node components (AI Message, Send Email, Delay, Condition) with placeholder UIs. | ✅ Visual workflow canvas with draggable nodes renders |
| **B (Backend)** | **FIRST:** Create and run `seed_demo.py` (15 leads, 1 workflow, 1 executed campaign with 40+ events, pre-generated LLM fixtures). **THEN:** Scaffold FastAPI project. Set up SQLite (with WAL mode!) with all 7 tables. Implement CRUD APIs: leads upload (CSV parse), workflows (create/read/update), campaigns. | ✅ seed_demo.py runs clean; CSV upload + workflow CRUD work |
| **C (AI/LLM)** | Set up OpenAI client. Build `generate_personalized_email()` function with system prompt + 3 step variants. Test with sample lead data. Build Campaign Copilot prompt (NL → workflow JSON) + `validate_workflow_json()` guardrail. | ✅ LLM returns valid personalized email + validated workflow JSON |

### Block 2: Hours 3–7 — Core Integration

| Person | Tasks | Checkpoint |
|---|---|---|
| **A (Frontend)** | Wire workflow designer to backend API (save/load). Build lead import UI (file upload + field mapping preview). Connect Campaign Copilot: text input → API call → render workflow on canvas. | ✅ End-to-end: type description → workflow appears on canvas |
| **B (Backend)** | Build workflow executor: topological sort of DAG, iterate nodes per lead, schedule jobs via APScheduler. Implement timing engine (`compute_next_send_time`). Build email mock provider (log to events table). | ✅ Executor runs a simple workflow, events logged to DB |
| **C (AI/LLM)** | Build spam/compliance preflight API (`/api/preflight`). Implement scoring engine (regex + rules). Build "Fix It" endpoint (LLM rewrite). Test end-to-end with sample campaign. | ✅ Preflight returns risk score; Fix It returns improved copy |

### Block 3: Hours 7–11 — Dashboard & Monitoring

| Person | Tasks | Checkpoint |
|---|---|---|
| **A (Frontend)** | Build campaign dashboard: campaign list, status cards, per-lead progress table. Build cadence heatmap component (48h grid showing scheduled sends). Wire SSE for live updates. | ✅ Dashboard shows live campaign progress + heatmap |
| **B (Backend)** | Implement SSE endpoint for campaign events. Build heatmap data API. Add Safe Mode toggle (activates throttling + ramp-up). Pre-seed demo data (10-15 leads with events). | ✅ SSE pushes events; heatmap API works; demo data seeded |
| **C (AI/LLM)** | Build AI SDR Coach: aggregate metrics from events table, feed to LLM, return suggestions. Build "Apply Optimization" (clone workflow + apply tweaks). Start reply sentiment classifier. | ✅ Coach returns actionable suggestions from campaign data |

### Block 4: Hours 11–15 — WOW Features & Polish

| Person | Tasks | Checkpoint |
|---|---|---|
| **A (Frontend)** | Build Execution Replay timeline component (vertical timeline, icons per event). Build Preflight UI (risk card + issues list + Fix It button). Polish all UIs: animations, loading states, dark theme. | ✅ Replay timeline renders; Preflight card works |
| **B (Backend)** | Build replay data API (all events for a lead in a campaign). Add AI reasoning storage (save LLM explanation alongside generated messages). Bug fixes + API hardening. | ✅ Replay API returns full timeline with AI explanations |
| **C (AI/LLM)** | Build Coach UI integration (analysis panel + suggestions + Apply button). Add AI explanation generation (store "why" with each generated message). Prepare demo dataset with realistic scenarios. | ✅ Full AI Coach flow works end-to-end |

### Block 5: Hours 15–18 — Integration Testing & Demo Prep

| Person | Tasks | Checkpoint |
|---|---|---|
| **A (Frontend)** | Full integration testing: every demo flow works click-by-click. Fix UI bugs. Add micro-animations (node glow on execution, heatmap pulse, timeline slide-in). | ✅ All 5 demo flows work smoothly |
| **B (Backend)** | Load testing with demo dataset. Fix edge cases. Ensure pre-seeded data produces perfect demo. Create backup plan: pre-computed API responses in case LLM is slow. | ✅ Backend handles demo load; fallback data ready |
| **C (AI/LLM)** | Rehearse demo script. Prepare talking points. Create backup pre-generated LLM responses. Record demo video as backup if live demo fails. | ✅ Demo script rehearsed 2x; backup video recorded |

### Block 6: Hours 18–20 — Final Polish & Presentation

| Person | Tasks | Checkpoint |
|---|---|---|
| **ALL** | Final bug fixes. Prepare 2-3 slide intro (problem + solution positioning). Final demo rehearsal. Deploy to local machine with everything pre-loaded. Clean up UI. Test offline fallbacks. | ✅ **Ready to present** |

## Critical Path

| Milestone | Must Be Working By |
|---|---|
| Workflow canvas + lead upload + LLM personalization | Hour 5 |
| Workflow executor + Campaign Copilot + Preflight | Hour 9 |
| Dashboard + Heatmap + SSE live updates | Hour 13 |
| All 5 WOW features functional | Hour 16 |
| Demo rehearsed, fallbacks tested | Hour 19 |

## Cut-Scope Plan (If Behind Schedule)

**Drop FIRST (Stretch features):**
1. A/B testing within workflows
2. Full AI SDR Coach auto-optimizer (keep simple suggestions only)
3. Reply sentiment classification

**Drop SECOND (Nice-to-haves):**
4. Timezone-aware scheduling (use single timezone)
5. Cadence heatmap (keep Safe Mode toggle, drop visualization)

**Minimum Impressive Demo (Absolute Fallback):**
> Upload CSV → Campaign Copilot generates workflow → User tweaks nodes → Preflight checks spam risk → Fix It rewrites → Launch campaign → Dashboard shows leads progressing → Click on a lead to see Execution Replay timeline.

This is still **5 distinct aha moments** even without the Coach and full heatmap.
