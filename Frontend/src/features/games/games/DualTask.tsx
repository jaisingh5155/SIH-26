import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

import type { ReactNode } from "react";

const SHAPES = ["circle", "square", "triangle", "star", "diamond"] as const;
type Shape = (typeof SHAPES)[number];
const SHAPE_SVG: Record<Shape, (color: string) => ReactNode> = {
  circle: (c) => <circle cx="20" cy="20" r="16" fill={c} />,
  square: (c) => <rect x="4" y="4" width="32" height="32" rx="4" fill={c} />,
  triangle: (c) => <polygon points="20,4 36,36 4,36" fill={c} />,
  star: (c) => (
    <polygon points="20,4 23,16 36,16 26,24 29,36 20,28 11,36 14,24 4,16 17,16" fill={c} />
  ),
  diamond: (c) => <polygon points="20,4 36,20 20,36 4,20" fill={c} />,
};

const COLORS = ["#e9c46a", "#e63946", "#52b788", "#457b9d", "#f4a261"];

type DualTaskProblem = {
  targetShape: Shape;
  shapeCount: number;
  shapes: Array<{ shape: Shape; color: string }>;
  math: string;
  mathAnswer: number;
};

const generateProblem = (level: number): DualTaskProblem => {
  const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
  const itemCount = Math.min(6 + level, 14);
  const targetCount = Math.floor(Math.random() * 4) + 1;
  const items: Array<{ shape: Shape; color: string }> = [];
  for (let i = 0; i < targetCount; i++)
    items.push({ shape: targetShape, color: COLORS[Math.floor(Math.random() * COLORS.length)]! });
  for (let i = targetCount; i < itemCount; i++) {
    let s: Shape;
    do {
      s = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
    } while (s === targetShape);
    items.push({ shape: s, color: COLORS[Math.floor(Math.random() * COLORS.length)]! });
  }
  items.sort(() => Math.random() - 0.5);
  const a = Math.floor(Math.random() * (4 * level)) + 2,
    b = Math.floor(Math.random() * 8) + 1;
  const ops = level <= 3 ? ["+", "-"] : ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)]!;
  const mathAnswer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return {
    targetShape,
    shapeCount: targetCount,
    shapes: items,
    math: `${a} ${op} ${b}`,
    mathAnswer,
  };
};

export default function DualTask({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 20,
    gameId: "dual-task",
  });
  const activeLevel = dda.level;

  const [problem, setProblem] = useState<DualTaskProblem>(() => generateProblem(activeLevel));
  const [shapeInput, setShapeInput] = useState("");
  const [mathInput, setMathInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const trialStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(activeLevel / 2));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setProblem(generateProblem(propLevel));
    setScore(0);
    setFeedback(null);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    trialStart.current = Date.now();
  }, [propLevel]);

  const submit = () => {
    if (completed) return;
    const trialDuration = Math.max(1, (Date.now() - trialStart.current) / 1000);
    const shapeOk = parseInt(shapeInput.trim(), 10) === problem.shapeCount;
    const mathOk = parseInt(mathInput.trim(), 10) === problem.mathAnswer;
    const bothOk = shapeOk && mathOk;

    dda.recordTrial(bothOk, trialDuration);

    if (bothOk) {
      const newScore = score + 1;
      setScore(newScore);
      setFeedback({ text: "✓ Right! Both tasks answered correctly!", isCorrect: true });
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "dual-task",
            gameType: "dual_task",
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
      } else {
        setTimeout(() => {
          setProblem(generateProblem(dda.level));
          setShapeInput("");
          setMathInput("");
          setFeedback(null);
          trialStart.current = Date.now();
        }, 1000);
      }
    } else {
      let errText = "✗ Mistakes: ";
      if (!shapeOk && !mathOk) errText += `Count was ${problem.shapeCount}, Math was ${problem.mathAnswer}`;
      else if (!shapeOk) errText += `Count was ${problem.shapeCount} (you entered ${shapeInput || "empty"})`;
      else errText += `Math answer was ${problem.mathAnswer} (you entered ${mathInput || "empty"})`;

      setFeedback({ text: errText, isCorrect: false });
      setTimeout(() => setFeedback(null), 1600);
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
          gameName="Dual Task"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
            setProblem(generateProblem(dda.level));
            setShapeInput("");
            setMathInput("");
            trialStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-5 max-w-lg mx-auto">
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
          <p className="text-xs sm:text-sm text-cream/70 font-bold">
            Score: <span className="text-sun font-extrabold text-base">{score}</span> / {target}
          </p>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Assistance Active: Target shapes are softly illuminated to ease cognitive load.
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

      {/* Task 1: Shapes area */}
      <div className="rounded-2xl border border-clay/60 bg-ink/60 p-4">
        <p className="text-xs text-cream/70 mb-2 font-bold">
          Task 1: Count the <span className="text-sun uppercase font-black">{problem.targetShape}s</span>:
        </p>
        <div className="flex flex-wrap gap-2.5 justify-center">
          {problem.shapes.map((item, i) => {
            const isTarget = item.shape === problem.targetShape;
            const isAssisted = isTarget && dda.showAssistanceCue;
            return (
              <div
                key={i}
                className={`p-1 rounded-xl transition-all ${
                  isAssisted ? "ring-2 ring-sun/80 bg-sun/15 scale-105" : ""
                }`}
              >
                <svg width="40" height="40" viewBox="0 0 40 40">
                  {SHAPE_SVG[item.shape](item.color)}
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task 2: Math area */}
      <div className="rounded-2xl border border-clay/60 bg-ink/60 p-4 text-center">
        <p className="text-xs text-cream/70 mb-2 font-bold">Task 2: Solve the arithmetic:</p>
        <span className="font-display text-4xl font-black text-fire">{problem.math} = ?</span>
      </div>

      {/* Dual Inputs */}
      <div className="flex gap-4 flex-wrap justify-center items-end pt-1">
        <div className="flex flex-col items-center gap-1.5">
          <label className="text-xs text-sun font-bold uppercase tracking-wider">Shape Count</label>
          <input
            type="number"
            value={shapeInput}
            onChange={(e) => setShapeInput(e.target.value)}
            className="w-24 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl py-2.5 focus:border-sun focus:outline-none"
            placeholder="Count"
          />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <label className="text-xs text-fire font-bold uppercase tracking-wider">Math Answer</label>
          <input
            type="number"
            value={mathInput}
            onChange={(e) => setMathInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className="w-24 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl py-2.5 focus:border-sun focus:outline-none"
            placeholder="Result"
          />
        </div>
        <div>
          <button
            onClick={submit}
            className="px-6 py-3 rounded-xl bg-sun text-ink font-black hover:opacity-90 transition shadow-lg text-lg"
          >
            ✓ Submit Both
          </button>
        </div>
      </div>
    </div>
  );
}

