import { describe, expect, it } from "vitest";
import { CLUB_COLORS, colorLabel, isHexColor, readableTextColor, relativeLuminance } from "@/lib/club-colors";

function distance(a: string, b: string): number {
  const rgb = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

describe("palette des clubs", () => {
  it("contient 20 couleurs valides et toutes différentes", () => {
    expect(CLUB_COLORS).toHaveLength(20);
    for (const color of CLUB_COLORS) expect(isHexColor(color.hex)).toBe(true);
    expect(new Set(CLUB_COLORS.map((color) => color.hex.toUpperCase())).size).toBe(20);
  });

  it("n'a pas deux nuances trop proches", () => {
    for (let i = 0; i < CLUB_COLORS.length; i++) {
      for (let j = i + 1; j < CLUB_COLORS.length; j++) {
        expect(distance(CLUB_COLORS[i].hex, CLUB_COLORS[j].hex), `${CLUB_COLORS[i].label} / ${CLUB_COLORS[j].label}`).toBeGreaterThan(60);
      }
    }
  });

  it("choisit un texte lisible sur chaque couleur", () => {
    expect(readableTextColor("#FDD835")).toBe("#071426");
    expect(readableTextColor("#0D47A1")).toBe("#ffffff");
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1);
    expect(relativeLuminance("#000000")).toBe(0);
  });

  it("nomme les couleurs de la palette", () => {
    expect(colorLabel("#1e88e5")).toBe("Bleu");
    expect(colorLabel("#123456")).toBe("#123456");
  });
});

describe("garde-fous d'affichage des clubs", async () => {
  const { safeClubImageUrl, safeExternalUrl } = await import("@/lib/clubs");

  it("n'accepte que les images locales ou de notre stockage", () => {
    expect(safeClubImageUrl("/images/clubs/robot.jpg")).toBe("/images/clubs/robot.jpg");
    expect(safeClubImageUrl("https://kodlozakvjuegwtetewm.supabase.co/storage/v1/object/public/marketplace-media/clubs/u/c-1.jpg")).not.toBeNull();
    expect(safeClubImageUrl("https://evil.example/x.jpg")).toBeNull();
    expect(safeClubImageUrl("/images/clubs/../../secret")).toBeNull();
  });

  it("refuse les liens javascript: et data:", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,x")).toBeNull();
    expect(safeExternalUrl("https://ucao-uut.tg")).toBe("https://ucao-uut.tg/");
  });
});
