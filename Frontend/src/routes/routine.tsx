import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  ArrowLeft,
  Check,
  Plus,
  Clock,
  AlertCircle,
  Sparkles,
  Trash2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { formatApiError } from "@/api/client";
import { NavigationHeader } from "@/components/navigation-header";
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
import { useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n/i18nContext";
import type { TaskPriority } from "@/types/api";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Daily Routine | SmritiSetu" },
      {
        name: "description",
        content: "Reassuring, structured daily activities and reminders on SmritiSetu.",
      },
    ],
  }),
  component: RoutinePage,
});

function RoutinePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { tasks, todayTasks, createTask, completeTask, deleteTask, isLoading } = useTasks();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  // Add Task Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTasks = todayTasks.filter((t) => {
    if (filter === "pending") return t.status === "pending";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const handleToggleTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update activity"));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!user) {
      toast.error("Please sign in to add a routine activity.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask({
        patient_id: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_time: scheduledTime.length === 5 ? `${scheduledTime}:00` : scheduledTime,
        priority,
        recurrence: "daily",
        start_date: new Date().toISOString().split("T")[0] ?? "",
      });
      toast.success("New routine activity added!");
      setIsAddOpen(false);
      setTitle("");
      setDescription("");
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to add activity"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success("Activity removed.");
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to remove activity"));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavigationHeader />

      <main className="flex-1 mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12 w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Button asChild variant="cream" size="touch">
            <Link to="/">
              <ArrowLeft size={20} className="mr-2" /> {t("common.backHome")}
            </Link>
          </Button>

          {/* Add Activity Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="cream" size="touch" className="text-base font-extrabold">
                <Plus size={20} className="mr-2" /> {t("routine.addActivity").toUpperCase()}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-clay text-cream max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold text-cream">
                  {t("routine.addActivity")}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="task-title" className="text-sm font-bold text-cream">
                    {t("routine.activityName")}
                  </Label>
                  <Input
                    id="task-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Afternoon Tea with Family"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="task-time" className="text-sm font-bold text-cream">
                    {t("routine.scheduledTime")}
                  </Label>
                  <Input
                    id="task-time"
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="task-desc" className="text-sm font-bold text-cream">
                    Notes / Description (Optional)
                  </Label>
                  <Input
                    id="task-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Sit in the balcony garden"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold text-cream mb-1 block">Priority Level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "normal", "high"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 rounded-lg text-xs font-bold uppercase transition ${
                          priority === p
                            ? "bg-sun text-ink shadow-sm"
                            : "bg-ink border border-clay text-cream hover:bg-clay"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddOpen(false)}
                    className="border border-clay text-cream"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="cream" disabled={isSubmitting}>
                    {isSubmitting ? "Saving…" : "Save Activity"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Page Title Card */}
        <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card mb-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-sun text-ink shadow-sm">
                <CalendarDays size={36} />
              </span>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
                  Today’s Routine
                </h1>
                <p className="text-cream/80 mt-1">
                  A steady, predictable routine creates calm and confidence.
                </p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-ink/70 p-1.5 rounded-xl border border-clay">
              {(["all", "pending", "completed"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition ${
                    filter === f ? "bg-sun text-ink shadow-sm" : "text-cream hover:bg-clay"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-cream/70 text-lg">Loading daily routine…</div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-clay bg-surface p-12 text-center text-cream/70">
              <CalendarDays size={48} className="mx-auto text-sun/40 mb-4" />
              <h2 className="font-display text-2xl font-bold text-cream">
                No activities match this view
              </h2>
              <p className="text-cream/70 mt-2">
                Click "Add Activity" above to schedule a routine.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === "completed";
              return (
                <article
                  key={task.id}
                  className={`rounded-2xl border-2 p-5 sm:p-6 transition shadow-card flex items-center justify-between gap-4 ${
                    isDone
                      ? "border-tea-confirm bg-surface/90 text-cream"
                      : "border-clay bg-surface text-cream hover:border-sun/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id)}
                    className="flex items-center gap-4 text-left flex-1 min-w-0"
                  >
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 transition ${
                        isDone
                          ? "border-cream bg-cream text-tea-confirm"
                          : "border-cream/80 text-cream bg-ink"
                      }`}
                    >
                      {isDone ? (
                        <Check size={26} strokeWidth={3} />
                      ) : (
                        <span className="size-2 rounded-full bg-cream" />
                      )}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-display text-2xl font-bold truncate ${
                            isDone ? "line-through opacity-80" : ""
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                            task.priority === "high"
                              ? "bg-fire/30 text-fire border border-fire"
                              : task.priority === "low"
                                ? "bg-clay/50 text-cream/70"
                                : "bg-sun/20 text-sun border border-sun/40"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className="text-sun font-bold mt-0.5 text-base">
                        {task.scheduled_time.slice(0, 5)}
                      </p>

                      {task.description && (
                        <p className="text-cream/80 text-sm mt-1 truncate">{task.description}</p>
                      )}
                    </div>
                  </button>

                  {/* Caregiver/Doctor Delete Button */}
                  {(user?.role === "caretaker" || user?.role === "doctor") && (
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="size-10 flex items-center justify-center rounded-xl text-cream/60 hover:text-fire hover:bg-ink transition"
                      title="Delete activity"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
