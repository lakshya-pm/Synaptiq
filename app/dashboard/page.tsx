"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AgentSidebar, AgentConfig, defaultAgentConfig } from "@/components/AgentSidebar";

function DashboardNavbar() {
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

export default function DashboardPage() {
  const [config, setConfig] = useState<AgentConfig>(defaultAgentConfig);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("agentConfig");
      if (raw) setConfig(JSON.parse(raw) as AgentConfig);
    } catch {
      // keep default
    }
  }, []);

  const nodeData = [
    { id: 0, label: "Start",     sub: "Trigger",   x: 60,  y: 80,  bg: "rgba(59,130,246,0.18)",  border: "rgba(59,130,246,0.40)",  glow: "rgba(59,130,246,0.20)",  icon: <svg className="w-6 h-6 text-blue-400"   viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16" fill="currentColor" stroke="none"/></svg> },
    { id: 1, label: "Qualify",   sub: "AI filter",  x: 240, y: 80,  bg: "rgba(168,85,247,0.18)",  border: "rgba(168,85,247,0.40)",  glow: "rgba(168,85,247,0.20)",  icon: <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg> },
    { id: 2, label: "Send",      sub: "Email/SMS",  x: 420, y: 80,  bg: "rgba(34,197,94,0.18)",   border: "rgba(34,197,94,0.40)",   glow: "rgba(34,197,94,0.20)",   icon: <svg className="w-6 h-6 text-green-400"  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
    { id: 3, label: "Follow Up", sub: "D+3 auto",   x: 600, y: 80,  bg: "rgba(245,158,11,0.18)",  border: "rgba(245,158,11,0.40)",  glow: "rgba(245,158,11,0.20)",  icon: <svg className="w-6 h-6 text-amber-400"  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { id: 4, label: "Convert",   sub: "Close 🎯",    x: 780, y: 80,  bg: "rgba(239,68,68,0.18)",   border: "rgba(239,68,68,0.40)",   glow: "rgba(239,68,68,0.20)",   icon: <svg className="w-6 h-6 text-red-400"    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> },
  ];

  const [nodes, setNodes] = useState(nodeData.map(n => ({ ...n })));
  const draggingNode = useRef<{ id: number; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onNodeMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    const node = nodes.find(n => n.id === id)!;
    draggingNode.current = { id, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y };
    const onMove = (ev: MouseEvent) => {
      if (!draggingNode.current) return;
      const dx = ev.clientX - draggingNode.current.startX;
      const dy = ev.clientY - draggingNode.current.startY;
      setNodes(prev => prev.map(n => n.id === id ? { ...n, x: draggingNode.current!.origX + dx, y: draggingNode.current!.origY + dy } : n));
    };
    const onUp = () => {
      draggingNode.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #ffffff 0%, #dbeafe 40%, #3b82f6 100%)" }}>
      <DashboardNavbar />
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: "rgba(59,130,246,0.15)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-[100px]" style={{ background: "rgba(255,255,255,0.50)" }} />
      </div>

      {/* Header */}
      <div
        className="relative z-10 pl-72 pr-8 pt-24 pb-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(59,130,246,0.15)" }}
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow</h1>
          <p className="text-sm mt-0.5 text-slate-500">
            AI outreach pipeline &middot; Agent:{" "}
            <span className="text-blue-600 font-semibold">{config.agentName}</span>
          </p>
        </div>
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.20)" }}
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-400">Agent Active</span>
        </div>
      </div>

      {/* Stats removed — Workflow canvas fills the space */}

      {/* Workflow canvas */}
      <div className="relative z-10 pl-72 pr-8 pt-6 pb-8">
        <div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(24px) saturate(1.8)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
            minHeight: 260,
          }}
        >
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(59,130,246,0.12) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <p
            className="text-[11px] font-bold tracking-widest uppercase mb-10 relative z-10 text-slate-400"
          >
            Pipeline
          </p>

          {/* Nodes */}
          <div className="relative" style={{ height: 220 }}>
            {/* SVG edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
              {nodes.slice(0, -1).map((n, i) => {
                const next = nodes[i + 1];
                const x1 = n.x + 28; const y1 = n.y + 28;
                const x2 = next.x + 28; const y2 = next.y + 28;
                return (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(59,130,246,0.30)" strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                );
              })}
            </svg>
            {nodes.map(({ id, label, sub, x, y, bg, border, glow, icon }) => (
              <div
                key={id}
                onMouseDown={(e) => onNodeMouseDown(e, id)}
                className="absolute flex flex-col items-center gap-2 select-none"
                style={{ left: x, top: y, cursor: "grab", width: 72 }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-shadow"
                  style={{ background: bg, border: `1.5px solid ${border}`, boxShadow: `0 0 20px ${glow}` }}
                >
                  {icon}
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-700 whitespace-nowrap">{label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Draggable sidebar */}
      <AgentSidebar config={config} activePage="workflow" />
    </div>
  );
}
