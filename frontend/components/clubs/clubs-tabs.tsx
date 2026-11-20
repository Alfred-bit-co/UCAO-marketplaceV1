"use client";

import { useSearchParams } from "next/navigation";
import { useId, type ReactNode } from "react";
import { CalendarDays, UsersRound } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Les deux volets de la page publique des clubs. L'onglet actif est gardé dans l'adresse
 * (/clubs?vue=programme) pour qu'on puisse partager le lien du programme, sans recharger
 * la page (history.pushState est compris par le routeur de Next.js).
 */
type ClubsTabsProps = {
  clubsPanel: ReactNode;
  programmePanel: ReactNode;
};

const TABS = [
  { key: "clubs", label: "Les clubs", Icon: UsersRound },
  { key: "programme", label: "Programme & annonces", Icon: CalendarDays },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ClubsTabs({ clubsPanel, programmePanel }: ClubsTabsProps) {
  const searchParams = useSearchParams();
  const baseId = useId();
  const active: TabKey = searchParams.get("vue") === "programme" ? "programme" : "clubs";

  function select(key: TabKey) {
    if (key === active) return;
    const url = key === "programme" ? "/clubs?vue=programme" : "/clubs";
    window.history.pushState(null, "", url);
  }

  return (
    <div>
      <div className="sticky top-[72px] z-30 -mx-4 bg-white/95 px-4 py-3 backdrop-blur-sm dark:bg-[#071426]/95 sm:mx-0 sm:px-0 lg:top-[82px]">
        <div role="tablist" aria-label="Vue des clubs" className="mx-auto grid max-w-md grid-cols-2 gap-1 rounded-full bg-ucao-soft p-1 dark:bg-[#132238]">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`${baseId}-tab-${key}`}
              aria-selected={active === key}
              aria-controls={`${baseId}-panel-${key}`}
              onClick={() => select(key)}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition",
                active === key ? "bg-white text-ucao-red shadow-sm dark:bg-[#1b2d47] dark:text-[#ff9aa0]" : "text-ucao-muted hover:text-ucao-ink dark:hover:text-white",
              )}
            >
              <Icon size={16} aria-hidden="true" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id={`${baseId}-panel-clubs`} aria-labelledby={`${baseId}-tab-clubs`} hidden={active !== "clubs"}>
        {clubsPanel}
      </div>
      <div role="tabpanel" id={`${baseId}-panel-programme`} aria-labelledby={`${baseId}-tab-programme`} hidden={active !== "programme"}>
        {programmePanel}
      </div>
    </div>
  );
}
