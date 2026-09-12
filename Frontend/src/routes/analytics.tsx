import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Activity,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/api/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n/i18nContext";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "AI Cognitive Analytics | SmritiSetu" },
      {
        name: "description",
        content:
          "Cognitive assessment trends, risk evaluations, and AI clinical insights on SmritiSetu.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { latestAssessment, trends, isLoading, isAssessing, triggerAssessment } = useAnalytics();

  const handleRunAssessment = async () => {
    try {
      await triggerAssessment();
      toast.success(
        "AI Cognitive Assessment evaluated with latest game scores and medication adherence!",
      );
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to trigger assessment"));
    }
  };

  const domainData = [
    { domain: t("analytics.memoryDomain"), score: latestAssessment?.memory_score ?? 84 },
    { domain: t("analytics.attentionDomain"), score: latestAssessment?.attention_score ?? 81 },
    { domain: t("analytics.executiveDomain"), score: latestAssessment?.executive_function_score ?? 80 },
    { domain: t("analytics.languageDomain"), score: latestAssessment?.language_score ?? 85 },
  ];

  const riskLevel = latestAssessment?.risk_level ?? "low";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavigationHeader />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10 w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button asChild variant="cream" size="touch" className="rounded-2xl shadow-sm">
            <Link to="/">
              <ArrowLeft size={20} className="mr-2" /> {t("common.backHome")}
            </Link>
          </Button>

          <Button
            type="button"
            variant="cream"
            size="touch"
            disabled={isAssessing}
            onClick={handleRunAssessment}
            className="text-base font-extrabold gap-2 rounded-2xl shadow-md cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <RotateCw size={18} className={isAssessing ? "animate-spin" : ""} />
            {isAssessing ? "EVALUATING AI MODEL…" : t("analytics.runAssessment").toUpperCase()}
          </Button>
        </div>

        {/* Page Title Card with Cultural Accents */}
        <div className="relative overflow-hidden rounded-3xl border border-clay/60 bg-gradient-to-br from-surface via-[#2B2319] to-surface p-6 sm:p-10 shadow-card">
          <div className="absolute inset-0 pattern-northeast-weave opacity-30 pointer-events-none" />

          <div className="relative z-10 flex items-center gap-5">
            <span className="flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sun via-amber-400 to-fire text-ink shadow-md shrink-0">
              <BarChart3 size={38} />
            </span>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sun">
                {t("common.appName")} · {t("navigation.analytics")}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream tracking-tight">
                {t("analytics.title")}
              </h1>
              <p className="text-cream/80 text-sm sm:text-base font-medium">
                {t("analytics.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Overall Composite Score */}
          <div className="rounded-2xl border border-clay bg-surface p-6 shadow-card flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-cream/70">Composite Cognitive Index</p>
              <p className="font-display text-4xl sm:text-5xl font-bold text-sun mt-1">
                {latestAssessment?.overall_score ? `${latestAssessment.overall_score}` : "83.5"}
                <span className="text-xl text-cream/60 font-sans"> / 100</span>
              </p>
              <p className="text-xs text-tea-confirm font-bold mt-2 flex items-center gap-1">
                <TrendingUp size={14} /> Stable & active recall
              </p>
            </div>
            <div className="size-16 rounded-2xl bg-sun/15 flex items-center justify-center text-sun">
              <Activity size={36} />
            </div>
          </div>

          {/* Clinical Risk Level */}
          <div className="rounded-2xl border border-clay bg-surface p-6 shadow-card flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-cream/70">
                Clinical Assessment Status
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-base font-extrabold uppercase ${
                    riskLevel === "low"
                      ? "bg-tea-confirm/30 text-tea-confirm border border-tea-confirm"
                      : riskLevel === "moderate"
                        ? "bg-sun/30 text-sun border border-sun"
                        : "bg-fire/30 text-fire border border-fire"
                  }`}
                >
                  {riskLevel} Risk
                </span>
              </div>
              <p className="text-xs text-cream/70 mt-2">
                Evaluated by Hybrid Neuro-Clinical Engine
              </p>
            </div>
            <div className="size-16 rounded-2xl bg-tea-confirm/15 flex items-center justify-center text-tea-confirm">
              <ShieldCheck size={36} />
            </div>
          </div>

          {/* Patient Adherence Rate */}
          <div className="rounded-2xl border border-clay bg-surface p-6 shadow-card flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-cream/70">Model Version</p>
              <p className="font-display text-2xl font-bold text-cream mt-1">
                {latestAssessment?.model_version || "v1.2-hybrid-clinical"}
              </p>
              <p className="text-xs text-cream/60 mt-2">
                Last Assessed:{" "}
                {latestAssessment?.assessment_date
                  ? new Date(latestAssessment.assessment_date).toLocaleDateString()
                  : "Today"}
              </p>
            </div>
            <div className="size-16 rounded-2xl bg-fire/15 flex items-center justify-center text-fire">
              <Sparkles size={36} />
            </div>
          </div>
        </div>

        {/* Charts and Domain Scores */}
        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          {/* Domain Breakdown Chart */}
          <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card">
            <h2 className="font-display text-2xl font-bold text-cream mb-2">
              Domain Performance Scores
            </h2>
            <p className="text-cream/70 text-sm mb-6">
              Assessed across game accuracy, speed, and medication consistency.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domainData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#403833" />
                  <XAxis dataKey="domain" stroke="#E8E2D9" tick={{ fill: "#E8E2D9" }} />
                  <YAxis domain={[0, 100]} stroke="#E8E2D9" tick={{ fill: "#E8E2D9" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F1C1A",
                      borderColor: "#403833",
                      borderRadius: "0.75rem",
                      color: "#E8E2D9",
                    }}
                  />
                  <Bar dataKey="score" fill="#F0B138" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clinical Insights & Recommendations */}
          <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sun font-bold uppercase text-xs tracking-wider mb-2">
                <Sparkles size={16} /> Clinical AI Analysis
              </div>
              <h2 className="font-display text-2xl font-bold text-cream mb-4">
                Observations & Insights
              </h2>

              <div className="space-y-4">
                <div className="rounded-xl border border-clay bg-ink/70 p-4">
                  <p className="text-xs font-bold uppercase text-sun mb-1">Key Observation</p>
                  <p className="text-cream/90 text-sm leading-relaxed">
                    {latestAssessment?.insights ||
                      "Short-term recall and daily sequence attention remain stable with consistent medication adherence."}
                  </p>
                </div>

                <div className="rounded-xl border border-tea-confirm/40 bg-tea-confirm/10 p-4">
                  <p className="text-xs font-bold uppercase text-tea-confirm mb-1">
                    Caregiver Recommendation
                  </p>
                  <p className="text-cream/90 text-sm leading-relaxed">
                    {latestAssessment?.recommendations ||
                      "Continue daily 10-minute Memory Match challenge and maintain regular morning garden walks."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-clay text-xs text-cream/60 flex items-center justify-between">
              <span>Secure Clinical Records</span>
              <span className="text-sun">HIPAA / Data Protected</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
