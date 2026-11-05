import { describe, expect, it } from "vitest";
import { escapeIlike, formatPrice, getGoogleLoginRedirect, getPostLoginRedirect, getProductLimit, safeNextPath, getStandLimit, isValidPhoneNumber, verificationLabel } from "@/lib/utils";

describe("escapeIlike", () => {
  it("escapes wildcard characters", () => {
    expect(escapeIlike("100%")).toBe("100\\%");
    expect(escapeIlike("a_b")).toBe("a\\_b");
  });
});

describe("formatPrice", () => {
  it("formats FCFA prices in French locale", () => {
    expect(formatPrice(1500)).toContain("1");
    expect(formatPrice(1500)).toContain("FCFA");
  });
});

describe("getPostLoginRedirect", () => {
  it("redirects admin to /admin", () => {
    expect(getPostLoginRedirect({ role: "ADMIN", verification_status: "pending" })).toBe("/admin");
  });

  it("does not gate buyers on background verification", () => {
    expect(getPostLoginRedirect({ role: "ACHETEUR", verification_status: "pending" })).toBe("/products");
  });

  it("redirects verified vendor to dashboard", () => {
    expect(getPostLoginRedirect({ role: "VENDEUR", verification_status: "approved" })).toBe("/dashboard");
  });

  it("redirects verified buyer to products", () => {
    expect(getPostLoginRedirect({ role: "ACHETEUR", verification_status: "approved" })).toBe("/products");
  });

  it("sends the user back to the page they came from", () => {
    expect(getPostLoginRedirect({ role: "ACHETEUR", verification_status: "pending" }, "/devenir-vendeur")).toBe("/devenir-vendeur");
  });

  it("ignores external next targets", () => {
    expect(getPostLoginRedirect({ role: "ACHETEUR", verification_status: "pending" }, "//evil.com")).toBe("/products");
    expect(getPostLoginRedirect({ role: "ACHETEUR", verification_status: "pending" }, "https://evil.com")).toBe("/products");
  });

  it("keeps admins on /admin", () => {
    expect(getPostLoginRedirect({ role: "ADMIN", verification_status: "approved" }, "/devenir-vendeur")).toBe("/admin");
  });
});

describe("safeNextPath", () => {
  it("accepts internal paths and rejects the rest", () => {
    expect(safeNextPath("/devenir-vendeur")).toBe("/devenir-vendeur");
    expect(safeNextPath("/\\evil.com")).toBeNull();
    expect(safeNextPath("/\t/evil.com")).toBeNull();
    expect(safeNextPath("/\n/evil.com")).toBeNull();
    expect(safeNextPath("")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath("//evil.com")).toBeNull();
    expect(safeNextPath("/redirect?to=https://evil.com")).toBeNull();
    expect(safeNextPath("https://evil.com")).toBeNull();
  });
});

describe("getGoogleLoginRedirect", () => {
  const complete = { cgu_accepted_at: "2026-11-01T00:00:00Z", student_id_url: "cartes/abc.jpg" };

  it("envoie l'admin sur /admin, même sans conditions ni carte", () => {
    expect(getGoogleLoginRedirect({ role: "ADMIN", cgu_accepted_at: null, student_id_url: null })).toBe("/admin");
  });

  it("envoie vers l'onboarding si les conditions ne sont pas acceptées", () => {
    expect(getGoogleLoginRedirect({ ...complete, role: "VENDEUR", cgu_accepted_at: null })).toBe("/verification-carte?oauth=google");
  });

  it("envoie vers l'onboarding si aucune carte n'a été envoyée", () => {
    expect(getGoogleLoginRedirect({ ...complete, role: "VENDEUR", student_id_url: null })).toBe("/verification-carte?oauth=google");
  });

  it("envoie le vendeur complet sur /dashboard, même avec ?next=", () => {
    expect(getGoogleLoginRedirect({ ...complete, role: "VENDEUR" }, "/stands")).toBe("/dashboard");
  });

  it("utilise ?next= s'il est sûr, sinon /products", () => {
    expect(getGoogleLoginRedirect({ ...complete, role: "ACHETEUR" }, "/devenir-vendeur")).toBe("/devenir-vendeur");
    expect(getGoogleLoginRedirect({ ...complete, role: "ACHETEUR" }, "//evil.com")).toBe("/products");
    expect(getGoogleLoginRedirect({ ...complete, role: "ACHETEUR" })).toBe("/products");
  });

  it("garde le comportement actuel si le profil est illisible", () => {
    expect(getGoogleLoginRedirect(null, "/devenir-vendeur")).toBe("/verification-carte?oauth=google");
  });
});

describe("verificationLabel", () => {
  it("returns French labels", () => {
    expect(verificationLabel("approved")).toBe("Validé");
    expect(verificationLabel("rejected")).toBe("Refusé");
    expect(verificationLabel("pending")).toBe("En attente");
  });
});

describe("subscription limits", () => {
  it("calculates product and stand limits for each tier", () => {
    expect(getProductLimit("STANDARD")).toBe(5);
    expect(getProductLimit("PREMIUM")).toBe(10);
    expect(getProductLimit("VIP")).toBe(30);
    expect(getStandLimit("STANDARD")).toBe(0);
    expect(getStandLimit("PREMIUM")).toBe(1);
    expect(getStandLimit("VIP")).toBe(5);
  });
});

describe("phone format", () => {
  it("accepts + followed by digits only", () => {
    expect(isValidPhoneNumber("+22892982926")).toBe(true);
    expect(isValidPhoneNumber("22892982926")).toBe(false);
    expect(isValidPhoneNumber("+228 92982926")).toBe(false);
  });
});

describe("normalizeWhatsAppNumber", () => {
  it("normalise les saisies togolaises en +228 et 8 chiffres", async () => {
    const { normalizeWhatsAppNumber } = await import("@/lib/utils");
    expect(normalizeWhatsAppNumber("92 98 29 26")).toBe("+22892982926");
    expect(normalizeWhatsAppNumber("92982926")).toBe("+22892982926");
    expect(normalizeWhatsAppNumber("+228 92 98 29 26")).toBe("+22892982926");
    expect(normalizeWhatsAppNumber("228-92-98-29-26")).toBe("+22892982926");
    expect(normalizeWhatsAppNumber("0022892982926")).toBe("+22892982926");
  });

  it("accepte un numéro international complet d'un autre pays", async () => {
    const { normalizeWhatsAppNumber } = await import("@/lib/utils");
    expect(normalizeWhatsAppNumber("+229 97 00 00 00")).toBe("+22997000000");
    expect(normalizeWhatsAppNumber("00229 97000000")).toBe("+22997000000");
  });

  it("refuse les numéros inexploitables", async () => {
    const { normalizeWhatsAppNumber } = await import("@/lib/utils");
    expect(normalizeWhatsAppNumber("")).toBeNull();
    expect(normalizeWhatsAppNumber("9298292")).toBeNull(); // 7 chiffres
    expect(normalizeWhatsAppNumber("+228 9298 2926 1")).toBeNull(); // 9 chiffres après +228
    expect(normalizeWhatsAppNumber("abc")).toBeNull();
  });
});
