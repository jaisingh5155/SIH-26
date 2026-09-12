import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";

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

export default function AnagramSolver({ level }: { level: number }) {
  const pool = getPool(level);
  const [word, setWord] = useState(() => pool[Math.floor(Math.random() * pool.length)] || "cat");
  const [scr, setScr] = useState(() => scramble(word));
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(level / 2));
  const { submitResult } = useGameSession();

  const pick = () => {
    const w = pool[Math.floor(Math.random() * pool.length)]!;
    setWord(w);
    setScr(scramble(w));
    setInput("");
    setFeedback("");
  };

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    pick();
  }, [level]);

  const submit = () => {
    if (completed) return;
    if (input.toLowerCase() === word.toLowerCase()) {
      const newScore = score + 1;
      setScore(newScore);
      setFeedback("✓ Correct!");
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "anagram-solver",
          gameType: "anagram_solver",
          score: acc,
          accuracy: acc,
          durationSeconds: Math.max(5, dur),
          level,
          difficulty: String(level),
        }).then((r) => {
          setSynced(r.success);
          setOffline(r.offline);
          setCompleted(true);
        });
      } else {
        setTimeout(pick, 700);
      }
    } else {
      setFeedback("✗ Wrong — the answer was: " + word);
      setTimeout(pick, 1200);
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
          level={level}
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
            pick();
          }}
        />
      </>
    );

  return (
    <div className="space-y-6 text-center">
      <p className="text-cream/50 text-xs uppercase font-bold">
        Score: {score}/{target}
      </p>
      <p className="text-cream/60 text-sm">Unscramble these letters to form a real word:</p>
      <div className="flex justify-center gap-2 flex-wrap">
        {scr
          .toUpperCase()
          .split("")
          .map((letter, i) => (
            <span
              key={i}
              className="flex w-12 h-12 items-center justify-center rounded-xl border-2 border-sun bg-sun/10 font-display text-2xl font-black text-sun"
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
          className="px-6 py-3 rounded-xl bg-sun text-ink font-extrabold hover:opacity-90 disabled:opacity-40 transition shadow"
        >
          Submit
        </button>
      </div>
      {feedback && (
        <p
          className={`text-sm font-bold ${feedback.startsWith("✓") ? "text-tea-confirm" : "text-fire"}`}
        >
          {feedback}
        </p>
      )}
      <button onClick={pick} className="text-xs text-cream/40 underline">
        Skip
      </button>
    </div>
  );
}
