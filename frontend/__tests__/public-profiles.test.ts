import { describe, expect, it } from "vitest";
import { toSeller, type PublicProfile } from "@/lib/public-profiles";

describe("toSeller", () => {
  it("maps only the public seller fields", () => {
    const profile: PublicProfile = {
      id: "seller-1",
      full_name: "Awa K.",
      role: "VENDEUR",
      phone: "+22890123456",
      subscription_tier: "PREMIUM",
    };

    expect(toSeller(profile)).toEqual({
      name: "Awa K.",
      role: "VENDEUR",
      phone: "+22890123456",
      subscription_tier: "PREMIUM",
    });
  });

  it("does not fabricate a seller when no public profile is available", () => {
    expect(toSeller(undefined)).toBeNull();
  });
});
