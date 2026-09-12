import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

type Puzzle = { question: string; answer: number; hint: string };

const PUZZLES_BY_LEVEL: Puzzle[][] = [
  // Level 1-2: simple
  [
    {
      question: "A farmer has 17 sheep. All but 9 run away. How many are left?",
      answer: 9,
      hint: "'All but 9' means 9 remain in the pasture.",
    },
    {
      question: "You have 10 candles burning. 3 blow out. How many candles do you still have in total?",
      answer: 10,
      hint: "All 10 candles still physically exist — 3 are just unlit.",
    },
    {
      question:
        "A bat and ball cost $1.10 together. The bat costs $1.00 more than the ball. How many cents does the ball cost?",
      answer: 5,
      hint: "If ball = 5¢, bat = $1.05. Total = $1.10.",
    },
  ],
  // Level 3-5
  [
    {
      question:
        "If 5 machines take 5 minutes to make 5 widgets, how many minutes does it take 100 machines to make 100 widgets?",
      answer: 5,
      hint: "Each machine independently makes 1 widget every 5 minutes.",
    },
    {
      question:
        "A water lily patch doubles in size every day. It takes 48 days to cover the entire pond. On what day was it half covered?",
      answer: 47,
      hint: "If it doubles every day and is full on day 48, it was half full on day 47.",
    },
    {
      question: "A carton has 6 fresh eggs. You break 2, cook 2, and eat 2. How many eggs are left in the kitchen?",
      answer: 4,
      hint: "The 2 you cooked and ate are the same 2 you broke, so only 2 are gone from the 6.",
    },
  ],
  // Level 6-8
  [
    {
      question:
        "A snail climbs 3m up a 10m wall each day, but slides down 2m each night. How many days until it first reaches the top?",
      answer: 8,
      hint: "On day 7 it reaches 7m. On day 8 it climbs 3m to reach 10m and finishes before nightfall!",
    },
    {
      question:
        "You have two ropes. Each burns for 60 minutes. How many minutes does it take to measure 45 minutes using both ropes?",
      answer: 45,
      hint: "Light rope 1 at both ends and rope 2 at one end. When rope 1 finishes (30m), light rope 2's other end.",
    },
  ],
  // Level 9-10
  [
    {
      question: "What is the next number in the famous Fibonacci series: 1, 1, 2, 3, 5, 8, 13, ?",
      answer: 21,
      hint: "Each number is the sum of the two preceding numbers (8 + 13 = 21).",
    },
    {
      question: "In a competitive race, you sprint and overtake the runner in 2nd place. What position are you in now?",
      answer: 2,
      hint: "You took 2nd place away from them, so you are now in 2nd place.",
    },
  ],
];

export default function LogicPuzzles({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 25,
    gameId: "logic-puzzles",
  });
  const activeLevel = dda.level;

  const pool = PUZZLES_BY_LEVEL[Math.min(Math.floor((activeLevel - 1) / 2.5), 3)]!;
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = pool[puzzleIdx % pool.length]!;
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const trialStart = useRef(Date.now());
  const target = Math.max(2, Math.ceil(activeLevel / 3));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    setPuzzleIdx(0);
    setInput("");
    setFeedback(null);
    setShowHint(false);
    setAttempts(0);
    trialStart.current = Date.now();
  }, [propLevel]);

  const submit = () => {
    if (completed) return;
    const val = parseInt(input.trim(), 10);
    const trialDuration = Math.max(1, (Date.now() - trialStart.current) / 1000);
    const isCorrect = val === puzzle.answer;

    dda.recordTrial(isCorrect, trialDuration);
    setAttempts((a) => a + 1);

    if (isCorrect) {
      setFeedback({ text: `✓ Right! "${puzzle.answer}" is the correct solution!`, isCorrect: true });
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "logic-puzzles",
            gameType: "logic_puzzles",
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
        }, 700);
        return;
      }
      setTimeout(() => {
        setPuzzleIdx((i) => i + 1);
        setInput("");
        setFeedback(null);
        setShowHint(false);
        setAttempts(0);
        trialStart.current = Date.now();
      }, 1000);
    } else {
      setFeedback({
        text: `✗ Wrong answer! You entered "${input || "empty"}". Try reading carefully!`,
        isCorrect: false,
      });
      if (attempts >= 1 || dda.showAssistanceCue) {
        setShowHint(true);
      }
      setTimeout(() => {
        if (!isCorrect) setFeedback(null);
      }, 2000);
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
          gameName="Logic Puzzles"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
            setPuzzleIdx(0);
            setInput("");
            setFeedback(null);
            setShowHint(false);
            setAttempts(0);
            trialStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-5 max-w-lg mx-auto">
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

      {(dda.showAssistanceCue || showHint) && (
        <div className="p-3 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Logic Hint: {puzzle.hint}
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

      <div className="rounded-2xl border-2 border-sun/30 bg-ink/70 p-6 text-cream text-lg font-medium leading-relaxed shadow-card text-center">
        {puzzle.question}
      </div>

      <div className="flex gap-3 items-center justify-center pt-2">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="w-32 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-3xl font-bold py-3 focus:border-sun focus:outline-none"
          placeholder="Answer"
          autoFocus
        />
        <button
          onClick={submit}
          className="px-8 py-3 rounded-xl bg-sun text-ink font-black hover:opacity-90 transition shadow-lg text-lg"
        >
          ✓ Submit
        </button>
      </div>

      {attempts > 0 && !showHint && !dda.showAssistanceCue && (
        <div className="flex justify-center pt-1">
          <button onClick={() => setShowHint(true)} className="text-xs text-cream/50 hover:text-cream underline transition">
            💡 Request Hint
          </button>
        </div>
      )}
    </div>
  );
}

