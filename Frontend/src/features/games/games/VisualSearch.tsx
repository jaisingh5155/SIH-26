import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

type Shape = "circle" | "square" | "triangle";
type Item = { shape: Shape; color: string; isTarget: boolean; found: boolean };

const COLORS = ["#e9c46a", "#e63946", "#52b788", "#457b9d", "#f4a261", "#a8dadc", "#6a4c93"];
const SHAPES: Shape[] = ["circle", "square", "triangle"];

const ShapeSVG = ({ shape, color, size = 40 }: { shape: Shape; color: string; size?: number }) => {
  if (shape === "circle")
    return <circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill={color} />;
  if (shape === "square")
    return <rect x="2" y="2" width={size - 4} height={size - 4} rx="3" fill={color} />;
  return <polygon points={`${size / 2},2 ${size - 2},${size - 2} 2,${size - 2}`} fill={color} />;
};

const generateProblem = (level: number): { items: Item[]; target: Shape } => {
  const count = Math.min(8 + level * 2, 24);
  const target = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
  const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)]!;
  const items: Item[] = [];
  const targetCount = Math.floor(Math.random() * Math.min(4, level + 1)) + 1;
  for (let i = 0; i < targetCount; i++)
    items.push({ shape: target, color: targetColor, isTarget: true, found: false });
  for (let i = targetCount; i < count; i++) {
    let s: Shape;
    do {
      s = SHAPES[Math.floor(Math.random() * SHAPES.length)]!;
    } while (s === target);
    items.push({
      shape: s,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      isTarget: false,
      found: false,
    });
  }
  return { items: items.sort(() => Math.random() - 0.5), target };
};

export default function VisualSearch({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "visual-search",
  });
  const activeLevel = dda.level;

  const [{ items, target }, setProblem] = useState(() => generateProblem(activeLevel));
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrongClicks, setWrongClicks] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const clickStart = useRef(Date.now());
  const targetCount = items.filter((i) => i.isTarget).length;
  const gameTarget = Math.max(3, Math.ceil(activeLevel / 2));
  const { submitResult } = useGameSession();

  useEffect(() => {
    const p = generateProblem(propLevel);
    setProblem(p);
    setFound(new Set());
    setWrongClicks(0);
    setScore(0);
    setFeedback(null);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    clickStart.current = Date.now();
  }, [propLevel]);

  const handleClick = (idx: number) => {
    if (found.has(idx) || completed) return;
    const trialDuration = Math.max(0.5, (Date.now() - clickStart.current) / 1000);
    clickStart.current = Date.now();

    if (items[idx]!.isTarget) {
      dda.recordTrial(true, trialDuration);
      const newFound = new Set(found);
      newFound.add(idx);
      setFound(newFound);
      setFeedback({ text: `✓ Right! Found a target ${target.toUpperCase()}!`, isCorrect: true });

      if (newFound.size === targetCount) {
        const newScore = score + 1;
        setScore(newScore);
        const acc = Math.max(
          20,
          Math.min(100, Math.round((100 * targetCount) / Math.max(1, targetCount + wrongClicks))),
        );
        if (newScore >= gameTarget && !saved.current) {
          saved.current = true;
          const dur = Math.round((Date.now() - sessionStart.current) / 1000);
          setTimeout(() => {
            submitResult({
              gameId: "visual-search",
              gameType: "visual_search",
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
            const p = generateProblem(dda.level);
            setProblem(p);
            setFound(new Set());
            setWrongClicks(0);
            setFeedback(null);
            clickStart.current = Date.now();
          }, 700);
        }
      }
    } else {
      dda.recordTrial(false, trialDuration);
      setWrongClicks((w) => w + 1);
      setFeedback({ text: `✗ That is not a target ${target.toUpperCase()}! Look closely.`, isCorrect: false });
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / gameTarget) * 100))}
          accuracy={Math.max(20, Math.min(100, Math.round((100 * targetCount) / Math.max(1, targetCount + wrongClicks))))}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={activeLevel}
          gameName="Visual Search"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
            const p = generateProblem(dda.level);
            setProblem(p);
            setFound(new Set());
            setWrongClicks(0);
            clickStart.current = Date.now();
          }}
        />
      </>
    );

  const size = 44;
  return (
    <div className="space-y-4 max-w-lg mx-auto">
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
            Score: <span className="text-sun font-extrabold text-base">{score}</span> / {gameTarget}
          </p>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Assistance Active: Look for matching shape outlines indicated by subtle rings.
        </div>
      )}

      {/* Prominent Right/Wrong Banner */}
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

      <div className="flex items-center justify-between p-3 rounded-2xl bg-ink/70 border border-clay/60">
        <div className="flex items-center gap-3">
          <p className="text-sm text-cream font-bold">Target to Find:</p>
          <div className="p-1 rounded-xl bg-sun/20 border-2 border-sun">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <ShapeSVG shape={target} color="#e9c46a" size={size} />
            </svg>
          </div>
        </div>
        <p className="text-base text-cream/80 font-bold">
          Found: <span className="text-sun text-xl">{found.size}</span> / {targetCount}
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl border border-clay/50 bg-ink/50 justify-center">
        {items.map((item, idx) => {
          const isFound = found.has(idx);
          const isAssisted = item.isTarget && !isFound && dda.showAssistanceCue;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleClick(idx)}
              disabled={isFound || completed}
              className={`p-1.5 rounded-xl border-2 transition-all flex items-center justify-center ${
                isFound
                  ? "border-tea-confirm/50 bg-tea-confirm/20 opacity-40 cursor-default"
                  : isAssisted
                    ? "border-sun ring-4 ring-sun/40 scale-105 bg-sun/10"
                    : "border-clay/60 bg-ink/70 hover:border-sun hover:scale-110 active:scale-95"
              }`}
            >
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <ShapeSVG shape={item.shape} color={item.color} size={size} />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

