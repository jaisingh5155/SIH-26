import { useCallback, useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

const MAZE_SIZES: Record<number, number> = {
  1: 5,
  2: 7,
  3: 7,
  4: 9,
  5: 9,
  6: 11,
  7: 11,
  8: 13,
  9: 13,
  10: 15,
};

type Cell = 0 | 1; // 0 = open, 1 = wall

const generateMaze = (size: number): Cell[][] => {
  const grid: Cell[][] = Array.from({ length: size }, () => Array(size).fill(1) as Cell[]);
  const carve = (r: number, c: number) => {
    grid[r]![c] = 0;
    const dirs = [
      [0, 2],
      [0, -2],
      [2, 0],
      [-2, 0],
    ].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr!,
        nc = c + dc!;
      if (nr > 0 && nr < size - 1 && nc > 0 && nc < size - 1 && grid[nr]![nc] === 1) {
        grid[r + dr! / 2]![c + dc! / 2] = 0;
        carve(nr, nc);
      }
    }
  };
  carve(1, 1);
  grid[size - 2]![size - 2] = 0; // ensure goal accessible
  return grid;
};

export default function Maze({ level: propLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel: propLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 25,
    gameId: "maze",
  });
  const [boardLevel, setBoardLevel] = useState(propLevel);
  useEffect(() => {
    setBoardLevel(propLevel);
  }, [propLevel]);

  const size = MAZE_SIZES[boardLevel] ?? 9;
  const [maze, setMaze] = useState<Cell[][]>(() => generateMaze(size));
  const [pos, setPos] = useState<[number, number]>([1, 1]);
  const [moves, setMoves] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [won, setWon] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const stepStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  const reset = useCallback((lvl = boardLevel) => {
    setBoardLevel(lvl);
    const newSize = MAZE_SIZES[lvl] ?? 9;
    const newMaze = generateMaze(newSize);
    setMaze(newMaze);
    setPos([1, 1]);
    setMoves(0);
    setFeedback(null);
    setWon(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    stepStart.current = Date.now();
  }, [boardLevel]);

  useEffect(() => {
    reset(propLevel);
  }, [propLevel, reset]);

  const move = (dr: number, dc: number) => {
    if (won) return;
    const [r, c] = pos;
    const nr = r + dr,
      nc = c + dc;
    const trialDuration = Math.max(0.2, (Date.now() - stepStart.current) / 1000);
    stepStart.current = Date.now();

    if (nr < 0 || nr >= size || nc < 0 || nc >= size || maze[nr]![nc] === 1) {
      dda.recordTrial(false, trialDuration);
      setFeedback({ text: "✗ Path blocked! Cannot move into a wall.", isCorrect: false });
      setTimeout(() => setFeedback(null), 1000);
      return;
    }

    dda.recordTrial(true, trialDuration);
    setPos([nr, nc]);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (nr === size - 2 && nc === size - 2) {
      setWon(true);
      setFeedback({ text: `✓ Right! Goal reached in ${nextMoves} moves!`, isCorrect: true });
      if (!saved.current) {
        saved.current = true;
        const score = Math.max(25, Math.min(100, Math.round(1200 / Math.max(1, nextMoves + 1))));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "maze",
            gameType: "maze",
            score,
            accuracy: 100,
            durationSeconds: Math.max(5, dur),
            level: boardLevel,
            difficulty: String(boardLevel),
          }).then((r) => {
            setSynced(r.success);
            setOffline(r.offline);
          });
        }, 800);
      }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowUp") move(-1, 0);
      else if (e.key === "ArrowDown") move(1, 0);
      else if (e.key === "ArrowLeft") move(0, -1);
      else if (e.key === "ArrowRight") move(0, 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pos, won, maze, moves]);

  if (won)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.max(25, Math.min(100, Math.round(1200 / Math.max(1, moves))))}
          accuracy={100}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={boardLevel}
          gameName="Pathway Maze"
          synced={synced}
          offline={offline}
          onPlayAgain={() => reset(dda.level)}
        />
      </>
    );

  const cellSize = Math.min(32, Math.floor(340 / size));

  return (
    <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 w-full px-2 pb-3 border-b border-clay/40">
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
            <span>Moves: <span className="text-sun font-black">{moves}</span></span>
            <span>Goal: <span className="text-fire font-black">🔴 Target</span></span>
          </div>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="w-full p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Step Hint: Keep navigating towards the bottom-right red square!
        </div>
      )}

      {/* Prominent Right/Wrong Banner */}
      {feedback && (
        <div
          className={`w-full py-2 px-4 rounded-xl font-bold text-center text-sm shadow-md transition-all ${
            feedback.isCorrect
              ? "bg-tea-confirm/20 border-2 border-tea-confirm text-tea-confirm"
              : "bg-fire/20 border-2 border-fire text-fire"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="border-4 border-clay/70 rounded-2xl overflow-hidden shadow-card bg-ink">
        {maze.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => {
              const isPlayer = pos[0] === r && pos[1] === c;
              const isGoal = r === size - 2 && c === size - 2;
              const isStart = r === 1 && c === 1;
              return (
                <div
                  key={c}
                  style={{ width: cellSize, height: cellSize }}
                  className={`${cell === 1 ? "bg-clay/80 border border-clay/40" : isPlayer ? "bg-sun text-ink font-black shadow-lg" : isGoal ? "bg-fire animate-pulse" : isStart ? "bg-tea-confirm/30" : "bg-ink/60"} flex items-center justify-center transition-all`}
                >
                  {isPlayer && <span style={{ fontSize: cellSize * 0.7 }}>●</span>}
                  {isGoal && !isPlayer && <span style={{ fontSize: cellSize * 0.5 }}>🏁</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Arrow controls for touchscreen/mobile */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        <div />
        <button
          onClick={() => move(-1, 0)}
          className="w-14 h-12 rounded-xl bg-clay/70 text-cream text-xl font-black hover:bg-sun hover:text-ink transition shadow"
          aria-label="Up"
        >
          ↑
        </button>
        <div />
        <button
          onClick={() => move(0, -1)}
          className="w-14 h-12 rounded-xl bg-clay/70 text-cream text-xl font-black hover:bg-sun hover:text-ink transition shadow"
          aria-label="Left"
        >
          ←
        </button>
        <button
          onClick={() => move(1, 0)}
          className="w-14 h-12 rounded-xl bg-clay/70 text-cream text-xl font-black hover:bg-sun hover:text-ink transition shadow"
          aria-label="Down"
        >
          ↓
        </button>
        <button
          onClick={() => move(0, 1)}
          className="w-14 h-12 rounded-xl bg-clay/70 text-cream text-xl font-black hover:bg-sun hover:text-ink transition shadow"
          aria-label="Right"
        >
          →
        </button>
      </div>

      <button onClick={reset} className="text-xs text-cream/50 hover:text-cream underline transition">
        Regenerate Maze
      </button>
    </div>
  );
}

