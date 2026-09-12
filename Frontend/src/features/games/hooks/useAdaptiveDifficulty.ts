import { useState, useCallback, useRef, useEffect } from "react";

export interface AdaptiveConfig {
  initialLevel?: number;
  maxLevel?: number;
  minLevel?: number;
  targetSeconds?: number;
  gameId?: string;
}

export type DdaAdjustmentType =
  | "level_up"
  | "level_down"
  | "relax_timer"
  | "assistance_hint"
  | null;

export interface DdaAdjustment {
  type: DdaAdjustmentType;
  message: string;
  timestamp: number;
}

/**
 * useAdaptiveDifficulty — Real-time Dynamic Difficulty Adjustment (DDA) hook
 *
 * Implements clinical cognitive pacing designed for elderly and dementia care:
 * 1. Rapid Success Streak (>= 2 fast, 0-error trials) -> Automatically advances difficulty level.
 * 2. Consecutive Errors (>= 2 mistakes) -> Decreases difficulty, removes distractors,
 *    relaxes timers, and activates gentle assistance cues to prevent cognitive frustration.
 * 3. Hesitation Detection (>= 8-10s of inactivity) -> Slows countdown timers and triggers hints.
 */
export function useAdaptiveDifficulty({
  initialLevel = 1,
  maxLevel = 10,
  minLevel = 1,
  targetSeconds = 15,
  gameId,
}: AdaptiveConfig = {}) {
  const [level, setLevel] = useState<number>(initialLevel);
  const [isAdaptiveActive, setIsAdaptiveActive] = useState<boolean>(true);
  const [timerMultiplier, setTimerMultiplier] = useState<number>(1.0);
  const [distractorModifier, setDistractorModifier] = useState<number>(0);
  const [showAssistanceCue, setShowAssistanceCue] = useState<boolean>(false);
  const [adjustment, setAdjustment] = useState<DdaAdjustment | null>(null);

  const streakSuccess = useRef<number>(0);
  const streakError = useRef<number>(0);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial level if search params change externally
  useEffect(() => {
    setLevel(initialLevel);
  }, [initialLevel]);

  const triggerAdjustmentNotice = useCallback((type: DdaAdjustmentType, message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setAdjustment({ type, message, timestamp: Date.now() });
    toastTimeoutRef.current = setTimeout(() => {
      setAdjustment(null);
    }, 3200);
  }, []);

  /**
   * Record a trial/interaction outcome in real time
   * @param isCorrect Whether the trial was solved accurately with 0 errors
   * @param timeTakenSec Time taken in seconds to solve the trial
   */
  const recordTrial = useCallback(
    (isCorrect: boolean, timeTakenSec?: number) => {
      if (!isAdaptiveActive) return;

      if (isCorrect) {
        streakError.current = 0;
        streakSuccess.current += 1;

        // Fast solution bonus (solved in under 70% of target time)
        const wasFast = timeTakenSec !== undefined && timeTakenSec < targetSeconds * 0.75;
        const shouldLevelUp = streakSuccess.current >= 2 || (wasFast && streakSuccess.current >= 1);

        if (shouldLevelUp) {
          setLevel((prev) => {
            if (prev < maxLevel) {
              const next = prev + 1;
              triggerAdjustmentNotice(
                "level_up",
                `Level auto-advanced to ${next}! Excellent focus.`
              );
              return next;
            }
            // At max level, subtly sharpen timer
            setTimerMultiplier((m) => Math.max(0.75, Math.round((m - 0.05) * 100) / 100));
            triggerAdjustmentNotice("level_up", "Superb mastery! Pacing slightly accelerated.");
            return prev;
          });
          streakSuccess.current = 0;
          setDistractorModifier(0);
          setShowAssistanceCue(false);
        }
      } else {
        streakSuccess.current = 0;
        streakError.current += 1;

        // If 2 consecutive errors occur, adapt immediately to prevent frustration
        if (streakError.current >= 2) {
          setLevel((prev) => {
            if (prev > minLevel) {
              const next = prev - 1;
              triggerAdjustmentNotice(
                "level_down",
                `Simplified to Level ${next} for comfortable pacing.`
              );
              return next;
            }
            // At lowest level: extend timer and reduce distractors
            setTimerMultiplier((m) => Math.min(1.6, Math.round((m + 0.2) * 100) / 100));
            setDistractorModifier(-1);
            triggerAdjustmentNotice(
              "relax_timer",
              "Pacing relaxed and timers extended to give you more time."
            );
            return prev;
          });

          // Activate gentle visual assistance cue
          setShowAssistanceCue(true);
          streakError.current = 0;
        }
      }
    },
    [isAdaptiveActive, maxLevel, minLevel, targetSeconds, triggerAdjustmentNotice]
  );

  /**
   * Report hesitation / cognitive freeze during a trial
   */
  const reportHesitation = useCallback(
    (secondsIdle: number) => {
      if (!isAdaptiveActive) return;
      if (secondsIdle >= 8) {
        setShowAssistanceCue(true);
        setTimerMultiplier((m) => Math.min(1.5, Math.round((m + 0.15) * 100) / 100));
        triggerAdjustmentNotice(
          "assistance_hint",
          "Take your time! A gentle assistance hint is highlighted."
        );
      }
    },
    [isAdaptiveActive, triggerAdjustmentNotice]
  );

  const clearAssistanceCue = useCallback(() => {
    setShowAssistanceCue(false);
  }, []);

  const toggleAdaptive = useCallback((active?: boolean) => {
    setIsAdaptiveActive((prev) => (active !== undefined ? active : !prev));
  }, []);

  return {
    level,
    setLevel,
    isAdaptiveActive,
    toggleAdaptive,
    timerMultiplier,
    distractorModifier,
    showAssistanceCue,
    clearAssistanceCue,
    recordTrial,
    reportHesitation,
    adjustment,
  };
}
