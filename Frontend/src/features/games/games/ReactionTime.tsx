import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

export type ReactionTimeProps = { level: number };

export default function ReactionTime({ level: initialLevel }: ReactionTimeProps) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 12,
    gameId: "reaction-time",
  });
  const activeLevel = dda.level;

  const [phase, setPhase] = useState<"ready" | "wait" | "click" | "result">("ready");
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const startTime = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStart = useRef(Date.now());
  const target = Math.max(4, Math.min(activeLevel + 2, 7));
  const avgThreshold = Math.max(600 - activeLevel * 30, 250);
  const { submitResult } = useGameSession();

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    setAttempts([]);
    setCompleted(false);
    saved.current = false;
    setFeedback(null);
    setPhase("ready");
    sessionStart.current = Date.now();
  }, [propLevel]);

  const startTest = () => {
    setPhase("wait");
    setFeedback(null);
    const delay = Math.random() * 2500 + 1200;
    timeoutRef.current = setTimeout(() => {
      startTime.current = Date.now();
      setPhase("click");
    }, delay);
  };

  const handleClick = () => {
    if (phase === "ready") {
      startTest();
      return;
    }
    if (phase === "wait") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      dda.recordTrial(false, 1);
      setFeedback({ text: "✗ Too early! You clicked before the box turned green.", isCorrect: false });
      setPhase("ready");
      return;
    }
    if (phase === "click") {
      const ms = Date.now() - startTime.current;
      const trialDuration = Math.max(0.2, ms / 1000);
      const isFastEnough = ms <= avgThreshold;

      dda.recordTrial(isFastEnough, trialDuration);
      setReactionTime(ms);

      const next = [...attempts, ms];
      setAttempts(next);
      setFeedback({
        text: isFastEnough
          ? `✓ Great reflexes! Reaction time: ${ms}ms.`
          : `⚡ Good try! Reaction time: ${ms}ms (goal: <${avgThreshold}ms).`,
        isCorrect: isFastEnough,
      });

      if (next.length >= target && !saved.current) {
        saved.current = true;
        const avg = next.reduce((a, b) => a + b, 0) / next.length;
        const score = Math.max(10, Math.min(100, Math.round((1000 / avg) * 50)));
        const dur = Math.round((Date.now() - sessionStart.current) / 1000);
        setTimeout(() => {
          submitResult({
            gameId: "reaction-time",
            gameType: "reaction_time",
            score,
            accuracy: Math.min(100, Math.round((avgThreshold / Math.max(avgThreshold, avg)) * 100)),
            durationSeconds: Math.max(5, dur),
            level: activeLevel,
            difficulty: String(activeLevel),
          }).then((r) => {
            setSynced(r.success);
            setOffline(r.offline);
            setCompleted(true);
          });
        }, 600);
        return;
      }
      setPhase("ready");
    }
  };

  const avgTime = attempts.length ? attempts.reduce((a, b) => a + b, 0) / attempts.length : null;

  if (completed)
    return (
      <>
        <CelebrationAnimation show />
        <GameResults
          score={avgTime ? Math.max(10, Math.min(100, Math.round((1000 / avgTime) * 50))) : 50}
          accuracy={
            avgTime
              ? Math.min(100, Math.round((avgThreshold / Math.max(avgThreshold, avgTime)) * 100))
              : 80
          }
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={activeLevel}
          gameName="Reaction Time"
          synced={synced}
          offline={offline}
          onPlayAgain={() => {
            setAttempts([]);
            setCompleted(false);
            saved.current = false;
            setPhase("ready");
            sessionStart.current = Date.now();
          }}
        />
      </>
    );

  const bg =
    phase === "wait"
      ? "bg-fire"
      : phase === "click"
        ? "bg-tea-confirm"
        : "bg-surface";

  return (
    <div className="space-y-5 max-w-md mx-auto">
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
          <div className="flex gap-2 text-xs sm:text-sm font-bold text-cream/70">
            <span>
              Trial: <span className="text-sun font-extrabold">{attempts.length}/{target}</span>
            </span>
            {avgTime && (
              <span>
                · Avg: <span className="text-tea-confirm">{avgTime.toFixed(0)}ms</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {dda.showAssistanceCue && (
        <div className="p-2.5 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
          💡 Assistance Active: Target threshold has relaxed to accommodate natural reaction pacing.
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

      <button
        type="button"
        onClick={handleClick}
        className={`w-full h-56 rounded-3xl flex flex-col items-center justify-center text-cream text-3xl font-black transition-all duration-150 shadow-card border-4 border-clay/60 cursor-pointer ${bgClass}`}
        aria-label="Reaction target — click when green"
      >
        {phase === "ready" && (
          <>
            <span className="text-5xl mb-3">👆</span>
            <span>Tap to Start</span>
          </>
        )}
        {phase === "wait" && (
          <>
            <span className="text-5xl mb-3">⏳</span>
            <span>Wait for green…</span>
          </>
        )}
        {phase === "click" && (
          <>
            <span className="text-5xl mb-3 animate-bounce">🟢</span>
            <span className="text-4xl text-ink font-black">CLICK NOW!</span>
          </>
        )}
        {phase === "result" && reactionTime && (
          <>
            <span className="text-5xl mb-3">⚡</span>
            <span className="text-sun font-display text-5xl">{reactionTime}ms</span>
          </>
        )}
      </button>

      {phase === "result" && !completed && (
        <div className="flex justify-center">
          <button
            onClick={() => setPhase("ready")}
            className="px-8 py-3.5 rounded-xl bg-sun text-ink font-black hover:opacity-90 transition shadow-lg text-lg"
          >
            {attempts.length < target ? "▶ Next Attempt" : "🔄 Complete & Finalize"}
          </button>
        </div>
      )}

      {attempts.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center pt-2">
          {attempts.slice(-5).map((t, i) => (
            <span
              key={i}
              className={`px-3 py-1.5 rounded-xl border text-sm font-bold shadow-sm ${
                t <= avgThreshold
                  ? "border-tea-confirm bg-tea-confirm/20 text-tea-confirm"
                  : "border-clay bg-ink/60 text-cream/70"
              }`}
            >
              {t}ms
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

