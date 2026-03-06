"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export interface AgentConfig {
  agentName: string;
  avatarUrl: string | null;
  aggression: number;
  empathy: number;
  cta: number;
  tone: string;
}

export const defaultAgentConfig: AgentConfig = {
  agentName: "Felix",
  avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
  aggression: 40,
  empathy: 70,
  cta: 55,
  tone: "Empathetic",
};

export function AgentSidebar({
  config,
  activePage,
}: {
  config: AgentConfig;
  activePage: "workflow" | "monitoring";
}) {
  const [leads, setLeads] = useState<Record<string, string>[]>([]);
  const [leadsCollapsed, setLeadsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("leadsData");
      if (raw) setLeads(JSON.parse(raw) as Record<string, string>[]);
    } catch { /* ignore */ }
  }, []);

  const getLeadName = (lead: Record<string, string>) =>
    lead["Name"] ?? lead["name"] ?? lead["NAME"] ?? lead["Full Name"] ?? Object.values(lead)[0] ?? "—";

  const getLeadSub = (lead: Record<string, string>) =>
    lead["Email"] ?? lead["email"] ?? lead["EMAIL"] ??
    lead["Company"] ?? lead["company"] ?? lead["COMPANY"] ??
    Object.values(lead)[1] ?? "";

  const bars = [
    { label: "Aggression", value: config.aggression, color: "#ef4444" },
    { label: "Empathy",    value: config.empathy,    color: "#22c55e" },
    { label: "CTA Style",  value: config.cta,        color: "#3b82f6" },
  ];

  const navItems = [
    {
      key: "workflow" as const,
      href: "/dashboard",
      label: "Workflow",
      activeBg: "rgba(59,130,246,0.18)",
      activeBorder: "rgba(59,130,246,0.30)",
      iconColor: "#60a5fa",
      dotColor: "rgba(96,165,250,0.8)",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5"  r="2" />
          <circle cx="5"  cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <line x1="12" y1="7"    x2="5.5"  y2="17.2" />
          <line x1="12" y1="7"    x2="18.5" y2="17.2" />
        </svg>
      ),
    },
    {
      key: "monitoring" as const,
      href: "/monitoring",
      label: "Monitoring",
      activeBg: "rgba(34,197,94,0.15)",
      activeBorder: "rgba(34,197,94,0.25)",
      iconColor: "#4ade80",
      dotColor: "rgba(74,222,128,0.8)",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 80,
        bottom: 0,
        zIndex: 100,
        width: 272,
        display: "flex",
        flexDirection: "column",
        padding: "0 0 12px 0",
      }}
    >
      <div
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(219,234,254,0.88) 55%, rgba(147,197,253,0.72) 100%)",
          backdropFilter: "blur(28px) saturate(2)",
          borderRight: "1.5px solid rgba(255,255,255,0.85)",
          borderTop: "1px solid rgba(255,255,255,0.70)",
          borderBottom: "1px solid rgba(255,255,255,0.70)",
          borderRadius: "0 20px 20px 0",
          boxShadow: "6px 0 32px rgba(59,130,246,0.18), 0 8px 40px rgba(0,0,0,0.10), inset -1px 0 0 rgba(255,255,255,0.60)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Drag handle / logo area ── */}
        <div
          className="relative flex items-center justify-center px-4 py-4 select-none shrink-0"
          style={{
            background: "rgba(255,255,255,0.55)",
            borderBottom: "1px solid rgba(59,130,246,0.12)",
          }}
        >
          <div className="absolute left-4 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ background: "rgba(59,130,246,0.35)" }} />
            ))}
          </div>
          <span className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Agent Panel
          </span>
          <div className="absolute right-4 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ background: "rgba(59,130,246,0.35)" }} />
            ))}
          </div>
        </div>

        {/* ── Agent profile ── */}
        <div className="px-4 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(59,130,246,0.10)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="relative w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
              style={{
                background: "rgba(59,130,246,0.10)",
                border: "1px solid rgba(59,130,246,0.25)",
                boxShadow: "0 0 16px rgba(59,130,246,0.12)",
              }}
            >
              {config.avatarUrl ? (
                <Image src={config.avatarUrl} alt="agent" fill className="object-cover" unoptimized />
              ) : (
                <svg className="w-6 h-6" style={{ color: "#60a5fa" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{config.agentName}</p>
              <div
                className="inline-flex mt-1 items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(59,130,246,0.10)", color: "#1d4ed8" }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#3b82f6" }} />
                {config.tone}
              </div>
            </div>
          </div>

          {/* Tone bars */}
          <div className="space-y-3">
            {bars.map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-slate-500">
                    {label}
                  </span>
                  <span className="text-[11px] font-bold" style={{ color }}>{value}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(59,130,246,0.10)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${value}%`,
                      background: `linear-gradient(90deg, ${color}50, ${color})`,
                      boxShadow: `0 0 8px ${color}40`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="px-3 pt-3 pb-4 space-y-1.5 flex-1 overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-blue-200/60"
        >
          {/* ── Leads panel ── */}
          <div className="mb-3">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #ffffff 0%, #f5f0ff 55%, #ede9fe 100%)",
                border: "1px solid rgba(168,85,247,0.18)",
                boxShadow: "0 4px 18px rgba(168,85,247,0.10), inset 0 1px 0 rgba(255,255,255,0.80)",
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-3 py-2.5"
                style={{ borderBottom: leadsCollapsed ? "none" : "1px solid rgba(168,85,247,0.12)" }}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-purple-600">
                    Leads
                  </span>
                  {leads.length > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "rgba(168,85,247,0.15)", color: "#7c3aed" }}
                    >
                      {leads.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setLeadsCollapsed(v => !v)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-purple-100"
                  style={{ color: "#a855f7" }}
                  title={leadsCollapsed ? "Expand leads" : "Collapse leads"}
                >
                  <svg
                    className="w-3.5 h-3.5 transition-transform duration-300"
                    style={{ transform: leadsCollapsed ? "rotate(180deg)" : "rotate(0deg)" }}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
              </div>

              {/* Lead list */}
              {!leadsCollapsed && (
                <div
                  className="max-h-52 overflow-y-auto px-2 py-2 space-y-1.5
                    [&::-webkit-scrollbar]:w-1
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-purple-200"
                >
                  {leads.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-5">
                      <svg className="w-8 h-8 text-purple-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      <p className="text-[11px] text-slate-400 text-center">
                        No leads yet.<br />Upload a CSV or Excel file.
                      </p>
                    </div>
                  ) : (
                    leads.map((lead, i) => {
                      const name = getLeadName(lead);
                      const sub  = getLeadSub(lead);
                      const initial = name.charAt(0).toUpperCase();
                      const avatarPalette = [
                        ["rgba(168,85,247,0.15)", "#7c3aed"],
                        ["rgba(59,130,246,0.15)",  "#1d4ed8"],
                        ["rgba(34,197,94,0.15)",   "#15803d"],
                        ["rgba(245,158,11,0.15)",  "#b45309"],
                        ["rgba(239,68,68,0.15)",   "#b91c1c"],
                      ];
                      const [avatarBg, avatarColor] = avatarPalette[i % avatarPalette.length];
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 hover:bg-white/80"
                          style={{
                            background: "rgba(255,255,255,0.55)",
                            border: "1px solid rgba(168,85,247,0.08)",
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                            style={{ background: avatarBg, color: avatarColor }}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-slate-700 truncate">{name}</p>
                            {sub && <p className="text-[10px] text-slate-400 truncate mt-0.5">{sub}</p>}
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "rgba(168,85,247,0.35)" }} />
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Nav label ── */}
          <p className="text-[10px] font-bold tracking-widest uppercase px-2 mb-2.5 text-slate-400">
            Navigate
          </p>
          {navItems.map(({ key, href, label, activeBg, activeBorder, iconColor, dotColor, icon }) => {
            const isActive = activePage === key;
            return (
              <Link
                key={key}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/60"
                style={{
                  background: isActive ? activeBg : "rgba(255,255,255,0.40)",
                  border: `1px solid ${isActive ? activeBorder : "rgba(59,130,246,0.10)"}`,
                }}>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isActive ? activeBg : "rgba(59,130,246,0.08)",
                    color: isActive ? iconColor : "#64748b",
                  }}
                >
                  {icon}
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: isActive ? iconColor : "#475569" }}
                >
                  {label}
                </span>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: iconColor, boxShadow: `0 0 6px ${dotColor}` }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
