import { useCallback, useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

// Trail Making: connect circles in order (numbers, or alternating number-letter)
type Circle = { label: string; x: number; y: number; done: boolean };

const generateCircles = (level: number): Circle[] => {
  const useLetters = level >= 4;
  const count = Math.min(5 + level, 14);
  const circles: Circle[] = [];
  const letters = "ABCDEFGHIJ".split("");
  for (let i = 0; i < count; i++) {
    const label = useLetters
      ? i % 2 === 0
        ? String(Math.floor(i / 2) + 1)
        : letters[Math.floor(i / 2)]!
      : String(i + 1);
    circles.push({ label, x: 12 + Math.random() * 76, y: 12 + Math.random() * 76, done: false });
  }
  return circles;
};

export default function TrailMaking({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 20,
    gameId: "trail-making",
  });
  const [boardLevel, setBoardLevel] = useState(propLevel);
  useEffect(() => {
    setBoardLevel(propLevel);
  }, [propLevel]);

  const [circles, setCircles] = useState<Circle[]>(() => generateCircles(boardLevel));
  const [nextIdx, setNextIdx] = useState(0);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [won, setWon] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const clickStart = useRef(Date.now());
  const svgRef = useRef<SVGSVGElement>(null);
  const { submitResult } = useGameSession();

  const reset = useCallback((lvl = boardLevel) => {
    setBoardLevel(lvl);
    setCircles(generateCircles(lvl));
    setNextIdx(0);
    setErrors(0);
    setFeedback(null);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    clickStart.current = Date.now();
  }, [boardLevel]);

  useEffect(() => {
    reset(propLevel);
  }, [propLevel, reset]);

  const handleClick = (idx: number) => {
    if (won || circles[idx]?.done) return;
    const trialDuration = Math.max(0.5, (Date.now() - clickStart.current) / 1000);
    clickStart.current = Date.now();

    if (idx === nextIdx) {
      dda.recordTrial(true, trialDuration);
      setCircles((prev) => prev.map((c, i) => (i === idx ? { ...c, done: true } : c)));
      const newNext = nextIdx + 1;
      setNextIdx(newNext);
      setFeedback({ text: `✓ Right! Connected ${circles[idx]?.label}!`, isCorrect: true });

      if (newNext >= circles.length && !saved.current) {
        saved.current = true;
        const acc = Math.max(
          20,
          Math.min(
            100,
            Math.round((100 * circles.length) / Math.max(circles.length, circles.length + errors)),
          ),
        );
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "trail-making",
            gameType: "trail_making",
            score: acc,
            accuracy: acc,
            durationSeconds: Math.max(5, dur),
            level: activeLevel,
            difficulty: String(activeLevel),
          }).then((r) => {
            setSynced(r.success);
            setOffline(r.offline);
            setWon(true);
          });
        }, 600);
      }
    } else {
      dda.recordTrial(false, trialDuration);
      setErrors((e) => e + 1);
      setFeedback({
        text: `✗ Wrong circle! You clicked "${circles[idx]?.label}", next is "${circles[nextIdx]?.label}"!`,
        isCorrect: false,
      });
      setTimeout(() => setFeedback(null), 1400);
    }
  };

  if (won)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.max(
            20,
            Math.min(
              100,
              Math.round(
                (100 * circles.length) / Math.max(circles.length, circles.length + errors),
              ),
            ),
          )}
          accuracy={Math.max(
            20,
            Math.min(
              100,
              Math.round(
                (100 * circles.length) / Math.max(circles.length, circles.length + errors),
              ),
            ),
          )}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={boardLevel}
          gameName="Trail Making"
          synced={synced}
          offline={offline}
          onPlayAgain={() => reset(dda.level)}
        />
      </>
    );

  const doneCircles = circles.filter((c) => c.done);

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3 border-b border-clay/40">
        <AdaptivePacingBadge
          isAdaptiveActive={dda.isAdaptiveActive}
          onToggle={dda.toggleAdaptive}
          adjustment={dda.adjustment}
        />

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full border border-sun/40 bg-sun/10 text-sun font-bold text-xs sm:text-sm">
            Level {boardLevel}
          </span>
          <div className="flex gap-3 text-xs sm:text-sm font-bold text-cream/70">
            <span>
              Next: <span className="text-sun font-black text-base">{circles[nextIdx]?.label ?? "—"}</span>
            </span>
            <span>
              Progress: <span className="text-tea-confirm">{nextIdx}/{circles.length}</span>
            </span>
            <span>Errors: <span className="text-fire">{errors}</span></span>
          </div>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Assistance Active: Target circle "{circles[nextIdx]?.label}" is highlighted with a pulse.
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

      <p className="text-xs text-cream/50 text-center">
        Connect circles in sequence: <strong>{circles.map((c) => c.label).join(" → ")}</strong>
      </p>

      <div className="relative w-full aspect-square max-w-sm mx-auto rounded-3xl border-2 border-clay/60 bg-ink/50 shadow-card overflow-hidden">
        <svg ref={svgRef} viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          {/* Trail lines */}
          {doneCircles.map((c, i) => {
            const next = doneCircles[i + 1];
            if (!next) return null;
            return (
              <line
                key={i}
                x1={c.x}
                y1={c.y}
                x2={next.x}
                y2={next.y}
                stroke="#52b788"
                strokeWidth="1.2"
                strokeDasharray="1 1"
                opacity="0.8"
              />
            );
          })}
          {/* Circles */}
          {circles.map((c, idx) => {
            const isTarget = idx === nextIdx;
            const isAssisted = isTarget && dda.showAssistanceCue;
            return (
              <g key={idx} onClick={() => handleClick(idx)} className="cursor-pointer">
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isAssisted ? "6.5" : "5.5"}
                  fill={c.done ? "#52b788" : isTarget ? "#e9c46a" : "#2a2a3e"}
                  stroke={c.done ? "#2d6a4f" : isTarget ? "#ffffff" : "#6b7280"}
                  strokeWidth={isTarget ? "1.2" : "0.8"}
                  className={isAssisted ? "animate-pulse" : ""}
                />
                <text
                  x={c.x}
                  y={c.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="3.8"
                  fill={c.done ? "#0a1910" : isTarget ? "#1a1a2e" : "#f5f0e8"}
                  fontWeight="bold"
                >
                  {c.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-center">
        <button
          onClick={reset}
          className="px-5 py-2 rounded-xl border border-clay text-cream/70 text-sm hover:bg-clay transition"
        >
          🔄 Restart Trail
        </button>
      </div>
    </div>
  );
}

