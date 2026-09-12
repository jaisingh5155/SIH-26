import { useEffect, useMemo, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

const WORDS = [
  "cat",
  "dog",
  "sun",
  "moon",
  "earth",
  "brain",
  "react",
  "vital",
  "garden",
  "puzzle",
  "complex",
  "rotation",
];

const scramble = (word: string) =>
  word
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

export default function WordScramble({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "word-scramble",
  });
  const activeLevel = dda.level;

  const pool = useMemo(() => {
    if (activeLevel <= 1) return WORDS.filter((w) => w.length === 3);
    if (activeLevel <= 4) return WORDS.filter((w) => w.length <= 5);
    return WORDS;
  }, [activeLevel]);

  const [word, setWord] = useState("");
  const [scr, setScr] = useState("");
  const [input, setInput] = useState("");
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

  const pick = (lvl = dda.level) => {
    const currentPool = WORDS[lvl] ?? WORDS[1] ?? pool;
    const w = currentPool[Math.floor(Math.random() * currentPool.length)]!;
    setWord(w);
    setScr(scramble(w));
    setInput("");
    setFeedback(null);
    trialStart.current = Date.now();
  };

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    pick(propLevel);
  }, [propLevel]);

  const submitGuess = () => {
    if (completed) return;
    const trialDuration = Math.max(1, (Date.now() - trialStart.current) / 1000);
    if (input.trim().toLowerCase() === word.toLowerCase()) {
      dda.recordTrial(true, trialDuration);
      const newScore = score + 1;
      setScore(newScore);
      setFeedback({ text: `✓ Right! "${word.toUpperCase()}" is correct!`, isCorrect: true });
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "word-scramble",
            gameType: "word_scramble",
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
        setTimeout(() => pick(dda.level), 700);
      }
    } else {
      dda.recordTrial(false, trialDuration);
      setFeedback({ text: "✗ Wrong — try again!", isCorrect: false });
      setScore((s) => Math.max(0, s - 1));
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleSkip = () => {
    dda.recordTrial(false, 15);
    setFeedback({ text: `Skipped! The word was "${word.toUpperCase()}"`, isCorrect: false });
    setTimeout(() => pick(dda.level), 900);
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
          gameName="Word Scramble"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
            pick(dda.level);
          }}
        />
      </>
    );

  return (
    <div className="space-y-6 text-center">
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
        <div className="p-3 rounded-xl bg-sun/15 border border-sun/40 text-sun text-sm font-semibold animate-pulse flex items-center justify-center gap-2">
          <span>💡 Gentle Hint:</span> Starts with <strong>"{word[0]?.toUpperCase()}"</strong> ({word.length} letters)
        </div>
      )}

      <div className="mx-auto inline-block rounded-2xl border-4 border-sun bg-ink px-10 py-6 shadow-card">
        <span className="font-display text-5xl sm:text-6xl font-black text-sun tracking-widest">
          {scr.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitGuess();
          }}
          className="rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl font-bold py-3 px-4 w-full max-w-xs focus:border-sun focus:outline-none"
          placeholder="Type answer…"
          disabled={completed}
          autoFocus
        />
        <button
          onClick={submitGuess}
          disabled={completed}
          className="px-6 py-3 rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 disabled:opacity-40 transition shadow text-lg"
        >
          ✓ Submit
        </button>
      </div>

      {feedback && (
        <div
          className={`py-2 px-4 rounded-xl font-bold text-base max-w-md mx-auto transition-all ${
            feedback.isCorrect
              ? "bg-tea-confirm/20 border-2 border-tea-confirm text-tea-confirm"
              : "bg-fire/20 border-2 border-fire text-fire"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <button onClick={handleSkip} className="text-xs text-cream/50 hover:text-cream underline transition">
        Skip word
      </button>
    </div>
  );
}

