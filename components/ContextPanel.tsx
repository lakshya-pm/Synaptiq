"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TimelineEvent {
    id: string | number;
    type: string;
    channel: string;
    payload: Record<string, any>;
    timestamp: string | null;
    campaign_id: number;
}

interface LeadInfo {
    id: number;
    name: string;
    email: string;
    company: string;
    phone?: string;
    title?: string;
}

interface ContextData {
    lead: LeadInfo;
    timeline: TimelineEvent[];
    summary: { total_events: number; email_count: number; whatsapp_count: number; call_count: number };
}

const CHANNEL_STYLES: Record<string, { icon: string; label: string; color: string; bg: string }> = {
    email: { icon: "📧", label: "Email", color: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
    whatsapp: { icon: "💬", label: "WhatsApp", color: "#22c55e", bg: "rgba(34,197,94,0.10)" },
    call: { icon: "📞", label: "Call", color: "#f97316", bg: "rgba(249,115,22,0.10)" },
    calendar: { icon: "📅", label: "Calendar", color: "#06b6d4", bg: "rgba(6,182,212,0.10)" },
    system: { icon: "⚙️", label: "System", color: "#6b7280", bg: "rgba(107,114,128,0.10)" },
};

const EVENT_LABELS: Record<string, string> = {
    email_sent: "Email sent",
    email_opened: "Email opened",
    email_failed: "Email failed",
    reply_received: "Reply received",
    message_generated: "AI drafted email",
    clawbot_triggered: "ClawBot alert",
    meeting_booked: "Meeting booked",
    meeting_confirmed: "Meeting confirmed",
    positive_intent: "Positive intent detected",
    objection_detected: "Objection detected",
    followup_sent: "Follow-up sent",
    trigger_started: "Pipeline started",
    delay_started: "Delay started",
    delay_completed: "Delay completed",
    blocklist_passed: "Blocklist cleared",
    call_made: "Call placed",
};

export default function ContextPanel({ leadId, onClose }: { leadId: number; onClose: () => void }) {
    const [data, setData] = useState<ContextData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [expandedEvent, setExpandedEvent] = useState<string | number | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`${API}/api/context/leads/${leadId}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [leadId]);

    if (loading) {
        return (
            <div className="fixed top-0 right-0 bottom-0 w-[420px] z-50 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.90)", backdropFilter: "blur(30px)" }}>
                <div className="text-slate-400 text-sm">Loading context...</div>
            </div>
        );
    }

    if (!data || !data.lead) return null;

    const filteredTimeline = filter === "all" ? data.timeline : data.timeline.filter(e => e.channel === filter);

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/10 z-40" onClick={onClose} />

            {/* Panel */}
            <div
                className="fixed top-0 right-0 bottom-0 w-[420px] z-50 overflow-y-auto"
                style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(30px) saturate(2)",
                    borderLeft: "1px solid rgba(59,130,246,0.12)",
                    boxShadow: "-8px 0 40px rgba(0,0,0,0.10)",
                    animation: "slideInRight 0.3s ease",
                }}
            >
                {/* Lead header */}
                <div className="sticky top-0 z-10 p-5 pb-4" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(59,130,246,0.10)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">📋 Conversation Context</p>
                        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">✕</button>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
                            {data.lead.name?.charAt(0) || "?"}
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-900">{data.lead.name}</p>
                            <p className="text-[11px] text-slate-500">{data.lead.company} {data.lead.title ? `· ${data.lead.title}` : ""}</p>
                            <p className="text-[10px] text-slate-400">{data.lead.email} {data.lead.phone ? `· ${data.lead.phone}` : ""}</p>
                        </div>
                    </div>

                    {/* Channel summary badges */}
                    <div className="flex items-center gap-2 mb-3">
                        {Object.entries(data.summary).filter(([k]) => k !== "total_events").map(([key, count]) => {
                            const ch = key.replace("_count", "");
                            const style = CHANNEL_STYLES[ch];
                            if (!style || count === 0) return null;
                            return (
                                <span key={key} className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}20` }}>
                                    {style.icon} {count}
                                </span>
                            );
                        })}
                        <span className="text-[10px] text-slate-400 ml-auto">{data.summary.total_events} total events</span>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1">
                        {["all", "email", "whatsapp", "call", "calendar"].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all capitalize ${filter === f ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                            >
                                {f === "all" ? "All" : CHANNEL_STYLES[f]?.icon} {f === "all" ? "" : ""} {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Timeline */}
                <div className="p-5 pt-4">
                    {filteredTimeline.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">No events in this channel yet.</p>
                    )}
                    <div className="space-y-0 relative">
                        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-200" />
                        {filteredTimeline.map((ev, i) => {
                            const style = CHANNEL_STYLES[ev.channel] || CHANNEL_STYLES.system;
                            const label = EVENT_LABELS[ev.type] || ev.type;
                            const time = ev.timestamp ? new Date(ev.timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                            const isExpanded = expandedEvent === ev.id;

                            return (
                                <div
                                    key={`${ev.id}-${i}`}
                                    onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                                    className="flex items-start gap-3 py-2.5 relative z-10 cursor-pointer rounded-lg hover:bg-white/60 px-1 transition-all"
                                >
                                    {/* Channel dot */}
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5" style={{ background: style.bg, border: `1.5px solid ${style.color}30` }}>
                                        {style.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12px] font-semibold text-slate-700">{label}</span>
                                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">{time}</span>
                                        </div>

                                        {/* Preview line */}
                                        {ev.payload?.subject && (
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">✉️ {ev.payload.subject}</p>
                                        )}
                                        {ev.payload?.reply_text && (
                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">💬 &ldquo;{ev.payload.reply_text.slice(0, 60)}...&rdquo;</p>
                                        )}
                                        {ev.channel === "call" && ev.payload?.status && (
                                            <p className="text-[11px] text-slate-500 mt-0.5">📞 {ev.payload.status} {ev.payload.meeting_booked ? "· 📅 Meeting booked" : ""}</p>
                                        )}

                                        {/* Expanded detail */}
                                        {isExpanded && (
                                            <div className="mt-2 p-3 rounded-xl text-[11px] text-slate-600 leading-relaxed space-y-1" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                                                {ev.payload?.body_preview && <p><strong>Body:</strong> {ev.payload.body_preview}</p>}
                                                {ev.payload?.reply_text && <p><strong>Reply:</strong> {ev.payload.reply_text}</p>}
                                                {ev.payload?.transcript && <p><strong>Transcript:</strong> {ev.payload.transcript}</p>}
                                                {ev.payload?.intent && <p><strong>Intent:</strong> <span className={ev.payload.intent === "positive" ? "text-amber-600" : "text-red-600"}>{ev.payload.intent} ({Math.round((ev.payload.confidence || 0) * 100)}%)</span></p>}
                                                {ev.payload?.reason && <p><strong>Reason:</strong> {ev.payload.reason}</p>}
                                                <p className="text-[9px] text-slate-400">Campaign #{ev.campaign_id} · {ev.channel}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
        </>
    );
}
