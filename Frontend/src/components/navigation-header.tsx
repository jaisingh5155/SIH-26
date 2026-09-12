import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  House,
  Bell,
  Check,
  User as UserIcon,
  LogOut,
  Brain,
  Pill,
  CalendarDays,
  Heart,
  BarChart3,
  Stethoscope,
  Users,
} from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useNotifications } from "../hooks/use-notifications";
import { useTranslation } from "../i18n/i18nContext";
import { LanguageSelector } from "./LanguageSelector";
import { SmritiSetuLogo } from "./SmritiSetuLogo";
import { Button } from "./ui/button";
import profilePhoto from "@/assets/profile-lalita.jpg";

interface NavigationHeaderProps {
  progress?: number;
}

export function NavigationHeader({ progress }: NavigationHeaderProps) {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRoleSwitch = async (role: "patient" | "caretaker" | "doctor") => {
    setShowRoleMenu(false);
    await demoLogin(role);
    if (role === "patient") {
      navigate({ to: "/" });
    } else if (role === "caretaker") {
      navigate({ to: "/caregiver" });
    } else if (role === "doctor") {
      navigate({ to: "/doctor" });
    }
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="border-b border-clay/70 bg-surface/95 backdrop-blur-md text-cream sticky top-0 z-40 shadow-md">
      {/* North Eastern Cultural Accent Top Strip */}
      <div className="border-cultural-strip" />

      {/* Main Single-Row Master Navigation Bar */}
      <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6">
        <nav
          className="flex h-16 items-center justify-between gap-2 sm:gap-4"
          aria-label="Main navigation"
        >
          {/* ================= LEFT: Brand & Role Switcher ================= */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-2.5 rounded-xl text-cream group focus-visible:ring-2 focus-visible:ring-sun focus:outline-none"
            >
              <SmritiSetuLogo
                size={36}
                showGlow={true}
                className="group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-cream group-hover:text-sun transition-colors">
                  SmritiSetu
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sun/15 border border-sun/30 text-sun font-bold uppercase tracking-wider hidden sm:inline-block">
                  स्मृति सेतु
                </span>
              </div>
            </Link>

            {/* Quick Perspective Pill */}
            {isAuthenticated && user && (
              <div className="relative" ref={roleMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowRoleMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-clay/80 bg-ink/60 hover:bg-clay/50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-sun transition cursor-pointer active:scale-95"
                  title="Switch user perspective (Patient / Caregiver / Doctor)"
                >
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{user.role}</span>
                  <span className="text-cream/50 text-[9px]">▼</span>
                </button>

                {showRoleMenu && (
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-clay/90 bg-surface/95 backdrop-blur-md p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <p className="px-3 py-1.5 text-[11px] font-bold text-sun uppercase tracking-wider border-b border-clay/40 mb-1">
                      Switch Perspective:
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch("patient")}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition cursor-pointer ${
                        user.role === "patient"
                          ? "bg-sun text-ink font-bold shadow-xs"
                          : "text-cream hover:bg-clay/50"
                      }`}
                    >
                      <UserIcon size={16} /> Patient (Lalita)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch("caretaker")}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition cursor-pointer ${
                        user.role === "caretaker"
                          ? "bg-sun text-ink font-bold shadow-xs"
                          : "text-cream hover:bg-clay/50"
                      }`}
                    >
                      <Users size={16} /> Caretaker (Rahul)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleSwitch("doctor")}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition cursor-pointer ${
                        user.role === "doctor"
                          ? "bg-sun text-ink font-bold shadow-xs"
                          : "text-cream hover:bg-clay/50"
                      }`}
                    >
                      <Stethoscope size={16} /> Doctor (Dr. Sharma)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= CENTER: Sleek Horizontal Navigation Hub ================= */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-1 bg-ink/50 border border-clay/60 p-1 rounded-xl shadow-inner text-xs xl:text-sm font-semibold">
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-cream/80 hover:text-sun hover:bg-surface/70 transition whitespace-nowrap font-bold"
                activeProps={{ className: "bg-surface text-sun border border-sun/35 shadow-xs font-black" }}
              >
                <House size={14} className="shrink-0 text-sun/90" />
                <span>{t("navigation.home", "Home")}</span>
              </Link>
              <Link
                to="/games"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-cream/80 hover:text-sun hover:bg-surface/70 transition whitespace-nowrap font-bold"
                activeProps={{ className: "bg-surface text-sun border border-sun/35 shadow-xs font-black" }}
              >
                <Brain size={14} className="shrink-0 text-sun/90" />
                <span>{t("navigation.games", "Games")}</span>
              </Link>
              <Link
                to="/medication"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-cream/80 hover:text-sun hover:bg-surface/70 transition whitespace-nowrap font-bold"
                activeProps={{ className: "bg-surface text-sun border border-sun/35 shadow-xs font-black" }}
              >
                <Pill size={14} className="shrink-0 text-sun/90" />
                <span>{t("navigation.medication", "Medicine")}</span>
              </Link>
              <Link
                to="/routine"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-cream/80 hover:text-sun hover:bg-surface/70 transition whitespace-nowrap font-bold"
                activeProps={{ className: "bg-surface text-sun border border-sun/35 shadow-xs font-black" }}
              >
                <CalendarDays size={14} className="shrink-0 text-sun/90" />
                <span>{t("navigation.routine", "Routine")}</span>
              </Link>
              <Link
                to="/memories"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-cream/80 hover:text-sun hover:bg-surface/70 transition whitespace-nowrap font-bold"
                activeProps={{ className: "bg-surface text-sun border border-sun/35 shadow-xs font-black" }}
              >
                <Heart size={14} className="shrink-0 text-sun/90" />
                <span>{t("navigation.memories", "Memories")}</span>
              </Link>
              <Link
                to="/analytics"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-cream/80 hover:text-sun hover:bg-surface/70 transition whitespace-nowrap font-bold"
                activeProps={{ className: "bg-surface text-sun border border-sun/35 shadow-xs font-black" }}
              >
                <BarChart3 size={14} className="shrink-0 text-sun/90" />
                <span>{t("navigation.analytics", "Analytics")}</span>
              </Link>

              {user?.role === "caretaker" && (
                <Link
                  to="/caregiver"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tea-confirm/20 text-cream hover:bg-tea-confirm/35 transition border border-tea-confirm/40 whitespace-nowrap font-bold"
                >
                  <Users size={14} className="text-emerald-300" />
                  <span>{t("navigation.caregiver", "Caregiver Hub")}</span>
                </Link>
              )}

              {user?.role === "doctor" && (
                <Link
                  to="/doctor"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tea-confirm/20 text-cream hover:bg-tea-confirm/35 transition border border-tea-confirm/40 whitespace-nowrap font-bold"
                >
                  <Stethoscope size={14} className="text-emerald-300" />
                  <span>{t("navigation.doctor", "Doctor Portal")}</span>
                </Link>
              )}
            </div>
          )}

          {/* ================= RIGHT: Systematic Utility Controls Hub ================= */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Website Language Selector */}
            <LanguageSelector align="right" />

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative flex size-9 items-center justify-center rounded-xl border border-clay/70 bg-surface hover:border-sun/60 hover:text-sun text-cream transition cursor-pointer active:scale-95"
                  aria-label="View notifications"
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-fire text-[10px] font-extrabold text-cream shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-clay/90 bg-surface/95 backdrop-blur-md p-4 shadow-2xl z-50 text-cream animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-clay/50">
                      <h3 className="font-display font-bold text-base sm:text-lg">Notifications</h3>
                      <span className="text-xs text-sun font-semibold px-2 py-0.5 rounded-full bg-sun/10 border border-sun/30">
                        {notifications.length} alerts
                      </span>
                    </div>
                    <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <p className="py-4 text-center text-sm text-cream/70">No new notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-xl border text-sm transition flex items-start justify-between gap-3 ${
                              n.status === "read"
                                ? "border-clay/50 bg-ink/40 text-cream/70"
                                : "border-sun/50 bg-ink text-cream shadow-sm"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm leading-tight">{n.title}</p>
                              <p className="mt-1 text-xs opacity-90 leading-snug">{n.message}</p>
                            </div>
                            {n.status !== "read" && (
                              <button
                                type="button"
                                onClick={() => markAsRead(n.id)}
                                className="size-7 shrink-0 flex items-center justify-center rounded-lg bg-tea-confirm text-cream hover:bg-tea-confirm/80 transition cursor-pointer"
                                title="Mark as read"
                              >
                                <Check size={16} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile & Logout */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 border-l border-clay/50">
                <div className="flex items-center gap-1.5" title={user.name}>
                  <img
                    src={profilePhoto}
                    alt={user.name}
                    className="size-8 rounded-full border border-sun/70 object-cover shadow-xs shrink-0"
                  />
                  <span className="hidden xl:inline text-xs font-bold text-cream max-w-[80px] truncate">
                    {user.name.split(" ")[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex size-8 items-center justify-center rounded-xl border border-clay/70 bg-surface text-cream/70 hover:text-white hover:bg-fire/80 hover:border-fire transition cursor-pointer active:scale-95 shrink-0"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild variant="cream" size="sm">
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* ================= MOBILE / TABLET SUB-NAVBAR (< lg) ================= */}
      {isAuthenticated && (
        <div className="lg:hidden flex items-center justify-around gap-1 px-3 py-2 bg-ink/95 border-t border-clay/50 overflow-x-auto text-xs font-bold scrollbar-none shadow-inner">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-xl text-cream/80 hover:text-sun hover:bg-surface flex items-center gap-1.5 whitespace-nowrap"
            activeProps={{ className: "text-sun bg-surface border border-sun/40 shadow-xs font-black" }}
          >
            <House size={15} /> {t("navigation.home", "Home")}
          </Link>
          <Link
            to="/games"
            className="px-3 py-1.5 rounded-xl text-cream/80 hover:text-sun hover:bg-surface flex items-center gap-1.5 whitespace-nowrap"
            activeProps={{ className: "text-sun bg-surface border border-sun/40 shadow-xs font-black" }}
          >
            <Brain size={15} /> {t("navigation.games", "Games")}
          </Link>
          <Link
            to="/medication"
            className="px-3 py-1.5 rounded-xl text-cream/80 hover:text-sun hover:bg-surface flex items-center gap-1.5 whitespace-nowrap"
            activeProps={{ className: "text-sun bg-surface border border-sun/40 shadow-xs font-black" }}
          >
            <Pill size={15} /> {t("navigation.medication", "Medicine")}
          </Link>
          <Link
            to="/routine"
            className="px-3 py-1.5 rounded-xl text-cream/80 hover:text-sun hover:bg-surface flex items-center gap-1.5 whitespace-nowrap"
            activeProps={{ className: "text-sun bg-surface border border-sun/40 shadow-xs font-black" }}
          >
            <CalendarDays size={15} /> {t("navigation.routine", "Routine")}
          </Link>
          <Link
            to="/memories"
            className="px-3 py-1.5 rounded-xl text-cream/80 hover:text-sun hover:bg-surface flex items-center gap-1.5 whitespace-nowrap"
            activeProps={{ className: "text-sun bg-surface border border-sun/40 shadow-xs font-black" }}
          >
            <Heart size={15} /> {t("navigation.memories", "Memories")}
          </Link>
          <Link
            to="/analytics"
            className="px-3 py-1.5 rounded-xl text-cream/80 hover:text-sun hover:bg-surface flex items-center gap-1.5 whitespace-nowrap"
            activeProps={{ className: "text-sun bg-surface border border-sun/40 shadow-xs font-black" }}
          >
            <BarChart3 size={15} /> {t("navigation.analytics", "Analytics")}
          </Link>
        </div>
      )}
    </header>
  );
}
