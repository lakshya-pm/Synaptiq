"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

/* ─── Main Navbar (Logout only) ─────────────────────────────────────── */
function MainNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.60)",
            backdropFilter: "blur(24px) saturate(2)",
            border: "1px solid rgba(255,255,255,0.75)",
            boxShadow: "0 4px 24px rgba(59,130,246,0.10)",
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)" }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-40" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)" }} />

          <div className="relative z-10 px-6 py-3.5 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-px rounded-[7px] bg-white/20 backdrop-blur-sm" />
                <svg className="relative z-10 w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" />
                  <path d="M8.56 13.44A4 4 0 1 0 12 18" />
                  <path d="M12 18a4 4 0 0 0 4-4c0-1.1-.45-2.1-1.17-2.83" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-blue-600 bg-clip-text text-transparent">
                Synaptiq
              </span>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1">
              {[{ href: "/", label: "Home" }, { href: "/#features", label: "Features" }, { href: "/#about", label: "About" }].map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-white/60 transition-all duration-200"
                >
                  {label}
                </Link>
              ))}
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                boxShadow: "0 0 16px rgba(59,130,246,0.30), inset 0 1px 1px rgba(255,255,255,0.20)",
                border: "1px solid rgba(255,255,255,0.20)",
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ─── Draggable Slider ───────────────────────────────────────────────── */
function VolumeSlider({
  label,
  description,
  value,
  onChange,
  color = "#3b82f6",
  leftLabel,
  rightLabel,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const calcValue = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(pct * 100);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange(calcValue(e.clientX));
    const move = (ev: MouseEvent) => onChange(calcValue(ev.clientX));
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const move = (ev: TouchEvent) => onChange(calcValue(ev.touches[0].clientX));
    const end = () => { window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", end);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
        <span
          className="text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-lg min-w-[52px] text-center"
          style={{ color, background: `${color}18` }}
        >
          {value}%
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="relative h-3 rounded-full bg-slate-200 cursor-pointer select-none"
        style={{ touchAction: "none" }}
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}70, ${color})` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 active:scale-125"
          style={{ left: `${value}%`, background: color, boxShadow: `0 0 0 3px ${color}30, 0 2px 6px rgba(0,0,0,0.15)` }}
        />
      </div>

      {leftLabel && rightLabel && (
        <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Generate Avatar seeds ──────────────────────────────────────────── */
const GENERATED = [
  { seed: "Felix",  style: "adventurer" },
  { seed: "Luna",   style: "adventurer" },
  { seed: "Mars",   style: "bottts"     },
  { seed: "Nova",   style: "bottts"     },
  { seed: "Sage",   style: "lorelei"    },
  { seed: "River",  style: "lorelei"    },
  { seed: "Pixel",  style: "micah"      },
  { seed: "Atlas",  style: "micah"      },
];

const avatarUrl = (style: string, seed: string) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;

/* ─── Step 1 ─────────────────────────────────────────────────────────── */
function StepAgent({
  tab, setTab, preview, setPreview, selected, setSelected,
  aggression, setAggression, empathy, setEmpathy, cta, setCta, onNext,
}: {
  tab: "upload" | "generate";
  setTab: (t: "upload" | "generate") => void;
  preview: string | null;
  setPreview: (s: string | null) => void;
  selected: { seed: string; style: string };
  setSelected: (s: { seed: string; style: string }) => void;
  aggression: number; setAggression: (v: number) => void;
  empathy: number; setEmpathy: (v: number) => void;
  cta: number; setCta: (v: number) => void;
  onNext: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const activeAvatar = tab === "upload" ? preview : avatarUrl(selected.style, selected.seed);

  return (
    <div className="space-y-5">
      {/* Avatar section */}
      <div
        className="rounded-2xl p-4 space-y-4"
        style={{
          background: "rgba(255,255,255,0.70)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        }}
      >
        {/* Preview */}
        <div className="flex justify-center">
          <div
            className="relative w-20 h-20 rounded-2xl ring-4 ring-blue-400/50 shadow-[0_0_24px_rgba(59,130,246,0.20)] overflow-hidden bg-blue-50 flex items-center justify-center"
          >
            {activeAvatar ? (
              <Image src={activeAvatar} alt="avatar" fill className="object-cover" unoptimized />
            ) : (
              <svg className="w-9 h-9 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
          {(["generate", "upload"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
                ${tab === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {t === "generate" ? "✨ Generate" : "📤 Upload"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "generate" ? (
          <div className="grid grid-cols-4 gap-2">
            {GENERATED.map((av) => {
              const isActive = selected.seed === av.seed && selected.style === av.style;
              return (
                <button
                  key={av.seed}
                  onClick={() => setSelected(av)}
                  className={`relative flex items-center justify-center rounded-xl p-1 transition-all duration-200
                    ${isActive
                      ? "ring-2 ring-blue-500 bg-blue-50 scale-105 shadow-[0_0_10px_rgba(59,130,246,0.25)]"
                      : "ring-1 ring-slate-200 bg-white hover:ring-blue-300 hover:scale-105"}`}
                >
                  <Image src={avatarUrl(av.style, av.seed)} alt={av.seed} width={44} height={44} className="rounded-lg" unoptimized />
                  {isActive && <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-500 border border-white" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 bg-blue-50/40"
          >
            <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-xs font-medium text-slate-500">{preview ? "Click to replace photo" : "Click to upload photo"}</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
        )}
      </div>

      {/* Sliders */}
      <div
        className="rounded-2xl p-5 space-y-5"
        style={{
          background: "rgba(255,255,255,0.70)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        }}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Personality Traits</p>
        <VolumeSlider
          label="Aggression"
          description="How assertive the agent sounds"
          value={aggression}
          onChange={setAggression}
          color="#ef4444"
          leftLabel="Soft"
          rightLabel="Assertive"
        />
        <VolumeSlider
          label="Empathy"
          description="Warmth & understanding in responses"
          value={empathy}
          onChange={setEmpathy}
          color="#22c55e"
          leftLabel="Neutral"
          rightLabel="Warm"
        />
        <VolumeSlider
          label="CTA Style"
          description="Directness of calls-to-action"
          value={cta}
          onChange={setCta}
          color="#3b82f6"
          leftLabel="Subtle"
          rightLabel="Direct"
        />
      </div>

      <button
        onClick={onNext}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
        style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 0 20px rgba(59,130,246,0.35)" }}
      >
        Next: Upload Leads
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Step 2 ─────────────────────────────────────────────────────────── */
function StepLeads({ onBack, onLaunch }: { onBack: () => void; onLaunch: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = ".csv,.xlsx,.xls";

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && /\.(csv|xlsx|xls)$/i.test(dropped.name)) setFile(dropped);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const fileIcon = file?.name.endsWith(".csv") ? (
    <span className="text-2xl">📄</span>
  ) : (
    <span className="text-2xl">📊</span>
  );

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl p-8 flex flex-col items-center gap-4 border-2 border-dashed transition-all duration-300
          ${dragging ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-50"}`}
      >
        {file ? (
          <>
            {fileIcon}
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Drag & drop your leads file</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            </div>
            <div className="flex gap-2">
              {["CSV", "XLSX", "XLS"].map((ext) => (
                <span key={ext} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-500 shadow-sm">
                  .{ext}
                </span>
              ))}
            </div>
          </>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      </div>

      {/* Info box */}
      <div
        className="rounded-xl p-4 flex gap-3 items-start"
        style={{
          background: "rgba(255,255,255,0.70)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        }}
      >
        <svg className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <p className="text-xs font-semibold text-slate-700">Accepted formats</p>
          <p className="text-xs text-slate-400 mt-0.5">Upload a CSV or Excel file with columns: Name, Email, Phone, Company. Max 10 MB.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-300"
        >
          ← Back
        </button>
        <button
          disabled={!file}
          onClick={onLaunch}
          className="flex-[2] py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
          style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 0 20px rgba(59,130,246,0.35)" }}
        >
          Launch Agent
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function MainPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [tab, setTab] = useState<"upload" | "generate">("generate");
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState(GENERATED[0]);
  const [aggression, setAggression] = useState(40);
  const [empathy, setEmpathy] = useState(70);
  const [cta, setCta] = useState(55);

  const handleLaunch = () => {
    const agentAvatarUrl = tab === "upload" ? preview : avatarUrl(selected.style, selected.seed);
    const tone = aggression > 65 ? "Assertive" : empathy > 65 ? "Empathetic" : "Balanced";
    const config = { agentName: selected.seed, avatarUrl: agentAvatarUrl, aggression, empathy, cta, tone };
    localStorage.setItem("agentConfig", JSON.stringify(config));
    router.push("/dashboard");
  };

  const steps = [
    { n: 1, label: "Make Agent" },
    { n: 2, label: "Upload Leads" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #ffffff 0%, #dbeafe 40%, #3b82f6 100%)" }}
    >
      <MainNavbar />
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-blue-300/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-white/50 blur-[100px]" />
      </div>

      <div className="flex items-center justify-center px-6 pt-28 pb-10 relative z-10">
        <div className="w-full max-w-md">
        {/* Glass card */}
        <div
          className="rounded-3xl p-7"
          style={{
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(28px) saturate(1.8)",
            border: "1px solid rgba(255,255,255,0.90)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map(({ n, label }, i) => {
              const done = step > n;
              const active = step === n;
              return (
                <div key={n} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                        ${active ? "border-blue-500 bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.45)]"
                          : done ? "border-blue-500 bg-blue-500 text-white"
                          : "border-slate-200 bg-white text-slate-400"}`}
                    >
                      {done ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : n}
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-blue-600" : done ? "text-blue-500" : "text-slate-400"}`}>
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-20 h-0.5 mb-5 mx-2 rounded-full transition-all duration-500 ${step > 1 ? "bg-blue-500" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step heading */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {step === 1 ? "Configure Your Agent" : "Upload Your Leads"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {step === 1 ? "Set avatar and personality traits" : "Import contacts from a spreadsheet"}
            </p>
          </div>

          {step === 1 ? (
            <StepAgent
              tab={tab} setTab={setTab}
              preview={preview} setPreview={setPreview}
              selected={selected} setSelected={setSelected}
              aggression={aggression} setAggression={setAggression}
              empathy={empathy} setEmpathy={setEmpathy}
              cta={cta} setCta={setCta}
              onNext={() => setStep(2)}
            />
          ) : (
            <StepLeads onBack={() => setStep(1)} onLaunch={handleLaunch} />
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
