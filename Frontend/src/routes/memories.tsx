import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ArrowLeft, Plus, Volume2, Sparkles, MapPin, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n/i18nContext";
import memoryPhotos from "@/assets/memory-triptych.jpg";
import profilePhoto from "@/assets/profile-lalita.jpg";

export const Route = createFileRoute("/memories")({
  head: () => ({
    meta: [
      { title: "My Memories | SmritiSetu" },
      {
        name: "description",
        content: "Familiar people, places, and personal life stories on SmritiSetu.",
      },
    ],
  }),
  component: MemoriesPage,
});

interface MemoryItem {
  id: string;
  title: string;
  category: "Family" | "Places" | "Celebrations";
  description: string;
  date?: string;
  image?: string;
  voicePrompt: string;
}

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: "1",
    title: "Family Celebration with Grandchildren",
    category: "Family",
    description:
      "A joyful evening in Delhi celebrating Arjun and Mira’s birthdays with sweet jalebis and laughter.",
    date: "Winter 2024",
    image: memoryPhotos,
    voicePrompt:
      "Remember the birthday celebration with Arjun and Mira? Arjun asked for an extra jalebi!",
  },
  {
    id: "2",
    title: "The Hillside Garden in Shimla",
    category: "Places",
    description:
      "The morning mist over the pine trees, blooming yellow marigolds, and warm chai on the veranda.",
    date: "Spring Home",
    image: memoryPhotos,
    voicePrompt:
      "Do you remember the marigolds in your Shimla garden? You loved watching the sparrows every morning.",
  },
  {
    id: "3",
    title: "Son Rahul's Graduation Day",
    category: "Celebrations",
    description:
      "Rahul receiving his engineering degree with pride. A wonderful sunny afternoon surrounded by family.",
    date: "Summer Pride",
    image: profilePhoto,
    voicePrompt:
      "Here is Rahul on his graduation day. You were so proud as he walked onto the stage.",
  },
];

function MemoriesPage() {
  const { t } = useTranslation();
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Family" | "Places" | "Celebrations">("Family");
  const [description, setDescription] = useState("");

  const handleSpeak = (promptText: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      toast.info("Playing comforting memory prompt…");
    } else {
      toast.info(promptText);
    }
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newMemory: MemoryItem = {
      id: Date.now().toString(),
      title: title.trim(),
      category,
      description: description.trim(),
      date: "Recent Addition",
      image: memoryPhotos,
      voicePrompt: `Remember this beautiful memory: ${title}. ${description}`,
    };

    setMemories((prev) => [newMemory, ...prev]);
    toast.success("Memory added to your family album!");
    setIsAddOpen(false);
    setTitle("");
    setDescription("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavigationHeader />

      <main className="flex-1 mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12 w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Button asChild variant="cream" size="touch">
            <Link to="/">
              <ArrowLeft size={20} className="mr-2" /> {t("common.backHome")}
            </Link>
          </Button>

          {/* Add Memory Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="cream" size="touch" className="text-base font-extrabold">
                <Plus size={20} className="mr-2" /> {t("memories.addMemory").toUpperCase()}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-clay text-cream max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold text-cream">
                  {t("memories.addMemory")}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddMemory} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="mem-title" className="text-sm font-bold text-cream">
                    Memory Title
                  </Label>
                  <Input
                    id="mem-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Diwalis with Family in Jaipur"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold text-cream mb-1 block">Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Family", "Places", "Celebrations"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 rounded-lg text-xs font-bold transition ${
                          category === cat
                            ? "bg-sun text-ink shadow-sm"
                            : "bg-ink border border-clay text-cream hover:bg-clay"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mem-desc" className="text-sm font-bold text-cream">
                    Description & Heartwarming Details
                  </Label>
                  <Textarea
                    id="mem-desc"
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe who was there, how it felt, or familiar sights…"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddOpen(false)}
                    className="border border-clay text-cream"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" variant="cream">
                    {t("common.save")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Title Card */}
        <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card mb-8">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-sun text-ink shadow-sm">
              <Heart size={36} />
            </span>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
                {t("memories.title")}
              </h1>
              <p className="text-cream/80 mt-1">
                {t("memories.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Memory Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {memories.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl border border-clay bg-surface overflow-hidden shadow-card hover:shadow-card-active transition duration-300 flex flex-col justify-between"
            >
              <div>
                <img
                  src={m.image || memoryPhotos}
                  alt={m.title}
                  className="h-48 w-full object-cover border-b border-clay/60"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between text-xs font-bold text-sun mb-2">
                    <span className="uppercase tracking-wider">{m.category}</span>
                    <span className="text-cream/60">{m.date}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-cream mb-2 leading-tight">
                    {m.title}
                  </h2>
                  <p className="text-cream/80 text-base leading-relaxed">{m.description}</p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-clay/40 mt-4">
                <Button
                  type="button"
                  variant="cream"
                  size="touch"
                  onClick={() => handleSpeak(m.voicePrompt)}
                  className="w-full text-base font-extrabold gap-2 mt-4"
                >
                  <Volume2 size={20} /> {t("memories.listenMemory").toUpperCase()}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
