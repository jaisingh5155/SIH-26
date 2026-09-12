import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

type Problem = { text: string; answer: number };

const generateProblem = (level: number): Problem => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  if (level <= 1) return { text: `${a} + ${b}`, answer: a + b };
  if (level <= 3)
    return Math.random() > 0.5
      ? { text: `${a} + ${b}`, answer: a + b }
      : { text: `${Math.max(a, b)} - ${Math.min(a, b)}`, answer: Math.max(a, b) - Math.min(a, b) };
  if (level <= 7) return { text: `${Math.min(a, 6)} × ${Math.min(b, 5)}`, answer: Math.min(a, 6) * Math.min(b, 5) };
  if (level === 8) return { text: `(${a} + ${b}) × 2`, answer: (a + b) * 2 };
  return { text: `${a} × ${b}`, answer: a * b };
};

export default function QuickMath({ level: propLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel: propLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 15,
    gameId: "quick-math",
  });
  const activeLevel = dda.level;

  const [problem, setProblem] = useState<Problem>(() => generateProblem(activeLevel));
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const trialStartTime = useRef(Date.now());
  const target = Math.max(3, Math.ceil(activeLevel / 2));
  const { submitResult } = useGameSession();

  useEffect(() => {
    setProblem(generateProblem(propLevel));
    setInput("");
    setScore(0);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
    trialStartTime.current = Date.now();
  }, [propLevel]);

  const submit = () => {
    const val = parseInt(input, 10);
    const trialSecs = Math.round((Date.now() - trialStartTime.current) / 1000);

    if (isNaN(val)) {
      setFeedback("Enter a number");
      return;
    }
    if (val === problem.answer) {
      dda.recordTrial(true, trialSecs);
      const newScore = score + 1;
      setScore(newScore);
      setFeedback("✓ Correct!");
      if (newScore >= target && !saved.current) {
        saved.current = true;
        const acc = Math.min(100, Math.round((newScore / target) * 100));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        submitResult({
          gameId: "quick-math",
          gameType: "quick_math",
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
      } else {
        setTimeout(() => {
          setProblem(generateProblem(dda.level));
          setInput("");
          setFeedback(null);
          trialStartTime.current = Date.now();
        }, 700);
      }
    } else {
      dda.recordTrial(false, trialSecs);
      setFeedback(`✗ Answer was ${problem.answer}`);
      setTimeout(() => {
        setProblem(generateProblem(dda.level));
        setInput("");
        setFeedback(null);
        trialStartTime.current = Date.now();
      }, 1200);
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
          gameName="Quick Math"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setCompleted(false);
            setScore(0);
            saved.current = false;
            setSynced(false);
            setOffline(false);
            sessionStart.current = Date.now();
            setProblem(generateProblem(dda.level));
            setInput("");
            trialStartTime.current = Date.now();
          }}
        />
      </>
    );

  return (
    <div className="space-y-6 text-center">
      {/* Top Controls: Adaptive Pacing Badge + Level & Score */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-clay/40 text-left">
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
            Score: <span className="text-sun text-base font-black">{score}</span> / {target}
          </p>
        </div>
      </div>

      {/* Gentle Assistance Cue */}
      {dda.showAssistanceCue && (
        <div className="px-4 py-2 rounded-xl bg-sun/10 border border-sun/40 text-sun text-xs font-bold text-center animate-pulse">
          💡 Adaptive Assistance: Break down the numbers step-by-step. Take your time!
        </div>
      )}

      <div>
        <div className="mx-auto inline-block rounded-2xl border-4 border-sun bg-ink px-10 py-6 shadow-card">
          <span className="font-display text-5xl sm:text-6xl font-black text-sun">
            {problem.text} = ?
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="w-36 rounded-xl border-2 border-clay bg-ink text-cream text-center font-display text-3xl font-bold py-3 focus:border-sun focus:outline-none"
          placeholder="?"
          autoFocus
        />
        <button
          onClick={submit}
          className="px-8 py-3 rounded-xl bg-sun text-ink font-extrabold text-lg hover:opacity-90 transition shadow"
        >
          Submit
        </button>
        {feedback && (
          <p
            className={`text-sm font-bold ${feedback.startsWith("✓") ? "text-tea-confirm" : "text-fire"}`}
          >
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
}
