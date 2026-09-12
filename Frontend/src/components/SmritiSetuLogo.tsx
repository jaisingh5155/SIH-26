import React from "react";

interface SmritiSetuLogoProps {
  size?: number | string;
  className?: string;
  showGlow?: boolean;
}

/**
 * SmritiSetu (स्मृति सेतु / "Memory Bridge") Emblem
 * A bespoke vector symbol representing:
 * 1. An elegant synaptic bridge ("Setu") spanning two memory anchors.
 * 2. An interconnected neural core / radiant memory spark at the apex.
 * 3. Flowing North Eastern cultural harmony curves inspired by Assam Muga silk & vitality.
 */
export function SmritiSetuLogo({
  size = 40,
  className = "",
  showGlow = true,
}: SmritiSetuLogoProps) {
  const pixelSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {showGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/25 via-sun/20 to-orange-500/30 blur-md -z-10 transform scale-110"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Main Bridge Gradient (Silk Gold to Warm Terracotta) */}
          <linearGradient id="smritiBridgeGrad" x1="10" y1="90" x2="90" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5A623" />
            <stop offset="50%" stopColor="#FFB703" />
            <stop offset="100%" stopColor="#FB8500" />
          </linearGradient>

          {/* Core Synapse Glow */}
          <linearGradient id="smritiCoreGlow" x1="50" y1="20" x2="50" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF275" />
            <stop offset="60%" stopColor="#FFB703" />
            <stop offset="100%" stopColor="#E76F51" />
          </linearGradient>

          {/* Base Anchor Gradient */}
          <linearGradient id="smritiBaseGrad" x1="15" y1="80" x2="85" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E76F51" />
            <stop offset="50%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#E76F51" />
          </linearGradient>

          {/* Background Tile Glow */}
          <radialGradient id="smritiTileBg" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#2E241F" />
            <stop offset="100%" stopColor="#1C1613" />
          </radialGradient>
        </defs>

        {/* Rounded Container Tile */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="22"
          fill="url(#smritiTileBg)"
          stroke="#F5A623"
          strokeWidth="2.5"
          strokeOpacity="0.45"
        />

        {/* Subtle decorative inner corner rings */}
        <circle cx="50" cy="50" r="40" stroke="#F5A623" strokeWidth="1" strokeOpacity="0.12" strokeDasharray="3 4" />

        {/* --- LOWER BRIDGE DECK & RIPPLE (Setu Foundations) --- */}
        {/* Foundation Base Curve */}
        <path
          d="M 20 72 C 32 67, 68 67, 80 72 C 72 75, 28 75, 20 72 Z"
          fill="url(#smritiBaseGrad)"
          opacity="0.9"
        />

        {/* Main Arching Suspension Bridge Span (Continuous Synaptic Arc) */}
        <path
          d="M 22 71 C 28 42, 42 28, 50 28 C 58 28, 72 42, 78 71"
          stroke="url(#smritiBridgeGrad)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Secondary Inner Harmonious Arch */}
        <path
          d="M 29 71 C 35 48, 44 38, 50 38 C 56 38, 65 48, 71 71"
          stroke="url(#smritiBridgeGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />

        {/* Vertical Memory Pillars (Connecting Bridge to Foundations) */}
        <line x1="36" y1="52" x2="36" y2="71" stroke="#FFB703" strokeWidth="2" strokeOpacity="0.75" strokeLinecap="round" />
        <line x1="44" y1="42" x2="44" y2="70" stroke="#FFB703" strokeWidth="2" strokeOpacity="0.85" strokeLinecap="round" />
        <line x1="56" y1="42" x2="56" y2="70" stroke="#FFB703" strokeWidth="2" strokeOpacity="0.85" strokeLinecap="round" />
        <line x1="64" y1="52" x2="64" y2="71" stroke="#FFB703" strokeWidth="2" strokeOpacity="0.75" strokeLinecap="round" />

        {/* --- APEX: RADIANT MEMORY CORE (Neural Synapse & Golden Star) --- */}
        {/* Outer Radiant Pulse */}
        <circle cx="50" cy="28" r="10" fill="url(#smritiCoreGlow)" opacity="0.3" />
        {/* Core Node */}
        <circle cx="50" cy="28" r="5.5" fill="#FFF8E7" stroke="#FFB703" strokeWidth="2" />
        {/* Inner Sparkle */}
        <circle cx="50" cy="28" r="2.5" fill="#FFB703" />

        {/* Left & Right Anchor Nodes (Memory Synapses) */}
        <circle cx="22" cy="71" r="4.5" fill="#E76F51" stroke="#FFB703" strokeWidth="1.5" />
        <circle cx="78" cy="71" r="4.5" fill="#E76F51" stroke="#FFB703" strokeWidth="1.5" />

        {/* Ascending Knowledge Sparks (Gentle memory particles) */}
        <circle cx="34" cy="30" r="1.8" fill="#FFF275" opacity="0.8" />
        <circle cx="66" cy="30" r="1.8" fill="#FFF275" opacity="0.8" />
        <circle cx="50" cy="15" r="2" fill="#FFB703" opacity="0.9" />
      </svg>
    </div>
  );
}
