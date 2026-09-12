import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

const gridSize = (l: number) => (l <= 2 ? 3 : l <= 5 ? 4 : 5);
const itemCount = (l: number) => Math.min(2 + Math.floor(l / 2), 7);

export default function WorkingMemoryGrid({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "working-memory-grid",
  });
  const activeLevel = dda.level;

  const size = gridSize(activeLevel);
  const count = itemCount(activeLevel);
  const [positions, setPositions] = useState<number[]>([]);
  const [phase, setPhase] = useState<"show" | "recall" | "feedback">("show");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const roundStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(activeLevel * 1.2));
  const displayTime = Math.max(2200 - activeLevel * 100, 1000);
  const { submitResult } = useGameSession();

  const startRound = () => {
    const total = size * size;
    const newPos: number[] = [];
    while (newPos.length < count) {
      const p = Math.floor(Math.random() * total);
      if (!newPos.includes(p)) newPos.push(p);
    }
    setPositions(newPos);
    setPhase("show");
    setSelected(new Set());
    setLastResult(null);
    setTimeout(() => {
      setPhase("recall");
      roundStart.current = Date.now();
    }, displayTime);
  };

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    setLastResult(null);
    sessionStart.current = Date.now();
    startRound();
  }, [propLevel]);

  const toggleCell = (idx: number) => {
    if (phase !== "recall") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const checkAnswer = () => {
    if (phase !== "recall") return;
    const roundDuration = Math.max(1, (Date.now() - roundStart.current) / 1000);
    const correct = positions.filter((p) => selected.has(p)).length;
    const wrong = [...selected].filter((s) => !positions.includes(s)).length;
    const perfect = correct === count && wrong === 0;

    dda.recordTrial(perfect, roundDuration);

    if (perfect) {
      setLastResult({ isCorrect: true, text: "✓ Right! You recalled all positions perfectly!" });
      setPhase("feedback");
      const newScore = score + 1;
      setScore(newScore);
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = 100;
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "working-memory-grid",
            gameType: "working_memory_grid",
            score: acc,
            accuracy: acc,
            durationSeconds: Math.max(5, dur),
            level: activeLevel,
            difficulty: String(activeLevel),
          }).then((r) => {
            setSynced(r.success);
            setOffline(r.offline);
            setCompleted(true);
          });
        }, 700);
        return;
      }
    } else {
      setLastResult({
        isCorrect: false,
        text: `✗ Wrong! You found ${correct}/${count} cells. Review highlighted positions!`,
      });
      setPhase("feedback");
    }
    setTimeout(startRound, 1500);
  };

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={activeLevel}
          gameName="Working Memory Grid"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
            startRound();
          }}
        />
      </>
    );

  return (
    <div className="flex flex-col items-center space-y-5 w-full max-w-md mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 w-full px-2 pb-3 border-b border-clay/40">
        <AdaptivePacingBadge
          isAdaptiveActive={dda.isAdaptiveActive}
          onToggle={dda.toggleAdaptive}
          adjustment={dda.adjustment}
        />

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full border border-sun/40 bg-sun/10 text-sun font-bold text-xs sm:text-sm">
            Level {activeLevel}
          </span>
          <p className="text-xs sm:text-sm text-cream/70 font-bold">
            Score: <span className="text-sun font-extrabold text-base">{score}</span> / {target}
          </p>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="w-full p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Assistance Active: Target pattern duration is extended to help recall.
        </div>
      )}

      {/* Prominent Right/Wrong Response Notification */}
      {lastResult ? (
        <div
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-center text-sm shadow-md transition-all ${
            lastResult.isCorrect
              ? "bg-tea-confirm/20 border-2 border-tea-confirm text-tea-confirm"
              : "bg-fire/20 border-2 border-fire text-fire"
          }`}
        >
          {lastResult.text}
        </div>
      ) : (
        <div className="text-sm text-cream/70 text-center font-medium min-h-[28px] flex items-center justify-center">
          {phase === "show"
            ? "👀 Memorise the highlighted positions…"
            : "👆 Select the positions that were highlighted, then press Submit"}
        </div>
      )}

      <div
        className="grid gap-2 p-3 rounded-2xl bg-ink/70 border border-clay/50 shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          maxWidth: "360px",
          width: "100%",
        }}
      >
        {Array.from({ length: size * size }).map((_, idx) => {
          const isActive = positions.includes(idx);
          const isSelected = selected.has(idx);
          const showFeedback = phase === "feedback";
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleCell(idx)}
              disabled={phase !== "recall"}
              className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center font-bold text-lg
                ${phase === "show" && isActive ? "bg-sun border-sun shadow-[0_0_12px_rgba(234,179,8,0.6)] scale-95" : ""}
                ${phase === "show" && !isActive ? "bg-clay/20 border-clay/40" : ""}
                ${phase === "recall" && isSelected ? "bg-sun/80 border-sun text-ink shadow-md" : ""}
                ${phase === "recall" && !isSelected ? "bg-clay/20 border-clay hover:border-sun/60 hover:bg-clay/30" : ""}
                ${showFeedback && isActive && isSelected ? "bg-tea-confirm/60 border-tea-confirm text-cream" : ""}
                ${showFeedback && isActive && !isSelected ? "bg-tea-confirm/40 border-dashed border-tea-confirm text-tea-confirm" : ""}
                ${showFeedback && !isActive && isSelected ? "bg-fire/40 border-fire text-cream" : ""}
                ${showFeedback && !isActive && !isSelected ? "bg-clay/15 border-clay/30" : ""}`}
              aria-label={`Cell ${idx + 1}`}
            >
              {showFeedback && isActive && isSelected && "✓"}
              {showFeedback && !isActive && isSelected && "✗"}
            </button>
          );
        })}
      </div>

      {phase === "recall" && (
        <button
          onClick={checkAnswer}
          className="px-8 py-3 rounded-xl bg-sun text-ink font-black hover:opacity-90 transition shadow-lg text-lg"
        >
          ✓ Submit Selection ({selected.size}/{count})
        </button>
      )}
    </div>
  );
}

