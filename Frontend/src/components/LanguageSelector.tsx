import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "../i18n/i18nContext";
import type { LanguageCode } from "../i18n/types";

interface LanguageSelectorProps {
  className?: string;
  variant?: "header" | "compact" | "drawer";
  align?: "left" | "right" | "auto";
}

export function LanguageSelector({
  className = "",
  variant = "header",
  align = "auto",
}: LanguageSelectorProps) {
  const { language, setLanguage, languages, currentLanguageInfo, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [menuAlign, setMenuAlign] = useState<"left" | "right">("right");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine smart alignment on open so it never clips offscreen
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      if (align === "left") {
        setMenuAlign("left");
      } else if (align === "right") {
        setMenuAlign("right");
      } else {
        const rect = dropdownRef.current.getBoundingClientRect();
        // If button is in the left 280px of screen, open towards the right
        if (rect.left < 260) {
          setMenuAlign("left");
        } else {
          setMenuAlign("right");
        }
      }
    }
  }, [isOpen, align]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t("navigation.websiteLanguage", "Website Language")}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-surface/90 hover:bg-clay/60 border border-clay/90 text-cream text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-sun select-none active:scale-95"
      >
        <Globe size={15} className="text-sun shrink-0" />
        <span className="font-semibold text-cream hidden sm:inline-block">
          {currentLanguageInfo.nativeName}
        </span>
        <span className="font-semibold text-cream sm:hidden text-xs uppercase tracking-wide">
          {currentLanguageInfo.code}
        </span>
        <ChevronDown
          size={13}
          className={`text-cream/70 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-sun" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-surface/95 backdrop-blur-md border border-clay/90 shadow-2xl p-2.5 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-150 ${
            menuAlign === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
          }`}
        >
          {/* Header title */}
          <div className="px-3 py-2 border-b border-clay/40 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sun flex items-center gap-1.5">
              <Globe size={13} /> {t("navigation.websiteLanguage", "Website Language")}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sun/15 text-sun border border-sun/30 font-semibold">
              8 NE Regional
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 py-1 pr-0.5">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  role="menuitem"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-sun/20 text-sun font-bold border border-sun/40 shadow-xs"
                      : "text-cream hover:bg-clay/50 hover:text-white"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-snug">{lang.nativeName}</span>
                    <span className="text-[11px] text-cream/60 flex items-center gap-1">
                      {lang.name}
                      {lang.region && (
                        <span className="text-[10px] text-muted-foreground">· {lang.region}</span>
                      )}
                    </span>
                  </div>

                  {isSelected && <Check size={16} className="text-sun shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="mt-1 pt-2 border-t border-clay/40 px-3 py-1 text-[10px] text-cream/50 text-center">
            {t("common.appName", "SmritiSetu")} UI Localization
          </div>
        </div>
      )}
    </div>
  );
}
