import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Pill,
  ArrowLeft,
  Check,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  XCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMedications } from "@/hooks/use-medications";
import type { MedicationLogStatus } from "@/types/api";

export const Route = createFileRoute("/medication")({
  head: () => ({
    meta: [
      { title: "Medication & Reminders | SmritiSetu" },
      {
        name: "description",
        content: "Clear daily medication schedules and dosage logs on SmritiSetu.",
      },
    ],
  }),
  component: MedicationPage,
});

import { formatApiError } from "../api/client";
import { useTranslation } from "@/i18n/i18nContext";

function MedicationPage() {
  const { todaySchedules, todayLogs, prescriptions, updateLogStatus, isLoading } = useMedications();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"today" | "prescriptions">("today");

  const totalLogs = todayLogs.length || 1;
  const takenCount = todayLogs.filter((l) => l.status === "taken").length;
  const adherence = Math.round((takenCount / totalLogs) * 100);

  const handleStatusChange = async (logId: string, status: MedicationLogStatus) => {
    try {
      await updateLogStatus({ logId, status });
      toast.success(
        status === "taken"
          ? "Medicine marked as taken. Well done!"
          : status === "skipped"
            ? "Medicine marked as skipped."
            : "Medicine status updated.",
      );
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update medication status"));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavigationHeader />

      <main className="flex-1 mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10 w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button asChild variant="cream" size="touch" className="rounded-2xl shadow-sm">
            <Link to="/">
              <ArrowLeft size={20} className="mr-2" /> {t("common.backHome")}
            </Link>
          </Button>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 bg-surface p-1.5 rounded-2xl border border-clay/60 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition cursor-pointer ${
                activeTab === "today" ? "bg-sun text-ink shadow-sm" : "text-cream/80 hover:bg-clay/40"
              }`}
            >
              {t("medication.todaysDoses")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("prescriptions")}
              className={`px-5 py-2.5 rounded-xl text-sm font-extrabold transition cursor-pointer ${
                activeTab === "prescriptions"
                  ? "bg-sun text-ink shadow-sm"
                  : "text-cream/80 hover:bg-clay/40"
              }`}
            >
              {t("medication.prescriptions")} ({prescriptions.length})
            </button>
          </div>
        </div>

        {/* Page Header & Adherence Card with Cultural Accents */}
        <div className="relative overflow-hidden rounded-3xl border border-clay/60 bg-gradient-to-br from-surface via-[#2B2319] to-surface p-6 sm:p-10 shadow-card">
          <div className="absolute inset-0 pattern-northeast-weave opacity-30 pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-fire via-[#E57A3A] to-sun text-ink shadow-md shrink-0">
                <Pill size={38} />
              </span>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-sun">
                  {t("common.appName")} · {t("navigation.medication")}
                </span>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream tracking-tight">
                  {t("medication.title")}
                </h1>
                <p className="text-cream/80 text-sm sm:text-base font-medium">
                  {t("medication.subtitle")}
                </p>
              </div>
            </div>

            {/* Adherence progress badge */}
            <div className="w-full sm:w-64 bg-ink/70 border border-clay p-4 rounded-xl">
              <div className="flex justify-between text-sm font-bold text-cream mb-2">
                <span>{t("medication.adherenceRate")}</span>
                <span className="text-sun">{adherence}%</span>
              </div>
              <Progress value={adherence} className="h-3 bg-clay [&>div]:bg-tea-confirm" />
              <p className="mt-2 text-xs text-cream/70 text-right">
                {takenCount} / {todayLogs.length} {t("common.completed").toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {activeTab === "today" ? (
          /* Today's Medication Logs Timeline */
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-cream/70 text-lg">
                Loading today’s medication schedule…
              </div>
            ) : todayLogs.length === 0 ? (
              <div className="rounded-2xl border border-clay bg-surface p-12 text-center">
                <Pill size={48} className="mx-auto text-sun/40 mb-4" />
                <h2 className="font-display text-2xl font-bold text-cream">
                  No medications scheduled for today
                </h2>
                <p className="text-cream/70 mt-2">All prescribed routines are up to date.</p>
              </div>
            ) : (
              todayLogs.map((log) => {
                const schedule = todaySchedules.find((s) => s.id === log.schedule_id);
                const isTaken = log.status === "taken";
                const isSkipped = log.status === "skipped";

                return (
                  <article
                    key={log.id}
                    className={`rounded-2xl border-2 p-6 sm:p-8 transition shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
                      isTaken
                        ? "border-tea-confirm bg-surface/90 text-cream"
                        : isSkipped
                          ? "border-clay bg-surface/60 text-cream/60"
                          : "border-fire/80 bg-surface text-cream"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 ${
                          isTaken
                            ? "border-tea-confirm bg-tea-confirm text-cream"
                            : isSkipped
                              ? "border-clay bg-ink text-cream/60"
                              : "border-fire bg-fire text-ink"
                        }`}
                      >
                        {isTaken ? (
                          <Check size={28} strokeWidth={3} />
                        ) : isSkipped ? (
                          <XCircle size={28} />
                        ) : (
                          <Clock size={28} />
                        )}
                      </span>

                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-display text-2xl font-bold text-cream">
                            {schedule?.medicine_name || "Prescribed Medicine"}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                              isTaken
                                ? "bg-tea-confirm/30 text-tea-confirm border border-tea-confirm"
                                : isSkipped
                                  ? "bg-clay/50 text-cream/60 border border-clay"
                                  : "bg-fire/30 text-fire border border-fire"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>

                        <p className="text-sun font-bold mt-1 text-lg">
                          {schedule?.scheduled_time
                            ? schedule.scheduled_time.slice(0, 5)
                            : "10:00 AM"}{" "}
                          · {schedule?.dosage || "1 tablet"}
                        </p>

                        <p className="text-cream/80 text-sm mt-1">
                          Take with a glass of water after meals.
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {isTaken ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(log.id, "scheduled")}
                          className="border border-clay text-cream hover:bg-clay w-full sm:w-auto"
                        >
                          Mark as Not Taken
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="cream"
                            size="touch"
                            onClick={() => handleStatusChange(log.id, "taken")}
                            className="w-full sm:w-auto text-lg font-bold"
                          >
                            <Check size={20} className="mr-2" /> TAKE MEDICINE
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="touch"
                            onClick={() => handleStatusChange(log.id, "skipped")}
                            className="border border-clay text-cream/70 hover:text-cream hover:bg-clay"
                          >
                            Skip
                          </Button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        ) : (
          /* Prescriptions List Tab */
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className="rounded-2xl border border-clay bg-surface p-12 text-center text-cream/70">
                <FileText size={48} className="mx-auto text-sun/40 mb-4" />
                <h2 className="font-display text-2xl font-bold text-cream">
                  No active prescriptions found
                </h2>
                <p className="text-cream/70 mt-2">
                  Your attending doctor will add prescriptions here.
                </p>
              </div>
            ) : (
              prescriptions.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card flex flex-col sm:flex-row justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sun/20 text-sun">
                      <FileText size={24} />
                    </span>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-2xl font-bold text-cream">
                          {p.medicine_name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-tea-confirm/30 text-tea-confirm border border-tea-confirm">
                          {p.status}
                        </span>
                      </div>
                      <p className="text-sun font-bold mt-1 text-base">
                        Dosage: {p.dosage} ({p.route || "Oral"})
                      </p>
                      {p.instructions && (
                        <p className="text-cream/90 text-sm mt-2 max-w-xl">
                          <span className="font-bold text-cream">Instructions:</span>{" "}
                          {p.instructions}
                        </p>
                      )}
                      <p className="text-xs text-cream/60 mt-2 flex items-center gap-1.5">
                        <Calendar size={14} /> Started: {p.start_date}
                        {p.end_date ? ` · Ends: ${p.end_date}` : " · Ongoing"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
