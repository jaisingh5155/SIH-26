import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

const COLORS = ["red", "blue", "green", "yellow"] as const;
type Color = (typeof COLORS)[number];
const COLOR_CLASSES: Record<Color, string> = {
  red: "bg-red-500 hover:bg-red-600",
  blue: "bg-blue-500 hover:bg-blue-600",
  green: "bg-green-500 hover:bg-green-600",
  yellow: "bg-yellow-400 hover:bg-yellow-500",
};

export default function SimonSays({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "simon-says",
  });
  const activeLevel = dda.level;

  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerSeq, setPlayerSeq] = useState<Color[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const roundStart = useRef(Date.now());
  const seqLength = Math.min(2 + Math.floor(activeLevel * 0.75), 8);
  const speed = Math.max(900 - activeLevel * 50, 450) * (dda.showAssistanceCue ? 1.3 : 1.0);
  const target = Math.max(3, Math.ceil(activeLevel * 1.2));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setSequence([]);
    setPlayerSeq([]);
    setScore(0);
    setIsPlaying(false);
    setIsPlayerTurn(false);
    setFeedback(null);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [propLevel]);

  const playSequence = async (seq: Color[]) => {
    setIsPlaying(true);
    setIsPlayerTurn(false);
    for (const c of seq) {
      await new Promise((r) => setTimeout(r, speed));
      setActiveColor(c);
      await new Promise((r) => setTimeout(r, speed * 0.6));
      setActiveColor(null);
    }
    setIsPlaying(false);
    setIsPlayerTurn(true);
    roundStart.current = Date.now();
  };

  const startGame = () => {
    const seq: Color[] = Array.from(
      { length: seqLength },
      () => COLORS[Math.floor(Math.random() * COLORS.length)]!,
    );
    setSequence(seq);
    setPlayerSeq([]);
    setFeedback(null);
    void playSequence(seq);
  };

  const handleColorClick = (color: Color) => {
    if (!isPlayerTurn || isPlaying) return;
    const newSeq = [...playerSeq, color];
    setPlayerSeq(newSeq);
    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    const idx = newSeq.length - 1;
    const trialDuration = Math.max(0.5, (Date.now() - roundStart.current) / 1000);

    if (newSeq[idx] !== sequence[idx]) {
      dda.recordTrial(false, trialDuration);
      setIsPlayerTurn(false);
      setPlayerSeq([]);
      setFeedback({
        text: `✗ Wrong! You clicked ${color.toUpperCase()} but Simon flashed ${sequence[idx]?.toUpperCase()}. Watch again…`,
        isCorrect: false,
      });
      setTimeout(() => {
        setFeedback(null);
        void playSequence(sequence);
      }, 1600);
      return;
    }

    if (newSeq.length === sequence.length) {
      dda.recordTrial(true, trialDuration);
      const newScore = score + 1;
      setScore(newScore);
      setIsPlayerTurn(false);
      setPlayerSeq([]);
      setFeedback({ text: "✓ Right! Sequence matched perfectly!", isCorrect: true });
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "simon-says",
            gameType: "simon_says",
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
          setFeedback(null);
          startGame();
        }, 1200);
      }
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
          gameName="Simon Says"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-5 max-w-sm mx-auto">
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
          <span className="text-xs sm:text-sm font-bold text-cream/70">
            Score: <span className="text-sun font-extrabold text-base">{score}</span> / {target}
          </span>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Assistance Active: Sequence playback speed slowed to help recall.
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

      <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto pt-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => handleColorClick(c)}
            disabled={!isPlayerTurn || isPlaying}
            className={`h-28 rounded-2xl font-bold text-xl text-white capitalize shadow-card transition-all ${COLOR_CLASSES[c]} ${
              activeColor === c ? "ring-8 ring-white scale-95 brightness-150 shadow-2xl" : ""
            } ${!isPlayerTurn || isPlaying ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {isPlaying && (
        <p className="text-center text-sun text-sm font-semibold animate-pulse">
          👀 Watch the color flashes closely…
        </p>
      )}
      {isPlayerTurn && (
        <p className="text-center text-tea-confirm text-sm font-bold">
          👆 Repeat the pattern! ({playerSeq.length}/{sequence.length})
        </p>
      )}

      <div className="flex justify-center pt-2">
        <button
          onClick={startGame}
          disabled={isPlaying || isPlayerTurn}
          className="px-8 py-3.5 rounded-xl bg-sun text-ink font-black text-base hover:opacity-90 disabled:opacity-40 transition shadow-lg"
        >
          {score === 0 ? "🎬 Start Sequence" : "🔄 Repeat Round"}
        </button>
      </div>
    </div>
  );
}

