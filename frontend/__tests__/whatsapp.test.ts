import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

describe("buildWhatsAppUrl", () => {
  it("returns null without phone", () => {
    expect(buildWhatsAppUrl(null)).toBeNull();
    expect(buildWhatsAppUrl("")).toBeNull();
  });

  it("normalizes phone and encodes message", () => {
    const url = buildWhatsAppUrl("+228 92 98 29 26", "Bonjour");
    expect(url).toBe("https://wa.me/22892982926?text=Bonjour");
  });

  it("uses default message", () => {
    const url = buildWhatsAppUrl("+22892982926");
    expect(url).toContain("wa.me/22892982926");
    expect(url).toContain("text=");
  });
});
