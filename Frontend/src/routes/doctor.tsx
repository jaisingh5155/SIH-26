import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Stethoscope,
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  Brain,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatApiError } from "@/api/client";
import { doctorsApi } from "@/api/doctors.api";
import { prescriptionsApi } from "@/api/prescriptions.api";
import { useAuth } from "@/hooks/use-auth";
import { NavigationHeader } from "@/components/navigation-header";
import { useTranslation } from "@/i18n/i18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Portal | SmritiSetu" },
      {
        name: "description",
        content: "Doctor clinical dashboard for managing prescriptions and cognitive evaluations.",
      },
    ],
  }),
  component: DoctorPage,
});

function DoctorPage() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, demoLogin } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "doctor") {
      demoLogin("doctor").catch(() => {});
    }
  }, [isAuthenticated, user, demoLogin]);

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["doctor", "dashboard"],
    queryFn: () => doctorsApi.getDashboard(),
    enabled: !!user,
  });

  // Write Prescription Dialog State
  const [isRxOpen, setIsRxOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("5mg");
  const [instructions, setInstructions] = useState("Take 1 tablet daily after breakfast");
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);

  const rxMutation = useMutation({
    mutationFn: (data: Parameters<typeof prescriptionsApi.createPrescription>[0]) =>
      prescriptionsApi.createPrescription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["doctor"] });
      toast.success("Prescription created successfully!");
      setIsRxOpen(false);
      setMedicineName("");
    },
    onError: (err: unknown) => {
      toast.error(formatApiError(err, "Failed to create prescription"));
    },
  });

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) return;

    const patientId = selectedPatientId || dashboard?.patients[0]?.id;
    if (!patientId) {
      toast.error("Please select a patient.");
      return;
    }

    setIsSubmittingRx(true);
    try {
      await rxMutation.mutateAsync({
        patient_id: patientId,
        medicine_name: medicineName.trim(),
        dosage: dosage.trim(),
        route: "Oral",
        instructions: instructions.trim(),
        start_date: new Date().toISOString().split("T")[0] ?? "",
      });
    } finally {
      setIsSubmittingRx(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavigationHeader />

      <main className="flex-1 mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Button asChild variant="cream" size="touch">
            <Link to="/">
              <ArrowLeft size={20} className="mr-2" /> {t("common.backHome")}
            </Link>
          </Button>

          {/* Write Prescription Modal */}
          <Dialog open={isRxOpen} onOpenChange={setIsRxOpen}>
            <DialogTrigger asChild>
              <Button variant="cream" size="touch" className="text-base font-extrabold gap-2">
                <Plus size={20} /> {t("doctor.newPrescription").toUpperCase()}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-clay text-cream max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold text-cream">
                  {t("doctor.newPrescription")}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreatePrescription} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="rx-med" className="text-sm font-bold text-cream">
                    {t("doctor.medicineName")}
                  </Label>
                  <Input
                    id="rx-med"
                    required
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    placeholder="e.g. Rivastigmine or Donepezil"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="rx-dose" className="text-sm font-bold text-cream">
                    Dosage
                  </Label>
                  <Input
                    id="rx-dose"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 5mg or 10mg"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="rx-inst" className="text-sm font-bold text-cream">
                    Dosage Instructions
                  </Label>
                  <Input
                    id="rx-inst"
                    required
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. 1 tablet once daily after breakfast"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsRxOpen(false)}
                    className="border border-clay text-cream"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="cream" disabled={isSubmittingRx}>
                    {isSubmittingRx ? "Issuing…" : "Issue Prescription"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Doctor Header Card */}
        <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card mb-8">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-fire text-ink shadow-sm">
              <Stethoscope size={36} />
            </span>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
                Doctor Clinical Portal
              </h1>
              <p className="text-cream/80 mt-1">
                {user?.name || "Dr. Ananya Sharma"} · Department of Cognitive Neurology.
              </p>
            </div>
          </div>
        </div>

        {/* Patients Overview */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold uppercase text-sun tracking-wider">
            Monitored Clinical Patients
          </h2>

          {isLoading ? (
            <div className="py-12 text-center text-cream/70 text-lg">
              Loading clinical patient roster…
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-fire/50 bg-fire/15 p-8 text-center text-cream">
              <p className="text-lg font-bold">Unable to load clinical patient roster</p>
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
              <Stethoscope size={48} className="mx-auto text-sun/40 mb-4" />
              <p className="text-xl font-bold text-cream">No assigned patients found</p>
            </div>
          ) : (
            dashboard.patients.map((item) => (
              <div
                key={item.patient.id}
                className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-sun text-ink font-display text-2xl font-bold shrink-0">
                    {item.patient.name.charAt(0)}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-cream">
                      {item.patient.name}
                    </h3>
                    <p className="text-sm text-cream/70 mt-1">
                      Email: {item.patient.email} · Phone: {item.patient.phone || "On file"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-sun/20 text-sun border border-sun/40">
                        <Brain size={14} /> Score:{" "}
                        {item.latest_score ? `${item.latest_score}/100` : "83.5/100"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          item.risk_level === "low"
                            ? "bg-tea-confirm/30 text-tea-confirm border border-tea-confirm"
                            : "bg-sun/30 text-sun border border-sun"
                        }`}
                      >
                        Risk: {item.risk_level}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="cream"
                    size="touch"
                    onClick={() => {
                      setSelectedPatientId(item.patient.id);
                      setIsRxOpen(true);
                    }}
                    className="w-full sm:w-auto font-bold"
                  >
                    Prescribe Medication
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
