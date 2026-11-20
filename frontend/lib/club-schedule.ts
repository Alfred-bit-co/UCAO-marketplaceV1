import type { Club, ClubAnnouncement, ClubSession } from "./types";

/**
 * Règles du programme des clubs, sans dépendance au navigateur ni à Supabase
 * (testées dans __tests__/club-schedule.test.ts).
 */

export const CAMPUS_TIMEZONE = "Africa/Lome";
export const CAMPUS_PLACE = "UCAO-UUT";

export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;
export const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

export type PeriodKey = "matin" | "apres-midi" | "soir";

export type Period = {
  key: PeriodKey;
  label: string;
  /** Pour la phrase « jeudi soir » (en minuscules). */
  phrase: string;
  /** Heure de début proposée quand on ajoute une séance dans cette période. */
  defaultStart: string;
  defaultEnd: string;
};

export const PERIODS: Period[] = [
  { key: "matin", label: "Matin", phrase: "matin", defaultStart: "08:00", defaultEnd: "10:00" },
  { key: "apres-midi", label: "Après-midi", phrase: "après-midi", defaultStart: "14:00", defaultEnd: "16:00" },
  { key: "soir", label: "Soir", phrase: "soir", defaultStart: "17:00", defaultEnd: "19:00" },
];

/** Nom du jour (1 = lundi … 7 = dimanche). */
export function dayName(day: number): string {
  return DAY_NAMES[day - 1] ?? "";
}

/** « 17:00:00 » ou « 17:00 » → minutes depuis minuit. */
export function timeToMinutes(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/** Période d'une séance d'après son heure de début : matin < 12h, après-midi < 17h, soir ensuite. */
export function periodOf(startTime: string): PeriodKey {
  const hour = Math.floor(timeToMinutes(startTime) / 60);
  if (hour < 12) return "matin";
  if (hour < 17) return "apres-midi";
  return "soir";
}

/** « 17:00:00 » → « 17h00 ». */
export function formatTime(time: string): string {
  const total = timeToMinutes(time);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

/** « 17h00 – 19h00 ». */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** Version courte pour les libellés : « 17h–19h » (minutes affichées seulement si non nulles). */
export function formatTimeRangeShort(start: string, end: string): string {
  const short = (time: string) => {
    const total = timeToMinutes(time);
    const minutes = total % 60;
    return `${Math.floor(total / 60)}h${minutes ? String(minutes).padStart(2, "0") : ""}`;
  };
  return `${short(start)}–${short(end)}`;
}

/** Lieu affiché : « UCAO-UUT » ou « UCAO-UUT · Terrain de basket ». */
export function formatLocation(locationDetail: string | null | undefined): string {
  const detail = locationDetail?.trim();
  return detail ? `${CAMPUS_PLACE} · ${detail}` : CAMPUS_PLACE;
}

export type SessionWithClub = ClubSession & { club: Club };

/** Identifiant d'une case du calendrier. */
export function cellKey(day: number, period: PeriodKey): string {
  return `${day}-${period}`;
}

/**
 * Range les séances dans les cases jour × période, triées par heure de début.
 * Les séances d'un club absent de la liste (ex. club caché) sont ignorées.
 */
export function buildWeekGrid(sessions: ClubSession[], clubs: Club[]): Map<string, SessionWithClub[]> {
  const byId = new Map(clubs.map((club) => [club.id, club]));
  const grid = new Map<string, SessionWithClub[]>();
  for (const session of sessions) {
    const club = byId.get(session.club_id);
    if (!club) continue;
    const key = cellKey(session.day_of_week, periodOf(session.start_time));
    const list = grid.get(key) ?? [];
    list.push({ ...session, club });
    grid.set(key, list);
  }
  for (const list of grid.values()) {
    list.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time) || a.club.name.localeCompare(b.club.name, "fr"));
  }
  return grid;
}

/** « Jeudi soir : Basketball 17h–19h, Théâtre 18h–20h » (ou « Jeudi soir : aucune séance »). */
export function cellAriaLabel(day: number, period: PeriodKey, entries: SessionWithClub[]): string {
  const phrase = PERIODS.find((item) => item.key === period)?.phrase ?? period;
  const prefix = `${dayName(day)} ${phrase} : `;
  if (!entries.length) return prefix + "aucune séance";
  return prefix + entries.map((entry) => `${entry.club.name} ${formatTimeRangeShort(entry.start_time, entry.end_time)}`).join(", ");
}

/** Deux séances du même jour se chevauchent (bornes exclusives : 17h–19h puis 19h–21h ne se chevauchent pas). */
export function sessionsOverlap(a: Pick<ClubSession, "day_of_week" | "start_time" | "end_time">, b: Pick<ClubSession, "day_of_week" | "start_time" | "end_time">): boolean {
  if (a.day_of_week !== b.day_of_week) return false;
  return timeToMinutes(a.start_time) < timeToMinutes(b.end_time) && timeToMinutes(b.start_time) < timeToMinutes(a.end_time);
}

/** Séances du même club qui chevauchent le créneau saisi (en excluant la séance en cours de modification). */
export function findOverlaps(
  draft: Pick<ClubSession, "club_id" | "day_of_week" | "start_time" | "end_time">,
  sessions: ClubSession[],
  excludeId?: string | null,
): ClubSession[] {
  return sessions.filter((session) => session.id !== excludeId && session.club_id === draft.club_id && sessionsOverlap(draft, session));
}

/** Jour de la semaine (1 = lundi … 7 = dimanche) à Lomé, pour la date donnée. */
export function campusDayOfWeek(date: Date = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: CAMPUS_TIMEZONE }).format(date);
  const index = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  return index === -1 ? 1 : index + 1;
}

/** Initiales d'un club pour les cases étroites : « Jeux vidéo » → « JV », « Basketball » → « BA ». */
export function clubInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toLocaleUpperCase("fr");
  return name.trim().slice(0, 2).toLocaleUpperCase("fr");
}

// ===== Annonces =====

const DAY_MS = 24 * 60 * 60 * 1000;

/** Date de fin de visibilité publique : lendemain de l'événement, ou 30 jours après la création. */
export function announcementExpiresAt(announcement: Pick<ClubAnnouncement, "event_at" | "created_at">): Date {
  if (announcement.event_at) return new Date(new Date(announcement.event_at).getTime() + DAY_MS);
  return new Date(new Date(announcement.created_at).getTime() + 30 * DAY_MS);
}

export function isAnnouncementExpired(announcement: Pick<ClubAnnouncement, "event_at" | "created_at">, now: Date = new Date()): boolean {
  return announcementExpiresAt(announcement).getTime() <= now.getTime();
}

/**
 * Ordre d'affichage public : les épinglées d'abord, puis les événements à venir par date
 * croissante, puis les autres par date de création décroissante.
 */
export function sortAnnouncements<T extends ClubAnnouncement>(items: T[], now: Date = new Date()): T[] {
  const rank = (item: ClubAnnouncement) => {
    if (item.is_pinned) return 0;
    if (item.event_at && new Date(item.event_at).getTime() >= now.getTime()) return 1;
    return 2;
  };
  return [...items].sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    if (rank(a) === 1) return new Date(a.event_at!).getTime() - new Date(b.event_at!).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/** « jeudi 20 novembre à 18h00 » (heure de Lomé). */
export function formatEventDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: CAMPUS_TIMEZONE }).format(date);
  const parts = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CAMPUS_TIMEZONE }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${day} à ${Number(hour)}h${minute}`;
}

// ===== Lien WhatsApp =====

const PHONE_PATTERN = /^\+\d{8,15}$/;

/**
 * Lien WhatsApp vers le responsable du club, avec le message déjà écrit.
 * Renvoie null tant que le numéro est vide ou invalide : la carte n'affiche alors pas de bouton actif.
 */
export function getClubJoinLink(club: Pick<Club, "name" | "whatsapp">): string | null {
  const phone = (club.whatsapp ?? "").replace(/[\s.-]/g, "");
  if (!PHONE_PATTERN.test(phone)) return null;
  const message = `Bonjour, j'ai vu le club ${club.name.trim()} sur UCAO Marketplace et je souhaiterais le rejoindre.`;
  return "https://wa.me/" + phone.slice(1) + "?text=" + encodeURIComponent(message);
}
