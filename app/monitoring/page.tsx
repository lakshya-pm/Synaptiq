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

  useEffect(() => {
    try {
      const raw = localStorage.getItem("agentConfig");
      if (raw) setConfig(JSON.parse(raw) as AgentConfig);
    } catch {
      // keep default
    }
  }, []);

  const metrics = [
    { label: "Messages Sent",  value: "1,284",  sub: "This month",          color: "#3b82f6", icon: "📨" },
    { label: "Open Rate",      value: "38.4%",  sub: "+4.2% vs last month",  color: "#22c55e", icon: "👁" },
    { label: "Reply Rate",     value: "12.6%",  sub: "Industry avg: 8%",     color: "#a855f7", icon: "💬" },
    { label: "Booked Calls",   value: "47",     sub: "3 today",              color: "#f59e0b", icon: "📞" },
  ];

  const feed = [
    { name: "Michael Torres", action: "Booked a call",        time: "2m ago",  color: "#22c55e" },
    { name: "Sarah Chen",     action: "Replied to message",   time: "11m ago", color: "#3b82f6" },
    { name: "James Wright",   action: "Opened email",         time: "24m ago", color: "#a855f7" },
    { name: "Priya Mehta",    action: "Clicked link",         time: "1h ago",  color: "#f59e0b" },
    { name: "Daniel Kim",     action: "Unsubscribed",         time: "2h ago",  color: "#ef4444" },
    { name: "Anna Fischer",   action: "Booked a call",        time: "3h ago",  color: "#22c55e" },
  ];

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
      <div className="relative z-10 pl-72 pr-8 pt-6 pb-8">
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
          <div className="space-y-2.5">
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

      {/* Draggable sidebar */}
      <AgentSidebar config={config} activePage="monitoring" />
    </div>
  );
}
