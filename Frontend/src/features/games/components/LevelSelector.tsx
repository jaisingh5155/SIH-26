import { useNavigate, useSearch } from "@tanstack/react-router";

interface LevelSelectorProps {
  gameId: string;
  maxLevel?: number;
  isAdaptive?: boolean;
  onToggleAdaptive?: () => void;
}

/**
 * Reads the current level from ?level=N URL search param,
 * and provides +/- controls to navigate between levels,
 * with optional real-time Adaptive AI mode toggle.
 */
export function LevelSelector({
  gameId,
  maxLevel = 10,
  isAdaptive = true,
  onToggleAdaptive,
}: LevelSelectorProps) {
  const navigate = useNavigate();
  // Read level from search params (with safe fallback)
  let level = 1;
  try {
    const search = useSearch({ strict: false }) as Record<string, unknown>;
    const raw = Number(search?.["level"] ?? "1");
    level = Math.min(Math.max(1, isNaN(raw) ? 1 : raw), maxLevel);
  } catch {
    level = 1;
  }

  const setLevel = (next: number) => {
    void navigate({
      to: `/games/${gameId}` as never,
      // Cast to bypass strict param types — level is validated by validateSearch
      search: { level: String(Math.min(Math.max(1, next), maxLevel)) } as never,
      replace: true,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {onToggleAdaptive && (
        <button
          type="button"
          onClick={onToggleAdaptive}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition shadow-card cursor-pointer select-none active:scale-95 ${
            isAdaptive
              ? "border-amber-500/60 bg-sun/15 text-sun hover:bg-sun/25"
              : "border-clay/80 bg-surface text-cream/70 hover:text-white"
          }`}
          title="Toggle real-time AI Dynamic Difficulty Adjustment (DDA)"
        >
          <span className={`size-2 rounded-full ${isAdaptive ? "bg-emerald-400 animate-pulse" : "bg-clay"}`} />
          <span>{isAdaptive ? "🧠 Adaptive AI: ON" : "Manual Level"}</span>
        </button>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-clay bg-surface px-4 py-2 sm:px-5 sm:py-2.5 shadow-card">
        <span className="text-xs sm:text-sm font-bold text-cream/70 uppercase tracking-wide">Level</span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setLevel(level - 1)}
            disabled={level <= 1}
            className="flex size-8 sm:size-9 items-center justify-center rounded-lg border border-clay bg-ink text-cream hover:bg-clay disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-lg cursor-pointer"
            aria-label="Previous level"
          >
            −
          </button>
          <span className="font-display text-xl sm:text-2xl font-bold text-sun w-8 sm:w-10 text-center">
            {level}
          </span>
          <button
            type="button"
            onClick={() => setLevel(level + 1)}
            disabled={level >= maxLevel}
            className="flex size-8 sm:size-9 items-center justify-center rounded-lg border border-clay bg-ink text-cream hover:bg-clay disabled:opacity-40 disabled:cursor-not-allowed transition font-bold text-lg cursor-pointer"
            aria-label="Next level"
          >
            +
          </button>
        </div>
        <span className="text-xs text-cream/50">of {maxLevel}</span>
      </div>
    </div>
  );
}
