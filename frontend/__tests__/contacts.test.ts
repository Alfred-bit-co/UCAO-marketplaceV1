import { describe, expect, it } from "vitest";
import { toContactStats } from "@/lib/contacts";

describe("toContactStats (compteur de contacts)", () => {
  it("convertit les nombres reçus en texte et indexe par produit", () => {
    const stats = toContactStats([
      { product_id: "a", total: "12", last_7_days: "3" },
      { product_id: "b", total: 1, last_7_days: 0 },
    ]);
    expect(stats.get("a")).toEqual({ total: 12, last7Days: 3 });
    expect(stats.get("b")).toEqual({ total: 1, last7Days: 0 });
    expect(stats.has("c")).toBe(false);
  });
});
