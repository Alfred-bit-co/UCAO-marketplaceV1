"use client";

import { useState } from "react";
import { CalendarDays, Pencil, Trash2 } from "@/lib/icons";
import { formatEventDate, isAnnouncementExpired } from "@/lib/club-schedule";
import type { Club, ClubAnnouncement } from "@/lib/types";
import { cn } from "@/lib/utils";

type AnnouncementCardProps = {
  announcement: ClubAnnouncement;
  club: Club | null;
  /** Mode gestion : badge « Expirée » et boutons Modifier / Supprimer. */
  manage?: boolean;
  onEdit?: (announcement: ClubAnnouncement) => void;
  onDelete?: (announcement: ClubAnnouncement) => void;
};

const COLLAPSED_CHARS = 220;

export function AnnouncementCard({ announcement, club, manage = false, onEdit, onDelete }: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const long = announcement.body.length > COLLAPSED_CHARS;
  const expired = manage && isAnnouncementExpired(announcement);

  return (
    <article className={cn("panel p-4 sm:p-5", expired && "opacity-70")}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: club?.color ?? "#546E7A" }} aria-hidden="true" />
          {club ? club.name : "Tous les clubs"}
        </span>
        {announcement.is_pinned && <span className="rounded-full bg-ucao-red-soft px-2 py-0.5 text-[10px] font-bold uppercase text-ucao-red dark:bg-[#3a171d] dark:text-[#ff9aa0]">Épinglée</span>}
        {expired && <span className="rounded-full bg-ucao-soft px-2 py-0.5 text-[10px] font-bold uppercase text-ucao-muted dark:bg-[#1b2d47]">Expirée</span>}
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug">{announcement.title}</h3>
      {announcement.event_at && (
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-ucao-navy dark:text-[#8ea2d8]">
          <CalendarDays size={15} aria-hidden="true" /> {formatEventDate(announcement.event_at)}
        </p>
      )}
      <p className={cn("mt-2 whitespace-pre-line text-sm leading-relaxed text-ucao-muted dark:text-[#a8b8cc]", !expanded && long && "line-clamp-3")}>{announcement.body}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {long && (
          <button type="button" className="text-sm font-semibold text-ucao-red underline-offset-4 hover:underline" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
            {expanded ? "Réduire" : "Lire la suite"}
          </button>
        )}
        {manage && (
          <span className="ml-auto flex gap-1">
            <button type="button" className="btn btn-ghost min-h-9 px-3 text-xs" onClick={() => onEdit?.(announcement)}>
              <Pencil size={13} aria-hidden="true" /> Modifier
            </button>
            <button type="button" className="btn btn-ghost min-h-9 px-3 text-xs text-ucao-red" onClick={() => onDelete?.(announcement)}>
              <Trash2 size={13} aria-hidden="true" /> Supprimer
            </button>
          </span>
        )}
      </div>
    </article>
  );
}
