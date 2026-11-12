"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, X } from "@/lib/icons";
import { readableTextColor } from "@/lib/club-colors";
import {
  DAY_NAMES,
  DAY_SHORT,
  PERIODS,
  buildWeekGrid,
  campusDayOfWeek,
  cellAriaLabel,
  cellKey,
  clubInitials,
  formatLocation,
  formatTimeRange,
  getClubJoinLink,
  type PeriodKey,
  type SessionWithClub,
} from "@/lib/club-schedule";
import type { Club, ClubSession } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Calendrier de la semaine des clubs : 7 jours × 3 périodes (matin, après-midi, soir).
 * Chaque club a sa couleur ; une case prend la couleur du club qui s'y réunit, et plusieurs
 * couleurs côte à côte quand plusieurs clubs partagent la même case.
 *
 * - mode « read » (page publique) : un clic sur une case ouvre le détail des séances ;
 * - mode « edit » (espace du représentant) : un clic sur une case vide crée une séance,
 *   un clic sur une séance la modifie.
 */
type ClubWeekCalendarProps = {
  clubs: Club[];
  sessions: ClubSession[];
  mode?: "read" | "edit";
  onCreate?: (day: number, period: PeriodKey) => void;
  onEdit?: (session: ClubSession) => void;
};

type OpenCell = { day: number; period: PeriodKey; left: number; top: number };

const MAX_BANDS = 3;
const PANEL_WIDTH = 340;

export function ClubWeekCalendar({ clubs, sessions, mode = "read", onCreate, onEdit }: ClubWeekCalendarProps) {
  const [filterClubId, setFilterClubId] = useState<string | null>(null);
  const [openCell, setOpenCell] = useState<OpenCell | null>(null);
  const [today, setToday] = useState<number | null>(null);
  const [desktop, setDesktop] = useState(false);

  const editing = mode === "edit";

  // Le jour courant est calculé côté navigateur (fuseau du campus) pour éviter un écart serveur/client.
  useEffect(() => {
    setToday(campusDayOfWeek());
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!openCell) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenCell(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openCell]);

  const grid = useMemo(() => buildWeekGrid(sessions, clubs), [sessions, clubs]);
  const hasSunday = useMemo(() => PERIODS.some((period) => (grid.get(cellKey(7, period.key)) ?? []).length > 0), [grid]);
  const days = editing || hasSunday ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5, 6];
  const isEmpty = sessions.length === 0 || grid.size === 0;

  function entriesOf(day: number, period: PeriodKey): SessionWithClub[] {
    return grid.get(cellKey(day, period)) ?? [];
  }

  function toggleFilter(clubId: string) {
    setFilterClubId((current) => (current === clubId ? null : clubId));
    setOpenCell(null);
  }

  // Position de la fenêtre de détail (ordinateur) : sous la case, en coordonnées de la fenêtre
  // (position fixe), pour ne pas être rognée par le cadre « overflow-hidden » du panneau parent.
  function openPanel(event: React.MouseEvent<HTMLElement>, day: number, period: PeriodKey) {
    const rect = event.currentTarget.getBoundingClientRect();
    const maxLeft = Math.max(window.innerWidth - PANEL_WIDTH - 16, 0);
    const left = Math.min(Math.max(rect.left, 16), maxLeft);
    const top = Math.min(rect.bottom + 8, window.innerHeight - 120);
    setOpenCell({ day, period, left, top });
  }

  function handleCellClick(event: React.MouseEvent<HTMLElement>, day: number, period: PeriodKey) {
    const entries = entriesOf(day, period);
    if (!entries.length) {
      if (editing) onCreate?.(day, period);
      return;
    }
    if (openCell && openCell.day === day && openCell.period === period) {
      setOpenCell(null);
      return;
    }
    openPanel(event, day, period);
  }

  const openEntries = openCell ? entriesOf(openCell.day, openCell.period) : [];

  function renderCell(day: number, period: PeriodKey, compact: boolean) {
    const entries = entriesOf(day, period);
    const label = cellAriaLabel(day, period, entries);
    const isOpen = openCell?.day === day && openCell?.period === period;
    const clickable = entries.length > 0 || editing;
    const base = cn(
      "relative flex w-full overflow-hidden rounded-xl text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ucao-navy dark:focus-visible:outline-white",
      compact ? "min-h-[56px]" : "min-h-[72px]",
      entries.length === 0 && "border border-dashed border-ucao-line bg-ucao-soft/60 dark:border-[#2a3a52] dark:bg-[#0f1f35]",
      entries.length === 0 && editing && "hover:border-ucao-navy hover:bg-ucao-navy-soft dark:hover:border-[#8ea2d8] dark:hover:bg-[#162b47]",
      entries.length > 0 && "shadow-sm hover:brightness-105",
      isOpen && "ring-2 ring-ucao-navy ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-[#10233b]",
    );

    const content =
      entries.length === 0 ? (
        editing ? (
          <span className="m-auto inline-flex items-center gap-1 text-xs font-medium text-ucao-muted">
            <Plus size={14} aria-hidden="true" /> Ajouter
          </span>
        ) : null
      ) : (
        <>
          {entries.slice(0, entries.length > MAX_BANDS ? MAX_BANDS : entries.length).map((entry) => {
            const dimmed = filterClubId !== null && entry.club_id !== filterClubId;
            const color = entry.club.color;
            return (
              <span
                key={entry.id}
                className={cn("flex min-w-0 flex-1 items-center justify-center px-1 text-center transition-opacity", dimmed && "opacity-20")}
                style={{ backgroundColor: color, color: readableTextColor(color) }}
                aria-hidden="true"
              >
                {entries.length === 1 ? (
                  <span className="line-clamp-2 text-xs font-semibold leading-tight sm:text-[13px]">{entry.club.name}</span>
                ) : (
                  <span className={cn("text-[11px] font-bold", compact && entries.length > 2 && "hidden min-[400px]:inline")}>{clubInitials(entry.club.name)}</span>
                )}
              </span>
            );
          })}
          {entries.length > MAX_BANDS && (
            <span
              className="absolute bottom-1 right-1 rounded-full bg-[#071426]/85 px-1.5 py-0.5 text-[10px] font-bold text-white"
              aria-hidden="true"
            >
              +{entries.length - MAX_BANDS}
            </span>
          )}
        </>
      );

    if (!clickable) {
      return (
        <div className={base} role="img" aria-label={label}>
          {content}
        </div>
      );
    }
    return (
      <button type="button" className={base} aria-label={label} aria-expanded={entries.length ? isOpen : undefined} onClick={(event) => handleCellClick(event, day, period)}>
        {content}
      </button>
    );
  }

  const dayHeader = (day: number, short: boolean) => (
    <span
      className={cn(
        "inline-flex min-h-7 items-center justify-center rounded-full px-2.5 text-xs font-bold uppercase tracking-wide",
        today === day ? "bg-ucao-navy text-white dark:bg-white dark:text-ucao-navy" : "text-ucao-muted",
      )}
    >
      {short ? DAY_SHORT[day - 1] : DAY_NAMES[day - 1]}
      {today === day && <span className="sr-only"> (aujourd&apos;hui)</span>}
    </span>
  );

  return (
    <div className="grid gap-4">
      {/* Légende : une puce par club, cliquable pour filtrer. */}
      {clubs.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Clubs du calendrier (cliquer pour filtrer)">
          {clubs.map((club) => {
            const active = filterClubId === club.id;
            const dimmed = filterClubId !== null && !active;
            return (
              <button
                key={club.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleFilter(club.id)}
                className={cn(
                  "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition",
                  active ? "border-transparent text-white shadow-sm" : "border-ucao-line bg-white text-ucao-ink hover:bg-ucao-soft dark:border-[#2a3a52] dark:bg-[#10233b] dark:text-[#e8edf4] dark:hover:bg-[#162b47]",
                  dimmed && "opacity-50",
                )}
                style={active ? { backgroundColor: club.color, color: readableTextColor(club.color) } : undefined}
              >
                <span className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: club.color }} aria-hidden="true" />
                {club.name}
                {!club.is_active && <span className="rounded-full bg-black/10 px-1.5 text-[10px] uppercase">caché</span>}
              </button>
            );
          })}
          {filterClubId && (
            <button type="button" className="inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-ucao-muted hover:text-ucao-red" onClick={() => setFilterClubId(null)}>
              <X size={12} aria-hidden="true" /> Tout afficher
            </button>
          )}
        </div>
      )}

      {isEmpty && !editing ? (
        <p className="rounded-ucao bg-ucao-soft p-6 text-center font-medium text-ucao-muted dark:bg-[#132238]">Le programme des clubs sera bientôt publié.</p>
      ) : (
        <div className="relative">
          {/* Ordinateur : jours en colonnes, périodes en lignes. */}
          <div className="hidden md:block">
            <div className="grid gap-2" style={{ gridTemplateColumns: `6.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
              <span aria-hidden="true" />
              {days.map((day) => (
                <div key={day} className="flex justify-center">{dayHeader(day, false)}</div>
              ))}
              {PERIODS.map((period) => (
                <div key={period.key} className="contents">
                  <span className="flex items-center text-sm font-semibold text-ucao-ink dark:text-[#e8edf4]">{period.label}</span>
                  {days.map((day) => (
                    <div key={day} className={cn("rounded-xl p-0.5", today === day && "bg-ucao-navy-soft/70 dark:bg-white/5")}>
                      {renderCell(day, period.key, false)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Téléphone : une ligne par jour, les 3 périodes côte à côte (aucun défilement horizontal). */}
          <div className="grid gap-2 md:hidden">
            <div className="grid grid-cols-[3.25rem_repeat(3,minmax(0,1fr))] gap-1.5">
              <span aria-hidden="true" />
              {PERIODS.map((period) => (
                <span key={period.key} className="text-center text-[11px] font-bold uppercase tracking-wide text-ucao-muted">{period.label}</span>
              ))}
            </div>
            {days.map((day) => (
              <div key={day} className={cn("grid grid-cols-[3.25rem_repeat(3,minmax(0,1fr))] items-center gap-1.5 rounded-xl p-0.5", today === day && "bg-ucao-navy-soft/70 dark:bg-white/5")}>
                <div className="flex justify-start">{dayHeader(day, true)}</div>
                {PERIODS.map((period) => (
                  <div key={period.key}>{renderCell(day, period.key, true)}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Détail d'une case : panneau glissant en bas sur téléphone, fenêtre près de la case sur ordinateur. */}
          {openCell && openEntries.length > 0 && (
            <>
              <button type="button" className="fixed inset-0 z-40 bg-[#071426]/40 md:bg-transparent" aria-label="Fermer le détail" onClick={() => setOpenCell(null)} />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={cellAriaLabel(openCell.day, openCell.period, openEntries)}
                className="panel fixed inset-x-0 bottom-0 z-50 max-h-[75dvh] overflow-y-auto rounded-b-none p-4 shadow-2xl md:inset-auto md:max-h-[60vh] md:w-[340px] md:rounded-ucao"
                style={desktop ? { left: openCell.left, top: openCell.top } : undefined}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="font-bold">
                    {DAY_NAMES[openCell.day - 1]} {PERIODS.find((period) => period.key === openCell.period)?.phrase}
                  </p>
                  <button type="button" className="grid size-8 place-items-center rounded-full text-ucao-muted hover:bg-ucao-soft dark:hover:bg-[#1b2d47]" onClick={() => setOpenCell(null)} aria-label="Fermer">
                    <X size={16} />
                  </button>
                </div>
                <ul className="grid gap-3">
                  {openEntries.map((entry) => {
                    const joinLink = getClubJoinLink(entry.club);
                    return (
                      <li key={entry.id} className="flex gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#132238]">
                        <span className="mt-1 size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: entry.club.color }} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{entry.club.name}</p>
                          <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">{formatTimeRange(entry.start_time, entry.end_time)}</p>
                          <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">{formatLocation(entry.location_detail)}</p>
                          {entry.activity && <p className="text-sm">{entry.activity}</p>}
                          <div className="mt-2 flex flex-wrap gap-2">
                            {editing ? (
                              <button type="button" className="btn btn-ghost min-h-9 px-3 text-xs" onClick={() => { setOpenCell(null); onEdit?.(entry); }}>
                                <Pencil size={13} aria-hidden="true" /> Modifier
                              </button>
                            ) : (
                              joinLink && (
                                <a
                                  href={joinLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
                                  style={{ backgroundColor: entry.club.color, color: readableTextColor(entry.club.color) }}
                                >
                                  Rejoindre le club
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {editing && (
                  <button type="button" className="btn btn-ghost mt-3 w-full text-sm" onClick={() => { const cell = openCell; setOpenCell(null); onCreate?.(cell.day, cell.period); }}>
                    <Plus size={15} aria-hidden="true" /> Ajouter une séance ici
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
