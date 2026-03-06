# SECTION 9 — DEMO SCRIPT & STORYTELLING

> **Total Time: 4 minutes.** Rehearse from this script.

---

## 1. HOOK (45 seconds)

**[Speaker: Any team member. Stand center. Confident tone.]**

> "Meet Ravi. He's the founder of a 12-person fintech startup. Last week, he got 150 CTO leads from LinkedIn. He spent **6 hours** crafting individual emails. He sent 40. Three bounced. Two went to spam. He got one reply — *'Please unsubscribe me.'*
>
> The problem isn't Ravi's message. The problem is that every outreach tool treats leads like rows in a spreadsheet and blasts them on robot timers.
>
> Today we're introducing **ChronoReach** — an AI outreach engine that **thinks before it sends.** It builds your campaign, checks for spam before launch, times sends like a real human, and coaches you to get better after every batch."

---

## 2. LIVE PRODUCT WALKTHROUGH (2 min 30 sec)

### Scene 1: Upload & Auto-Detect (20 sec)

**[Share screen. ChronoReach dashboard open.]**

> "Ravi starts by uploading his Excel file."

**[Click "Import Leads" → drag Excel file → upload.]**

> "ChronoReach auto-detects columns — name, email, company, title, funding stage. 150 leads imported in 3 seconds."

### Scene 2: Campaign Copilot — NL to Workflow (30 sec)

> "Now, instead of dragging nodes manually, Ravi types what he wants."

**[Type in Copilot box:]** *"3-step outreach to fintech CTOs: soft intro about their funding stage, a case study follow-up about UPI payments, and a final nudge with a meeting link."*

**[Click "Generate Workflow" → watch the canvas populate with nodes and edges.]**

> "In one sentence, ChronoReach generated a full 3-step workflow with AI Message nodes, human-like delays between 24–48 hours, and a reply-detection condition. Ravi can tweak any node if he wants."

### Scene 3: AI Personalization Preview (25 sec)

> "Let's preview what the AI drafts for a specific lead."

**[Click on lead "Priya Sharma, CTO at AcmeSaaS" → preview panel shows personalized email.]**

> "Notice — ChronoReach references Priya's *Series A funding* and her *LinkedIn headline about UPI payments*. This isn't a mail-merge template — the AI read her profile and crafted a message that feels like Ravi actually knows her."

### Scene 4: Spam Preflight — The Safety Net (30 sec) ⭐ **MAGIC MOMENT #1**

> "Before launching, Ravi runs our **Preflight Check**."

**[Click "Run Preflight" → Risk Card appears: **HIGH RISK (7.2/10)**.]**

> "It caught three issues: a spammy phrase in step 2, too many links, and the cadence is too aggressive — 3 emails in 3 days."

**[Click "Fix It" → watch the score change.]**

> "One click. AI rewrites the flagged content. Score drops to **LOW (2.1)**. Ravi's campaign is now safe to launch before the first email ever leaves his inbox."

### Scene 5: Safe Mode + Cadence Heatmap (20 sec)

> "Ravi toggles Safe Mode."

**[Toggle Safe Mode → heatmap appears showing 48-hour send schedule.]**

> "This heatmap shows exactly when emails will fire — clustered in business hours, staggered with random jitter, respecting a 50/day cap with gradual ramp-up. No more sending 100 emails at 3AM."

### Scene 6: Execution Replay (25 sec) ⭐ **MAGIC MOMENT #2**

> "Let's fast-forward. The campaign ran for 2 days. Ravi clicks on lead Priya Sharma."

**[Click on Priya → Execution Replay Timeline opens.]**

> "A full timeline: AI drafted the intro at 9:12 AM using her funding stage as a hook — here's the AI's reasoning. Email sent at 9:47 AM with 35 minutes of jitter. Opened at 11:02 AM. No reply. AI drafted a follow-up referencing her LinkedIn post. Every decision is transparent and debuggable."

---

## 3. MAGIC MOMENT #3: AI SDR Coach (30 sec)

> "Finally, Ravi asks the AI Coach: *how can I improve?*"

**[Click "Ask Coach" → analysis panel slides in.]**

> "The Coach analyzed all sends. Subject line A got 32% opens versus 18% for B. Morning sends outperformed afternoon 2-to-1. It recommends: switch to Subject A, shift all sends to 9–10 AM, soften the CTA in step 3.
>
> Click **Apply Optimization** — and ChronoReach creates an optimized v2 of the workflow with these changes pre-applied."

---

## 4. CLOSING (30 seconds)

> "Let's recap what makes ChronoReach different from what you've seen today.
>
> **Innovation:** The Campaign Copilot and AI Coach don't just automate — they *think* alongside you.
>
> **Technical depth:** A real DAG execution engine, behavioral timing algorithms, and structured LLM orchestration — not just API calls.
>
> **Real-world impact:** Every founder doing outbound has this exact problem. ChronoReach could become a product *tomorrow*.
>
> We're Team HeavyWeight. This is ChronoReach — the AI outreach engine that thinks before it sends. Thank you."

**[End. ~4 minutes total.]**

---

# SECTION 10 — CODE SCAFFOLDING

## 1. Workflow Execution Engine (Python / FastAPI)

```python
# engine/executor.py
from collections import deque
from datetime import datetime
from typing import Any
import json

class WorkflowExecutor:
    """DAG-based workflow executor that processes nodes in topological order."""

    def __init__(self, workflow: dict, leads: list[dict], scheduler, llm_client, email_provider):
        self.nodes = {n["id"]: n for n in workflow["nodes"]}
        self.edges = workflow["edges"]
        self.leads = leads
        self.scheduler = scheduler
        self.llm = llm_client
        self.email = email_provider

    def get_topological_order(self) -> list[str]:
        """Kahn's algorithm for topological sort of workflow DAG."""
        in_degree = {nid: 0 for nid in self.nodes}
        adj = {nid: [] for nid in self.nodes}

        for edge in self.edges:
            adj[edge["source"]].append(edge["target"])
            in_degree[edge["target"]] += 1

        queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
        order = []

        while queue:
            nid = queue.popleft()
            order.append(nid)
            for neighbor in adj[nid]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return order

    async def execute_for_lead(self, lead: dict, campaign_id: int):
        """Execute the workflow for a single lead, respecting node types."""
        order = self.get_topological_order()

        for node_id in order:
            node = self.nodes[node_id]
            node_type = node["node_type"]

            if node_type == "ai_message":
                result = await self._handle_ai_message(node, lead, campaign_id)
            elif node_type == "delay":
                await self._handle_delay(node, lead, campaign_id)
            elif node_type == "send_email":
                await self._handle_send_email(node, lead, campaign_id, result)
            elif node_type == "condition":
                next_node_id = await self._handle_condition(node, lead, campaign_id)
                if next_node_id:
                    # Skip remaining topological order; continue from branch target
                    await self._execute_from_node(next_node_id, lead, campaign_id)
                    return  # Branch took over; don't continue linear order

    async def _handle_ai_message(self, node, lead, campaign_id) -> dict:
        """Generate a personalized message using LLM."""
        prompt_context = {
            "lead": lead,
            "campaign_context": node["config"],
            "step_number": node["config"].get("step_number", 1),
        }
        message = await self.llm.generate_message(prompt_context)
        reasoning = message.get("reasoning", "")

        # Log event
        await self._log_event(campaign_id, lead["id"], node["id"],
                              "message_generated",
                              {"text": message["body"], "subject": message["subject"],
                               "ai_reasoning": reasoning})
        return message

    async def _handle_delay(self, node, lead, campaign_id):
        """Schedule the next node execution after computed delay."""
        from engine.timing import compute_next_send_time
        send_at = compute_next_send_time(
            previous_send_time=None,  # fetched from events in production
            campaign_config=node["config"],
            lead_timezone=lead.get("timezone", "Asia/Kolkata"),
            sends_today=0,
            campaign_day=1
        )
        await self._log_event(campaign_id, lead["id"], node["id"],
                              "delay_started", {"scheduled_for": send_at.isoformat()})
        # In production: schedule via APScheduler
        self.scheduler.add_job(self._resume_after_delay, trigger='date',
                               run_date=send_at, args=[campaign_id, lead, node["id"]])

    async def _handle_send_email(self, node, lead, campaign_id, message):
        """Send (or mock-send) the email."""
        await self.email.send(
            to=lead["email"],
            subject=message["subject"],
            body=message["body"]
        )
        await self._log_event(campaign_id, lead["id"], node["id"],
                              "email_sent",
                              {"to": lead["email"], "subject": message["subject"]})

    async def _handle_condition(self, node, lead, campaign_id) -> str | None:
        """Evaluate condition by checking events table. Returns next node ID."""
        check_type = node["config"].get("check", "reply_received")

        # Query events for this lead in this campaign
        has_reply = await self._check_event_exists(
            campaign_id, lead["id"], event_type="reply_received"
        )

        # Find matching outgoing edge
        matched_label = "replied" if has_reply else "no_reply"
        for edge in self.edges:
            if edge["source"] == node["id"] and edge.get("condition_label") == matched_label:
                await self._log_event(campaign_id, lead["id"], node["id"],
                                      "condition_evaluated",
                                      {"check": check_type, "result": matched_label,
                                       "next_node": edge["target"]})
                return edge["target"]

        await self._log_event(campaign_id, lead["id"], node["id"],
                              "condition_evaluated",
                              {"check": check_type, "result": "no_matching_edge"})
        return None

    async def _check_event_exists(self, campaign_id, lead_id, event_type) -> bool:
        """Check if a specific event type exists for this lead (mock-friendly)."""
        # In production: SELECT COUNT(*) FROM events WHERE ...
        # For demo: return False (no replies in mock data) or True for seeded leads
        return False

    async def _execute_from_node(self, node_id, lead, campaign_id):
        """Resume execution from a specific node (for branch jumps)."""
        node = self.nodes[node_id]
        node_type = node["node_type"]
        if node_type == "ai_message":
            result = await self._handle_ai_message(node, lead, campaign_id)
        elif node_type == "delay":
            await self._handle_delay(node, lead, campaign_id)
        elif node_type == "send_email":
            # For branch nodes, generate message first if needed
            await self._handle_send_email(node, lead, campaign_id, {})

    async def _log_event(self, campaign_id, lead_id, node_id, event_type, payload):
        """Log every execution event for replay timeline."""
        # In production: insert into events table
        print(f"[EVENT] {event_type}: campaign={campaign_id} lead={lead_id} "
              f"node={node_id} payload={json.dumps(payload)[:100]}")
```

### Workflow JSON Validation Guardrail

```python
# engine/validation.py
from fastapi import HTTPException

ALLOWED_NODE_TYPES = {"ai_message", "send_email", "delay", "condition"}

def validate_workflow_json(data: dict) -> dict:
    """Validate LLM-generated workflow JSON before it reaches the frontend.
    Raises HTTPException(422) with details if invalid."""
    errors = []

    # Check nodes exist
    nodes = data.get("nodes", [])
    if not nodes:
        raise HTTPException(422, detail="Workflow has no nodes")

    node_ids = set()
    for i, node in enumerate(nodes):
        if "id" not in node:
            errors.append(f"Node {i} missing 'id'")
        else:
            node_ids.add(node["id"])
        if node.get("node_type") not in ALLOWED_NODE_TYPES:
            errors.append(f"Node {node.get('id', i)}: invalid node_type "
                          f"'{node.get('node_type')}'. Allowed: {ALLOWED_NODE_TYPES}")

    # Check edges reference valid nodes
    for i, edge in enumerate(data.get("edges", [])):
        if edge.get("source") not in node_ids:
            errors.append(f"Edge {i}: source '{edge.get('source')}' not in node list")
        if edge.get("target") not in node_ids:
            errors.append(f"Edge {i}: target '{edge.get('target')}' not in node list")

    if errors:
        raise HTTPException(422, detail={"message": "Invalid workflow JSON", "errors": errors})

    return data  # Pass-through if valid

### Example Workflow JSON

```json
{
  "nodes": [
    {"id": "n1", "node_type": "ai_message", "label": "Draft Intro Email",
     "config": {"step_number": 1, "tone": "casual-professional"}},
    {"id": "n2", "node_type": "delay", "label": "Wait 24-36h",
     "config": {"min_hours": 24, "max_hours": 36, "send_windows": [[9,11],[14,16]]}},
    {"id": "n3", "node_type": "send_email", "label": "Send Intro",
     "config": {}},
    {"id": "n4", "node_type": "condition", "label": "Reply received?",
     "config": {"check": "reply_received", "wait_hours": 48}},
    {"id": "n5", "node_type": "ai_message", "label": "Draft Follow-up",
     "config": {"step_number": 2, "tone": "casual-professional"}}
  ],
  "edges": [
    {"source": "n1", "target": "n2"},
    {"source": "n2", "target": "n3"},
    {"source": "n3", "target": "n4"},
    {"source": "n4", "target": "n5", "condition_label": "no_reply"}
  ]
}
```

## 2. LLM Personalization Module

```python
# engine/llm_service.py
import openai
import json
from tenacity import retry, stop_after_attempt, wait_exponential

SYSTEM_PROMPTS = {
    1: """You are an expert B2B sales copywriter. Write a cold intro email.
Lead with a relevant insight about their company/industry using the lead data provided.
Keep it under 120 words. Be conversational, not corporate.
End with a soft, low-pressure CTA. Output JSON: {"subject": "...", "body": "...", "reasoning": "..."}""",

    2: """You are an expert B2B sales copywriter. Write a follow-up email (email #2 of the sequence).
Briefly reference the previous email. Share a concrete insight or case study relevant to their role.
Keep it under 100 words. Output JSON: {"subject": "...", "body": "...", "reasoning": "..."}""",

    3: """You are an expert B2B sales copywriter. Write a final gentle nudge (email #3).
Acknowledge you've been in touch. Make it easy to say yes or no. Be respectful.
Keep it under 80 words. Output JSON: {"subject": "...", "body": "...", "reasoning": "..."}""",
}

class LLMService:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model = model

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def generate_message(self, context: dict) -> dict:
        step = context.get("step_number", 1)
        system_prompt = SYSTEM_PROMPTS.get(step, SYSTEM_PROMPTS[1])

        user_prompt = f"""Lead data:
Name: {context['lead']['first_name']} {context['lead']['last_name']}
Company: {context['lead']['company']}
Title: {context['lead']['title']}
Custom fields: {json.dumps(context['lead'].get('custom_fields', {}))}

Sender: {context['campaign_context'].get('sender_name', 'Team')}
Value prop: {context['campaign_context'].get('value_proposition', '')}
Tone: {context['campaign_context'].get('tone', 'casual-professional')}"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.8,
            max_tokens=500
        )
        return json.loads(response.choices[0].message.content)
```

## 3. React Workflow Builder (Key Components)

```tsx
// src/components/WorkflowDesigner.tsx
import React, { useCallback, useState } from 'react';
import ReactFlow, {
  addEdge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Connection, Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AIMessageNode } from './nodes/AIMessageNode';
import { DelayNode } from './nodes/DelayNode';
import { SendEmailNode } from './nodes/SendEmailNode';
import { ConditionNode } from './nodes/ConditionNode';
import { NodePalette } from './NodePalette';

const nodeTypes = {
  aiMessage: AIMessageNode,
  delay: DelayNode,
  sendEmail: SendEmailNode,
  condition: ConditionNode,
};

export function WorkflowDesigner() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = { x: event.clientX - 250, y: event.clientY - 100 };
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position,
      data: { label: type.replace(/([A-Z])/g, ' $1').trim() },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const saveWorkflow = async () => {
    const workflow = {
      nodes: nodes.map(n => ({
        id: n.id, node_type: n.type, label: n.data.label,
        config: n.data.config || {}, position_x: n.position.x, position_y: n.position.y
      })),
      edges: edges.map(e => ({
        source: e.source, target: e.target,
        condition_label: e.data?.conditionLabel || null
      }))
    };
    await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <NodePalette />
      <div style={{ flex: 1 }}
           onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} nodeTypes={nodeTypes}
          fitView
        >
          <Background /> <Controls /> <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
```

```tsx
// src/components/nodes/AIMessageNode.tsx
import { Handle, Position } from 'reactflow';

export function AIMessageNode({ data }: { data: any }) {
  return (
    <div className="rounded-xl border-2 border-purple-500 bg-purple-50
                    dark:bg-purple-900/30 p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🤖</span>
        <span className="font-semibold text-purple-700 dark:text-purple-300">
          AI Message
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {data.label || 'Generate personalized email'}
      </p>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

```tsx
// src/components/NodePalette.tsx
const NODE_TYPES = [
  { type: 'aiMessage', icon: '🤖', label: 'AI Message', color: 'purple' },
  { type: 'sendEmail', icon: '📧', label: 'Send Email', color: 'blue' },
  { type: 'delay', icon: '⏳', label: 'Delay', color: 'amber' },
  { type: 'condition', icon: '🔀', label: 'Condition', color: 'green' },
];

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, type: string) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-56 bg-gray-50 dark:bg-gray-900 border-r p-4 space-y-3">
      <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500">
        Nodes
      </h3>
      {NODE_TYPES.map(({ type, icon, label }) => (
        <div key={type}
             className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800
                        rounded-lg shadow cursor-grab hover:shadow-md transition"
             draggable onDragStart={(e) => onDragStart(e, type)}>
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}
```

---

# SECTION 11 — FINAL CHECKLIST & RISKS

## Pre-Hackathon Setup Checklist

- [ ] **Repos:** Frontend repo (React+Vite) and Backend repo (FastAPI) initialized with README
- [ ] **Environment:** `.env` files with `OPENAI_API_KEY`, `SENDGRID_API_KEY` (optional), `DATABASE_URL`
- [ ] **LLM Access:** OpenAI API key with billing enabled; Gemini API key as fallback
- [ ] **Email Provider:** SendGrid free-tier account OR mock provider configured
- [ ] **Demo Data:** Excel file with 15–20 realistic leads (varied companies, titles, custom fields)
- [ ] **Pre-generated fallbacks:** 5 sample personalized emails + 1 complete workflow JSON stored as fixtures
- [ ] **Design tokens:** Tailwind config + shadcn components installed and themed (dark mode ready)
- [ ] **Must-demo flows verified:**
  - [ ] Upload CSV → leads appear in table
  - [ ] Campaign Copilot → workflow on canvas
  - [ ] Drag-and-drop nodes → save workflow
  - [ ] Run Preflight → risk card → Fix It → score drops
  - [ ] Execute campaign → dashboard updates via SSE
  - [ ] Click lead → Execution Replay timeline
  - [ ] Ask AI Coach → suggestions → Apply Optimization

## Top 5 Risks & Mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | **OpenAI API down or rate-limited during demo** | Can't generate messages live | Pre-generate 5 messages per lead and store in DB. LLM calls use `try/except` with fallback to pre-generated content. |
| 2 | **WiFi/network failure at venue** | All API calls fail | Run everything locally: SQLite, mock email provider, cached LLM responses. Test full demo in airplane mode before presenting. |
| 3 | **ReactFlow complex layout bugs** | Canvas looks broken | Keep workflow simple (5–6 nodes max). Pre-compute node positions. Test with the exact demo workflow only. |
| 4 | **Workflow executor runtime errors (edge cases)** | Demo crashes mid-execution | Pre-seed a fully executed campaign in DB. If executor fails live, show the pre-seeded data. Replay timeline works regardless. |
| 5 | **Time crunch — can't finish all 5 WOW features** | Weaker demo | Prioritize by demo impact: Copilot > Preflight > Replay > Heatmap > Coach. Even 3 of 5 is stronger than any competitor's full feature set. |

## "Minimum Winning Demo" Summary

> **If we only do these three things, we still have a winning-level demo:**
>
> 1. **Campaign Copilot:** Type a sentence → full workflow appears on canvas.
> 2. **Spam Preflight + Fix It:** Run check → see risk score → one-click fix → score drops.
> 3. **Execution Replay:** Click any lead → full timeline with AI reasoning at every step.
>
> These three features alone demonstrate **innovation** (NL→workflow), **technical depth** (execution engine + event sourcing), **real-world impact** (spam prevention), and **demo WOW factor** (visual timeline) — hitting every judging criterion.

---

> **🏋️ Team HeavyWeight — Let's build ChronoReach and win this. Clock starts NOW. 🚀**
