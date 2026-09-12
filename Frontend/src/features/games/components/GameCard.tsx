import { Link } from "@tanstack/react-router";
import { Play, Clock, Star } from "lucide-react";
import type { GameMetadata } from "../types/game.types";
import { CATEGORY_LABELS, CATEGORY_COLORS, DOMAIN_LABELS } from "../types/game.types";
import { useTranslation } from "@/i18n/i18nContext";

interface GameCardProps {
  game: GameMetadata;
  bestLevel?: number;
  bestScore?: number;
  lastPlayed?: string;
}

export function GameCard({ game, bestLevel, bestScore, lastPlayed }: GameCardProps) {
  const { t } = useTranslation();
  const categoryStyle = CATEGORY_COLORS[game.category] ?? "bg-clay/30 text-cream/70 border-clay";

  return (
    <Link
      to={`/games/${game.id}` as never}
      className="group flex flex-col justify-between rounded-3xl border border-clay/60 bg-surface p-6 shadow-card transition-all duration-300 hover:border-sun/70 hover:shadow-card-active hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun cursor-pointer min-h-[260px]"
      aria-label={`Play ${game.name}`}
    >
      {/* Top row: icon + category + best level badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-ink/80 text-3xl border border-clay/60 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            {game.icon}
          </span>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`text-[11px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${categoryStyle}`}
            >
              {CATEGORY_LABELS[game.category]}
            </span>
            {bestLevel !== undefined && bestLevel > 0 && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-tea-confirm/20 text-tea-confirm border border-tea-confirm/40 font-bold">
                <Star size={10} /> {t("games.level")} {bestLevel}
              </span>
            )}
          </div>
        </div>

        {/* Game title + description */}
        <h3 className="font-display text-xl font-bold text-cream leading-snug group-hover:text-sun transition-colors">
          {game.name}
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-cream/70 leading-relaxed line-clamp-2 font-medium">
          {game.description}
        </p>
      </div>

      {/* Cognitive domains + Footer CTA */}
      <div className="space-y-3 mt-4">
        {/* Domain tags */}
        <div className="flex flex-wrap gap-1.5">
          {game.cognitiveDomains.slice(0, 2).map((d) => (
            <span
              key={d}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-ink/70 text-cream/75 border border-clay/50 font-medium"
            >
              {DOMAIN_LABELS[d]}
            </span>
          ))}
        </div>

        {/* Footer: duration + last played + CTA */}
        <div className="flex items-center justify-between gap-2 border-t border-clay/40 pt-3">
          <div className="flex items-center gap-2.5 text-xs text-cream/60 font-medium">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-sun" /> ~{game.estimatedMinutes} {t("games.estimatedTime")}
            </span>
            {lastPlayed && (
              <span>
                · {new Date(lastPlayed).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 rounded-xl bg-sun px-4 py-2 text-xs font-extrabold text-ink group-hover:bg-amber-400 shadow-sm transition-all shrink-0">
            <Play size={12} fill="currentColor" /> {t("games.playExercise")}
          </span>
        </div>
      </div>
    </Link>
  );
}
