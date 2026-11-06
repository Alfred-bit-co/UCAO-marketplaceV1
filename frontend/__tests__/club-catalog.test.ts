import { describe, expect, it } from "vitest";
import { CLUBS, getClubFullName, getJoinLink } from "@/lib/club-catalog";

const club = (slug: string) => {
  const found = CLUBS.find((entry) => entry.slug === slug);
  if (!found) throw new Error("Club introuvable : " + slug);
  return found;
};

// Numéros des responsables fournis par l'équipe (06/11/2026).
const EXPECTED_PHONES: Record<string, string> = {
  petanque: "+22871840656",
  football: "+22890593302",
  theatre: "+22890895459",
  basketball: "+22891268956",
  dance: "+22897838098",
  volley: "+22899547116",
  juristes: "+22879760544",
  communication: "+22892424746",
  cybersecurite: "+22896548352",
  chorale: "+22897549116",
  echecs: "+22873267889",
  orchestre: "+22891209262",
};

describe("catalogue des clubs", () => {
  it("contient les 13 clubs, dont Échecs et Orchestre avec leurs images", () => {
    expect(CLUBS).toHaveLength(13);
    expect(club("echecs").image).toBe("/images/clubs/echecs.jpg");
    expect(club("orchestre").image).toBe("/images/clubs/orchestra.jpg");
    expect(new Set(CLUBS.map((entry) => entry.slug)).size).toBe(CLUBS.length);
  });

  it("écrit « Club d'échecs » sans espace après l'apostrophe", () => {
    expect(getClubFullName(club("echecs"))).toBe("Club d'échecs");
    expect(getClubFullName(club("orchestre"))).toBe("Club d'orchestre");
    expect(getClubFullName(club("basketball"))).toBe("Club de Basketball");
  });

  it.each(Object.entries(EXPECTED_PHONES))("%s : lien wa.me vers le bon responsable", (slug, phone) => {
    const link = getJoinLink(club(slug));
    expect(link).not.toBeNull();
    expect(link!.startsWith("https://wa.me/" + phone.slice(1) + "?text=")).toBe(true);
  });

  it("prépare le message « j'ai vu le club … sur UCAO Marketplace »", () => {
    const text = decodeURIComponent(getJoinLink(club("echecs"))!.split("?text=")[1]);
    expect(text).toBe("Bonjour, j'ai vu le club d'échecs sur UCAO Marketplace et je souhaiterais le rejoindre.");
  });

  it("n'a aucun lien pour un club sans numéro (Jeux vidéo)", () => {
    expect(club("jeux-video").managerPhone).toBe("");
    expect(getJoinLink(club("jeux-video"))).toBeNull();
  });

  it("n'utilise jamais le numéro de la plateforme", () => {
    for (const entry of CLUBS) expect(entry.managerPhone).not.toBe("+22892982926");
  });
});
