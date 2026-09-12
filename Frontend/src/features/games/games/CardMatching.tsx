import { useCallback, useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

export type CardMatchingProps = { level: number };

type Card = { id: number; value: string; isFlipped: boolean; isMatched: boolean };

const SYMBOLS = [
  "🎮",
  "🎯",
  "🎨",
  "🎭",
  "🎪",
  "🎬",
  "🎵",
  "🎸",
  "🎹",
  "🎺",
  "🎻",
  "🎲",
  "🎰",
  "🎳",
  "⚽",
  "🏀",
  "🏈",
  "⚾",
  "🎾",
  "🏐",
];
const gridSize = (l: number) => (l <= 2 ? 4 : l <= 5 ? 6 : 8);

export default function CardMatching({ level: propLevel }: CardMatchingProps) {
  const dda = useAdaptiveDifficulty({
    initialLevel: propLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 25,
    gameId: "card-matching",
  });
  const [boardLevel, setBoardLevel] = useState(propLevel);
  useEffect(() => {
    setBoardLevel(propLevel);
  }, [propLevel]);

  const size = gridSize(boardLevel);
  const pairCount = (size * size) / 2;
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const startTime = useRef(Date.now());
  const trialStartTime = useRef(Date.now());
  const endSecs = useRef(0);
  const { submitResult } = useGameSession();

  const initializeGame = useCallback((lvl = boardLevel) => {
    const s = gridSize(lvl);
    const count = (s * s) / 2;
    const symbols = SYMBOLS.slice(0, count);
    const shuffled = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    setCards(shuffled.map((value, id) => ({ id, value, isFlipped: false, isMatched: false })));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    startTime.current = Date.now();
    trialStartTime.current = Date.now();
  }, [boardLevel]);

  useEffect(() => {
    initializeGame(boardLevel);
  }, [boardLevel, initializeGame]);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id]?.isFlipped || cards[id]?.isMatched) return;
    const newFlipped = [...flippedCards, id];
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped as [number, number];
      const trialDuration = Math.round((Date.now() - trialStartTime.current) / 1000);

      if (cards[first]?.value === cards[second]?.value) {
        // Record successful trial for DDA
        dda.recordTrial(true, trialDuration);
        trialStartTime.current = Date.now();

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first || c.id === second ? { ...c, isMatched: true } : c)),
          );
          setMatches((m) => {
            const next = m + 1;
            if (next === pairCount && !saved.current) {
              saved.current = true;
              endSecs.current = Math.round((Date.now() - startTime.current) / 1000);
              const scoreVal = Math.max(
                10,
                Math.round(100000 / (endSecs.current * 1000 + (moves + 1) * 1000)),
              );
              const acc = Math.min(
                100,
                Math.round((pairCount / Math.max(pairCount, moves + 1)) * 100),
              );
              submitResult({
                gameId: "card-matching",
                gameType: "card_matching",
                score: Math.min(100, scoreVal),
                accuracy: acc,
                durationSeconds: Math.max(5, endSecs.current),
                level: boardLevel,
                difficulty: String(boardLevel),
              }).then((r) => {
                setSynced(r.success);
                setOffline(r.offline);
                setCompleted(true);
              });
            }
            return next;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        // Record missed attempt for DDA
        dda.recordTrial(false, trialDuration);
        trialStartTime.current = Date.now();

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first || c.id === second ? { ...c, isFlipped: false } : c)),
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((pairCount / Math.max(pairCount, moves)) * 100))}
          accuracy={Math.min(100, Math.round((pairCount / Math.max(pairCount, moves)) * 100))}
          durationSeconds={endSecs.current}
          level={boardLevel}
          gameName="Card Matching"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setBoardLevel(dda.level);
            initializeGame(dda.level);
          }}
        />
      </>
    );

  return (
    <div className="space-y-4">
      {/* Top Controls: Adaptive Pacing Badge + Move Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-clay/40">
        <AdaptivePacingBadge
          isAdaptiveActive={dda.isAdaptiveActive}
          onToggle={dda.toggleAdaptive}
          adjustment={dda.adjustment}
        />

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full border border-sun/40 bg-sun/10 text-sun font-bold text-xs sm:text-sm">
            Level {boardLevel}
          </span>
          <div className="flex gap-4 text-sm font-bold text-cream/80">
            <span>
              Moves: <span className="text-sun">{moves}</span>
            </span>
            <span>
              Matched:{" "}
              <span className="text-tea-confirm">
                {matches}/{pairCount}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Gentle Assistance Cue when struggling or hesitating */}
      {dda.showAssistanceCue && (
        <div className="px-4 py-2 rounded-xl bg-sun/10 border border-sun/40 text-sun text-xs font-bold text-center animate-pulse flex items-center justify-center gap-2">
          <span>💡 Adaptive Assistance: Look closely at matching symbols. Take your time!</span>
        </div>
      )}

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched || flippedCards.length === 2}
            className={`aspect-square rounded-xl text-2xl sm:text-3xl font-bold transition-all duration-300 border-2 shadow flex items-center justify-center
              ${
                card.isMatched
                  ? "border-tea-confirm bg-tea-confirm/20 opacity-60 scale-95"
                  : card.isFlipped
                    ? "border-sun bg-cream text-ink"
                    : "border-clay bg-ink/70 text-cream hover:border-sun/50 hover:scale-105 active:scale-95"
              }`}
            aria-label={card.isFlipped || card.isMatched ? card.value : `Card ${card.id + 1}`}
          >
            {card.isFlipped || card.isMatched ? card.value : "✦"}
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={initializeGame}
          className="px-5 py-2 rounded-xl border border-clay text-cream/80 text-sm hover:bg-clay transition"
        >
          🔄 New Game
        </button>
      </div>
    </div>
  );
}
