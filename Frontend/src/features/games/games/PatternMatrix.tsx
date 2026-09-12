import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

const gridSize = (l: number) => (l <= 1 ? 3 : l <= 4 ? 4 : 5);

export default function PatternMatrix({ level: propLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel: propLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "pattern-matrix",
  });
  const activeLevel = dda.level;

  const size = useMemo(() => gridSize(activeLevel), [activeLevel]);
  const total = size * size;
  const [pattern, setPattern] = useState<number[]>([]);
  const [attempt, setAttempt] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"show" | "recreate" | "feedback" | "done">("show");
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const trialStartTime = useRef(Date.now());
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const target = Math.max(3, Math.ceil(activeLevel / 2));
  const { submitResult } = useGameSession();

  const generateNewPattern = (lvl = activeLevel) => {
    const s = gridSize(lvl);
    const tot = s * s;
    const k = Math.min(3 + Math.floor(lvl / 2), Math.floor(tot / 2));
    const indices = new Set<number>();
    while (indices.size < k) indices.add(Math.floor(Math.random() * tot));
    setPattern(Array.from(indices));
    setPhase("show");
    setAttempt(new Set());
    setFeedback(null);
    trialStartTime.current = Date.now();

    const showDuration = Math.round(
      Math.max(1400, 2400 - lvl * 100) * dda.timerMultiplier
    );

    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      setPhase("recreate");
      trialStartTime.current = Date.now();
    }, showDuration);
  };

  // Only reset session when propLevel changes (external route/level select navigation)
  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    generateNewPattern(propLevel);

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [propLevel]);

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
    if (phase !== "recreate") return;
    const trialDuration = Math.round((Date.now() - trialStartTime.current) / 1000);
    const correctMatches = pattern.filter((p) => attempt.has(p)).length;
    const wrongClicks = [...attempt].filter((a) => !pattern.includes(a)).length;
    const isAccurate = correctMatches === pattern.length && wrongClicks === 0;

    setPhase("feedback");

    if (isAccurate) {
      dda.recordTrial(true, trialDuration);
      const newScore = score + 1;
      setScore(newScore);
      setFeedback({
        text: `✓ Right! Pattern recreated perfectly! (+1 Point)`,
        isCorrect: true,
      });

      if (newScore >= target && !saved.current) {
        saved.current = true;
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "pattern-matrix",
          gameType: "pattern_matrix",
          score: 100,
          accuracy: 100,
          durationSeconds: Math.max(5, dur),
          level: activeLevel,
          difficulty: String(activeLevel),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
          feedbackTimerRef.current = setTimeout(() => {
            setCompleted(true);
          }, 1400);
        });
        return;
      }
    } else {
      dda.recordTrial(false, trialDuration);
      setFeedback({
        text: `✗ Pattern missed (${correctMatches}/${pattern.length} cells matched). Check the highlighted pattern!`,
        isCorrect: false,
      });
    }

    feedbackTimerRef.current = setTimeout(() => {
      generateNewPattern(activeLevel);
    }, 1800);
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
            generateNewPattern(activeLevel);
          }}
        />
      </>
    );

  // Assistance hint target: unselected pattern cell
  const hintCell = dda.showAssistanceCue
    ? pattern.find((idx) => !attempt.has(idx))
    : undefined;

  return (
    <div className="space-y-5 flex flex-col items-center w-full">
      {/* Top Controls: Adaptive Pacing Badge + Level & Score */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full pb-3 border-b border-clay/40">
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

      {/* Dynamic Feedback Banner */}
      {feedback && (
        <div
          className={`w-full max-w-md px-4 py-2.5 rounded-xl border text-sm font-bold text-center transition-all animate-bounce ${
            feedback.isCorrect
              ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
              : "bg-rose-500/20 border-rose-500 text-rose-300"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Gentle Assistance Cue */}
      {dda.showAssistanceCue && !feedback && (
        <div className="px-4 py-2 rounded-xl bg-sun/10 border border-sun/40 text-sun text-xs font-bold text-center animate-pulse">
          💡 Adaptive Assistance: One of the target cells is highlighted with a gentle gold glow!
        </div>
      )}

      <p className="text-cream/70 text-sm text-center font-medium">
        {phase === "show"
          ? "Memorise the highlighted pattern…"
          : phase === "feedback"
            ? "Checking your pattern..."
            : "Recreate the pattern by clicking cells, then Submit"}
      </p>

      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          maxWidth: "360px",
          width: "100%",
        }}
      >
        {Array.from({ length: total }).map((_, idx) => {
          const isPattern = pattern.includes(idx);
          const isSelected = attempt.has(idx);
          const isHint = hintCell === idx;

          let cellStyle = "bg-ink/60 border-clay";

          if (phase === "show") {
            if (isPattern) {
              cellStyle = "bg-sun border-sun scale-95 shadow-[0_0_12px_rgba(234,179,8,0.6)]";
            }
          } else if (phase === "recreate") {
            if (isSelected) {
              cellStyle = "bg-sun border-sun text-ink shadow";
            } else if (isHint) {
              cellStyle = "bg-sun/20 border-sun animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]";
            } else {
              cellStyle = "bg-ink/60 border-clay hover:border-sun/50";
            }
          } else if (phase === "feedback") {
            if (isPattern && isSelected) {
              // Correct match
              cellStyle = "bg-emerald-500 border-emerald-400 text-white scale-95";
            } else if (!isPattern && isSelected) {
              // Wrongly clicked
              cellStyle = "bg-rose-500 border-rose-400 text-white";
            } else if (isPattern && !isSelected) {
              // Missed target
              cellStyle = "bg-amber-500/70 border-amber-400 animate-pulse";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggle(idx)}
              className={`aspect-square rounded-lg border-2 transition-all duration-200 ${cellStyle}`}
              disabled={phase !== "recreate"}
              aria-label={`Cell ${idx + 1}`}
            />
          );
        })}
      </div>

      {phase === "recreate" && (
        <button
          onClick={checkAnswer}
          className="px-6 py-3 rounded-xl bg-sun text-ink font-extrabold text-base hover:opacity-90 transition shadow active:scale-95"
        >
          ✓ Submit Pattern
        </button>
      )}
    </div>
  );
}
