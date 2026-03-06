"use client";

import { useState } from "react";
import Image from "next/image";

const AVATARS = [
  { id: "adventurer-felix",   url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix"    },
  { id: "adventurer-luna",    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Luna"     },
  { id: "bottts-mars",        url: "https://api.dicebear.com/9.x/bottts/svg?seed=Mars"         },
  { id: "bottts-nova",        url: "https://api.dicebear.com/9.x/bottts/svg?seed=Nova"         },
  { id: "lorelei-sage",       url: "https://api.dicebear.com/9.x/lorelei/svg?seed=Sage"        },
  { id: "lorelei-river",      url: "https://api.dicebear.com/9.x/lorelei/svg?seed=River"       },
  { id: "micah-pixel",        url: "https://api.dicebear.com/9.x/micah/svg?seed=Pixel"         },
  { id: "micah-atlas",        url: "https://api.dicebear.com/9.x/micah/svg?seed=Atlas"         },
  { id: "pixel-art-zero",     url: "https://api.dicebear.com/9.x/pixel-art/svg?seed=Zero"      },
  { id: "pixel-art-byte",     url: "https://api.dicebear.com/9.x/pixel-art/svg?seed=Byte"      },
  { id: "fun-emoji-spark",    url: "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Spark"     },
  { id: "fun-emoji-cloud",    url: "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Cloud"     },
];

interface AvatarPickerProps {
  onConfirm?: (avatarUrl: string) => void;
}

export default function AvatarPicker({ onConfirm }: AvatarPickerProps) {
  const [selected, setSelected] = useState(AVATARS[0].id);

  const selectedAvatar = AVATARS.find((a) => a.id === selected)!;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      {/* Heading */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Choose your avatar</h2>
        <p className="text-sm text-slate-500 mt-1">Pick one that represents you</p>
      </div>

      {/* Large preview */}
      <div className="flex justify-center">
        <div
          className="relative flex items-center justify-center w-24 h-24 rounded-2xl ring-4 ring-blue-400/60 shadow-[0_0_32px_rgba(59,130,246,0.25)] transition-all duration-300"
          style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}
        >
          <Image
            src={selectedAvatar.url}
            alt="Selected avatar"
            width={80}
            height={80}
            className="rounded-xl"
            unoptimized
          />
          {/* Checkmark badge */}
          <span className="absolute -bottom-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 shadow-md">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </div>
      </div>

      {/* Grid */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(20px) saturate(1.6)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map((avatar) => {
            const isSelected = selected === avatar.id;
            return (
              <button
                key={avatar.id}
                onClick={() => setSelected(avatar.id)}
                className={`relative flex items-center justify-center rounded-xl p-1.5 transition-all duration-200 outline-none
                  ${isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50 scale-105 shadow-[0_0_12px_rgba(59,130,246,0.30)]"
                    : "ring-1 ring-slate-200 bg-white hover:ring-blue-300 hover:scale-105 hover:bg-blue-50/50"
                  }`}
              >
                <Image
                  src={avatar.url}
                  alt={avatar.id}
                  width={52}
                  height={52}
                  className="rounded-lg"
                  unoptimized
                />
                {isSelected && (
                  <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={() => onConfirm?.(selectedAvatar.url)}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          boxShadow: "0 0 20px rgba(59,130,246,0.35)",
        }}
      >
        Confirm Avatar
      </button>
    </div>
  );
}
