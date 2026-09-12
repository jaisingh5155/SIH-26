import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

const sizeForLevel = (l: number) => (l <= 2 ? 3 : l <= 5 ? 4 : 5);

export default function SchulteTable({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 25,
    gameId: "schulte-table",
  });
  const [boardLevel, setBoardLevel] = useState(propLevel);
  useEffect(() => {
    setBoardLevel(propLevel);
  }, [propLevel]);

  const size = useMemo(() => sizeForLevel(boardLevel), [boardLevel]);
  const total = size * size;
  const [boardSeed, setBoardSeed] = useState(0);
  const numbers = useMemo(() => {
    const arr = Array.from({ length: total }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }, [size, total, boardSeed]);

  const [next, setNext] = useState(1);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const stepStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  const reset = useCallback((lvl = boardLevel) => {
    setBoardLevel(lvl);
    setBoardSeed((s) => s + 1);
    setNext(1);
    setStartTime(null);
    setElapsed(null);
    setFeedback(null);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    stepStart.current = Date.now();
  }, [boardLevel]);

  useEffect(() => {
    reset(propLevel);
  }, [propLevel, reset]);

  const clickNumber = (n: number) => {
    const now = Date.now();
    if (startTime === null) setStartTime(now);
    const stepDuration = Math.max(0.5, (now - stepStart.current) / 1000);

    if (n !== next) {
      dda.recordTrial(false, stepDuration);
      setFeedback({ text: `✗ Wrong number! You clicked ${n}, but find ${next} next!`, isCorrect: false });
      setTimeout(() => setFeedback(null), 1200);
      return;
    }

    dda.recordTrial(true, stepDuration);
    stepStart.current = now;
    setFeedback({ text: `✓ Right! Found ${n}!`, isCorrect: true });

    if (next === total) {
      const t = now - (startTime ?? now);
      setElapsed(t);
      if (!saved.current) {
        saved.current = true;
        const score = Math.min(100, Math.max(20, Math.round(10000 / Math.max(1, t / 100))));
        setTimeout(() => {
          submitResult({
            gameId: "schulte-table",
            gameType: "schulte_table",
            score,
            accuracy: score,
            durationSeconds: Math.max(1, Math.round(t / 1000)),
            level: activeLevel,
            difficulty: String(activeLevel),
          }).then((r) => {
            setSynced(r.success);
            setOffline(r.offline);
            setCompleted(true);
          });
        }, 600);
      }
    } else {
      setNext((s) => s + 1);
    }
  };

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, elapsed ? Math.round(10000 / Math.max(1, elapsed / 100)) : 80)}
          accuracy={100}
          durationSeconds={elapsed ? Math.round(elapsed / 1000) : 0}
          level={activeLevel}
          gameName="Schulte Table"
          synced={synced}
          offline={offline}
          onPlayAgain={() => reset(dda.level)}
        />
      </>
    );

  return (
    <div className="space-y-4 flex flex-col items-center max-w-md mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 w-full px-2 pb-3 border-b border-clay/40">
        <AdaptivePacingBadge
          isAdaptiveActive={dda.isAdaptiveActive}
          onToggle={dda.toggleAdaptive}
          adjustment={dda.adjustment}
        />

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full border border-sun/40 bg-sun/10 text-sun font-bold text-xs sm:text-sm">
            Level {boardLevel}
          </span>
          <div className="flex gap-3 text-sm font-bold text-cream/70">
            <span>
              Find: <span className="text-sun text-2xl font-black">{next}</span> / {total}
            </span>
            {elapsed !== null && (
              <span>
                Time: <span className="text-tea-confirm">{(elapsed / 1000).toFixed(2)}s</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="w-full p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Assistance Active: Target number <strong>{next}</strong> is softly illuminated to help guide your visual search!
        </div>
      )}

      {/* Prominent Right/Wrong Response */}
      {feedback && (
        <div
          className={`w-full py-2 px-4 rounded-xl font-bold text-center text-sm shadow-md transition-all ${
            feedback.isCorrect
              ? "bg-tea-confirm/20 border-2 border-tea-confirm text-tea-confirm"
              : "bg-fire/20 border-2 border-fire text-fire"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <p className="text-xs text-cream/50">
        Click numbers in ascending order from <strong>1 to {total}</strong> as quickly as possible.
      </p>

      <div
        className="grid gap-2 p-2 rounded-2xl bg-ink/70 border border-clay/50 shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          maxWidth: "360px",
          width: "100%",
        }}
      >
        {numbers.map((n) => {
          const isTarget = n === next;
          const isFound = n < next;
          const isAssisted = isTarget && dda.showAssistanceCue;
          return (
            <button
              key={n}
              onClick={() => clickNumber(n)}
              className={`aspect-square text-xl sm:text-2xl font-black rounded-xl border-2 transition-all shadow
                ${isFound ? "bg-tea-confirm/20 border-tea-confirm/30 text-tea-confirm/50 cursor-default" : ""}
                ${!isFound && !isAssisted ? "bg-ink/70 border-clay text-cream hover:border-sun hover:scale-105 active:scale-95" : ""}
                ${isAssisted ? "bg-sun/20 border-sun text-sun ring-4 ring-sun/40 animate-pulse scale-105" : ""}`}
              disabled={isFound}
            >
              {isFound ? "✓" : n}
            </button>
          );
        })}
      </div>

      <button
        onClick={reset}
        className="px-5 py-2 rounded-xl border border-clay text-cream/70 text-sm hover:bg-clay transition"
      >
        🔄 Reset Round
      </button>
    </div>
  );
}

