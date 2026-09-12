import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";

const gridSize = (l: number) => (l <= 1 ? 3 : l <= 4 ? 5 : 8);

export default function PatternMatrix({ level }: { level: number }) {
  const size = useMemo(() => gridSize(level), [level]);
  const total = size * size;
  const [pattern, setPattern] = useState<number[]>([]);
  const [attempt, setAttempt] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"show" | "recreate" | "done">("show");
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level / 2));
  const { submitResult } = useGameSession();

  const generateNewPattern = () => {
    const k = Math.min(3 + Math.floor(level / 2), Math.floor(total / 2));
    const indices = new Set<number>();
    while (indices.size < k) indices.add(Math.floor(Math.random() * total));
    setPattern(Array.from(indices));
    setPhase("show");
    setAttempt(new Set());
    setTimeout(() => setPhase("recreate"), Math.max(800, 1200 - level * 80));
  };

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    generateNewPattern();
  }, [level, total]);

  const toggle = (idx: number) => {
    if (phase !== "recreate") return;
    setAttempt((prev) => {
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
    const correct = pattern.filter((p) => attempt.has(p)).length;
    const wrong = [...attempt].filter((a) => !pattern.includes(a)).length;
    const acc = Math.max(0, Math.round(((correct - wrong) / pattern.length) * 100));
    if (acc >= 70) {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "pattern-matrix",
          gameType: "pattern_matrix",
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
    setTimeout(generateNewPattern, 800);
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
          gameName="Pattern Matrix"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
            generateNewPattern();
          }}
        />
      </>
    );

  return (
    <div className="space-y-5 flex flex-col items-center">
      <p className="text-cream/60 text-sm text-center">
        {phase === "show"
          ? "Memorise the highlighted pattern…"
          : "Recreate the pattern by clicking cells, then Submit"}
      </p>
      <p className="text-xs text-cream/40 font-semibold">
        Score: {score}/{target}
      </p>

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          maxWidth: "360px",
          width: "100%",
        }}
      >
        {Array.from({ length: total }).map((_, idx) => {
          const isPattern = pattern.includes(idx);
          const isSelected = attempt.has(idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggle(idx)}
              className={`aspect-square rounded-lg border-2 transition-all duration-200
                ${phase === "show" && isPattern ? "bg-sun border-sun scale-95" : ""}
                ${phase === "recreate" && isSelected ? "bg-sun/80 border-sun" : ""}
                ${phase === "recreate" && !isSelected ? "bg-ink/60 border-clay hover:border-sun/50" : ""}
                ${phase === "show" && !isPattern ? "bg-ink/60 border-clay" : ""}`}
              disabled={phase !== "recreate"}
              aria-label={`Cell ${idx + 1}`}
            />
          );
        })}
      </div>

      {phase === "recreate" && (
        <button
          onClick={checkAnswer}
          className="px-6 py-3 rounded-xl bg-sun text-ink font-extrabold text-base hover:opacity-90 transition shadow"
        >
          ✓ Submit Pattern
        </button>
      )}
    </div>
  );
}
