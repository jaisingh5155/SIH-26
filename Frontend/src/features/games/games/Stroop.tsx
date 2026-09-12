import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

export type StroopProps = { level: number };

const ALL_COLORS = ["Red", "Blue", "Green", "Yellow"];

const COLOR_HEX: Record<string, string> = {
  red: "#e63946",
  blue: "#457b9d",
  green: "#52b788",
  yellow: "#e9c46a",
};
const BTN_STYLE: Record<string, string> = {
  Red: "bg-red-500 hover:bg-red-600",
  Blue: "bg-blue-500 hover:bg-blue-600",
  Green: "bg-green-500 hover:bg-green-600",
  Yellow: "bg-yellow-400 hover:bg-yellow-500",
};

export default function Stroop({ level: propLevel }: StroopProps) {
  const dda = useAdaptiveDifficulty({
    initialLevel: propLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 4,
    gameId: "stroop",
  });
  const activeLevel = dda.level;

  const [word, setWord] = useState({ text: "RED", color: "red" });
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const startTime = useRef(Date.now());
  const trialStartTime = useRef(Date.now());
  const target = Math.max(3, activeLevel * 2);
  const { submitResult } = useGameSession();

  const baseSpeed =
    activeLevel <= 1
      ? 3200
      : activeLevel <= 3
        ? 2400
        : activeLevel <= 5
          ? 1800
          : activeLevel <= 7
            ? 1200
            : 800;
  const speed = Math.round(baseSpeed * dda.timerMultiplier);

  useEffect(() => {
    setCompleted(false);
    setScore(0);
    setFeedback(null);
    saved.current = false;
    startTime.current = Date.now();
    trialStartTime.current = Date.now();
  }, [propLevel]);

  useEffect(() => {
    const t = setInterval(() => {
      const color = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]!.toLowerCase();
      const text = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]!.toUpperCase();
      setWord({ text, color });
      trialStartTime.current = Date.now();
    }, speed);
    return () => clearInterval(t);
  }, [speed]);

  const press = (color: string) => {
    const trialSecs = Math.round((Date.now() - trialStartTime.current) / 1000);

    if (color.toLowerCase() === word.color) {
      dda.recordTrial(true, trialSecs);
      setScore((s) => {
        const next = s + 1;
        if (!saved.current && next >= target) {
          saved.current = true;
          const acc = Math.min(100, Math.round((next / target) * 100));
          const dur = Math.round((Date.now() - startTime.current) / 1000);
          submitResult({
            gameId: "stroop",
            gameType: "stroop",
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
        }
        return next;
      });
      setFeedback("✓ Correct!");
    } else {
      dda.recordTrial(false, trialSecs);
      setFeedback("Focus on the ink color, not the word.");
    }
    setTimeout(() => setFeedback(null), 900);
  };

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - startTime.current) / 1000)}
          level={activeLevel}
          gameName="Stroop Test"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            saved.current = false;
            setScore(0);
            setSynced(false);
            setOffline(false);
            startTime.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-6">
      {/* Top Controls: Adaptive Pacing Badge + Level & Score */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-clay/40">
        <AdaptivePacingBadge
          isAdaptiveActive={dda.isAdaptiveActive}
          onToggle={dda.toggleAdaptive}
          adjustment={dda.adjustment}
        />

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full border border-sun/40 bg-sun/10 text-sun font-bold text-xs sm:text-sm">
            Level {activeLevel}
          </span>
          <p className="text-cream/70 text-xs sm:text-sm font-bold">
            Score: <span className="text-sun font-extrabold text-base">{score}</span> / {target}
          </p>
          <div className="text-cream/80 text-xs sm:text-sm font-bold border-l border-clay/40 pl-3">
            Speed: <span className="text-sun">{(speed / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Gentle Assistance Cue */}
      {dda.showAssistanceCue && (
        <div className="px-4 py-2 rounded-xl bg-sun/10 border border-sun/40 text-sun text-xs font-bold text-center animate-pulse">
          💡 Adaptive Assistance: Name the ink color you see, not the word you read! Target: {word.color.toUpperCase()}
        </div>
      )}

      <div className="text-center">
        <p className="text-cream/60 text-sm mb-4">
          Click the COLOR of the ink — ignore what the word says!
        </p>
        <div className="mx-auto rounded-2xl border-4 border-clay bg-ink p-8 inline-block shadow-card">
          <span
            className="font-display text-6xl sm:text-7xl font-black"
            style={{ color: COLOR_HEX[word.color] ?? "#fff" }}
          >
            {word.text}
          </span>
        </div>
        <div className="mt-3 text-cream/60 text-sm font-semibold">
          Score: <span className="text-sun font-bold text-xl">{score}</span> / {target}
        </div>
        {feedback && (
          <p
            className={`mt-2 text-sm font-semibold ${feedback.startsWith("✓") ? "text-tea-confirm" : "text-fire"}`}
          >
            {feedback}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {ALL_COLORS.map((c) => {
          const isTarget = dda.showAssistanceCue && c.toLowerCase() === word.color;
          return (
            <button
              key={c}
              onClick={() => press(c)}
              className={`px-6 py-3 rounded-xl text-white text-lg font-extrabold shadow transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                BTN_STYLE[c]
              } ${isTarget ? "ring-4 ring-sun ring-offset-2 ring-offset-background scale-105" : ""}`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
