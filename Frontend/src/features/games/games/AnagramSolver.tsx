import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

// Same implementation as WordScramble but with a larger, harder word pool
const ANAGRAM_WORDS = [
  "act",
  "art",
  "bat",
  "cat",
  "dog",
  "ear",
  "eat",
  "far",
  "gas",
  "hat",
  "ice",
  "jam",
  "key",
  "lip",
  "map",
  "nap",
  "oak",
  "pan",
  "rat",
  "sat",
  "tan",
  "urn",
  "van",
  "war",
  "yam",
  "zinc",
  "apple",
  "brave",
  "chair",
  "dream",
  "eagle",
  "flame",
  "grace",
  "heart",
  "image",
  "joint",
  "karma",
  "lemon",
  "magic",
  "nerve",
  "ocean",
  "piano",
  "queen",
  "river",
  "sugar",
  "tiger",
  "brain",
  "focus",
  "blend",
  "crisp",
  "dance",
  "fluid",
  "globe",
  "hover",
  "index",
  "judge",
  "creative",
  "abstract",
  "balance",
  "diamond",
  "empower",
  "forward",
  "general",
  "horizon",
];

const scramble = (word: string) => {
  let s;
  do {
    s = word
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  } while (s === word && word.length > 2);
  return s;
};

const getPool = (level: number) => {
  if (level <= 2) return ANAGRAM_WORDS.filter((w) => w.length <= 3);
  if (level <= 4) return ANAGRAM_WORDS.filter((w) => w.length <= 5);
  if (level <= 7) return ANAGRAM_WORDS.filter((w) => w.length <= 7);
  return ANAGRAM_WORDS.filter((w) => w.length >= 6);
};

export default function AnagramSolver({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "anagram-solver",
  });
  const activeLevel = dda.level;

  const pool = getPool(activeLevel);
  const [word, setWord] = useState(() => pool[Math.floor(Math.random() * pool.length)] || "cat");
  const [scr, setScr] = useState(() => scramble(word));
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
    const list = getPool(lvl);
    const w = list[Math.floor(Math.random() * list.length)] ?? "cat";
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

  const submit = () => {
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
            gameId: "anagram-solver",
            gameType: "anagram_solver",
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
      setFeedback({ text: "✗ Not quite — try another word combination!", isCorrect: false });
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  const skip = () => {
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
          gameName="Anagram Solver"
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

      <p className="text-cream/70 text-sm">Unscramble these letters to form a real word:</p>
      <div className="flex justify-center gap-2 flex-wrap">
        {scr
          .toUpperCase()
          .split("")
          .map((letter, i) => (
            <span
              key={i}
              className="flex w-12 h-12 items-center justify-center rounded-xl border-2 border-sun bg-sun/10 font-display text-2xl font-black text-sun shadow-md"
            >
              {letter}
            </span>
          ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-2xl font-bold py-3 px-4 w-full max-w-xs focus:border-sun focus:outline-none"
          placeholder="Type answer…"
          disabled={completed}
          autoFocus
        />
        <button
          onClick={submit}
          disabled={completed}
          className="px-6 py-3 rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 disabled:opacity-40 transition shadow text-lg"
        >
          Submit
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
        Skip word (Show answer)
      </button>
    </div>
  );
}

