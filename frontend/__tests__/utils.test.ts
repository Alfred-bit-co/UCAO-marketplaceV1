import { describe, expect, it } from "vitest";
import { escapeIlike, formatPrice, getPostLoginRedirect, getProductLimit, getStandLimit, isValidPhoneNumber, verificationLabel } from "@/lib/utils";

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

  it("redirects unverified users to verification page", () => {
    expect(getPostLoginRedirect({ role: "ACHETEUR", verification_status: "pending" })).toBe("/verification");
  });

  it("redirects verified vendor to dashboard", () => {
    expect(getPostLoginRedirect({ role: "VENDEUR", verification_status: "approved" })).toBe("/dashboard");
  });

  it("redirects verified buyer to products", () => {
    expect(getPostLoginRedirect({ role: "ACHETEUR", verification_status: "approved" })).toBe("/products");
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
