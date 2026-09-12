import { useEffect, useRef, useState } from "react";
import { CelebrationAnimation } from "../components/CelebrationAnimation";
import { GameResults } from "../components/GameResults";
import { useGameSession } from "../hooks/useGameSession";
import { useAdaptiveDifficulty } from "../hooks/useAdaptiveDifficulty";
import { AdaptivePacingBadge } from "../components/AdaptivePacingBadge";

// Word lists by level difficulty
const WORD_LISTS: string[][] = [
  ["apple", "chair", "cloud", "table", "water", "light", "happy", "green"], // lv 1-2
  ["river", "storm", "bread", "flame", "music", "stone", "dream", "eagle"], // lv 3-4
  ["thunder", "cabinet", "horizon", "journey", "lantern", "mystery", "pattern", "shelter"], // lv 5-6
  [
    "architect",
    "blueprint",
    "cathedral",
    "discovery",
    "elaborate",
    "framework",
    "glittering",
    "handcrafted",
  ], // 7-10
];

const getWordList = (level: number) => WORD_LISTS[Math.min(Math.floor((level - 1) / 2.5), 3)]!;
const getWordCount = (level: number) => Math.min(3 + Math.floor(level / 2), 7);

type Phase = "study" | "distract" | "recall";

export default function DelayedRecall({ level: initialLevel }: { level: number }) {
  const dda = useAdaptiveDifficulty({
    initialLevel,
    maxLevel: 10,
    minLevel: 1,
    targetSeconds: 20,
    gameId: "delayed-recall",
  });

  const [boardLevel, setBoardLevel] = useState(propLevel);
  useEffect(() => {
    setBoardLevel(propLevel);
  }, [propLevel]);

  const wordCount = Math.min(3 + Math.floor(boardLevel / 2), 8);
  const studyTime = Math.round(
    Math.max(4000, 8000 - boardLevel * 400) * dda.timerMultiplier,
  );
  const distractTime = 5000;

  const [words, setWords] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("study");
  const [distractNum, setDistractNum] = useState(1);
  const [input, setInput] = useState("");
  const [recalled, setRecalled] = useState<{ word: string; isCorrect: boolean }[]>([]);
  const [wordFeedback, setWordFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [synced, setSynced] = useState(false);
  const [offline, setOffline] = useState(false);
  const saved = useRef(false);
  const sessionStart = useRef(Date.now());
  const recallStart = useRef(Date.now());
  const { submitResult } = useGameSession();

  const restartGame = useCallback((lvl = boardLevel) => {
    setBoardLevel(lvl);
    const count = Math.min(3 + Math.floor(lvl / 2), 8);
    const list = getWordList(lvl);
    setWords([...list].sort(() => Math.random() - 0.5).slice(0, count));
    setPhase("study");
    setDistractNum(1);
    setInput("");
    setRecalled([]);
    setWordFeedback(null);
    setSubmitted(false);
    setCompleted(false);
    setSynced(false);
    setOffline(false);
    saved.current = false;
    sessionStart.current = Date.now();
  }, [boardLevel]);

  useEffect(() => {
    restartGame(propLevel);
  }, [propLevel, restartGame]);

  useEffect(() => {
    if (phase === "study") {
      const study = setTimeout(() => setPhase("distract"), studyTime);
      return () => clearTimeout(study);
    }
  }, [phase, studyTime]);

  useEffect(() => {
    if (phase !== "distract") return;
    const interval = setInterval(() => setDistractNum((n) => n + 1), 1000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPhase("recall");
      recallStart.current = Date.now();
    }, distractTime);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phase, distractTime]);

  const addWord = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    if (recalled.some((r) => r.word.toLowerCase() === trimmed)) {
      setWordFeedback({ text: `⚠️ "${trimmed.toUpperCase()}" was already entered!`, isCorrect: false });
      setInput("");
      setTimeout(() => setWordFeedback(null), 1500);
      return;
    }

    const isMatch = words.some((w) => w.toLowerCase() === trimmed);
    const trialDuration = Math.max(1, (Date.now() - recallStart.current) / 1000);
    dda.recordTrial(isMatch, trialDuration);

    setRecalled((r) => [...r, { word: trimmed, isCorrect: isMatch }]);
    setInput("");

    if (isMatch) {
      setWordFeedback({ text: `✓ Right! "${trimmed.toUpperCase()}" is from the study list!`, isCorrect: true });
    } else {
      setWordFeedback({ text: `✗ Wrong! "${trimmed.toUpperCase()}" was not on the list.`, isCorrect: false });
    }
    setTimeout(() => setWordFeedback(null), 1800);
  };

  const submitRecall = () => {
    if (submitted) return;
    setSubmitted(true);
    const correctCount = recalled.filter((r) => r.isCorrect).length;
    const acc = Math.min(100, Math.round((correctCount / wordCount) * 100));
    if (!saved.current) {
      saved.current = true;
      const dur = Math.round((Date.now() - sessionStart.current) / 1000);
      submitResult({
        gameId: "delayed-recall",
        gameType: "delayed_recall",
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
    }
  };

  // Compute un-recalled words for assistance cue
  const unRecalledWords = words.filter(
    (w) => !recalled.some((r) => r.isCorrect && r.word.toLowerCase() === w.toLowerCase()),
  );

  if (completed) {
    const correctCount = recalled.filter((r) => r.isCorrect).length;
    const acc = Math.min(100, Math.round((correctCount / wordCount) * 100));
    return (
      <>
        <CelebrationAnimation show={acc >= 60} />
        <GameResults
          score={acc}
          accuracy={acc}
          durationSeconds={Math.round((Date.now() - sessionStart.current) / 1000)}
          level={activeLevel}
          gameName="Delayed Recall"
          synced={synced}
          offline={offline}
          onPlayAgain={() => restartGame(dda.level)}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3 border-b border-clay/40">
        <AdaptivePacingBadge
          isAdaptiveActive={dda.isAdaptiveActive}
          onToggle={dda.toggleAdaptive}
          adjustment={dda.adjustment}
        />

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full border border-sun/40 bg-sun/10 text-sun font-bold text-xs sm:text-sm">
            Level {boardLevel}
          </span>
          <p className="text-cream/70 text-xs sm:text-sm font-bold">
            Words to Recall: <span className="text-sun font-extrabold">{wordCount}</span>
          </p>
        </div>
      </div>

      {phase === "study" && (
        <div className="text-center space-y-4">
          <p className="text-cream/80 text-sm font-semibold">👀 Memorise these {wordCount} words:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {words.map((w) => (
              <span
                key={w}
                className="px-4 py-2.5 rounded-xl border-2 border-sun bg-sun/15 font-display text-2xl font-black text-sun shadow-md"
              >
                {w}
              </span>
            ))}
          </div>
          <div className="p-2 rounded-xl bg-ink/60 border border-clay/40 text-xs text-cream/60 animate-pulse inline-block">
            Distractor round starts automatically in a few seconds…
          </div>
        </div>
      )}

      {phase === "distract" && (
        <div className="text-center space-y-5 p-6 rounded-2xl bg-ink/60 border border-fire/30 shadow-inner">
          <p className="text-cream/70 text-sm font-medium">Keep rhythm with the number counter:</p>
          <p className="font-display text-8xl font-black text-fire animate-pulse">{distractNum}</p>
          <p className="text-xs text-cream/50 font-semibold">Hold the studied words in memory…</p>
        </div>
      )}

      {phase === "recall" && !submitted && (
        <div className="space-y-5">
          <p className="text-cream/80 text-sm text-center font-medium">
            Type all the words you remember, one by one:
          </p>

          {dda.showAssistanceCue && unRecalledWords.length > 0 && (
            <div className="p-3 rounded-xl bg-sun/15 border border-sun/40 text-sun text-xs font-semibold animate-pulse text-center">
              💡 Gentle Hint: One remaining word starts with "{unRecalledWords[0]?.charAt(0).toUpperCase()}…" ({unRecalledWords[0]?.length} letters)
            </div>
          )}

          {/* Real-time word response banner */}
          {wordFeedback && (
            <div
              className={`py-2 px-4 rounded-xl font-bold text-center text-sm transition-all ${
                wordFeedback.isCorrect
                  ? "bg-tea-confirm/20 border-2 border-tea-confirm text-tea-confirm"
                  : "bg-fire/20 border-2 border-fire text-fire"
              }`}
            >
              {wordFeedback.text}
            </div>
          )}

          <div className="flex gap-2 flex-wrap justify-center min-h-[40px] p-3 rounded-xl bg-ink/50 border border-clay/30">
            {recalled.length === 0 ? (
              <span className="text-cream/30 text-xs italic">Entered words will appear here...</span>
            ) : (
              recalled.map((r, i) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-sm flex items-center gap-1.5 shadow-sm ${
                    r.isCorrect
                      ? "border-tea-confirm bg-tea-confirm/20 text-tea-confirm"
                      : "border-fire bg-fire/20 text-fire line-through"
                  }`}
                >
                  <span>{r.isCorrect ? "✓" : "✗"}</span>
                  <span>{r.word}</span>
                </span>
              ))
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addWord();
              }}
              className="rounded-xl border-2 border-clay bg-ink text-cream font-bold py-3 px-4 w-52 focus:border-sun focus:outline-none text-xl text-center"
              placeholder="Type word…"
              autoFocus
            />
            <button
              onClick={addWord}
              className="px-5 py-3 rounded-xl bg-clay/80 text-cream font-bold hover:bg-clay transition text-base"
            >
              Add Word
            </button>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={submitRecall}
              className="px-8 py-3.5 rounded-xl bg-sun text-ink font-black hover:opacity-90 transition shadow-lg text-lg"
            >
              ✓ Complete & Submit ({recalled.filter((r) => r.isCorrect).length}/{wordCount} found)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

