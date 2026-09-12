import { useCallback, useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

type Tube = string[];
type LevelConfig = { colors: string[]; tubesCount: number; ballsPerTube: number };

const getLevelConfig = (l: number): LevelConfig => {
  switch (l) {
    case 1:
      return { colors: ["red", "blue"], tubesCount: 3, ballsPerTube: 3 };
    case 2:
      return { colors: ["red", "blue", "green"], tubesCount: 4, ballsPerTube: 3 };
    case 3:
      return { colors: ["red", "blue", "green"], tubesCount: 5, ballsPerTube: 3 };
    case 4:
      return { colors: ["red", "blue", "green", "yellow"], tubesCount: 5, ballsPerTube: 4 };
    case 5:
      return { colors: ["red", "blue", "green", "yellow"], tubesCount: 6, ballsPerTube: 4 };
    case 6:
      return {
        colors: ["red", "blue", "green", "yellow", "purple"],
        tubesCount: 6,
        ballsPerTube: 4,
      };
    default:
      return {
        colors: ["red", "blue", "green", "yellow", "purple"],
        tubesCount: 7,
        ballsPerTube: 4,
      };
  }
};

const COLOR_MAP: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
};

const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
};

const generateTubes = (cfg: LevelConfig): Tube[] => {
  const balls = shuffle(cfg.colors.flatMap((c) => Array(cfg.ballsPerTube).fill(c)));
  const tubes: Tube[] = cfg.colors.map((_, i) =>
    balls.slice(i * cfg.ballsPerTube, (i + 1) * cfg.ballsPerTube),
  );
  for (let i = cfg.colors.length; i < cfg.tubesCount; i++) tubes.push([]);
  return tubes;
};

const isSolved = (tubes: Tube[], cfg: LevelConfig) =>
  tubes.every(
    (t) => t.length === 0 || (t.length === cfg.ballsPerTube && t.every((b) => b === t[0])),
  );

export default function BallSort({ level: propLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel: propLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 30,
    gameId: "ball-sort",
  });
  const [boardLevel, setBoardLevel] = useState(propLevel);
  useEffect(() => {
    setBoardLevel(propLevel);
  }, [propLevel]);

  const cfg = useMemo(() => getLevelConfig(boardLevel), [boardLevel]);
  const [tubes, setTubes] = useState<Tube[]>(() => generateTubes(cfg));
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [won, setWon] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const moveStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  const reset = useCallback((lvl = boardLevel) => {
    setBoardLevel(lvl);
    const newCfg = getLevelConfig(lvl);
    setTubes(generateTubes(newCfg));
    setSelected(null);
    setMoves(0);
    setFeedback(null);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    moveStart.current = Date.now();
  }, [boardLevel]);

  useEffect(() => {
    reset(propLevel);
  }, [propLevel, reset]);

  const handleTubeClick = (idx: number) => {
    if (won) return;
    if (selected === null) {
      if (tubes[idx]!.length === 0) {
        setFeedback({ text: `✗ Tube ${idx + 1} is empty! Select a tube with balls.`, isCorrect: false });
        setTimeout(() => setFeedback(null), 1200);
        return;
      }
      setSelected(idx);
      const top = tubes[idx]![tubes[idx]!.length - 1];
      setFeedback({ text: `Selected top ${top?.toUpperCase()} ball from Tube ${idx + 1}.`, isCorrect: true });
      return;
    }
    if (selected === idx) {
      setSelected(null);
      setFeedback(null);
      return;
    }

    const src = tubes[selected]!;
    const dst = tubes[idx]!;
    const topBall = src[src.length - 1];
    const dstTop = dst[dst.length - 1];
    const trialDuration = Math.max(0.5, (Date.now() - moveStart.current) / 1000);
    moveStart.current = Date.now();

    if (dst.length >= cfg.ballsPerTube) {
      dda.recordTrial(false, trialDuration);
      setFeedback({ text: `✗ Tube ${idx + 1} is full (max ${cfg.ballsPerTube} balls)!`, isCorrect: false });
      setSelected(null);
      setTimeout(() => setFeedback(null), 1400);
      return;
    }
    if (dstTop !== undefined && dstTop !== topBall) {
      dda.recordTrial(false, trialDuration);
      setFeedback({
        text: `✗ Wrong color! Cannot place ${topBall?.toUpperCase()} onto ${dstTop?.toUpperCase()} ball.`,
        isCorrect: false,
      });
      setSelected(null);
      setTimeout(() => setFeedback(null), 1500);
      return;
    }

    dda.recordTrial(true, trialDuration);
    setTubes((prev) => {
      const next = prev.map((t) => [...t]);
      const ball = next[selected]!.pop()!;
      next[idx]!.push(ball);
      return next;
    });
    setMoves((m) => m + 1);
    setFeedback({ text: `✓ Right! Moved ${topBall?.toUpperCase()} ball into Tube ${idx + 1}.`, isCorrect: true });
    setSelected(null);
    setTimeout(() => setFeedback(null), 1200);
  };

  useEffect(() => {
    if (!won && isSolved(tubes, cfg)) {
      setWon(true);
      setFeedback({ text: "✓ Solved! All colors sorted successfully!", isCorrect: true });
      if (!saved.current) {
        saved.current = true;
        const score = Math.max(30, Math.min(100, 100 - moves + cfg.colors.length * 6));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "ball-sort",
            gameType: "ball_sort",
            score,
            accuracy: 100,
            durationSeconds: Math.max(5, dur),
            level: activeLevel,
            difficulty: String(activeLevel),
          }).then((r) => {
            setSynced(r.success);
            setOffline(r.offline);
          });
        }, 700);
      }
    }
  }, [tubes, won, moves, cfg, activeLevel]);

  if (won)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.max(30, Math.min(100, 100 - moves + cfg.colors.length * 6))}
          accuracy={100}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={boardLevel}
          gameName="Ball Sort"
          synced={synced}
          offline={offline}
          onPlayAgain={() => reset(dda.level)}
        />
      </>
    );

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
            Level {boardLevel}
          </span>
          <div className="flex gap-4 text-xs sm:text-sm font-bold text-cream/70">
            <span>Moves: <span className="text-sun font-black text-base">{moves}</span></span>
            <span>Colors: {cfg.colors.length}</span>
          </div>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Step Hint: Use the empty tubes as buffers to unblock lower balls!
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

      <p className="text-xs text-cream/50 text-center">
        Sort balls so each tube contains balls of only one color.
      </p>

      <div className="flex gap-3 flex-wrap justify-center p-3 rounded-2xl bg-ink/50 border border-clay/40">
        {tubes.map((tube, idx) => {
          const isSelected = selected === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleTubeClick(idx)}
              className={`flex flex-col-reverse items-center justify-start gap-1.5 w-16 min-h-[170px] rounded-b-2xl border-4 p-2 transition-all shadow-md
                ${isSelected ? "border-sun ring-4 ring-sun/40 bg-sun/10 scale-105" : "border-clay/70 bg-ink/70 hover:border-sun/60"}`}
              aria-label={`Tube ${idx + 1}${isSelected ? " (selected)" : ""}`}
            >
              {tube.map((ball, bi) => (
                <div
                  key={bi}
                  className={`w-10 h-10 rounded-full shadow-lg ${COLOR_MAP[ball] ?? "bg-clay"} border-2 border-white/30 transform transition`}
                />
              ))}
              <span className="text-[10px] text-cream/30 font-bold mb-auto">{idx + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pt-1">
        <button
          onClick={reset}
          className="px-5 py-2 rounded-xl border border-clay text-cream/70 text-sm hover:bg-clay transition"
        >
          🔄 Restart Puzzle
        </button>
      </div>
    </div>
  );
}

