import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  Pill,
  Volume2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import profilePhoto from "@/assets/profile-lalita.jpg";
import memoryPhotos from "@/assets/memory-triptych.jpg";
import { Button } from "@/components/ui/button";
import { NavigationHeader } from "@/components/navigation-header";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useMedications } from "@/hooks/use-medications";
import { useGames } from "@/hooks/use-games";
import { useTranslation } from "@/i18n/i18nContext";
import { formatApiError } from "@/api/client";
import { voiceApi } from "@/api/voice.api";
import { translationApi } from "@/api/translation.api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home | SmritiSetu" },
      {
        name: "description",
        content:
          "SmritiSetu: Cognitive assistance, multilingual voice, and elder care companion for North Eastern India.",
      },
      { property: "og:title", content: "Home | SmritiSetu" },
      {
        property: "og:description",
        content: "A warm daily companion for memory games, medicine, and routines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const { t } = useTranslation();
  const { todayTasks, completeTask, isLoading: tasksLoading } = useTasks();
  const { todayLogs, todaySchedules, updateLogStatus, isLoading: medsLoading } = useMedications();
  const { summary: gameSummary } = useGames();

  // Auto-login as Lalita (Patient) if not logged in to give instant friendly access
  useEffect(() => {
    if (!isAuthenticated) {
      demoLogin("patient").catch(() => {});
    }
  }, [isAuthenticated, demoLogin]);

  // Next scheduled medication
  const nextScheduledLog = todayLogs.find((l) => l.status === "scheduled") || todayLogs[0];
  const matchingSchedule = nextScheduledLog
    ? todaySchedules.find((s) => s.id === nextScheduledLog.schedule_id)
    : todaySchedules[0];

  const isMedicineTaken = nextScheduledLog ? nextScheduledLog.status === "taken" : false;

  // Real Progress Calculation
  const totalTasksCount = todayTasks.length;
  const completedTasksCount = todayTasks.filter((t) => t.status === "completed").length;
  const totalMedsCount = todayLogs.length || 1;
  const completedMedsCount = todayLogs.filter((l) => l.status === "taken").length;

  const totalItems = totalTasksCount + totalMedsCount;
  const completedItems = completedTasksCount + completedMedsCount;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Today's formatted date string
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const handleToggleMedicine = async () => {
    if (!nextScheduledLog) {
      toast.info("No active medication log found for today.");
      return;
    }
    const newStatus = isMedicineTaken ? "scheduled" : "taken";
    try {
      await updateLogStatus({
        logId: nextScheduledLog.id,
        status: newStatus,
        ...(newStatus === "taken" ? { notes: "Confirmed taken by patient on home screen" } : {}),
      });
      toast.success(
        newStatus === "taken"
          ? "Great job! Medicine marked as taken."
          : "Medicine marked as scheduled.",
      );
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update medication status"));
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update task"));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Central Accessible Navigation Header */}
      <NavigationHeader progress={progress} />

      <main className="flex-1 mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-8 sm:pt-10 w-full space-y-8">
        {/* Cultural Welcome Banner & Reassuring Greeting */}
        <section className="relative overflow-hidden rounded-3xl border border-clay/60 bg-gradient-to-br from-surface via-[#2B2319] to-surface p-6 sm:p-10 shadow-card">
          {/* Subtle decorative background pattern */}
          <div className="absolute inset-0 pattern-northeast-weave opacity-40 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              {/* Cultural Region Badge */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sun/20 text-sun border border-sun/40 shadow-xs">
                  <Sparkles size={13} className="text-sun animate-pulse" />
                  নমস্কাৰ · नमस्ते · SmritiSetu
                </span>
                <span className="text-cream/60">·</span>
                <span className="text-sun font-extrabold tracking-widest">{todayFormatted}</span>
              </div>

              <h1 className="font-display text-4xl font-bold leading-tight text-cream sm:text-6xl tracking-tight">
                {t("dashboard.greeting")}, {user?.name?.split(" ")[0] || "Lalita"} <span aria-hidden="true">🌿</span>
              </h1>

              <p className="text-lg sm:text-xl text-cream/85 leading-relaxed font-medium">
                {t("dashboard.greetingSub")}
              </p>
            </div>

            {/* Daily Wellness Summary & Voice Assistant Trigger */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              {/* Wellness Progress Capsule */}
              <div className="rounded-2xl border border-clay/60 bg-ink/75 p-4 sm:p-5 shadow-inner backdrop-blur-sm min-w-[220px]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cream/70">
                    {t("dashboard.wellnessBadge")}
                  </span>
                  <span className="text-sm font-extrabold text-sun">{progress}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-clay/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sun via-amber-400 to-tea-confirm transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-cream/60 font-medium">
                  {completedItems} / {totalItems} {t("common.completed").toLowerCase()}
                </p>
              </div>

              {/* Quick Multilingual Voice Prompt */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("cucove:open-voice"))}
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-sun via-amber-400 to-sun text-ink font-extrabold text-sm shadow-md hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                title="Speak to Voice Assistant in Assamese, Hindi, Bengali, or English"
              >
                <Volume2 size={18} />
                <span>{t("dashboard.voicePromptTitle")}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Cognitive Games Highlight Card */}
        <section aria-labelledby="games-title">
          <Link
            to="/games"
            className="group grid min-h-96 overflow-hidden rounded-3xl bg-gradient-to-br from-sun via-[#E8B83D] to-[#D69E26] text-ink shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-active active:translate-y-0 lg:grid-cols-[1.1fr_.9fr] border border-amber-300/40"
          >
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12 relative z-10">
              <div className="flex items-center gap-3 text-sm sm:text-base font-extrabold uppercase tracking-wider text-ink/80">
                <span className="p-2 rounded-xl bg-ink/10 border border-ink/15">
                  <Brain size={24} aria-hidden="true" />
                </span>
                <span>{t("games.hubTitle")}</span>
              </div>
              <p className="mt-5 text-sm font-bold uppercase tracking-widest text-ink/75">
                {t("dashboard.dailyChallenge").toUpperCase()}
              </p>
              <h2 id="games-title" className="mt-1 font-display text-4xl font-bold sm:text-6xl tracking-tight">
                Memory Match
              </h2>
              <p className="mt-3 max-w-xl text-lg sm:text-xl leading-relaxed text-ink/90 font-medium">
                {gameSummary?.total_sessions
                  ? `You've completed ${gameSummary.total_sessions} cognitive exercises with an average accuracy of ${Math.round(gameSummary.average_accuracy)}%. Keep your memory active today!`
                  : t("dashboard.dailyChallengeDesc")}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="inline-flex min-h-14 items-center gap-3 rounded-2xl bg-ink px-8 text-lg font-extrabold text-cream shadow-md transition group-hover:bg-surface group-hover:scale-105">
                  {t("dashboard.playNow").toUpperCase()} <ArrowRight size={22} aria-hidden="true" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
                  ~3 {t("games.estimatedTime")} · {t("games.level")} 1
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-ink/10 p-7 sm:p-10 items-center justify-center">
              {["☕", "🌼", "🔑", "☕"].map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="flex min-h-28 sm:min-h-32 items-center justify-center rounded-2xl border-4 border-ink/20 bg-cream text-5xl sm:text-6xl shadow-md transition-transform group-hover:animate-gentle-float"
                  style={{ animationDelay: `${index * 140}ms` }}
                >
                  {item}
                </span>
              ))}
            </div>
          </Link>
        </section>

        {/* 2-Column Grid: Medication Card & Memories Card */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Real Backend Medication Card */}
          <article
            className={`relative flex min-h-[380px] flex-col justify-between rounded-3xl p-7 sm:p-9 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-active border ${
              isMedicineTaken
                ? "bg-gradient-to-br from-tea-confirm via-[#316938] to-tea-confirm text-cream border-tea-confirm/60"
                : "bg-gradient-to-br from-fire via-[#DE6E2F] to-[#C95B1E] text-ink border-amber-500/40"
            }`}
          >
            <Link
              to="/medication"
              className="absolute inset-0 rounded-3xl z-0"
              aria-label="Open detailed medication page"
            />

            <div className="relative z-10 pointer-events-none flex items-center justify-between">
              <div className="flex items-center gap-3 text-lg sm:text-xl font-extrabold uppercase tracking-wide">
                <span className="p-2 rounded-xl bg-black/15">
                  <Pill size={28} aria-hidden="true" />
                </span>
                <span>{t("navigation.medication")}</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                isMedicineTaken ? "bg-cream/20 text-cream" : "bg-ink/20 text-ink"
              }`}>
                {isMedicineTaken ? "✓ " + t("common.completed") : "⏰ " + t("common.pending")}
              </span>
            </div>

            {isMedicineTaken ? (
              <div className="relative z-10 pointer-events-none flex flex-1 flex-col items-center justify-center text-center py-6">
                <span className="flex size-20 items-center justify-center rounded-full bg-cream text-tea-confirm shadow-md">
                  <Check size={48} strokeWidth={3.5} aria-hidden="true" />
                </span>
                <h2 className="mt-4 font-display text-4xl font-bold">{t("medication.takenSuccess")}</h2>
                <p className="mt-2 text-lg max-w-sm font-medium opacity-90">
                  {matchingSchedule?.medicine_name || "Medicine"} — {t("common.completed")}
                </p>
              </div>
            ) : (
              <div className="relative z-10 pointer-events-none flex flex-1 flex-col justify-end py-6">
                <p className="font-display text-5xl sm:text-6xl font-bold tracking-tight">
                  {matchingSchedule?.scheduled_time
                    ? matchingSchedule.scheduled_time.slice(0, 5)
                    : "10:00 AM"}
                </p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold">
                  {matchingSchedule?.medicine_name || "Donepezil"}
                </h2>
                <p className="mt-2 text-lg opacity-90 font-medium">
                  {matchingSchedule?.dosage || "5mg - 1 tablet"}
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="cream"
              size="touch"
              className="relative z-20 mt-3 w-full text-lg font-extrabold shadow-md rounded-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition"
              onClick={handleToggleMedicine}
            >
              {isMedicineTaken ? (
                <>
                  <RefreshCw size={20} className="mr-2" /> {t("medication.markSkipped").toUpperCase()}
                </>
              ) : (
                <>
                  {t("medication.markTaken").toUpperCase()} <ArrowRight size={22} className="ml-2" aria-hidden="true" />
                </>
              )}
            </Button>
          </article>

          {/* Memories Card */}
          <Link
            to="/memories"
            className="group min-h-[380px] overflow-hidden rounded-3xl bg-surface text-cream shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-active flex flex-col justify-between border border-clay/60 hover:border-sun/60"
          >
            <div className="p-7 sm:p-9 pb-3">
              <div className="flex items-center gap-3 text-lg sm:text-xl font-extrabold uppercase text-sun">
                <span className="p-2 rounded-xl bg-sun/15 border border-sun/30">
                  <Brain size={28} aria-hidden="true" />
                </span>
                <span>{t("navigation.memories")}</span>
              </div>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold">
                {t("memories.title")}
              </h2>
              <p className="mt-1 text-sm text-cream/70 font-medium">
                {t("memories.subtitle")}
              </p>
            </div>
            <div className="relative overflow-hidden mx-6 sm:mx-8 rounded-2xl border border-clay/40">
              <img
                src={memoryPhotos}
                alt="Family members and familiar hillside home"
                loading="lazy"
                width={1536}
                height={768}
                className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <div className="flex min-h-16 items-center justify-between px-7 sm:px-9 text-lg font-extrabold text-sun border-t border-clay/40 mt-4">
              <span>{t("dashboard.openAlbum").toUpperCase()}</span>
              <ArrowRight
                className="transition-transform group-hover:translate-x-2"
                aria-hidden="true"
              />
            </div>
          </Link>
        </div>

        {/* Real Backend Daily Routine Section */}
        <section
          className="rounded-3xl bg-surface p-6 sm:p-10 shadow-card border border-clay/60 space-y-6"
          aria-labelledby="routine-title"
        >
          <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-clay/40">
            <div>
              <div className="flex items-center gap-2.5 text-sm font-extrabold uppercase text-sun tracking-wider">
                <CalendarDays size={20} aria-hidden="true" />
                <span>{t("navigation.routine")}</span>
              </div>
              <h2 id="routine-title" className="mt-1 font-display text-3xl sm:text-4xl font-bold text-cream">
                {t("routine.title")}
              </h2>
            </div>
            <Link
              to="/routine"
              className="flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-extrabold text-sun hover:bg-clay/40 border border-sun/30 transition"
            >
              {t("common.viewAll").toUpperCase()} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {tasksLoading ? (
              <p className="col-span-full py-8 text-center text-cream/70 text-lg">
                Loading today’s schedule…
              </p>
            ) : todayTasks.length === 0 ? (
              <p className="col-span-full py-8 text-center text-cream/70 text-lg">
                No routine activities scheduled yet for today.
              </p>
            ) : (
              todayTasks.map((task) => {
                const isDone = task.status === "completed";
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    aria-pressed={isDone}
                    className={`min-h-28 h-auto whitespace-normal rounded-2xl border-2 p-4 text-left transition-all duration-200 cursor-pointer ${
                      isDone
                        ? "border-tea-confirm bg-tea-confirm/20 text-cream shadow-sm"
                        : "border-clay bg-ink/80 text-cream hover:border-sun/80 hover:bg-ink"
                    }`}
                  >
                    <span className="flex w-full items-start gap-3">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          isDone
                            ? "border-tea-confirm bg-tea-confirm text-cream"
                            : "border-cream/60 text-transparent"
                        }`}
                      >
                        {isDone && <Check size={18} strokeWidth={3.5} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block text-base font-bold truncate ${isDone ? "line-through opacity-70" : ""}`}
                        >
                          {task.title}
                        </span>
                        <span className="mt-1 block text-xs opacity-75 font-semibold text-sun">
                          {task.scheduled_time.slice(0, 5)}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
