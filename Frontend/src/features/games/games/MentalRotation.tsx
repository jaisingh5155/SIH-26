import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

// Simple SVG shape generation for mental rotation
type Shape = { points: string; mirrored: boolean; rotation: number };

const POLYGON_SETS = [
  "50,15 85,85 15,85", // triangle
  "50,15 85,50 50,85 15,50", // diamond
  "25,25 75,25 75,75 25,75", // square
  "50,15 80,35 70,80 30,80 20,35", // pentagon
  "30,15 70,15 85,50 70,85 30,85 15,50", // hexagon
];

const generateShape = (level: number): Shape => {
  const basePoints =
    POLYGON_SETS[Math.floor(Math.random() * Math.min(level + 1, POLYGON_SETS.length))]!;
  const rotation = Math.floor(Math.random() * 360);
  const mirrored = Math.random() > 0.5;
  return { points: basePoints, mirrored, rotation };
};

export default function MentalRotation({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "mental-rotation",
  });
  const activeLevel = dda.level;

  const [shape, setShape] = useState<Shape>(() => generateShape(activeLevel));
  const [displayRotation, setDisplayRotation] = useState(() => Math.floor(Math.random() * 360));
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const trialStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(activeLevel * 1.2));
  const { submitResult } = useGameSession();

  const rollNewProblem = (lvl = dda.level) => {
    const s = generateShape(lvl);
    setShape(s);
    // Simple snap angles at lower levels
    const rot = lvl <= 2
      ? [90, 180, 270][Math.floor(Math.random() * 3)]!
      : Math.floor(Math.random() * 360);
    setDisplayRotation(rot);
    setFeedback(null);
    trialStart.current = Date.now();
  };

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    rollNewProblem(propLevel);
  }, [propLevel]);

  const answer = (userSaysMirrored: boolean) => {
    if (completed) return;
    const correct = userSaysMirrored === shape.mirrored;
    const trialDuration = Math.max(0.5, (Date.now() - trialStart.current) / 1000);

    dda.recordTrial(correct, trialDuration);

    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      setFeedback({
        text: `✓ Right! The shape is indeed ${shape.mirrored ? "MIRRORED" : "THE SAME (ROTATED)"}!`,
        isCorrect: true,
      });

      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "mental-rotation",
            gameType: "mental_rotation",
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
        }, 600);
        return;
      }
      setTimeout(() => rollNewProblem(dda.level), 900);
    } else {
      setFeedback({
        text: `✗ Wrong! It was actually ${shape.mirrored ? "MIRRORED" : "THE SAME (ROTATED)"}.`,
        isCorrect: false,
      });
      setTimeout(() => rollNewProblem(dda.level), 1500);
    }
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
          gameName="Mental Rotation"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
            rollNewProblem(dda.level);
          }}
        />
      </>
    );

  return (
    <div className="space-y-6 text-center max-w-lg mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3 border-b border-clay/40">
        <AdaptivePacingBadge
          isAdaptiveActive={dda.isAdaptiveActive}
          onToggle={dda.toggleAdaptive}
          adjustment={dda.adjustment}
        />

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full border border-sun/40 bg-sun/10 text-sun font-bold text-xs sm:text-sm">
            Level {activeLevel}
          </span>
          <p className="text-xs sm:text-sm font-bold text-cream/70">
            Score: <span className="text-sun font-extrabold text-base">{score}</span> / {target}
          </p>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Step Hint: The rotation angle is simplified to regular intervals to ease visual rotation.
        </div>
      )}

      {/* Prominent Right/Wrong Feedback */}
      {feedback && (
        <div
          className={`py-2 px-4 rounded-xl font-bold text-center text-sm shadow-md transition-all ${
            feedback.isCorrect
              ? "bg-tea-confirm/20 border-2 border-tea-confirm text-tea-confirm"
              : "bg-fire/20 border-2 border-fire text-fire"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <p className="text-cream/70 text-sm font-medium">
        Is the comparison shape identical (just rotated) or is it a mirror-flipped reflection?
      </p>

      <div className="flex items-center justify-center gap-6 sm:gap-10 p-4 rounded-2xl bg-ink/50 border border-clay/40">
        {/* Reference shape */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-sun font-black uppercase tracking-wider">Reference</p>
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            className="rounded-2xl border-2 border-sun/40 bg-ink shadow-card"
          >
            <polygon
              points={shape.points}
              fill="#e9c46a"
              stroke="#e9c46a"
              strokeWidth="2.5"
              opacity="0.9"
            />
          </svg>
        </div>

        <span className="text-2xl font-black text-cream/40">vs</span>

        {/* Rotated/mirrored shape */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-tea-confirm font-black uppercase tracking-wider">Compare</p>
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            className="rounded-2xl border-2 border-clay bg-ink shadow-card"
          >
            <g
              transform={`rotate(${displayRotation}, 50, 50) ${shape.mirrored ? "scale(-1,1) translate(-100,0)" : ""}`}
            >
              <polygon
                points={shape.points}
                fill="#52b788"
                stroke="#52b788"
                strokeWidth="2.5"
                opacity="0.9"
              />
            </g>
          </svg>
        </div>
      </div>

      <div className="flex gap-4 justify-center pt-2">
        <button
          onClick={() => answer(false)}
          className="px-6 py-3.5 rounded-xl bg-tea-confirm text-cream font-black text-base hover:opacity-90 transition shadow-lg flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Same (Rotated)</span>
        </button>
        <button
          onClick={() => answer(true)}
          className="px-6 py-3.5 rounded-xl bg-fire text-cream font-black text-base hover:opacity-90 transition shadow-lg flex items-center gap-2"
        >
          <span>🪞</span>
          <span>Mirrored / Flipped</span>
        </button>
      </div>
    </div>
  );
}

