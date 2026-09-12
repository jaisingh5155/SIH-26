import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

const disksForLevel = (l: number) => (l <= 3 ? 3 : l <= 6 ? 4 : 5);

const DISK_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-400",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
];

export default function TowerOfHanoi({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 30,
    gameId: "tower-of-hanoi",
  });
  const [boardLevel, setBoardLevel] = useState(propLevel);
  useEffect(() => {
    setBoardLevel(propLevel);
  }, [propLevel]);

  const diskCount = useMemo(() => disksForLevel(boardLevel), [boardLevel]);
  const optimalMoves = Math.pow(2, diskCount) - 1;

  const initialRods: number[][] = useMemo(() => {
    return [Array.from({ length: diskCount }, (_, i) => diskCount - i), [], []];
  }, [diskCount]);

  const [rods, setRods] = useState<number[][]>(initialRods);
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
    const count = disksForLevel(lvl);
    setRods([Array.from({ length: count }, (_, i) => count - i), [], []]);
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

  const handleRodClick = (idx: number) => {
    if (won) return;
    if (selected === null) {
      if (rods[idx]?.length === 0) {
        setFeedback({ text: `✗ Tower ${idx + 1} has no disks to select!`, isCorrect: false });
        setTimeout(() => setFeedback(null), 1200);
        return;
      }
      setSelected(idx);
      setFeedback({ text: `Selected top disk on Tower ${idx + 1}. Now choose destination tower!`, isCorrect: true });
      return;
    }
    if (selected === idx) {
      setSelected(null);
      setFeedback(null);
      return;
    }

    const src = rods[selected]!;
    const dst = rods[idx]!;
    const disk = src[src.length - 1];
    const dstTop = dst[dst.length - 1];
    const trialDuration = Math.max(0.5, (Date.now() - moveStart.current) / 1000);
    moveStart.current = Date.now();

    if (disk === undefined || (dstTop !== undefined && disk > dstTop)) {
      dda.recordTrial(false, trialDuration);
      setFeedback({
        text: `✗ Wrong move! Cannot place larger disk ${disk} onto smaller disk ${dstTop}!`,
        isCorrect: false,
      });
      setSelected(null);
      setTimeout(() => setFeedback(null), 1600);
      return;
    }

    dda.recordTrial(true, trialDuration);
    setRods((prev) => {
      const copy = prev.map((r) => [...r]);
      const d = copy[selected]!.pop()!;
      copy[idx]!.push(d);
      return copy;
    });
    setMoves((m) => m + 1);
    setFeedback({ text: `✓ Right! Disk ${disk} moved to Tower ${idx + 1}.`, isCorrect: true });
    setSelected(null);
    setTimeout(() => setFeedback(null), 1400);
  };

  useEffect(() => {
    if (rods[2]?.length === diskCount && !won) {
      setWon(true);
      setFeedback({ text: `✓ Solved! All ${diskCount} disks successfully transferred!`, isCorrect: true });
      if (!saved.current) {
        saved.current = true;
        const score = Math.max(
          30,
          Math.round((optimalMoves / Math.max(moves, optimalMoves)) * 100),
        );
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "tower-of-hanoi",
            gameType: "tower_of_hanoi",
            score,
            accuracy: score,
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
  }, [rods, diskCount, won, moves, optimalMoves, activeLevel]);

  if (won)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.max(30, Math.round((optimalMoves / Math.max(moves, optimalMoves)) * 100))}
          accuracy={100}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={boardLevel}
          gameName="Tower of Hanoi"
          synced={synced}
          offline={offline}
          onPlayAgain={() => reset(dda.level)}
        />
      </>
    );

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
          <div className="flex gap-4 text-xs font-bold text-cream/70">
            <span>
              Disks: <span className="text-sun font-black text-base">{diskCount}</span>
            </span>
            <span>Moves: <span className="text-cream">{moves}</span></span>
            <span>Optimal: <span className="text-tea-confirm">{optimalMoves}</span></span>
          </div>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Step Advice: Move smaller disks between spare pegs to free up the base disk.
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

      <div className="flex gap-3 justify-center pt-1">
        {rods.map((rod, idx) => {
          const isSelected = selected === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleRodClick(idx)}
              className={`flex-1 min-h-[220px] rounded-2xl border-2 transition-all flex flex-col justify-end items-center p-2 relative cursor-pointer shadow-sm
                ${isSelected ? "border-sun ring-4 ring-sun/40 bg-sun/10 scale-102" : "border-clay/70 bg-ink/60 hover:border-sun/60 hover:bg-ink/80"}`}
              aria-label={`Tower ${idx + 1}${isSelected ? " (selected)" : ""}`}
            >
              {/* Pole */}
              <div className="absolute top-4 bottom-5 w-2.5 bg-clay/50 rounded-full left-1/2 -translate-x-1/2" />
              {/* Disks */}
              <div className="relative z-10 w-full flex flex-col gap-1.5 items-center">
                {[...rod].reverse().map((disk) => (
                  <div
                    key={disk}
                    className={`h-6 rounded-xl ${DISK_COLORS[(disk - 1) % DISK_COLORS.length]} text-ink text-xs font-black flex items-center justify-center shadow-md`}
                    style={{ width: `${Math.max(34, 38 + disk * 14)}%` }}
                  >
                    {disk}
                  </div>
                ))}
              </div>
              <span className="text-xs text-cream/60 mt-3 font-black tracking-wider">
                TOWER {idx + 1}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-cream/50 text-center pt-1">
        Transfer all disks from <strong>Tower 1 to Tower 3</strong>. Larger disks can never sit atop smaller disks.
      </p>
    </div>
  );
}

