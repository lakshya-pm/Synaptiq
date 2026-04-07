"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AgentSidebar, AgentConfig, defaultAgentConfig } from "@/components/AgentSidebar";

const ContextPanel = dynamic(() => import("@/components/ContextPanel"), { ssr: false });

/* ─── Types ─── */
interface LeadEvent {
  type: string;
  payload: Record<string, any>;
  time: string;
}
interface LeadData {
  id: number;
  name: string;
  company: string;
  email: string;
  status: string;
  current_stage: string;
  events: LeadEvent[];
}

/* ─── Navbar ─── */
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

/* ─── Milestone stages ─── */
const STAGES = [
  { key: "email_sent", icon: "📧", label: "Sent", color: "#3b82f6" },
  { key: "reply_received", icon: "💬", label: "Replied", color: "#a855f7" },
  { key: "positive_intent", altKey: "objection_detected", icon: "🦅", label: "ClawBot", color: "#f59e0b" },
  { key: "meeting_booked", altKey: "meeting_confirmed", icon: "📅", label: "Meeting", color: "#06b6d4" },
];

/* ─── Main Page ─── */
export default function MonitoringPage() {
  const [config, setConfig] = useState<AgentConfig>(defaultAgentConfig);
  const [metrics, setMetrics] = useState({ sent: 0, alerts: 0, replied: 0, meetings: 0, total: 0 });
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [pulse, setPulse] = useState(false);
  const [shieldFlash, setShieldFlash] = useState(false);
  const [callingLeadId, setCallingLeadId] = useState<number | null>(null);
  const [callStatus, setCallStatus] = useState<Record<number, string>>({});
  const [contextLeadId, setContextLeadId] = useState<number | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<Record<number, { autoReplySent?: boolean; callScheduled?: string; callCompleted?: boolean }>>({}); // per-lead follow-up state
  const [expandedFollowUp, setExpandedFollowUp] = useState<number | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = useCallback(() => {
    fetch(`${API}/api/campaigns/1/status`)
      .then(r => r.json())
      .then(data => {
        // Count ClawBot alerts from lead events
        const allEvents = (data.lead_progress || []).flatMap((l: any) => l.events || []);
        const alertCount = allEvents.filter((e: any) => e.type === "positive_intent" || e.type === "objection_detected").length;
        setMetrics({
          sent: data.sent ?? 0,
          alerts: alertCount,
          replied: data.replied ?? 0,
          meetings: data.meetings_booked ?? 0,
          total: data.total_leads ?? 0,
        });
        if (data.lead_progress) setLeads(data.lead_progress);
        setLastUpdated(new Date().toLocaleTimeString());
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      })
      .catch(() => { });
  }, [API]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("agentConfig");
      if (raw) setConfig(JSON.parse(raw) as AgentConfig);
    } catch { /* keep default */ }
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const es = new EventSource(`${API}/api/campaigns/1/stream`);
    es.onmessage = () => fetchData();
    es.addEventListener("campaign_event", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event_type === "blocked") {
          setShieldFlash(true);
          setTimeout(() => setShieldFlash(false), 800);
        }
      } catch { /* ignore parse errors */ }
      fetchData();
    });
    return () => es.close();
  }, [API, fetchData]);

  const selectedLeadData = leads.find(l => l.id === selectedLead);

  const metricCards = [
    { label: "Messages Sent", value: String(metrics.sent), sub: `${metrics.total} total leads`, color: "#3b82f6", icon: "📨" },
    { label: "ClawBot Alerts", value: String(metrics.alerts), sub: "WhatsApp notified", color: "#22c55e", icon: "🦅" },
    { label: "Reply Rate", value: metrics.total > 0 ? `${((metrics.replied / metrics.total) * 100).toFixed(1)}%` : "0%", sub: `${metrics.replied} replied`, color: "#a855f7", icon: "💬" },
    { label: "Booked Calls", value: String(metrics.meetings), sub: "via ClawBot", color: "#f59e0b", icon: "📞" },
  ];

  return (
    <div className={`min-h-screen transition-all duration-150 ${shieldFlash ? "ring-4 ring-red-500" : ""}`} style={{ background: shieldFlash ? "linear-gradient(135deg, #fef2f2 0%, #fecaca 40%, #ef4444 100%)" : "linear-gradient(135deg, #ffffff 0%, #dbeafe 40%, #3b82f6 100%)" }}>
      <MonitoringNavbar />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: "rgba(59,130,246,0.15)" }} />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full blur-[100px]" style={{ background: "rgba(255,255,255,0.50)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 pl-72 pr-8 pt-24 pb-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monitoring</h1>
          <p className="text-sm mt-0.5 text-slate-500">
            Live performance &middot; Agent: <span className="text-blue-600 font-semibold">{config.agentName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400">{lastUpdated && `Updated ${lastUpdated}`}</span>
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.20)" }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-live-dot" />
            <span className="text-xs font-semibold text-green-400">Live</span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="relative z-10 pl-72 pr-8 pt-6">
        <div className="grid grid-cols-4 gap-4">
          {metricCards.map(({ label, value, sub, color, icon }) => (
            <div
              key={label}
              className={`rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-default ${pulse ? "animate-fade-in-up" : ""}`}
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

      {/* Lead Pipeline + Detail Panel — side by side */}
      <div className="relative z-10 pl-72 pr-8 pt-6 pb-8">
        <div className="grid grid-cols-[1fr_380px] gap-4" style={{ gridTemplateColumns: selectedLeadData ? "1fr 380px" : "1fr" }}>

          {/* Left: Lead list with horizontal milestones */}
          <div
            className="rounded-3xl p-6"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(24px) saturate(1.8)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
            }}
          >
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-5">Lead Pipeline</p>

            <div className="space-y-2">
              {leads.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Launch a campaign to see lead activity here...</p>
              )}
              {leads.map((lead) => {
                const events = lead.events || [];
                const eventTypes = events.map(e => e.type);
                const isSelected = selectedLead === lead.id;
                const replyEvent = events.find(e => e.type === "reply_received");
                const intent = replyEvent?.payload?.intent;

                return (
                  <div key={lead.id} className="space-y-1">
                    <div
                      onClick={() => setSelectedLead(isSelected ? null : lead.id)}
                      className="flex items-center gap-4 py-3 px-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md group"
                      style={{
                        background: isSelected ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.70)",
                        border: `1.5px solid ${isSelected ? "rgba(59,130,246,0.30)" : "rgba(255,255,255,0.90)"}`,
                        boxShadow: isSelected ? "0 4px 16px rgba(59,130,246,0.10)" : "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* Name + Company */}
                      <div className="w-32 shrink-0">
                        <p className="text-[13px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{lead.name}</p>
                        <p className="text-[10px] text-slate-400">{lead.company}</p>
                      </div>

                      {/* Horizontal Milestones */}
                      <div className="flex-1 flex items-center">
                        {STAGES.map((stage, i) => {
                          const reached = eventTypes.includes(stage.key) || (stage.altKey && eventTypes.includes(stage.altKey));
                          const isLast = i === STAGES.length - 1;
                          return (
                            <div key={stage.key} className="flex items-center" style={{ flex: isLast ? "0 0 auto" : 1 }}>
                              <div className="flex flex-col items-center relative">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500"
                                  style={{
                                    background: reached ? `${stage.color}18` : "rgba(0,0,0,0.04)",
                                    border: `2px solid ${reached ? stage.color : "rgba(0,0,0,0.08)"}`,
                                    boxShadow: reached ? `0 0 12px ${stage.color}30` : "none",
                                    transform: reached ? "scale(1)" : "scale(0.9)",
                                  }}
                                >
                                  {reached ? stage.icon : <span className="text-slate-300 text-[10px]">●</span>}
                                </div>
                                <span className={`text-[9px] mt-1 font-medium ${reached ? "text-slate-600" : "text-slate-300"}`}>
                                  {stage.label}
                                </span>
                              </div>
                              {!isLast && (
                                <div className="flex-1 h-0.5 mx-1" style={{
                                  background: reached && eventTypes.includes(STAGES[i + 1]?.key)
                                    ? `linear-gradient(90deg, ${stage.color}, ${STAGES[i + 1].color})`
                                    : reached
                                      ? `linear-gradient(90deg, ${stage.color}, rgba(0,0,0,0.06))`
                                      : "rgba(0,0,0,0.06)",
                                  borderRadius: "2px",
                                }} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Intent Badge */}
                      {intent && (
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            color: intent === "positive" ? "#f59e0b" : "#ef4444",
                            background: intent === "positive" ? "rgba(245,158,11,0.10)" : "rgba(239,68,68,0.10)",
                            border: `1px solid ${intent === "positive" ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}`,
                          }}
                        >
                          {intent === "positive" ? "🎯 Positive" : "🛡️ Objection"}
                        </span>
                      )}

                      {/* Context button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setContextLeadId(lead.id); }}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-blue-600 transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}
                        title="View conversation context"
                      >
                        <span>📋</span> Context
                      </button>

                      {/* Call Lead button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (callingLeadId === lead.id) return;
                          setCallingLeadId(lead.id);
                          fetch(`${API}/api/calls/initiate`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ campaign_id: 1, lead_id: lead.id }),
                          })
                            .then(r => r.json())
                            .then(d => {
                              setCallStatus(prev => ({ ...prev, [lead.id]: d.message || "Call dispatched!" }));
                              setTimeout(() => setCallStatus(prev => { const n = { ...prev }; delete n[lead.id]; return n; }), 4000);
                            })
                            .catch(() => setCallStatus(prev => ({ ...prev, [lead.id]: "Call failed" })))
                            .finally(() => setCallingLeadId(null));
                        }}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                          background: callingLeadId === lead.id ? "rgba(100,100,100,0.5)" : "linear-gradient(135deg, #22c55e, #16a34a)",
                          boxShadow: "0 2px 8px rgba(34,197,94,0.30)",
                          opacity: callingLeadId !== null && callingLeadId !== lead.id ? 0.5 : 1,
                        }}
                        title={callStatus[lead.id] || "Call this lead with AI agent"}
                      >
                        {callingLeadId === lead.id ? (
                          <><span className="animate-spin">⏳</span> Calling...</>
                        ) : callStatus[lead.id] ? (
                          <><span>✅</span> Called!</>
                        ) : (
                          <><span>📞</span> Call</>
                        )}
                      </button>
                    </div>

                    {/* Toggle follow-up button for replied leads */}
                    {eventTypes.includes("reply_received") && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedFollowUp(expandedFollowUp === lead.id ? null : lead.id); }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.08))", border: "1px solid rgba(168,85,247,0.15)", color: "#7c3aed" }}
                      >
                        <span>🤖</span> {expandedFollowUp === lead.id ? "Hide" : "Smart Follow-Up"}
                        <svg className={`w-3 h-3 transition-transform ${expandedFollowUp === lead.id ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                      </button>
                    )}

                    {/* Smart Follow-Up Panel — shown for replied leads */}
                    {eventTypes.includes("reply_received") && expandedFollowUp === lead.id && (
                      <div className="rounded-2xl p-4 animate-fade-in-up" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.06), rgba(59,130,246,0.06))", border: "1px solid rgba(168,85,247,0.15)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.30)" }}>🤖</div>
                          <p className="text-xs font-bold text-purple-700">Smart Follow-Up — Automated Pipeline</p>
                          <div className="ml-auto text-[9px] font-bold text-purple-400 uppercase tracking-wider">{intent === "positive" ? "🟢 Interested" : "🟡 Engaged"}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Step 1: Auto-Reply */}
                          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(168,85,247,0.12)" }}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-[10px] font-bold text-slate-400">STEP 1</span>
                              {followUpStatus[lead.id]?.autoReplySent
                                ? <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full ml-auto">✅ Sent</span>
                                : <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full ml-auto">⏳ Queued</span>
                              }
                            </div>
                            <p className="text-[11px] font-bold text-slate-700 mb-1">📧 Auto-Reply: Ask Best Call Time</p>
                            <div className="rounded-lg p-2 mb-2 text-[10px] text-slate-500 leading-relaxed" style={{ background: "rgba(168,85,247,0.04)", border: "1px dashed rgba(168,85,247,0.15)" }}>
                              <p className="font-semibold text-slate-600 mb-1">Subject: Thanks for your interest, {lead.name}!</p>
                              <p>Hi {lead.name}, great to hear back from you! I&apos;d love to schedule a quick call to discuss how we can help {lead.company}. What time works best for you this week?</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFollowUpStatus(prev => ({ ...prev, [lead.id]: { ...prev[lead.id], autoReplySent: true } }));
                                fetch(`${API}/api/leads/${lead.id}/auto-reply`, { method: "POST" })
                                  .then(r => r.json())
                                  .then(d => {
                                    if (d.status !== "sent") {
                                      setFollowUpStatus(prev => ({ ...prev, [lead.id]: { ...prev[lead.id], autoReplySent: false } }));
                                    }
                                  })
                                  .catch(() => setFollowUpStatus(prev => ({ ...prev, [lead.id]: { ...prev[lead.id], autoReplySent: false } })));
                              }}
                              disabled={followUpStatus[lead.id]?.autoReplySent}
                              className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                              style={{ background: followUpStatus[lead.id]?.autoReplySent ? "#94a3b8" : "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 2px 8px rgba(168,85,247,0.25)" }}
                            >
                              {followUpStatus[lead.id]?.autoReplySent ? "✅ Auto-Reply Sent" : "📧 Send Auto-Reply"}
                            </button>
                          </div>

                          {/* Step 2: Schedule AI Call */}
                          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(59,130,246,0.12)" }}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-[10px] font-bold text-slate-400">STEP 2</span>
                              {followUpStatus[lead.id]?.callCompleted
                                ? <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full ml-auto">✅ Completed</span>
                                : followUpStatus[lead.id]?.callScheduled
                                  ? <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full ml-auto">📅 {followUpStatus[lead.id]?.callScheduled}</span>
                                  : <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full ml-auto">Waiting</span>
                              }
                            </div>
                            <p className="text-[11px] font-bold text-slate-700 mb-1">📞 Agentic AI Call (Bland.ai)</p>
                            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">Once lead replies with preferred time, an AI agent automatically calls to qualify and book a meeting.</p>
                            <div className="flex gap-1.5 mb-2">
                              {["Today 2pm", "Today 5pm", "Tomorrow 10am"].map(time => (
                                <button
                                  key={time}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFollowUpStatus(prev => ({ ...prev, [lead.id]: { ...prev[lead.id], callScheduled: time } }));
                                  }}
                                  className={`flex-1 py-1 rounded-md text-[9px] font-bold transition-all ${followUpStatus[lead.id]?.callScheduled === time ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!followUpStatus[lead.id]?.callScheduled) return;
                                setCallingLeadId(lead.id);
                                fetch(`${API}/api/calls/initiate`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ campaign_id: 1, lead_id: lead.id }),
                                })
                                  .then(r => r.json())
                                  .then(() => {
                                    setFollowUpStatus(prev => ({ ...prev, [lead.id]: { ...prev[lead.id], callCompleted: true } }));
                                  })
                                  .catch(() => { })
                                  .finally(() => setCallingLeadId(null));
                              }}
                              disabled={!followUpStatus[lead.id]?.callScheduled || followUpStatus[lead.id]?.callCompleted}
                              className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                              style={{ background: followUpStatus[lead.id]?.callCompleted ? "#94a3b8" : !followUpStatus[lead.id]?.callScheduled ? "#94a3b8" : "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 2px 8px rgba(59,130,246,0.25)" }}
                            >
                              {followUpStatus[lead.id]?.callCompleted ? "✅ Call Completed" : callingLeadId === lead.id ? "⏳ Initiating..." : "📞 Schedule AI Call"}
                            </button>
                          </div>
                        </div>

                        {/* Automation pipeline visualization */}
                        <div className="mt-3 flex items-center gap-1.5 px-2">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-purple-500"><span>📧</span> Reply</div>
                          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #a855f7, #3b82f6)" }} />
                          <div className="flex items-center gap-1 text-[9px] font-bold text-blue-500"><span>🤖</span> Auto-Ask Time</div>
                          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #3b82f6, #22c55e)" }} />
                          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500"><span>📞</span> AI Call @ Time</div>
                          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #22c55e, #f59e0b)" }} />
                          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500"><span>📅</span> Book Meeting</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Lead Detail Panel */}
          {selectedLeadData && (
            <div
              className="rounded-3xl p-5 animate-fade-in-up self-start sticky top-28"
              style={{
                background: "rgba(255,255,255,0.70)",
                backdropFilter: "blur(24px) saturate(1.8)",
                border: "1px solid rgba(255,255,255,0.90)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
              }}
            >
              {/* Lead Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-bold text-slate-900">{selectedLeadData.name}</p>
                  <p className="text-xs text-slate-500">{selectedLeadData.company} • {selectedLeadData.email}</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                  ✕
                </button>
              </div>

              {/* Stage Progress */}
              <div className="flex items-center justify-between mb-5 px-2">
                {STAGES.map((stage, i) => {
                  const reached = (selectedLeadData.events || []).some(e => e.type === stage.key || e.type === stage.altKey);
                  return (
                    <div key={stage.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 mb-1"
                        style={{
                          background: reached ? `${stage.color}15` : "rgba(0,0,0,0.03)",
                          border: `2.5px solid ${reached ? stage.color : "rgba(0,0,0,0.08)"}`,
                          boxShadow: reached ? `0 0 16px ${stage.color}25` : "none",
                        }}
                      >
                        {reached ? stage.icon : "○"}
                      </div>
                      <span className={`text-[10px] font-medium ${reached ? "text-slate-700" : "text-slate-300"}`}>{stage.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Reply content if exists */}
              {(() => {
                const re = (selectedLeadData.events || []).find(e => e.type === "reply_received");
                if (!re) return null;
                return (
                  <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wide mb-1.5">💬 Lead&apos;s Reply</p>
                    <p className="text-xs text-slate-700 italic leading-relaxed">&ldquo;{re.payload?.reply_text || re.payload?.body_preview || "—"}&rdquo;</p>
                    {re.payload?.intent && (
                      <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${re.payload.intent === "positive" ? "text-amber-700 bg-amber-50 border border-amber-200" : "text-red-700 bg-red-50 border border-red-200"
                        }`}>
                        {re.payload.intent === "positive" ? "🎯 Positive" : "🛡️ Objection"} • {Math.round((re.payload.confidence || 0) * 100)}%
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Meeting info if exists */}
              {(selectedLeadData.events || []).some(e => e.type === "meeting_booked") && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
                  <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-wide mb-1">📅 Meeting</p>
                  <p className="text-xs text-slate-700">Booking link sent via ClawBot</p>
                  {(() => {
                    const me = (selectedLeadData.events || []).find(e => e.type === "meeting_booked");
                    return me?.payload?.cal_url ? (
                      <a href={`https://${me.payload.cal_url}`} target="_blank" className="text-xs text-cyan-600 underline mt-1 inline-block">{me.payload.cal_url}</a>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Event Timeline */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Timeline</p>
                <div className="space-y-0 relative">
                  <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-200" />
                  {(selectedLeadData.events || []).map((ev, i) => {
                    const time = ev.time ? new Date(ev.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
                    const typeMap: Record<string, { icon: string; label: string; color: string }> = {
                      email_sent: { icon: "📧", label: "Email sent", color: "#3b82f6" },
                      email_opened: { icon: "👁", label: "Email opened", color: "#22c55e" },
                      reply_received: { icon: "💬", label: "Reply received", color: "#a855f7" },
                      positive_intent: { icon: "🎯", label: "Positive intent", color: "#f59e0b" },
                      objection_detected: { icon: "🛡️", label: "Objection", color: "#ef4444" },
                      meeting_booked: { icon: "📅", label: "Meeting booked", color: "#06b6d4" },
                      message_generated: { icon: "🤖", label: "AI drafted", color: "#8b5cf6" },
                      blocklist_passed: { icon: "🛡️", label: "Blocklist cleared", color: "#6b7280" },
                      followup_sent: { icon: "📬", label: "Follow-up sent", color: "#22c55e" },
                      trigger_started: { icon: "⚡", label: "Pipeline started", color: "#f97316" },
                      delay_started: { icon: "⏳", label: "Delay started", color: "#6b7280" },
                      delay_completed: { icon: "⏰", label: "Delay completed", color: "#6b7280" },
                    };
                    const info = typeMap[ev.type] || { icon: "▸", label: ev.type, color: "#6b7280" };
                    return (
                      <div key={i} className="flex items-center gap-3 py-1.5 relative z-10">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: `${info.color}12`, border: `1.5px solid ${info.color}30` }}>
                          {info.icon}
                        </div>
                        <span className="text-[11px] text-slate-600 flex-1">{info.label}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AgentSidebar config={config} activePage="monitoring" />

      {/* Context Panel */}
      {contextLeadId !== null && (
        <ContextPanel leadId={contextLeadId} onClose={() => setContextLeadId(null)} />
      )}
    </div>
  );
}
