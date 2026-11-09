import { describe, expect, it } from "vitest";
import { productShareText, whatsappShareUrl } from "@/lib/share";

describe("partage d'un produit", () => {
  it("écrit un texte avec le nom et le prix", () => {
    const text = productShareText("Sac pour femme", 20000);
    expect(text).toContain("« Sac pour femme »");
    expect(text).toContain("FCFA sur UCAO Marketplace");
    expect(text).not.toContain("FCFA FCFA");
  });

  it("ouvre WhatsApp sans numéro imposé, texte et lien encodés", () => {
    const url = whatsappShareUrl("Regarde ça :", "https://www.ucaomarketplace.com/products/abc");
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toBe(
      "Regarde ça : https://www.ucaomarketplace.com/products/abc",
    );
  });
});
