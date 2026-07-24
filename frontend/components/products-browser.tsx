"use client";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { PRODUCT_CATEGORIES, TIER_PRIORITY } from "@/lib/types";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export function ProductsBrowser({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("tous");
  const [page, setPage] = useState(1);
  const perPage = 5;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialProducts
      .filter((product) => {
        const haystack = `${product.name} ${product.seller?.name || ""} ${product.category}`.toLowerCase();
        return (!query || haystack.includes(query)) && (category === "tous" || product.category === category);
      })
      .sort((a, b) => TIER_PRIORITY[a.seller_tier ?? "STANDARD"] - TIER_PRIORITY[b.seller_tier ?? "STANDARD"]);
  }, [category, initialProducts, search]);
  const pages = Math.max(Math.ceil(filtered.length / perPage), 1);
  const items = filtered.slice((page - 1) * perPage, page * perPage);
  return (
    <section className="container-ucao">
      <div className="my-8 flex flex-wrap gap-3.5">
        <label className="min-w-[280px] flex-1">
          <span className="sr-only">Rechercher un produit</span>
          <input
            className="input-field"
            type="search"
            placeholder="Rechercher un produit, un vendeur ou une catégorie"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Catégorie</span>
          <select
            className="select-field min-w-[190px]"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            {PRODUCT_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-6 pb-[84px] md:grid-cols-2 lg:grid-cols-3">
        {items.length ? (
          items.map((product) => <ProductCard key={product.id} product={product} showDescription />)
        ) : (
          <p className="notice md:col-span-2 lg:col-span-3">
            <ShoppingBag className="mr-2 inline" size={18} /> Aucun produit ne correspond à votre recherche.
          </p>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 pb-[84px]">
        <button className="btn btn-ghost" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
          <ChevronLeft size={18} /> Précédent
        </button>
        <span className="font-black">Page {page} / {pages}</span>
        <button className="btn btn-ghost" type="button" disabled={page >= pages} onClick={() => setPage((value) => Math.min(value + 1, pages))}>
          Suivant <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}