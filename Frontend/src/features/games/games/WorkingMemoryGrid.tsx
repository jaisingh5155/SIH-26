import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";

const gridSize = (l: number) => (l <= 2 ? 3 : l <= 5 ? 5 : 7);
const itemCount = (l: number) => Math.min(3 + Math.floor(l / 2), 8);

export default function WorkingMemoryGrid({ level }: { level: number }) {
  const size = gridSize(level);
  const count = itemCount(level);
  const [positions, setPositions] = useState<number[]>([]);
  const [phase, setPhase] = useState<"show" | "recall" | "feedback">("show");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level * 1.5));
  const displayTime = Math.max(2000 - level * 100, 800);
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
    setTimeout(() => setPhase("recall"), displayTime);
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
  }, [level, size, count]);

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
    const correct = positions.filter((p) => selected.has(p)).length;
    const wrong = [...selected].filter((s) => !positions.includes(s)).length;
    const perfect = correct === count && wrong === 0;
    setLastResult(perfect ? "correct" : "wrong");
    setPhase("feedback");
    if (perfect) {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = 100;
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "working-memory-grid",
          gameType: "working_memory_grid",
          score: acc,
          accuracy: acc,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
          setCompleted(true);
        });
        return;
      }
    }
    setTimeout(startRound, 1000);
  };

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={level}
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
    <div className="flex flex-col items-center space-y-5">
      <div className="text-sm text-cream/60 text-center">
        {phase === "show"
          ? "Memorise the highlighted positions…"
          : phase === "recall"
            ? "Select the positions that were highlighted, then Submit"
            : lastResult === "correct"
              ? "✓ Correct!"
              : "✗ Try again!"}
      </div>
      <p className="text-xs text-cream/40 font-semibold">
        Score: {score}/{target} · Remember {count} cells
      </p>

      <div
        className="grid gap-1"
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
              className={`aspect-square rounded-lg border-2 transition-all
                ${phase === "show" && isActive ? "bg-sun border-sun" : ""}
                ${phase === "recall" && isSelected ? "bg-sun/80 border-sun" : ""}
                ${phase === "recall" && !isSelected ? "bg-ink/60 border-clay hover:border-sun/40" : ""}
                ${showFeedback && isActive ? "bg-tea-confirm/50 border-tea-confirm" : ""}
                ${showFeedback && !isActive && isSelected ? "bg-fire/30 border-fire" : ""}
                ${showFeedback && !isActive && !isSelected ? "bg-ink/60 border-clay" : ""}`}
              aria-label={`Cell ${idx + 1}`}
            />
          );
        })}
      </div>

      {phase === "recall" && (
        <button
          onClick={checkAnswer}
          className="px-6 py-3 rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 transition shadow"
        >
          ✓ Submit
        </button>
      )}
    </div>
  );
}
