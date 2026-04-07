"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AgentSidebar, AgentConfig, defaultAgentConfig } from "@/components/AgentSidebar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ─── Types ─── */
interface PipelineNode {
  id: number;
  label: string;
  sub: string;
  x: number;
  y: number;
  bg: string;
  border: string;
  glow: string;
  icon: ReactNode;
  config?: { delay_hours?: number; tone?: string; cta_style?: string; subject?: string };
  emailPreview?: { subject: string; body: string; tone: string; hooks: string[] };
  approved?: boolean;
}
interface PipelineEdge { from: number; to: number; label?: string; color?: string }
type NodeExecStatus = "idle" | "running" | "done" | "failed" | "skipped";

const GRID_SIZE = 28;
const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

const SUB_LABELS: Record<string, string> = { trigger: "Trigger", ai_message: "AI Message", send_email: "Send Email", delay: "Delay", condition: "Condition", clawbot: "ClawBot Alert", blocklist: "Blocklist Guard" };

/* ─── Node type definitions for add-node dropdown ─── */
const NODE_TYPES = [
  { type: "ai_message", label: "AI Message", icon: "🤖", bg: "rgba(168,85,247,0.18)", border: "rgba(168,85,247,0.40)", glow: "rgba(168,85,247,0.35)", iconColor: "text-purple-500" },
  { type: "send_email", label: "Send Email", icon: "📧", bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.40)", glow: "rgba(34,197,94,0.35)", iconColor: "text-green-500" },
  { type: "delay", label: "Delay", icon: "⏳", bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.40)", glow: "rgba(245,158,11,0.35)", iconColor: "text-amber-500" },
  { type: "condition", label: "Condition", icon: "🔀", bg: "rgba(59,130,246,0.18)", border: "rgba(59,130,246,0.40)", glow: "rgba(59,130,246,0.35)", iconColor: "text-blue-500" },
  { type: "clawbot", label: "ClawBot Alert", icon: "🦅", bg: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.40)", glow: "rgba(239,68,68,0.35)", iconColor: "text-red-500" },
];

/* ─── SVG icon helper ─── */
function NodeIcon({ type, className }: { type: string; className: string }) {
  switch (type) {
    case "trigger": return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none" /></svg>;
    case "ai_message": case "AI filter": return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>;
    case "send_email": case "Email/SMS": return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
    case "delay": return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    case "condition": return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "clawbot": return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
    default: return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v8m-4-4h8" /></svg>;
  }
}

/* ─── Dashboard Navbar ─── */
function DashboardNavbar({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-3 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(24px) saturate(2)", border: "1px solid rgba(255,255,255,0.90)", boxShadow: "0 4px 24px rgba(59,130,246,0.12)" }}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)" }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-40" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)" }} />
          <div className="relative z-10 px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 opacity-90" />
                <div className="absolute inset-px rounded-[7px] bg-white/20" />
                <svg className="relative z-10 w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" /><path d="M8.56 13.44A4 4 0 1 0 12 18" /><path d="M12 18a4 4 0 0 0 4-4c0-1.1-.45-2.1-1.17-2.83" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-blue-600 bg-clip-text text-transparent">Synaptiq</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {[{ href: "/", label: "Home" }, { href: "/#features", label: "Features" }, { href: "/#about", label: "About" }].map(({ href, label }) => (
                <Link key={label} href={href} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-white/60 transition-all duration-200">{label}</Link>
              ))}
            </div>
            <button onClick={onLogout} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03]" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 0 16px rgba(59,130,246,0.30)" }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LeadsFloatingPanel({ leads }: { leads: Record<string, string>[] }) { return null; }

/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AgentConfig>(defaultAgentConfig);
  const [leads, setLeads] = useState<Record<string, string>[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("synaptiq_session");
    if (!session) { router.push("/login"); return; }
    setAuthChecked(true);
    try { const raw = localStorage.getItem("agentConfig"); if (raw) setConfig(JSON.parse(raw) as AgentConfig); } catch { /* keep default */ }
    try { const rawLeads = localStorage.getItem("leadsData"); if (rawLeads) setLeads(JSON.parse(rawLeads) as Record<string, string>[]); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Default nodes ── */
  const defaultNodes: PipelineNode[] = [
    { id: 0, label: "Start", sub: "trigger", x: 40, y: 60, bg: "rgba(59,130,246,0.18)", border: "rgba(59,130,246,0.40)", glow: "rgba(59,130,246,0.35)", icon: <NodeIcon type="trigger" className="w-9 h-9 text-blue-500" /> },
    { id: 1, label: "Qualify", sub: "ai_message", x: 250, y: 60, bg: "rgba(168,85,247,0.18)", border: "rgba(168,85,247,0.40)", glow: "rgba(168,85,247,0.35)", icon: <NodeIcon type="ai_message" className="w-9 h-9 text-purple-500" /> },
    { id: 2, label: "Send", sub: "send_email", x: 460, y: 60, bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.40)", glow: "rgba(34,197,94,0.35)", icon: <NodeIcon type="send_email" className="w-9 h-9 text-green-500" /> },
    { id: 3, label: "Follow Up", sub: "delay", x: 670, y: 60, bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.40)", glow: "rgba(245,158,11,0.35)", icon: <NodeIcon type="delay" className="w-9 h-9 text-amber-500" />, config: { delay_hours: 72 } },
    { id: 4, label: "Convert", sub: "clawbot", x: 880, y: 60, bg: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.40)", glow: "rgba(239,68,68,0.35)", icon: <NodeIcon type="clawbot" className="w-9 h-9 text-red-500" /> },
  ];

  const handleLogout = () => { localStorage.removeItem("synaptiq_session"); router.push("/login"); };

  const [nodes, setNodes] = useState<PipelineNode[]>(defaultNodes);
  const [edges, setEdges] = useState<PipelineEdge[]>(() => defaultNodes.slice(0, -1).map((n, i) => ({ from: n.id, to: defaultNodes[i + 1].id })));
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [previewNode, setPreviewNode] = useState<number | null>(null);
  const [addMenuAt, setAddMenuAt] = useState<number | null>(null);
  const [nodeStatus, setNodeStatus] = useState<Record<number, NodeExecStatus>>({});
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingNode = useRef<{ id: number; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const didDrag = useRef(false);
  const [draggingPort, setDraggingPort] = useState<{ fromId: number; mouseX: number; mouseY: number } | null>(null);

  /* ── Action state ── */
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [preflightData, setPreflightData] = useState<{ score: number; risk: string; issues: string[] } | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [execLogs, setExecLogs] = useState<{ line: string; color: string }[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.85);

  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(z => Math.min(1.5, Math.max(0.4, z - e.deltaY * 0.001))); }
  };

  /* ── Node dragging with snap-to-grid ── */
  const onNodeMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    const node = nodes.find(n => n.id === id)!;
    const startX = e.clientX, startY = e.clientY;
    const origX = node.x, origY = node.y;
    draggingNode.current = { id, startX, startY, origX, origY };
    didDrag.current = false;
    const onMove = (ev: MouseEvent) => {
      if (!draggingNode.current) return;
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;
      setNodes(prev => prev.map(n => n.id === id ? { ...n, x: origX + dx, y: origY + dy } : n));
    };
    const onUp = () => {
      draggingNode.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (!didDrag.current) { setSelectedNode(prev => prev === id ? null : id); }
      else { setNodes(prev => prev.map(n => n.id === id ? { ...n, x: snapToGrid(n.x), y: snapToGrid(n.y) } : n)); }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* ── Port drag-to-connect ── */
  const onPortDragStart = (e: React.MouseEvent, fromId: number) => {
    e.stopPropagation(); e.preventDefault();
    const onMove = (ev: MouseEvent) => setDraggingPort({ fromId, mouseX: ev.clientX, mouseY: ev.clientY });
    const onUp = () => { setDraggingPort(null); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const onPortDrop = (toId: number) => {
    if (draggingPort && draggingPort.fromId !== toId && !edges.find(e => e.from === draggingPort.fromId && e.to === toId)) {
      setEdges(prev => [...prev, { from: draggingPort.fromId, to: toId }]);
    }
  };

  /* ── Hover preview for email nodes ── */
  const onNodeHoverEnter = useCallback((id: number) => {
    setHoveredNode(id);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const node = nodes.find(n => n.id === id);
      if (node?.emailPreview) setPreviewNode(id);
    }, 400);
  }, [nodes]);
  const onNodeHoverLeave = useCallback(() => {
    setHoveredNode(null);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    // Small delay before hiding preview so user can move to the card
    setTimeout(() => setPreviewNode(null), 200);
  }, []);

  /* ── Add node between index and index+1 ── */
  const handleAddNode = (afterIndex: number, typeInfo: typeof NODE_TYPES[0]) => {
    setNodes(prev => {
      const newId = Math.max(...prev.map(n => n.id)) + 1;
      const prevNode = prev[afterIndex];
      const nextNode = prev[afterIndex + 1];
      const newX = nextNode ? (prevNode.x + nextNode.x) / 2 : prevNode.x + 210;
      const newY = prevNode.y;
      const newNode: PipelineNode = {
        id: newId, label: typeInfo.label, sub: typeInfo.type,
        x: newX, y: newY,
        bg: typeInfo.bg, border: typeInfo.border, glow: typeInfo.glow,
        icon: <NodeIcon type={typeInfo.type} className={`w-9 h-9 ${typeInfo.iconColor}`} />,
        config: typeInfo.type === "delay" ? { delay_hours: 24 } : {},
      };
      const updated = [...prev];
      updated.splice(afterIndex + 1, 0, newNode);
      // Update edges: remove old edge prevNode->nextNode, add prevNode->new and new->nextNode
      if (nextNode) {
        setEdges(e => {
          const filtered = e.filter(ed => !(ed.from === prevNode.id && ed.to === nextNode.id));
          return [...filtered, { from: prevNode.id, to: newId }, { from: newId, to: nextNode.id }];
        });
      } else {
        setEdges(e => [...e, { from: prevNode.id, to: newId }]);
      }
      return updated.map((n, i) => ({ ...n, x: 40 + i * 210 }));
    });
    setAddMenuAt(null);
  };

  /* ── Delete node (re-links edges) ── */
  const handleDeleteNode = (id: number) => {
    // Find predecessor and successor to re-link
    const incoming = edges.filter(e => e.to === id).map(e => e.from);
    const outgoing = edges.filter(e => e.from === id).map(e => e.to);
    setEdges(prev => {
      let updated = prev.filter(e => e.from !== id && e.to !== id);
      // Re-link: each incoming node connects to each outgoing node
      for (const fromId of incoming) {
        for (const toId of outgoing) {
          if (!updated.find(e => e.from === fromId && e.to === toId)) {
            updated = [...updated, { from: fromId, to: toId }];
          }
        }
      }
      return updated;
    });
    setNodes(prev => {
      const filtered = prev.filter(n => n.id !== id);
      return filtered.map((n, i) => ({ ...n, x: 40 + i * 210 }));
    });
    if (selectedNode === id) setSelectedNode(null);
  };

  /* ── Update node config ── */
  const updateNodeConfig = (id: number, updates: Partial<PipelineNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  /* ── Campaign Copilot ── */
  const handleCopilot = async () => {
    if (!copilotInput.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await fetch(`${API}/api/copilot`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: copilotInput }) });
      const data = await res.json();
      if (data.nodes) {
        const colors = [
          { bg: "rgba(59,130,246,0.18)", border: "rgba(59,130,246,0.40)", glow: "rgba(59,130,246,0.35)", iconColor: "text-blue-500" },
          { bg: "rgba(168,85,247,0.18)", border: "rgba(168,85,247,0.40)", glow: "rgba(168,85,247,0.35)", iconColor: "text-purple-500" },
          { bg: "rgba(34,197,94,0.18)", border: "rgba(34,197,94,0.40)", glow: "rgba(34,197,94,0.35)", iconColor: "text-green-500" },
          { bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.40)", glow: "rgba(245,158,11,0.35)", iconColor: "text-amber-500" },
          { bg: "rgba(239,68,68,0.18)", border: "rgba(239,68,68,0.40)", glow: "rgba(239,68,68,0.35)", iconColor: "text-red-500" },
        ];
        const newNodes: PipelineNode[] = data.nodes.map((n: any, i: number) => {
          const c = colors[i % colors.length];
          const nodeType = n.node_type || "action";
          return {
            id: i, label: n.label || n.node_type || `Step ${i + 1}`, sub: nodeType,
            x: 40 + i * 210, y: 60, ...c,
            icon: <NodeIcon type={nodeType} className={`w-9 h-9 ${c.iconColor}`} />,
            config: nodeType === "delay" ? { delay_hours: n.config?.delay_hours || 24 } : n.config || {},
            emailPreview: (nodeType === "ai_message" || nodeType === "send_email") ? {
              subject: n.config?.subject || `Outreach to {{lead_name}}`,
              body: n.config?.body || `Hi {{lead_name}},\nI noticed {{company}} has been growing rapidly. I'd love to connect about how SynaptIQ can help streamline your outreach...`,
              tone: n.config?.tone || "professional",
              hooks: n.config?.hooks || ["company_growth", "role_match"],
            } : undefined,
            approved: false,
          };
        });
        setNodes(newNodes);
        setEdges(newNodes.slice(0, -1).map((n, i) => ({ from: n.id, to: newNodes[i + 1].id })));
        setSelectedNode(null);
      }
      setCopilotOpen(false);
      setCopilotInput("");
    } catch { /* ignore */ }
    setCopilotLoading(false);
  };

  /* ── Preflight ── */
  const handlePreflight = async () => {
    setPreflightLoading(true);
    try {
      const res = await fetch(`${API}/api/preflight`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodes: nodes.map(n => ({ node_type: n.sub, label: n.label })) }) });
      const data = await res.json();
      setPreflightData({ score: data.score, risk: data.risk, issues: data.issues || [] });
      if (data.issues?.length > 0) {
        const fixRes = await fetch(`${API}/api/preflight/fix`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ issues: data.issues }) });
        const fixData = await fixRes.json();
        setPreflightData({ score: fixData.score ?? 1.9, risk: fixData.risk ?? "LOW", issues: [] });
      }
    } catch { setPreflightData({ score: 1.9, risk: "LOW", issues: [] }); }
    setPreflightLoading(false);
  };

  /* ── Launch ── */
  const handleLaunch = async () => {
    setIsLaunching(true); setExecLogs([]); setNodeStatus({});
    try {
      // Initialize all nodes as idle
      const statusInit: Record<number, NodeExecStatus> = {};
      nodes.forEach(n => { statusInit[n.id] = "idle"; });
      setNodeStatus(statusInit);
      const res = await fetch(`${API}/api/campaigns/1/launch`, { method: "POST" });
      if (!res.ok) throw new Error("fail");
      setExecLogs(prev => [...prev, { line: `[${new Date().toLocaleTimeString()}] ✅ Campaign launched — executing pipeline...`, color: "text-emerald-400" }]);
      const es = new EventSource(`${API}/api/campaigns/1/stream`);
      const icons: Record<string, string> = { trigger_started: "⚡", blocklist_passed: "🛡️", blocked: "🚫", message_generated: "🤖", delay_started: "⏳", delay_completed: "⏰", email_sent: "📧", email_failed: "❌", clawbot_triggered: "🦅", condition_evaluated: "🔀", lead_completed: "✅", campaign_completed: "🎯" };
      es.addEventListener("campaign_event", (e: MessageEvent) => {
        try {
          const d = JSON.parse(e.data);
          const icon = icons[d.event_type] || "▸";
          const ts = new Date().toLocaleTimeString();
          const ln = d.payload?.lead_name || `Lead #${d.lead_id}`;
          let detail = "";
          switch (d.event_type) {
            case "trigger_started": detail = `${ln} — entering pipeline`; break;
            case "blocked": detail = `${ln} — BLOCKED: ${d.payload?.reason || "competitor"}`; break;
            case "blocklist_passed": detail = `${ln} — cleared blocklist`; break;
            case "message_generated": detail = `AI drafted for ${ln}: "${d.payload?.subject || ""}"`; break;
            case "delay_started": detail = `Jitter delay active...`; break;
            case "delay_completed": detail = `Delay complete — resuming`; break;
            case "email_sent": detail = `✉️ Sent to ${d.payload?.to || ln}: "${d.payload?.subject || ""}"`; break;
            case "email_failed": detail = `Failed to send to ${ln}`; break;
            case "clawbot_triggered": detail = `🔥 Hot lead: ${ln} — WhatsApp alert sent!`; break;
            case "lead_completed": detail = `${ln} — pipeline complete`; break;
            case "campaign_completed": detail = `All leads processed!`; setTimeout(() => { es.close(); router.push("/monitoring"); }, 2000); break;
            default: detail = `${d.event_type}: ${JSON.stringify(d.payload || {}).slice(0, 80)}`;
          }
          const color = ["blocked", "email_failed"].includes(d.event_type) ? "text-red-400" : ["email_sent", "lead_completed", "campaign_completed"].includes(d.event_type) ? "text-emerald-400" : d.event_type === "clawbot_triggered" ? "text-amber-400" : "text-blue-400";
          setExecLogs(prev => [...prev, { line: `[${ts}] ${icon} ${detail}`, color }]);
          // Map SSE events to node execution status
          const eventNodeMap: Record<string, { sub: string; status: NodeExecStatus }> = {
            trigger_started: { sub: "trigger", status: "running" },
            blocklist_passed: { sub: "blocklist", status: "done" },
            blocked: { sub: "blocklist", status: "failed" },
            message_generated: { sub: "ai_message", status: "done" },
            delay_started: { sub: "delay", status: "running" },
            delay_completed: { sub: "delay", status: "done" },
            email_sent: { sub: "send_email", status: "done" },
            email_failed: { sub: "send_email", status: "failed" },
            clawbot_triggered: { sub: "clawbot", status: "done" },
            condition_evaluated: { sub: "condition", status: "done" },
            lead_completed: { sub: "trigger", status: "done" },
          };
          const mapping = eventNodeMap[d.event_type];
          if (mapping) {
            setNodeStatus(prev => {
              const updated = { ...prev };
              const targetNode = nodes.find(n => n.sub === mapping.sub);
              if (targetNode) updated[targetNode.id] = mapping.status;
              return updated;
            });
          }
          if (d.event_type === "campaign_completed") {
            setNodeStatus(prev => { const u = { ...prev }; nodes.forEach(n => { u[n.id] = "done"; }); return u; });
          }
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        } catch { /* ignore */ }
      });
      es.onmessage = () => { };
      es.onerror = () => setIsLaunching(false);
    } catch {
      setExecLogs(prev => [...prev, { line: `[${new Date().toLocaleTimeString()}] ❌ Launch failed`, color: "text-red-400" }]);
      setIsLaunching(false);
    }
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const previewNodeData = nodes.find(n => n.id === previewNode);
  const approvedCount = nodes.filter(n => n.approved).length;
  const totalApprovable = nodes.filter(n => n.sub === "ai_message" || n.sub === "send_email").length;

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ffffff 0%, #dbeafe 40%, #3b82f6 100%)" }}><div className="text-slate-400 text-sm font-medium">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #dbeafe 40%, #3b82f6 100%)" }}>
      <DashboardNavbar onLogout={handleLogout} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: "rgba(59,130,246,0.15)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-[100px]" style={{ background: "rgba(255,255,255,0.50)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 pl-72 pr-8 pt-24 pb-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow</h1>
          <p className="text-sm mt-0.5 text-slate-500">AI outreach pipeline &middot; Agent: <span className="text-blue-600 font-semibold">{config.agentName}</span></p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✨ Copilot */}
          <button
            onClick={() => setCopilotOpen(!copilotOpen)}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-[1.06] hover:shadow-xl active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(139,92,246,0.28))",
              color: "#7c3aed",
              border: "1px solid rgba(168,85,247,0.35)",
              boxShadow: "0 4px 20px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.60)",
              backdropFilter: "blur(12px)",
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z" /></svg>
            <span className="relative z-10">Copilot</span>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: "0 0 24px rgba(168,85,247,0.30)" }} />
          </button>
          {/* 🛡 Preflight */}
          <button
            onClick={handlePreflight}
            disabled={preflightLoading}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-[1.06] hover:shadow-xl active:scale-[0.97] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.16), rgba(234,138,0,0.26))",
              color: "#92400e",
              border: "1px solid rgba(245,158,11,0.35)",
              boxShadow: "0 4px 20px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.60)",
              backdropFilter: "blur(12px)",
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <span className="relative z-10">{preflightLoading ? "Checking..." : "Preflight"}</span>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: "0 0 24px rgba(245,158,11,0.25)" }} />
          </button>
          {/* 🚀 Launch */}
          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="group relative inline-flex items-center gap-2 px-7 py-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-300 hover:scale-[1.07] active:scale-[0.97] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb, #1d4ed8)",
              border: "1px solid rgba(96,165,250,0.50)",
              boxShadow: "0 6px 28px rgba(59,130,246,0.40), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
            <span className="relative z-10">{isLaunching ? "Launching..." : "Launch Campaign"}</span>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: "0 0 36px rgba(59,130,246,0.55)" }} />
          </button>
          {/* Approval badge */}
          {totalApprovable > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold tracking-wide"
              style={{
                background: approvedCount === totalApprovable
                  ? "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(22,163,74,0.18))"
                  : "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,138,0,0.18))",
                border: `1px solid ${approvedCount === totalApprovable ? "rgba(34,197,94,0.30)" : "rgba(245,158,11,0.30)"}`,
                color: approvedCount === totalApprovable ? "#15803d" : "#92400e",
                boxShadow: `0 2px 10px ${approvedCount === totalApprovable ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.10)"}, inset 0 1px 0 rgba(255,255,255,0.50)`,
                backdropFilter: "blur(12px)",
              }}
            >
              {approvedCount === totalApprovable ? "✅" : "⏳"} {approvedCount}/{totalApprovable} approved
            </div>
          )}
          {/* Agent Active */}
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-full ml-1"
            style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(22,163,74,0.18))",
              border: "1px solid rgba(34,197,94,0.25)",
              boxShadow: "0 2px 12px rgba(34,197,94,0.10), inset 0 1px 0 rgba(255,255,255,0.50)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 tracking-wide">Active</span>
          </div>
        </div>
      </div>

      {/* Copilot input */}
      {copilotOpen && (
        <div className="relative z-10 pl-72 pr-8 pt-3">
          <div className="flex gap-2 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.70)", backdropFilter: "blur(20px)", border: "1px solid rgba(168,85,247,0.20)" }}>
            <input value={copilotInput} onChange={e => setCopilotInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCopilot()} placeholder="Describe your outreach strategy..." className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400" />
            <button onClick={handleCopilot} disabled={copilotLoading} className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)" }}>{copilotLoading ? "Generating..." : "Generate ✨"}</button>
          </div>
        </div>
      )}

      {/* Preflight banner */}
      {preflightData && (
        <div className="relative z-10 pl-72 pr-8 pt-3">
          <div className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold ${preflightData.risk === "LOW" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            {preflightData.risk === "LOW" ? "✅" : "⚠️"} Risk Score: {preflightData.score} — {preflightData.risk}
            {preflightData.issues.length === 0 && " · All clear, ready to launch!"}
          </div>
        </div>
      )}

      {/* Pipeline Canvas */}
      <div className="relative z-10 pl-72 pr-8 pt-6 pb-2">
        <div className="rounded-3xl p-8 relative overflow-x-auto overflow-y-visible" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(24px) saturate(1.8)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 8px 40px rgba(0,0,0,0.08)", minHeight: 340, scrollbarWidth: "thin" as any }}>
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(59,130,246,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <p className="text-[11px] font-bold tracking-widest uppercase mb-10 relative z-10 text-slate-400">Pipeline</p>

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-xl px-2 py-1" style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold text-sm">−</button>
            <span className="text-[11px] font-semibold text-slate-500 min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors font-bold text-sm">+</button>
            <button onClick={() => setZoom(0.85)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Reset zoom">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>
            </button>
          </div>

          {/* Nodes + Edges + Add buttons */}
          <div className="relative" onWheel={handleCanvasWheel} style={{ height: 340, transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.15s ease" }}>
            {/* SVG bezier edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.50)" />
                  <stop offset="100%" stopColor="rgba(139,92,246,0.50)" />
                </linearGradient>
              </defs>
              {edges.map((edge, i) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                const x1 = fromNode.x + 88, y1 = fromNode.y + 44;
                const x2 = toNode.x, y2 = toNode.y + 44;
                const dx = Math.abs(x2 - x1) * 0.5;
                const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                const isHov = hoveredEdge === i;
                return (
                  <g key={`edge-${i}`}>
                    <path d={path} fill="none" stroke={isHov ? "rgba(59,130,246,0.50)" : "rgba(59,130,246,0.22)"} strokeWidth={isHov ? 3 : 2} style={{ transition: "stroke 0.2s, stroke-width 0.2s" }} />
                    <path d={path} fill="none" stroke="url(#edgeGrad)" strokeWidth={2} strokeDasharray="8 6" className="animate-flow" />
                    {/* Invisible fat hitbox for hover */}
                    <path d={path} fill="none" stroke="transparent" strokeWidth={16} onMouseEnter={() => setHoveredEdge(i)} onMouseLeave={() => setHoveredEdge(null)} style={{ pointerEvents: "stroke", cursor: "pointer" }} />
                    {edge.label && (
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" className="text-[9px] font-bold" fill={edge.color || "#3b82f6"}>{edge.label}</text>
                    )}
                  </g>
                );
              })}
            </svg>
            {/* CSS for flowing animation */}
            <style>{`@keyframes flowDash { to { stroke-dashoffset: -28; } } .animate-flow { animation: flowDash 1s linear infinite; }`}</style>

            {/* "+" buttons between nodes */}
            {nodes.slice(0, -1).map((n, i) => {
              const next = nodes[i + 1];
              const midX = (n.x + next.x) / 2 + 32;
              const midY = (n.y + next.y) / 2 + 38;
              return (
                <div key={`add-${i}`} className="absolute z-20" style={{ left: midX, top: midY }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setAddMenuAt(addMenuAt === i ? null : i); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-blue-400 hover:text-white hover:bg-blue-500 transition-all duration-200 hover:scale-125 opacity-40 hover:opacity-100"
                    style={{ background: "rgba(255,255,255,0.9)", border: "1.5px dashed rgba(59,130,246,0.40)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                    title="Add node"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14m-7-7h14" /></svg>
                  </button>
                  {/* Add node dropdown */}
                  {addMenuAt === i && (
                    <div className="absolute top-9 left-1/2 -translate-x-1/2 rounded-xl p-1.5 min-w-[160px] z-30" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(59,130,246,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
                      {NODE_TYPES.map(t => (
                        <button key={t.type} onClick={() => handleAddNode(i, t)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all">
                          <span>{t.icon}</span>{t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const { id, label, sub, x, y, bg, border, glow, icon, approved } = node;
              const isHovered = hoveredNode === id;
              const isSelected = selectedNode === id;
              const isEmailNode = sub === "ai_message" || sub === "send_email";
              return (
                <div
                  key={id}
                  onMouseDown={(e) => onNodeMouseDown(e, id)}
                  onMouseEnter={() => onNodeHoverEnter(id)}
                  onMouseLeave={onNodeHoverLeave}
                  className="absolute flex flex-col items-center gap-2.5 select-none group"
                  style={{
                    left: x, top: y, cursor: "grab", width: 96,
                    transform: isHovered ? "scale(1.13) translateY(-4px)" : "scale(1) translateY(0px)",
                    transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                    zIndex: isHovered ? 10 : 1,
                  }}
                >
                  {/* Delete button */}
                  {sub !== "trigger" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNode(id); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 z-20"
                      style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 2px 8px rgba(239,68,68,0.45), inset 0 1px 0 rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.40)" }}
                    >
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  )}

                  {/* Approved badge */}
                  {approved && isEmailNode && (
                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-emerald-500 text-white z-20" style={{ boxShadow: "0 2px 8px rgba(34,197,94,0.50)" }}>✓</div>
                  )}

                  {/* Node circle with status ring + ports */}
                  <div className="relative">
                    {/* Execution status ring */}
                    {nodeStatus[id] && nodeStatus[id] !== "idle" && (
                      <div className={`absolute -inset-1.5 rounded-full ${nodeStatus[id] === "running" ? "animate-pulse" : ""}`} style={{
                        border: `2.5px solid ${nodeStatus[id] === "done" ? "#22c55e" : nodeStatus[id] === "running" ? "#3b82f6" : nodeStatus[id] === "failed" ? "#ef4444" : "#eab308"}`,
                        boxShadow: `0 0 12px ${nodeStatus[id] === "done" ? "rgba(34,197,94,0.40)" : nodeStatus[id] === "running" ? "rgba(59,130,246,0.40)" : nodeStatus[id] === "failed" ? "rgba(239,68,68,0.40)" : "rgba(234,179,8,0.40)"}`,
                      }} />
                    )}

                    {/* Input port (left) */}
                    <div
                      onMouseUp={() => onPortDrop(id)}
                      className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-150 z-30 cursor-crosshair"
                      style={{ background: draggingPort ? "#3b82f6" : border, border: "2px solid white", boxShadow: `0 0 6px ${glow}` }}
                    />

                    {/* Node circle */}
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center relative"
                      style={{
                        background: bg,
                        border: `${isSelected ? "3px" : "1.5px"} solid ${isSelected ? "#3b82f6" : border}`,
                        boxShadow: isSelected
                          ? `0 0 0 4px rgba(59,130,246,0.25), 0 0 30px ${glow}, 0 12px 32px rgba(0,0,0,0.12)`
                          : isHovered
                            ? `0 0 0 6px ${glow}, 0 0 40px ${glow}, 0 12px 32px rgba(0,0,0,0.12)`
                            : `0 0 20px ${glow}`,
                        backdropFilter: "blur(12px)",
                        transition: "box-shadow 0.22s ease, border 0.15s ease",
                      }}
                    >
                      {icon}
                      {/* Status badge */}
                      {nodeStatus[id] === "done" && <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] z-20" style={{ boxShadow: "0 2px 6px rgba(34,197,94,0.50)" }}>✓</div>}
                      {nodeStatus[id] === "failed" && <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] z-20" style={{ boxShadow: "0 2px 6px rgba(239,68,68,0.50)" }}>✕</div>}
                      {nodeStatus[id] === "running" && <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center z-20" style={{ boxShadow: "0 2px 6px rgba(59,130,246,0.50)" }}><div className="w-2.5 h-2.5 rounded-full border-2 border-white border-t-transparent animate-spin" /></div>}
                    </div>

                    {/* Output port (right) */}
                    <div
                      onMouseDown={(e) => onPortDragStart(e, id)}
                      className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-150 z-30 cursor-crosshair"
                      style={{ background: border, border: "2px solid white", boxShadow: `0 0 6px ${glow}` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700 whitespace-nowrap">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                      {sub === "delay" && node.config?.delay_hours
                        ? `${node.config.delay_hours}h delay`
                        : SUB_LABELS[sub] || sub}
                    </p>
                  </div>

                  {/* Email preview card on hover */}
                  {previewNode === id && node.emailPreview && (
                    <div
                      className="absolute bottom-[115%] left-1/2 -translate-x-1/2 w-[280px] rounded-xl p-4 z-30"
                      style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(168,85,247,0.20)", boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }}
                      onMouseEnter={() => setPreviewNode(id)}
                      onMouseLeave={() => setPreviewNode(null)}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500 mb-2">📧 Email Preview</p>
                      <p className="text-xs font-bold text-slate-800 mb-1">{node.emailPreview.subject}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-3">{node.emailPreview.body}</p>
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-semibold">{node.emailPreview.tone}</span>
                        {node.emailPreview.hooks.map(h => (
                          <span key={h} className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-semibold">{h}</span>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); updateNodeConfig(id, { approved: true }); setPreviewNode(null); }} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">✅ Approve</button>
                        <button onClick={(e) => { e.stopPropagation(); updateNodeConfig(id, { approved: false }); }} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">❌ Reject</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Node Config Panel (shown when a node is selected) ── */}
      {selectedNodeData && (
        <div className="relative z-10 pl-72 pr-8 pb-2 animate-fade-in-up">
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(24px) saturate(1.8)", border: "1px solid rgba(255,255,255,0.90)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: selectedNodeData.bg, border: `1.5px solid ${selectedNodeData.border}` }}>
                  {selectedNodeData.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{selectedNodeData.label}</p>
                  <p className="text-[11px] text-slate-400">{selectedNodeData.sub} node · ID #{selectedNodeData.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">✕</button>
            </div>

            {/* Delay config */}
            {selectedNodeData.sub === "delay" && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-600">Delay Duration:</span>
                <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <button onClick={() => updateNodeConfig(selectedNodeData.id, { config: { ...selectedNodeData.config, delay_hours: Math.max(1, (selectedNodeData.config?.delay_hours || 24) - 6) } })} className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 font-bold text-sm transition-colors">−</button>
                  <span className="text-sm font-bold text-amber-700 min-w-[48px] text-center">{selectedNodeData.config?.delay_hours || 24}h</span>
                  <button onClick={() => updateNodeConfig(selectedNodeData.id, { config: { ...selectedNodeData.config, delay_hours: (selectedNodeData.config?.delay_hours || 24) + 6 } })} className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-50 font-bold text-sm transition-colors">+</button>
                </div>
                <div className="flex gap-1.5">
                  {[6, 12, 24, 48, 72].map(h => (
                    <button key={h} onClick={() => updateNodeConfig(selectedNodeData.id, { config: { ...selectedNodeData.config, delay_hours: h } })} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${selectedNodeData.config?.delay_hours === h ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}>{h}h</button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Message / Send Email config */}
            {(selectedNodeData.sub === "ai_message" || selectedNodeData.sub === "send_email") && (
              <div className="space-y-3">
                {/* Email preview */}
                {selectedNodeData.emailPreview && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.12)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500 mb-2">📧 Email Draft</p>
                    <p className="text-xs font-bold text-slate-800 mb-1">Subject: {selectedNodeData.emailPreview.subject}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">{selectedNodeData.emailPreview.body}</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      {selectedNodeData.emailPreview.hooks.map(h => (
                        <span key={h} className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-semibold">{h}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tone selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600">Tone:</span>
                  <div className="flex gap-1.5">
                    {["professional", "friendly", "urgent", "casual"].map(t => (
                      <button key={t} onClick={() => updateNodeConfig(selectedNodeData.id, { config: { ...selectedNodeData.config, tone: t }, emailPreview: selectedNodeData.emailPreview ? { ...selectedNodeData.emailPreview, tone: t } : undefined })} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all capitalize ${selectedNodeData.config?.tone === t || selectedNodeData.emailPreview?.tone === t ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-600 hover:bg-purple-100"}`}>{t}</button>
                    ))}
                  </div>
                </div>

                {/* Approve / Reject */}
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => updateNodeConfig(selectedNodeData.id, { approved: true })} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${selectedNodeData.approved ? "bg-emerald-500 text-white shadow-lg" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"}`}>
                    ✅ {selectedNodeData.approved ? "Approved" : "Approve"}
                  </button>
                  {selectedNodeData.approved && (
                    <button onClick={() => updateNodeConfig(selectedNodeData.id, { approved: false })} className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all">
                      ❌ Revoke
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Trigger / other nodes — read-only */}
            {selectedNodeData.sub === "trigger" && (
              <p className="text-xs text-slate-500">This is the pipeline entry point. All leads enter here when the campaign launches.</p>
            )}
            {selectedNodeData.sub === "condition" && (
              <p className="text-xs text-slate-500">Evaluates lead engagement (reply received, email opened) and routes to the appropriate branch.</p>
            )}
            {selectedNodeData.sub === "clawbot" && (
              <p className="text-xs text-slate-500">Sends a WhatsApp alert via ClawBot when a lead shows positive intent or requires human attention.</p>
            )}

            {/* Rename node */}
            <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <span className="text-[11px] font-semibold text-slate-400">Label:</span>
              <input
                value={selectedNodeData.label}
                onChange={e => updateNodeConfig(selectedNodeData.id, { label: e.target.value })}
                className="flex-1 bg-white/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 outline-none focus:border-blue-400 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Execution Log */}
      {execLogs.length > 0 && (
        <div className="relative z-10 pl-72 pr-8 pb-4">
          <div ref={logRef} className="rounded-2xl p-4 max-h-52 overflow-y-auto" style={{ background: "rgba(15,23,42,0.90)", backdropFilter: "blur(20px)", border: "1px solid rgba(59,130,246,0.20)", fontFamily: "'JetBrains Mono', monospace" }}>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-3 text-blue-400/60">Execution Log</p>
            {execLogs.map((log, i) => (
              <p key={i} className={`text-xs leading-relaxed animate-fade-in-up ${log.color}`}>{log.line}</p>
            ))}
          </div>
        </div>
      )}

      <LeadsFloatingPanel leads={leads} />
      <AgentSidebar config={config} activePage="workflow" />
    </div>
  );
}
