import { describe, expect, it } from "vitest";
import {
  announcementExpiresAt,
  buildWeekGrid,
  campusDayOfWeek,
  cellAriaLabel,
  clubInitials,
  findOverlaps,
  formatEventDate,
  formatLocation,
  formatTime,
  formatTimeRange,
  formatTimeRangeShort,
  getClubJoinLink,
  isAnnouncementExpired,
  periodOf,
  sortAnnouncements,
} from "@/lib/club-schedule";
import type { Club, ClubAnnouncement, ClubSession } from "@/lib/types";

const club = (id: string, name: string, extra: Partial<Club> = {}): Club => ({
  id,
  name,
  short_description: null,
  banner_url: null,
  external_url: null,
  color: "#1E88E5",
  whatsapp: null,
  sort_order: 0,
  is_active: true,
  ...extra,
});

const session = (id: string, club_id: string, day: number, start: string, end: string): ClubSession => ({
  id,
  club_id,
  day_of_week: day,
  start_time: start,
  end_time: end,
  location_detail: null,
  activity: null,
});

describe("périodes et heures", () => {
  it("classe une séance d'après son heure de début", () => {
    expect(periodOf("08:00:00")).toBe("matin");
    expect(periodOf("11:59:00")).toBe("matin");
    expect(periodOf("12:00:00")).toBe("apres-midi");
    expect(periodOf("16:59:00")).toBe("apres-midi");
    expect(periodOf("17:00:00")).toBe("soir");
  });

  it("écrit les heures à la française", () => {
    expect(formatTime("17:00:00")).toBe("17h00");
    expect(formatTime("09:30")).toBe("9h30");
    expect(formatTimeRange("17:00:00", "19:00:00")).toBe("17h00 – 19h00");
    expect(formatTimeRangeShort("17:00:00", "19:30:00")).toBe("17h–19h30");
  });

  it("affiche toujours l'université comme lieu général", () => {
    expect(formatLocation(null)).toBe("UCAO-UUT");
    expect(formatLocation("Terrain de basket")).toBe("UCAO-UUT · Terrain de basket");
  });
});

describe("grille de la semaine", () => {
  const basket = club("b", "Basketball");
  const theatre = club("t", "Théâtre", { color: "#8E24AA" });
  const sessions = [session("1", "t", 4, "18:00:00", "20:00:00"), session("2", "b", 4, "17:00:00", "19:00:00"), session("3", "x", 1, "08:00:00", "09:00:00")];

  it("range les séances dans la case jour × période, triées par heure, et ignore les clubs inconnus", () => {
    const grid = buildWeekGrid(sessions, [basket, theatre]);
    const cell = grid.get("4-soir")!;
    expect(cell.map((entry) => entry.club.name)).toEqual(["Basketball", "Théâtre"]);
    expect(grid.has("1-matin")).toBe(false);
  });

  it("décrit une case pour les lecteurs d'écran", () => {
    const grid = buildWeekGrid(sessions, [basket, theatre]);
    expect(cellAriaLabel(4, "soir", grid.get("4-soir")!)).toBe("Jeudi soir : Basketball 17h–19h, Théâtre 18h–20h");
    expect(cellAriaLabel(2, "matin", [])).toBe("Mardi matin : aucune séance");
  });

  it("signale les chevauchements du même club, bornes exclues", () => {
    const existing = [session("1", "b", 4, "17:00:00", "19:00:00"), session("2", "t", 4, "17:00:00", "19:00:00")];
    expect(findOverlaps({ club_id: "b", day_of_week: 4, start_time: "18:00:00", end_time: "20:00:00" }, existing)).toHaveLength(1);
    expect(findOverlaps({ club_id: "b", day_of_week: 4, start_time: "19:00:00", end_time: "20:00:00" }, existing)).toHaveLength(0);
    expect(findOverlaps({ club_id: "b", day_of_week: 5, start_time: "18:00:00", end_time: "20:00:00" }, existing)).toHaveLength(0);
    expect(findOverlaps({ club_id: "b", day_of_week: 4, start_time: "18:00:00", end_time: "20:00:00" }, existing, "1")).toHaveLength(0);
  });

  it("donne le jour de Lomé (1 = lundi … 7 = dimanche)", () => {
    expect(campusDayOfWeek(new Date("2026-11-12T10:00:00Z"))).toBe(4); // jeudi
    expect(campusDayOfWeek(new Date("2026-11-15T23:30:00Z"))).toBe(7); // dimanche (Lomé = UTC)
  });

  it("calcule des initiales lisibles", () => {
    expect(clubInitials("Jeux vidéo")).toBe("JV");
    expect(clubInitials("Basketball")).toBe("BA");
  });
});

describe("annonces", () => {
  const now = new Date("2026-11-12T12:00:00Z");
  const base = { id: "a", club_id: null, title: "T", body: "B", is_pinned: false } satisfies Partial<ClubAnnouncement>;

  it("expire le lendemain de l'événement, ou 30 jours après la création", () => {
    const withEvent = { ...base, event_at: "2026-11-20T18:00:00Z", created_at: "2026-11-01T00:00:00Z" };
    expect(announcementExpiresAt(withEvent).toISOString()).toBe("2026-11-21T18:00:00.000Z");
    expect(isAnnouncementExpired(withEvent, now)).toBe(false);
    const old = { ...base, event_at: null, created_at: "2026-10-01T00:00:00Z" };
    expect(isAnnouncementExpired(old, now)).toBe(true);
  });

  it("trie : épinglées, puis événements à venir par date, puis les autres par création décroissante", () => {
    const items: ClubAnnouncement[] = [
      { ...base, id: "old", event_at: null, created_at: "2026-11-01T00:00:00Z" },
      { ...base, id: "soon", event_at: "2026-11-14T18:00:00Z", created_at: "2026-11-02T00:00:00Z" },
      { ...base, id: "pinned", event_at: null, created_at: "2026-10-01T00:00:00Z", is_pinned: true },
      { ...base, id: "later", event_at: "2026-11-20T18:00:00Z", created_at: "2026-11-03T00:00:00Z" },
      { ...base, id: "recent", event_at: null, created_at: "2026-11-10T00:00:00Z" },
    ];
    expect(sortAnnouncements(items, now).map((item) => item.id)).toEqual(["pinned", "soon", "later", "recent", "old"]);
  });

  it("écrit la date de l'événement en français, heure de Lomé", () => {
    expect(formatEventDate("2026-11-20T18:00:00Z")).toBe("vendredi 20 novembre à 18h00");
  });
});

describe("lien WhatsApp", () => {
  it("prépare le message « j'ai vu le club … sur UCAO Marketplace »", () => {
    const link = getClubJoinLink({ name: "Basketball", whatsapp: "+22891268956" });
    expect(link!.startsWith("https://wa.me/22891268956?text=")).toBe(true);
    expect(decodeURIComponent(link!.split("?text=")[1])).toBe("Bonjour, j'ai vu le club Basketball sur UCAO Marketplace et je souhaiterais le rejoindre.");
  });

  it("n'a aucun lien sans numéro valide", () => {
    expect(getClubJoinLink({ name: "Jeux vidéo", whatsapp: null })).toBeNull();
    expect(getClubJoinLink({ name: "Jeux vidéo", whatsapp: "92 98" })).toBeNull();
  });
});
