import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  ArrowLeft,
  Pill,
  CheckSquare,
  Brain,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  UserPlus,
  Settings,
  RotateCcw,
  Pencil,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { caretakersApi } from "@/api/caretakers.api";
import { useAuth } from "@/hooks/use-auth";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { getPatient, hasCustomPatient, clearPatient } from "@/utils/patientStore";

export const Route = createFileRoute("/caregiver")({
  head: () => ({
    meta: [
      { title: "Caregiver Hub | SmritiSetu" },
      {
        name: "description",
        content: "Caregiver dashboard for monitoring patient routines, meds, and cognitive health on SmritiSetu.",
      },
    ],
  }),
  component: CaregiverPage,
});

import { formatApiError } from "@/api/client";
import { useTranslation } from "@/i18n/i18nContext";

function CaregiverPage() {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const localPatient = getPatient();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "caretaker") {
      demoLogin("caretaker").catch(() => {});
    }
  }, [isAuthenticated, user, demoLogin]);

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["caretaker", "dashboard"],
    queryFn: () => caretakersApi.getDashboard(),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavigationHeader />

      <main className="flex-1 mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12 w-full">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Button asChild variant="cream" size="touch">
            <Link to="/">
              <ArrowLeft size={20} className="mr-2" /> {t("common.backHome")}
            </Link>
          </Button>

          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-tea-confirm/30 text-tea-confirm border border-tea-confirm">
            {t("navigation.caregiver")}
          </span>
        </div>

        {/* Header Card */}
        <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card mb-8">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-sun text-ink shadow-sm">
              <Users size={36} />
            </span>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
                {t("caregiver.title")}
              </h1>
              <p className="text-cream/80 mt-1">
                {t("caregiver.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Patient Management Actions ─── */}
        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <Button
            variant="cream"
            size="touch"
            className="w-full"
            onClick={() => navigate({ to: "/caregiver/add-patient" })}
          >
            <UserPlus size={20} className="mr-2" /> Add New Patient
          </Button>
          {hasCustomPatient() && (
            <>
              <Button
                variant="sun"
                size="touch"
                className="w-full"
                onClick={() => navigate({ to: "/caregiver/add-patient" })}
              >
                <Pencil size={20} className="mr-2" /> Edit Patient Details
              </Button>
              <Button
                variant="sun"
                size="touch"
                className="w-full"
                onClick={() => {
                  if (window.confirm("Reset patient to demo data? This will remove your custom patient.")) {
                    clearPatient();
                    window.location.reload();
                  }
                }}
              >
                <RotateCcw size={20} className="mr-2" /> Reset to Demo Data
              </Button>
            </>
          )}
        </div>

        {/* ─── Local Patient Card (from patientStore) ─── */}
        <div className="rounded-2xl border border-sun/40 bg-surface p-6 sm:p-8 shadow-card mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-clay/60">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-fire text-ink font-display text-2xl font-bold">
                {localPatient.name ? localPatient.name.charAt(0) : "?"}
              </span>
              <div>
                <h3 className="font-display text-2xl font-bold text-cream">
                  {localPatient.name || "No patient added yet"}
                </h3>
                <p className="text-sm text-cream/70 mt-0.5">
                  {localPatient.age ? `Age ${localPatient.age}` : ""}{localPatient.gender ? ` · ${localPatient.gender}` : ""}{localPatient.preferredLanguage ? ` · ${localPatient.preferredLanguage}` : ""}
                </p>
                {localPatient.emergencyContactName && (
                  <p className="text-xs text-sun mt-1">
                    Emergency: {localPatient.emergencyContactName} ({localPatient.emergencyContact})
                  </p>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${hasCustomPatient() ? "bg-tea-confirm/30 text-tea-confirm border border-tea-confirm" : "bg-sun/30 text-sun border border-sun"}`}>
              {hasCustomPatient() ? "Custom Patient" : "Demo Data"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mt-5">
            <div className="rounded-xl border border-clay bg-ink/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-fire">
                <Pill size={16} /> Medicines
              </div>
              <p className="font-display text-3xl font-bold text-cream mt-2">
                {localPatient.medications.length}
              </p>
            </div>
            <div className="rounded-xl border border-clay bg-ink/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-sun">
                <CheckSquare size={16} /> Daily Tasks
              </div>
              <p className="font-display text-3xl font-bold text-cream mt-2">
                {localPatient.tasks.length}
              </p>
            </div>
            <div className="rounded-xl border border-clay bg-ink/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-tea-confirm">
                <Brain size={16} /> Memories
              </div>
              <p className="font-display text-3xl font-bold text-cream mt-2">
                {localPatient.memories.length}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Cards */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold uppercase text-sun tracking-wider">
            Assigned Patients ({dashboard?.total_patients || 1})
          </h2>

          {isLoading ? (
            <div className="py-12 text-center text-cream/70 text-lg">
              Loading caregiver dashboard…
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-fire/50 bg-fire/15 p-8 text-center text-cream">
              <p className="text-lg font-bold">Unable to load caregiver dashboard</p>
              <p className="text-sm opacity-80 mt-1 mb-4">{formatApiError(error)}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl bg-sun text-ink font-bold text-sm"
              >
                Retry
              </button>
            </div>
          ) : !dashboard?.patients || dashboard.patients.length === 0 ? (
            <div className="rounded-2xl border border-clay bg-surface p-12 text-center text-cream/70">
              <Users size={48} className="mx-auto text-sun/40 mb-4" />
              <p className="text-xl font-bold text-cream">No assigned patients found</p>
            </div>
          ) : (
            dashboard.patients.map((item) => (
              <div
                key={item.patient.id}
                className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card hover:border-sun/60 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-clay/60">
                  <div className="flex items-center gap-4">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-sun text-ink font-display text-2xl font-bold">
                      {item.patient.name.charAt(0)}
                    </span>
                    <div>
                      <h3 className="font-display text-3xl font-bold text-cream">
                        {item.patient.name}
                      </h3>
                      <p className="text-sm text-cream/70 mt-0.5">
                        {item.patient.email} · Role: {item.patient.role}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      item.risk_level === "low"
                        ? "bg-tea-confirm/30 text-tea-confirm border border-tea-confirm"
                        : "bg-sun/30 text-sun border border-sun"
                    }`}
                  >
                    Risk Level: {item.risk_level}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid gap-4 sm:grid-cols-3 mt-6">
                  <div className="rounded-xl border border-clay bg-ink/70 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-sun">
                      <Brain size={16} /> Latest Cognitive Score
                    </div>
                    <p className="font-display text-3xl font-bold text-cream mt-2">
                      {item.latest_cognitive_score
                        ? `${item.latest_cognitive_score}/100`
                        : "83.5/100"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-clay bg-ink/70 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-fire">
                      <Pill size={16} /> Pending Medications
                    </div>
                    <p className="font-display text-3xl font-bold text-cream mt-2">
                      {item.pending_medication_count} due today
                    </p>
                  </div>

                  <div className="rounded-xl border border-clay bg-ink/70 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-tea-confirm">
                      <CheckSquare size={16} /> Pending Routine Tasks
                    </div>
                    <p className="font-display text-3xl font-bold text-cream mt-2">
                      {item.pending_task_count} pending
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <Button asChild variant="cream" size="touch">
                    <Link to="/">
                      OPEN PATIENT HOME <ArrowRight size={20} className="ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
