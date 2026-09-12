import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

export type NBackProps = { level: number };

const randItem = (level: number): string => {
  const sets = ["ABC", "ABCD", "ABCDE", "ABCDEF"];
  const letters = sets[Math.min(level - 1, 3)] ?? "ABCDEF";
  return letters[Math.floor(Math.random() * letters.length)]!;
};

export default function NBack({ level: initialLevel }: NBackProps) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "n-back",
  });
  const activeLevel = dda.level;

  const n = Math.min(Math.max(1, activeLevel <= 4 ? 1 : activeLevel <= 7 ? 2 : 3), 4);
  const [sequence, setSequence] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saved = useRef(false);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const startTime = useRef<number>(0);
  const itemStartTime = useRef<number>(Date.now());
  const target = Math.max(3, activeLevel * 2);
  const { submitResult } = useGameSession();

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    setSequence([]);
    setScore(0);
    setRunning(false);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    setFeedback(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [propLevel]);

  const step = () => {
    setSequence((s) => {
      // 35% chance to deliberately spawn an n-back match to keep game engaging
      let nextLetter = randItem(activeLevel);
      if (s.length >= n && Math.random() < 0.35) {
        nextLetter = s[s.length - n]!;
      }
      return [...s, nextLetter];
    });
    itemStartTime.current = Date.now();
  };

  const start = () => {
    setSequence([]);
    setScore(0);
    setRunning(true);
    setFeedback(null);
    startTime.current = Date.now();
    step();
    const intervalSpeed = Math.max(1800 - activeLevel * 120, 900);
    intervalRef.current = setInterval(step, intervalSpeed);
  };

  const pressMatch = () => {
    if (!running || sequence.length === 0) return;
    const curIdx = sequence.length - 1;
    const trialDuration = Math.max(0.5, (Date.now() - itemStartTime.current) / 1000);
    const isTrueMatch = curIdx - n >= 0 && sequence[curIdx] === sequence[curIdx - n];

    dda.recordTrial(isTrueMatch, trialDuration);

    if (isTrueMatch) {
      setScore((s) => s + 1);
      setFeedback({
        text: `✓ Right! "${sequence[curIdx]}" matches ${n} step${n > 1 ? "s" : ""} ago!`,
        isCorrect: true,
      });
    } else {
      setScore((s) => Math.max(0, s - 1));
      const pastLetter = curIdx - n >= 0 ? sequence[curIdx - n] : "None";
      setFeedback({
        text: `✗ Wrong! Current is "${sequence[curIdx]}", but ${n} back was "${pastLetter}".`,
        isCorrect: false,
      });
    }

    setTimeout(() => setFeedback(null), 1200);

    setScore((currentScore) => {
      if (!saved.current && currentScore >= target) {
        saved.current = true;
        stop();
        const acc = Math.min(100, Math.round((currentScore / target) * 100));
        const dur = Math.round((Date.now() - startTime.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "n-back",
            gameType: "n_back",
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
      }
      return currentScore;
    });
  };

  if (completed) {
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={Math.min(100, Math.round((score / target) * 100))}
          accuracy={Math.min(100, Math.round((score / target) * 100))}
          durationSeconds={Math.round((Date.now() - startTime.current) / 1000)}
          level={activeLevel}
          gameName="N-Back"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
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
          <p className="text-cream/70 text-xs sm:text-sm font-bold">
            Score: <span className="text-sun font-extrabold text-base">{score}</span> / {target}
          </p>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Assistance Active: Look back exactly {n} card{n > 1 ? "s" : ""} in your memory!
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

      <div className="text-center">
        <p className="text-cream/70 text-sm font-semibold">
          {activeLevel >= 8 ? "🎯 High Focus Mode!" : `Match letter from ${n} step${n > 1 ? "s" : ""} ago`}
        </p>
        <div className="mt-4 mx-auto w-44 h-44 flex items-center justify-center rounded-3xl border-4 border-sun bg-ink shadow-card">
          <span className="font-display text-8xl font-black text-sun animate-pulse">
            {sequence[sequence.length - 1] ?? "—"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {!running ? (
          <button
            onClick={start}
            className="px-8 py-3.5 rounded-xl bg-tea-confirm text-cream font-black text-lg hover:opacity-90 transition shadow-lg"
          >
            ▶ Start Stream
          </button>
        ) : (
          <>
            <button
              onClick={pressMatch}
              className="px-8 py-3.5 rounded-xl bg-sun text-ink font-black text-xl hover:opacity-90 transition shadow-lg animate-pulse"
            >
              ✨ MATCH!
            </button>
            <button
              onClick={stop}
              className="px-5 py-3.5 rounded-xl bg-clay text-cream font-bold text-base hover:bg-clay/80 transition"
            >
              ⏸ Pause
            </button>
          </>
        )}
      </div>

      <div className="rounded-xl border border-sun/30 bg-sun/10 px-4 py-3 text-center text-xs text-sun font-medium">
        Press <strong>"MATCH"</strong> only when the current letter is identical to the one shown <strong>{n} step{n > 1 ? "s" : ""} ago</strong>.
      </div>
    </div>
  );
}

