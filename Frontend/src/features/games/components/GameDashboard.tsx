import { useState } from "react";
import { Brain, Award, CheckCircle2, Flame, History, TrendingUp } from "lucide-react";
import { GameCard } from "./GameCard";
import { GAME_REGISTRY, getGamesByCategory, ALL_CATEGORIES } from "../data/gameRegistry";
import { CATEGORY_LABELS } from "../types/game.types";
import { useGames } from "@/hooks/use-games";
import { useTranslation } from "@/i18n/i18nContext";
import type { GameCategory } from "../types/game.types";

type Filter = "all" | GameCategory;

export function GameDashboard() {
  const [filter, setFilter] = useState<Filter>("all");
  const { summary, sessions } = useGames();
  const { t } = useTranslation();

  const displayed = filter === "all" ? GAME_REGISTRY : getGamesByCategory(filter);

  // Build per-game progress from sessions
  const progressMap = new Map<string, { bestLevel: number; lastPlayed: string }>();
  for (const s of sessions) {
    const existing = progressMap.get(s.game_id);
    if (!existing || s.level_achieved > existing.bestLevel) {
      progressMap.set(s.game_id, {
        bestLevel: s.level_achieved,
        lastPlayed: s.completed_at,
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Header with Cultural Accents */}
      <div className="relative overflow-hidden rounded-3xl border border-clay/60 bg-gradient-to-br from-surface via-[#2B2319] to-surface p-6 sm:p-10 shadow-card">
        <div className="absolute inset-0 pattern-northeast-weave opacity-30 pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center gap-5">
          <span className="flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sun via-amber-400 to-fire text-ink shadow-md shrink-0 font-bold">
            <Brain size={42} />
          </span>
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sun">
              <span>{t("common.appName")} · {t("games.hubTitle")}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream tracking-tight">
              {t("games.hubTitle")}
            </h1>
            <p className="text-cream/80 text-sm sm:text-base leading-relaxed font-medium">
              {t("games.hubSubtitle")}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-clay/60 bg-ink/75 px-4 py-3.5 flex items-center gap-3.5 shadow-inner">
              <span className="p-2 rounded-xl bg-sun/20 text-sun shrink-0">
                <Award size={22} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-cream/60">Sessions</p>
                <p className="font-display text-2xl font-bold text-cream mt-0.5">
                  {summary.total_sessions}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-clay/60 bg-ink/75 px-4 py-3.5 flex items-center gap-3.5 shadow-inner">
              <span className="p-2 rounded-xl bg-tea-confirm/20 text-tea-confirm shrink-0">
                <CheckCircle2 size={22} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-cream/60">Accuracy</p>
                <p className="font-display text-2xl font-bold text-cream mt-0.5">
                  {Math.round(summary.average_accuracy)}%
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-clay/60 bg-ink/75 px-4 py-3.5 flex items-center gap-3.5 shadow-inner">
              <span className="p-2 rounded-xl bg-fire/20 text-fire shrink-0">
                <TrendingUp size={22} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-cream/60">Avg. Score</p>
                <p className="font-display text-2xl font-bold text-cream mt-0.5">
                  {Math.round(summary.average_score)}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-clay/60 bg-ink/75 px-4 py-3.5 flex items-center gap-3.5 shadow-inner">
              <span className="p-2 rounded-xl bg-amber-500/20 text-sun shrink-0">
                <Flame size={22} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-cream/60">Retention</p>
                <p className="font-display text-2xl font-bold text-cream mt-0.5">
                  High
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2.5 items-center">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-5 py-2 rounded-xl text-sm font-extrabold border transition-all cursor-pointer min-h-[44px] ${
            filter === "all"
              ? "bg-sun text-ink border-sun shadow-sm scale-105"
              : "bg-surface text-cream border-clay/80 hover:border-sun hover:bg-clay/30"
          }`}
        >
          {t("games.allCategories")} ({GAME_REGISTRY.length})
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const count = getGamesByCategory(cat).length;
          const localizedCatLabel =
            cat === "logic"
              ? t("games.categoryLogic")
              : cat === "memory"
              ? t("games.categoryMemory")
              : cat === "attention"
              ? t("games.categoryAttention")
              : cat === "spatial"
              ? t("games.categorySpatial")
              : CATEGORY_LABELS[cat];

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer min-h-[44px] ${
                filter === cat
                  ? "bg-sun text-ink border-sun shadow-sm scale-105"
                  : "bg-surface text-cream/80 border-clay/70 hover:border-sun/60 hover:text-cream"
              }`}
            >
              {localizedCatLabel} ({count})
            </button>
          );
        })}
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map((game) => {
          const prog = progressMap.get(game.id);
          return (
            <GameCard
              key={game.id}
              game={game}
              {...(prog?.bestLevel ? { bestLevel: prog.bestLevel } : {})}
              {...(prog?.lastPlayed ? { lastPlayed: prog.lastPlayed } : {})}
            />
          );
        })}
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card">
          <div className="flex items-center gap-2 text-lg font-bold text-sun mb-4">
            <History size={20} /> Recent Sessions
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-clay text-cream/60">
                  <th className="pb-3 font-bold uppercase text-xs">Game</th>
                  <th className="pb-3 font-bold uppercase text-xs">Level</th>
                  <th className="pb-3 font-bold uppercase text-xs">Score</th>
                  <th className="pb-3 font-bold uppercase text-xs">Accuracy</th>
                  <th className="pb-3 font-bold uppercase text-xs">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clay/40">
                {sessions.slice(0, 8).map((s) => (
                  <tr key={s.id} className="text-cream">
                    <td className="py-3 font-bold capitalize">{s.game_id.replace(/-/g, " ")}</td>
                    <td className="py-3 text-cream/70">Lv {s.level_achieved}</td>
                    <td className="py-3 font-bold text-sun">{s.score}</td>
                    <td className="py-3 font-bold text-tea-confirm">{Math.round(s.accuracy)}%</td>
                    <td className="py-3 text-cream/70">{s.duration_seconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
