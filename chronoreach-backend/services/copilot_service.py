# services/copilot_service.py
"""
Synaptiq Campaign Copilot Service
Returns a rich multi-node workflow DAG instantly.
"""

import uuid

ALLOWED_NODE_TYPES = {
    "trigger", "blocklist", "ai_message", "delay",
    "send_email", "condition", "clawbot",
}


def _uid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Rich Copilot Template — 8 nodes matching the user's spec
# This is what gets generated when user clicks Copilot and describes a campaign
# ---------------------------------------------------------------------------

COPILOT_TEMPLATE = {
    "nodes": [
        {"id": "t1", "node_type": "trigger", "label": "⚡ Trigger", "config": {}, "position_x": 0, "position_y": 300},
        {"id": "b1", "node_type": "blocklist", "label": "🛡️ Blocklist Guard", "config": {"domains": ["zoho.com", "salesforce.com", "hubspot.com", "freshworks.com"]}, "position_x": 200, "position_y": 300},
        {"id": "m1", "node_type": "ai_message", "label": "🤖 AI Draft Email", "config": {"step": 1}, "position_x": 400, "position_y": 300},
        {"id": "d1", "node_type": "delay", "label": "⏳ Smart Delay", "config": {"delay_hours": 1, "min_hours": 0.5, "max_hours": 2}, "position_x": 600, "position_y": 300},
        {"id": "s1", "node_type": "send_email", "label": "📧 Send Email", "config": {}, "position_x": 800, "position_y": 300},
        {"id": "c1", "node_type": "condition", "label": "🔀 Replied?", "config": {"check": "reply_received"}, "position_x": 1000, "position_y": 300},
        {"id": "cb1", "node_type": "clawbot", "label": "🦅 ClawBot Alert", "config": {"threshold": 2}, "position_x": 1200, "position_y": 300},
        {"id": "s2", "node_type": "send_email", "label": "📅 Book Meeting", "config": {"action": "meeting"}, "position_x": 1400, "position_y": 300},
    ],
    "edges": [
        {"source": "t1", "target": "b1"},
        {"source": "b1", "target": "m1"},
        {"source": "m1", "target": "d1"},
        {"source": "d1", "target": "s1"},
        {"source": "s1", "target": "c1"},
        {"source": "c1", "target": "cb1", "condition_label": "no_reply"},
        {"source": "cb1", "target": "s2"},
    ],
}

# Aliases
TEMPLATE_1STEP = COPILOT_TEMPLATE
TEMPLATE_3STEP = COPILOT_TEMPLATE
TEMPLATE_5STEP = COPILOT_TEMPLATE


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def validate_workflow_json(data: dict) -> tuple[bool, list[str]]:
    errors = []
    nodes = data.get("nodes", [])
    if not nodes:
        errors.append("Workflow has no nodes")
        return False, errors

    node_ids = set()
    for i, node in enumerate(nodes):
        if "id" not in node:
            errors.append(f"Node {i} missing 'id'")
        else:
            node_ids.add(node["id"])

        ntype = node.get("node_type")
        if ntype not in ALLOWED_NODE_TYPES:
            errors.append(f"Node {node.get('id', i)}: invalid node_type '{ntype}'")

    for i, edge in enumerate(data.get("edges", [])):
        if edge.get("source") not in node_ids:
            errors.append(f"Edge {i}: source '{edge.get('source')}' not found")
        if edge.get("target") not in node_ids:
            errors.append(f"Edge {i}: target '{edge.get('target')}' not found")

    return len(errors) == 0, errors


# ---------------------------------------------------------------------------
# NL → Workflow JSON  —  INSTANT (no Gemini call)
# ---------------------------------------------------------------------------


async def natural_language_to_workflow(description: str) -> dict:
    """Return the rich copilot workflow template instantly."""
    print(f"[Copilot] ⚡ Generating workflow for: {description[:80]}...")
    return COPILOT_TEMPLATE
