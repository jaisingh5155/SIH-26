import React from "react";
import { Sparkles, Brain, CheckCircle2, HeartHandshake } from "lucide-react";
import type { DdaAdjustment } from "../hooks/useAdaptiveDifficulty";

interface AdaptivePacingBadgeProps {
  isAdaptiveActive: boolean;
  onToggle: () => void;
  adjustment?: DdaAdjustment | null;
  className?: string;
}

export function AdaptivePacingBadge({
  isAdaptiveActive,
  onToggle,
  adjustment,
  className = "",
}: AdaptivePacingBadgeProps) {
  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* Toggle Pill */}
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-extrabold transition shadow-xs cursor-pointer select-none active:scale-95 ${
          isAdaptiveActive
            ? "border-amber-500/50 bg-sun/15 text-sun hover:bg-sun/25"
            : "border-clay/80 bg-ink/60 text-cream/60 hover:text-cream hover:bg-clay/40"
        }`}
        title={
          isAdaptiveActive
            ? "AI Adaptive Difficulty is active. Scales up on success streaks, simplifies on hesitation or mistakes."
            : "Click to enable AI Adaptive Dynamic Difficulty Adjustment (DDA)."
        }
      >
        <Brain size={14} className={isAdaptiveActive ? "text-sun animate-pulse" : "text-cream/50"} />
        <span>{isAdaptiveActive ? "Adaptive AI Pacing" : "Fixed Level"}</span>
        <span
          className={`size-2 rounded-full ${
            isAdaptiveActive ? "bg-emerald-400 animate-pulse" : "bg-clay"
          }`}
        />
      </button>

      {/* Real-time Adjustment Toast / Floating Feedback Pill */}
      {adjustment && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute left-0 top-full mt-2 w-max max-w-xs sm:max-w-md px-3.5 py-2 rounded-xl text-xs font-bold border shadow-xl z-30 animate-in fade-in slide-in-from-top-1 duration-200 flex items-center gap-2 ${
            adjustment.type === "level_up"
              ? "bg-amber-950/90 border-sun text-sun"
              : "bg-teal-950/90 border-emerald-400 text-emerald-200"
          }`}
        >
          {adjustment.type === "level_up" ? (
            <Sparkles size={16} className="text-sun shrink-0" />
          ) : (
            <HeartHandshake size={16} className="text-emerald-300 shrink-0" />
          )}
          <span>{adjustment.message}</span>
        </div>
      )}
    </div>
  );
}
