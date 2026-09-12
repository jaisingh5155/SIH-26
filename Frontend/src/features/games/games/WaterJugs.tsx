import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

type JugConfig = { capacities: number[]; target: number; hint: string };

const configForLevel = (l: number): JugConfig => {
  switch (l) {
    case 1:
      return { capacities: [3, 5], target: 4, hint: "Fill the 5L jug, pour into 3L jug, then empty 3L jug!" };
    case 2:
      return { capacities: [3, 5], target: 2, hint: "Fill 5L jug, pour into 3L jug — 2L remains in 5L jug!" };
    case 3:
      return { capacities: [3, 7], target: 4, hint: "Fill 7L, pour into 3L to leave 4L!" };
    case 4:
      return { capacities: [5, 8], target: 3, hint: "Fill 8L, pour into 5L to leave 3L!" };
    case 5:
      return { capacities: [5, 11], target: 6, hint: "Fill 11L, pour into 5L to leave 6L!" };
    case 6:
      return { capacities: [3, 5, 8], target: 4, hint: "Use the intermediate transfers between jugs!" };
    default:
      return { capacities: [4, 7, 10], target: 3, hint: "Transfer step by step into the smallest available jug." };
  }
};

export default function WaterJugs({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 25,
    gameId: "water-jugs",
  });
  const [boardLevel, setBoardLevel] = useState(propLevel);
  useEffect(() => {
    setBoardLevel(propLevel);
  }, [propLevel]);

  const cfg = useMemo(() => configForLevel(boardLevel), [boardLevel]);
  const [jugs, setJugs] = useState<number[]>(() => cfg.capacities.map(() => 0));
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
    const newCfg = configForLevel(lvl);
    setJugs(newCfg.capacities.map(() => 0));
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

  const fill = (i: number) => {
    if (jugs[i] === cfg.capacities[i]) {
      setFeedback({ text: `✗ Jug ${i + 1} is already full!`, isCorrect: false });
      setTimeout(() => setFeedback(null), 1200);
      return;
    }
    const trialDuration = Math.max(0.5, (Date.now() - moveStart.current) / 1000);
    moveStart.current = Date.now();
    dda.recordTrial(true, trialDuration);

    setJugs((j) => {
      const n = [...j];
      n[i] = cfg.capacities[i]!;
      return n;
    });
    setMoves((m) => m + 1);
    setFeedback({ text: `✓ Filled Jug ${i + 1} to capacity (${cfg.capacities[i]}L).`, isCorrect: true });
    setTimeout(() => setFeedback(null), 1400);
  };

  const empty = (i: number) => {
    if (jugs[i] === 0) {
      setFeedback({ text: `✗ Jug ${i + 1} is already empty!`, isCorrect: false });
      setTimeout(() => setFeedback(null), 1200);
      return;
    }
    const trialDuration = Math.max(0.5, (Date.now() - moveStart.current) / 1000);
    moveStart.current = Date.now();
    dda.recordTrial(true, trialDuration);

    setJugs((j) => {
      const n = [...j];
      n[i] = 0;
      return n;
    });
    setMoves((m) => m + 1);
    setFeedback({ text: `✓ Emptied Jug ${i + 1}.`, isCorrect: true });
    setTimeout(() => setFeedback(null), 1400);
  };

  const pour = (from: number, to: number) => {
    if (jugs[from] === 0) {
      setFeedback({ text: `✗ Jug ${from + 1} is empty — nothing to pour!`, isCorrect: false });
      setTimeout(() => setFeedback(null), 1200);
      return;
    }
    if (jugs[to] === cfg.capacities[to]) {
      setFeedback({ text: `✗ Jug ${to + 1} is already full!`, isCorrect: false });
      setTimeout(() => setFeedback(null), 1200);
      return;
    }
    const trialDuration = Math.max(0.5, (Date.now() - moveStart.current) / 1000);
    moveStart.current = Date.now();
    dda.recordTrial(true, trialDuration);

    setJugs((j) => {
      const n = [...j];
      const amount = Math.min(n[from]!, cfg.capacities[to]! - n[to]!);
      n[from]! -= amount;
      n[to]! += amount;
      return n;
    });
    setMoves((m) => m + 1);
    setFeedback({ text: `✓ Poured from Jug ${from + 1} into Jug ${to + 1}.`, isCorrect: true });
    setTimeout(() => setFeedback(null), 1400);
  };

  useEffect(() => {
    if (!won && jugs.some((j) => j === cfg.target)) {
      setWon(true);
      setFeedback({ text: `✓ Right! Target ${cfg.target}L successfully achieved!`, isCorrect: true });
      if (!saved.current) {
        saved.current = true;
        const score = Math.max(30, Math.round(100 / Math.max(1, moves / 6)));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "water-jugs",
            gameType: "water_jugs",
            score: Math.min(100, score),
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
  }, [jugs, cfg.target, won, moves, activeLevel]);

  if (won)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.max(30, Math.round(100 / Math.max(1, moves / 6))))}
          accuracy={100}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={activeLevel}
          gameName="Water Jugs"
          synced={synced}
          offline={offline}
          onPlayAgain={() => reset(dda.level)}
        />
      </>
    );

  return (
    <div className="space-y-5 max-w-md mx-auto">
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
              Goal Target: <span className="text-sun font-black text-base">{cfg.target}L</span>
            </span>
            <span>Moves: <span className="text-cream">{moves}</span></span>
          </div>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Step Hint: {cfg.hint}
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

      <div className="flex gap-4 justify-center flex-wrap pt-2">
        {cfg.capacities.map((cap, i) => {
          const fill_pct = (jugs[i]! / cap) * 100;
          const isTarget = jugs[i] === cfg.target;
          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <p className="text-xs font-extrabold text-cream uppercase">
                Jug {i + 1}: <span className="text-sun">{jugs[i]}L</span> / {cap}L
              </p>
              <div className="relative w-20 h-44 rounded-b-2xl border-4 border-clay/70 bg-ink/70 overflow-hidden shadow-inner">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-sky-400 transition-all duration-300 rounded-b-xl opacity-90"
                  style={{ height: `${fill_pct}%` }}
                />
                {isTarget && (
                  <div className="absolute inset-0 ring-4 ring-tea-confirm rounded-xl animate-pulse flex items-center justify-center font-black text-tea-confirm text-lg shadow-lg">
                    ✓ {cfg.target}L
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 w-full pt-1">
                <button
                  onClick={() => fill(i)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-500 transition shadow"
                >
                  Fill ({cap}L)
                </button>
                <button
                  onClick={() => empty(i)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-clay/80 text-cream font-bold hover:bg-clay transition"
                >
                  Empty
                </button>
                {cfg.capacities.map(
                  (_, j) =>
                    j !== i && (
                      <button
                        key={j}
                        onClick={() => pour(i, j)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-sun text-ink font-extrabold hover:opacity-90 transition shadow"
                      >
                        Pour → Jug {j + 1}
                      </button>
                    ),
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-cream/50 pt-2">
        Fill, empty, or pour water between jugs until any jug holds exactly{" "}
        <strong className="text-sun">{cfg.target} Liters</strong>.
      </p>
    </div>
  );
}

