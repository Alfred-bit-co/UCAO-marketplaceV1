import { describe, expect, it } from "vitest";
import { SESSION_EXPIRED, friendlyError } from "@/lib/errors";

describe("friendlyError", () => {
  it("ne montre jamais le message brut d'un refus RLS", () => {
    const message = friendlyError({ code: "42501", message: 'new row violates row-level security policy for table "platform_reviews"' });
    expect(message).not.toMatch(/row-level|platform_reviews/i);
    expect(message).toContain("reconnectez-vous");
  });

  it("reconnaît une session expirée", () => {
    expect(friendlyError({ code: "PGRST301", message: "JWT expired" })).toBe(SESSION_EXPIRED);
  });

  it("réécrit les messages SQL sans accents en français correct", () => {
    expect(friendlyError({ code: "P0001", message: "Votre abonnement a expire. Renouvelez-le pour publier de nouveaux produits." })).toContain("a expiré");
    expect(friendlyError({ code: "P0001", message: "Limite de produits atteinte pour votre palier (5). Changez de palier." })).toContain("nombre maximum de produits");
  });

  it("traduit les erreurs réseau", () => {
    expect(friendlyError(new TypeError("Failed to fetch"))).toContain("Connexion internet");
  });

  it("utilise le message de repli pour une erreur inconnue", () => {
    expect(friendlyError({ message: "something odd" }, "Repli.")).toBe("Repli.");
    expect(friendlyError(null, "Repli.")).toBe("Repli.");
  });

  it("signale un numéro de téléphone déjà utilisé", () => {
    expect(friendlyError({ code: "23505", message: 'duplicate key value violates unique constraint "profiles_phone_unique"' })).toBe(
      "Ce numéro est déjà utilisé par un autre compte.",
    );
  });
});
