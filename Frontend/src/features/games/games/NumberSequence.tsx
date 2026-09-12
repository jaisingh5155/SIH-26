import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

type Sequence = { numbers: number[]; answer: number; type: string; hint: string };

const generateSequence = (level: number): Sequence => {
  if (level <= 2) {
    const s = Math.floor(Math.random() * 10) + 1,
      d = Math.floor(Math.random() * 5) + 1;
    return {
      numbers: [s, s + d, s + d * 2, s + d * 3],
      answer: s + d * 4,
      type: "arithmetic",
      hint: `Each step adds +${d}`,
    };
  }
  if (level <= 4) {
    const s = Math.floor(Math.random() * 3) + 2,
      r = 2;
    return {
      numbers: [s, s * r, s * r * r, s * r * r * r],
      answer: s * Math.pow(r, 4),
      type: "geometric",
      hint: `Each number is multiplied by ${r}`,
    };
  }
  if (level <= 6) {
    const a = Math.floor(Math.random() * 4) + 1,
      b = Math.floor(Math.random() * 4) + 1;
    return {
      numbers: [a, b, a + b, a + 2 * b, 2 * a + 3 * b],
      answer: 3 * a + 5 * b,
      type: "fibonacci",
      hint: "Each number is the sum of the previous two numbers",
    };
  }
  const base = Math.floor(Math.random() * 4) + 2;
  return {
    numbers: [base, base * 2, base * 2 + 1, base * 4 + 1, base * 4 + 2],
    answer: base * 8 + 2,
    type: "complex",
    hint: "Pattern alternates doubling and adding 1",
  };
};

export default function NumberSequence({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "number-sequence",
  });
  const activeLevel = dda.level;

  const [seq, setSeq] = useState<Sequence>(() => generateSequence(activeLevel));
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const trialStart = useRef(Date.now());
  const target = Math.max(3, Math.ceil(activeLevel * 1.2));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setSeq(generateSequence(propLevel));
    setInput("");
    setScore(0);
    setFeedback(null);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    trialStart.current = Date.now();
  }, [propLevel]);

  const handleSubmit = () => {
    if (completed) return;
    const answer = Number(input.trim());
    const isMatch = answer === seq.answer;
    const trialDuration = Math.max(1, (Date.now() - trialStart.current) / 1000);

    dda.recordTrial(isMatch, trialDuration);

    if (isMatch) {
      const newScore = score + 1;
      setScore(newScore);
      setFeedback({ text: `✓ Right! "${seq.answer}" correctly continues the sequence!`, isCorrect: true });

      if (!saved.current && newScore >= target) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "number-sequence",
            gameType: "number_sequence",
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
          setSeq(generateSequence(dda.level));
          setInput("");
          setFeedback(null);
          trialStart.current = Date.now();
        }, 900);
      }
    } else {
      setFeedback({
        text: `✗ Wrong! You entered ${input || "empty"}, but the correct answer was ${seq.answer}!`,
        isCorrect: false,
      });
      setTimeout(() => setFeedback(null), 1500);
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
          gameName="Number Sequence"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            setSeq(generateSequence(dda.level));
            setInput("");
            setFeedback(null);
            sessionStart.current = Date.now();
            trialStart.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-6 text-center max-w-lg mx-auto">
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
          <p className="text-xs sm:text-sm font-bold text-cream/70">
            Score: <span className="text-sun font-extrabold text-base">{score}</span> / {target}
          </p>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Gentle Hint: {seq.hint}
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

      <p className="text-cream/70 text-sm font-medium">Identify the rule and find the next number:</p>

      <div className="flex items-center justify-center gap-3 flex-wrap p-4 rounded-2xl bg-ink/60 border border-clay/50 shadow-inner">
        {seq.numbers.map((n, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="px-4 py-3 rounded-2xl bg-sun/15 border-2 border-sun/50 font-display text-2xl sm:text-3xl font-black text-sun shadow-md">
              {n}
            </span>
            <span className="text-cream/40 font-bold">→</span>
          </div>
        ))}
        <span className="px-5 py-3 rounded-2xl bg-fire/20 border-2 border-fire font-display text-2xl sm:text-3xl font-black text-fire animate-pulse shadow-md">
          ?
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          className="w-36 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-3xl font-bold py-3 focus:border-sun focus:outline-none"
          placeholder="Next #"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          className="px-8 py-3 rounded-xl bg-sun text-ink font-black hover:opacity-90 transition shadow-lg text-lg"
        >
          ✓ Submit
        </button>
      </div>
    </div>
  );
}

