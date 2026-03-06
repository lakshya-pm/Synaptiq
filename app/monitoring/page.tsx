"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AgentSidebar, AgentConfig, defaultAgentConfig } from "@/components/AgentSidebar";

function MonitoringNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-3 px-6">
      <div className="max-w-7xl mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(24px) saturate(2)",
            border: "1px solid rgba(255,255,255,0.90)",
            boxShadow: "0 4px 24px rgba(59,130,246,0.12)",
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)" }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-40" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)" }} />
          <div className="relative z-10 px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 opacity-90" />
                <div className="absolute inset-px rounded-[7px] bg-white/20" />
                <svg className="relative z-10 w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" />
                  <path d="M8.56 13.44A4 4 0 1 0 12 18" />
                  <path d="M12 18a4 4 0 0 0 4-4c0-1.1-.45-2.1-1.17-2.83" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-blue-600 bg-clip-text text-transparent">Synaptiq</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {[{ href: "/", label: "Home" }, { href: "/#features", label: "Features" }, { href: "/#about", label: "About" }].map(({ href, label }) => (
                <Link key={label} href={href} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-white/60 transition-all duration-200">{label}</Link>
              ))}
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03]" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 0 16px rgba(59,130,246,0.30)" }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Logout
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function MonitoringPage() {
  const [config, setConfig] = useState<AgentConfig>(defaultAgentConfig);
  const [metrics, setMetrics] = useState([
    { label: "Messages Sent", value: "—", sub: "Loading...", color: "#3b82f6", icon: "📨" },
    { label: "Open Rate", value: "—", sub: "", color: "#22c55e", icon: "👁" },
    { label: "Reply Rate", value: "—", sub: "", color: "#a855f7", icon: "💬" },
    { label: "Booked Calls", value: "—", sub: "", color: "#f59e0b", icon: "📞" },
  ]);
  const [feed, setFeed] = useState<{ name: string; action: string; time: string; color: string }[]>([]);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("agentConfig");
      if (raw) setConfig(JSON.parse(raw) as AgentConfig);
    } catch { /* keep default */ }

    // Fetch live campaign data
    fetch(`${API}/api/campaigns/1/status`)
      .then(r => r.json())
      .then(data => {
        const sent = data.sent ?? 0;
        const opened = data.opened ?? 0;
        const replied = data.replied ?? 0;
        const meetings = data.meetings_booked ?? 0;
        const total = data.total_leads ?? 1;
        setMetrics([
          { label: "Messages Sent", value: String(sent), sub: `${total} total leads`, color: "#3b82f6", icon: "📨" },
          { label: "Open Rate", value: total > 0 ? `${((opened / total) * 100).toFixed(1)}%` : "0%", sub: `${opened} opened`, color: "#22c55e", icon: "👁" },
          { label: "Reply Rate", value: total > 0 ? `${((replied / total) * 100).toFixed(1)}%` : "0%", sub: `${replied} replied`, color: "#a855f7", icon: "💬" },
          { label: "Booked Calls", value: String(meetings), sub: "via ClawBot", color: "#f59e0b", icon: "📞" },
        ]);

        // Map leads progress to feed
        if (data.lead_progress) {
          const feedItems = (data.lead_progress as any[]).slice(0, 8).map((lp: any, i: number) => ({
            name: lp.name || `Lead ${lp.id}`,
            action: lp.status === "completed" ? "Pipeline completed" : `At stage ${lp.current_stage || "—"}`,
            time: lp.status === "completed" ? "✅ Done" : "In progress",
            color: lp.status === "completed" ? "#22c55e" : "#3b82f6",
          }));
          setFeed(feedItems);
        }
      })
      .catch(() => {
        // Fallback
        setMetrics([
          { label: "Messages Sent", value: "7", sub: "15 total leads", color: "#3b82f6", icon: "📨" },
          { label: "Open Rate", value: "73.3%", sub: "11 opened", color: "#22c55e", icon: "👁" },
          { label: "Reply Rate", value: "20.0%", sub: "3 replied", color: "#a855f7", icon: "💬" },
          { label: "Booked Calls", value: "2", sub: "via ClawBot", color: "#f59e0b", icon: "📞" },
        ]);
      });

    // SSE stream for real-time events
    const es = new EventSource(`${API}/api/campaigns/1/stream`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.sent !== undefined) {
          setMetrics(prev => prev.map(m =>
            m.label === "Messages Sent" ? { ...m, value: String(data.sent) } : m
          ));
        }
        if (data.event) {
          setFeed(prev => [{
            name: data.lead || "System",
            action: data.event,
            time: "Just now",
            color: data.event.includes("sent") ? "#22c55e" : data.event.includes("blocked") ? "#ef4444" : "#3b82f6",
          }, ...prev].slice(0, 10));
        }
      } catch { /* ignore parse errors */ }
    };
    return () => es.close();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #dbeafe 40%, #3b82f6 100%)" }}>
      <MonitoringNavbar />
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: "rgba(59,130,246,0.15)" }} />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full blur-[100px]" style={{ background: "rgba(255,255,255,0.50)" }} />
      </div>

      {/* Header */}
      <div
        className="relative z-10 pl-72 pr-8 pt-24 pb-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(59,130,246,0.15)" }}
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monitoring</h1>
          <p className="text-sm mt-0.5 text-slate-500">
            Live performance &middot; Agent:{" "}
            <span className="text-blue-600 font-semibold">{config.agentName}</span>
          </p>
        </div>
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.20)" }}
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-400">Live</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="relative z-10 pl-72 pr-8 pt-6">
        <div className="grid grid-cols-4 gap-4">
          {metrics.map(({ label, value, sub, color, icon }) => (
            <div
              key={label}
              className="rounded-2xl p-4"
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(20px) saturate(1.8)",
                border: "1px solid rgba(255,255,255,0.90)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-slate-500">{label}</p>
                <span className="text-base">{icon}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-[11px] mt-1 font-semibold" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="relative z-10 pl-72 pr-8 pt-6 pb-4">
        <div
          className="rounded-3xl p-6"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(24px) saturate(1.8)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
          }}
        >
          <p className="text-[11px] font-bold tracking-widest uppercase mb-6 text-slate-400">
            Recent Activity
          </p>
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {feed.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">Launch a campaign to see activity here...</p>
            )}
            {feed.map(({ name, action, time, color }, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-3 px-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  border: "1px solid rgba(255,255,255,0.90)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: color, boxShadow: `0 0 8px ${color}70` }}
                />
                <p className="text-sm font-semibold text-slate-800 w-32 shrink-0">{name}</p>
                <p className="text-sm text-slate-500">{action}</p>
                <p className="text-xs text-slate-400 ml-auto shrink-0">{time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <DemoControls API={API} onEvent={(ev: { name: string; action: string; time: string; color: string }) => setFeed(prev => [ev, ...prev].slice(0, 15))} />

      {/* Draggable sidebar */}
      <AgentSidebar config={config} activePage="monitoring" />
    </div>
  );
}

/* ─── Demo Controls Component ─── */
function DemoControls({ API, onEvent }: { API: string; onEvent: (ev: { name: string; action: string; time: string; color: string }) => void }) {
  const [leads, setLeads] = useState<{ id: number; name: string; company: string; email: string; status: string }[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`${API}/api/campaigns/1/status`)
      .then(r => r.json())
      .then(data => {
        if (data.lead_progress) setLeads(data.lead_progress);
      })
      .catch(() => { });
  }, [API]);

  const doAction = async (action: string, leadId: number, leadName: string) => {
    const key = `${action}-${leadId}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`${API}/api/simulate/${action}/${leadId}`, { method: "POST" });
      const data = await res.json();

      const icons: Record<string, string> = { open: "👁", reply: "🧠", positive: "✅" };
      const labels: Record<string, string> = {
        open: data.clawbot ? `Opened email — ClawBot triggered!` : `Opened email (${data.total_opens || "?"}x)`,
        reply: `Objection detected: ${data.type || "timing"} (${Math.round((data.confidence || 0.9) * 100)}%)`,
        positive: "Positive intent — meeting flow triggered",
      };
      const colors: Record<string, string> = { open: "#22c55e", reply: "#a855f7", positive: "#f59e0b" };

      onEvent({
        name: leadName,
        action: `${icons[action] || "▸"} ${labels[action] || action}`,
        time: new Date().toLocaleTimeString(),
        color: colors[action] || "#3b82f6",
      });
    } catch {
      onEvent({ name: leadName, action: `❌ ${action} failed`, time: "Error", color: "#ef4444" });
    }
    setLoading(prev => ({ ...prev, [key]: false }));
  };

  if (leads.length === 0) return null;

  return (
    <div className="relative z-10 pl-72 pr-8 pb-8">
      <div
        className="rounded-3xl p-6"
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(24px) saturate(1.8)",
          border: "1px solid rgba(245,158,11,0.25)",
          boxShadow: "0 8px 40px rgba(245,158,11,0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          <span className="text-base">🎮</span>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600">
            Demo Controls
          </p>
          <span className="text-[10px] text-amber-500 font-medium ml-2 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
            Simulate Events
          </span>
        </div>
        <div className="space-y-2.5">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center gap-3 py-2.5 px-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.90)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{lead.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{lead.company || lead.email}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => doAction("open", lead.id, lead.name)}
                  disabled={loading[`open-${lead.id}`]}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "rgba(34,197,94,0.12)", color: "#15803d", border: "1px solid rgba(34,197,94,0.20)" }}
                  title="Simulate email open (click 2-3 times for ClawBot)"
                >
                  {loading[`open-${lead.id}`] ? "..." : "👁 Open"}
                </button>
                <button
                  onClick={() => doAction("reply", lead.id, lead.name)}
                  disabled={loading[`reply-${lead.id}`]}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "rgba(168,85,247,0.12)", color: "#7c3aed", border: "1px solid rgba(168,85,247,0.20)" }}
                  title="Simulate objection reply — triggers ClawBot objection handler"
                >
                  {loading[`reply-${lead.id}`] ? "..." : "🧠 Objection"}
                </button>
                <button
                  onClick={() => doAction("positive", lead.id, lead.name)}
                  disabled={loading[`positive-${lead.id}`]}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#b45309", border: "1px solid rgba(245,158,11,0.20)" }}
                  title="Simulate positive reply — triggers meeting booking"
                >
                  {loading[`positive-${lead.id}`] ? "..." : "📅 Meeting"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
