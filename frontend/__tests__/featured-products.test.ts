import { describe, expect, it } from "vitest";
import { rankMostLiked } from "@/lib/products";

const visible = [
  { id: "ancien", created_at: "2026-09-01T00:00:00Z" },
  { id: "recent", created_at: "2026-11-01T00:00:00Z" },
  { id: "star", created_at: "2026-10-01T00:00:00Z" },
  { id: "un-like", created_at: "2026-10-15T00:00:00Z" },
  { id: "zero", created_at: "2026-11-05T00:00:00Z" },
];

describe("rankMostLiked (produits en vedette)", () => {
  it("met les produits les plus aimés en premier, le plus récent d'abord à égalité", () => {
    const stats = [
      { product_id: "ancien", like_count: 3 },
      { product_id: "un-like", like_count: 1 },
      { product_id: "star", like_count: 6 },
      { product_id: "recent", like_count: 3 },
    ];
    expect(rankMostLiked(stats, visible, 3)).toEqual(["star", "recent", "ancien"]);
  });

  it("écarte les produits sans like et ceux qui ne sont plus visibles", () => {
    const stats = [
      { product_id: "masque", like_count: 10 },
      { product_id: "zero", like_count: 0 },
      { product_id: "un-like", like_count: 1 },
    ];
    expect(rankMostLiked(stats, visible, 3)).toEqual(["un-like"]);
  });
});
