"use client";

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
        top: 0,
        bottom: 0,
        zIndex: 100,
        width: 272,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: "linear-gradient(160deg, #1e0a3c 0%, #2d1060 55%, #3b0f6e 100%)",
          backdropFilter: "blur(28px) saturate(1.8)",
          borderRight: "1.5px solid rgba(168,85,247,0.55)",
          boxShadow: "4px 0 32px rgba(88,28,135,0.40), 8px 0 64px rgba(59,7,100,0.30)",
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
            background: "rgba(168,85,247,0.12)",
            borderBottom: "1px solid rgba(168,85,247,0.22)",
          }}
        >
          <div className="absolute left-4 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ background: "rgba(216,180,254,0.45)" }} />
            ))}
          </div>
          <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "rgba(216,180,254,0.70)" }}>
            Agent Panel
          </span>
          <div className="absolute right-4 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ background: "rgba(216,180,254,0.45)" }} />
            ))}
          </div>
        </div>

        {/* ── Agent profile ── */}
        <div className="px-4 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(168,85,247,0.20)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="relative w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
              style={{
                background: "rgba(168,85,247,0.20)",
                border: "1px solid rgba(192,132,252,0.40)",
                boxShadow: "0 0 16px rgba(168,85,247,0.25)",
              }}
            >
              {config.avatarUrl ? (
                <Image src={config.avatarUrl} alt="agent" fill className="object-cover" unoptimized />
              ) : (
                <svg className="w-6 h-6" style={{ color: "#c084fc" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#f3e8ff" }}>{config.agentName}</p>
              <div
                className="inline-flex mt-1 items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(168,85,247,0.25)", color: "#d8b4fe" }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#c084fc" }} />
                {config.tone}
              </div>
            </div>
          </div>

          {/* Tone bars */}
          <div className="space-y-3">
            {bars.map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[11px] font-medium" style={{ color: "rgba(216,180,254,0.60)" }}>
                    {label}
                  </span>
                  <span className="text-[11px] font-bold" style={{ color }}>{value}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(168,85,247,0.18)" }}>
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
        <div className="px-3 pt-3 pb-4 space-y-1.5 flex-1 overflow-y-auto">
          <p
            className="text-[10px] font-bold tracking-widest uppercase px-2 mb-2.5"
            style={{ color: "rgba(192,132,252,0.50)" }}
          >
            Navigate
          </p>
          {navItems.map(({ key, href, label, activeBg, activeBorder, iconColor, dotColor, icon }) => {
            const isActive = activePage === key;
            return (
              <Link
                key={key}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:brightness-125"
                style={{
                  background: isActive ? activeBg : "rgba(168,85,247,0.08)",
                  border: `1px solid ${isActive ? activeBorder : "rgba(168,85,247,0.15)"}`,
                }}>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isActive ? activeBg : "rgba(168,85,247,0.15)",
                    color: isActive ? iconColor : "#c084fc",
                  }}
                >
                  {icon}
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: isActive ? iconColor : "rgba(216,180,254,0.70)" }}
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
