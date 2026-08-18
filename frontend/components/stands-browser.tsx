"use client";
import { ChevronLeft, ChevronRight, PackageOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import type { Stand } from "@/lib/types";
import { StandCard } from "./stand-card";

export function StandsBrowser({
  stands,
  initialCategory,
}: {
  stands: Stand[];
  initialCategory?: string;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory || "tous");
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stands.filter((stand) => {
      const products = stand.products ?? [];
      const matchesCategory = category === "tous" || products.some((p) => p.category === category);
      const haystack = `${stand.name} ${stand.seller?.name || ""}`.toLowerCase();
      return (!query || haystack.includes(query)) && (category === "tous" || matchesCategory);
    });
  }, [category, search, stands]);

  const pages = Math.max(Math.ceil(filtered.length / perPage), 1);
  const items = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <section className="container-ucao">
      <div className="my-8 flex flex-wrap gap-3.5">
        <label className="min-w-[280px] flex-1">
          <span className="sr-only">Rechercher un stand</span>
          <input
            className="input-field"
            type="search"
            placeholder="Rechercher un stand, un vendeur ou une catégorie"
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
        <button className="btn btn-primary" type="button">
          <Search size={16} /> Rechercher
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {PRODUCT_CATEGORIES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setCategory(item.value);
              setPage(1);
            }}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              category === item.value
                ? "border-ucao-red bg-ucao-red text-white"
                : "border-ucao-line text-ucao-navy hover:border-ucao-red hover:text-ucao-red dark:border-[#1c3050] dark:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 pb-[84px] md:grid-cols-2 lg:grid-cols-3">
        {items.length ? (
          items.map((stand) => <StandCard key={stand.id} stand={stand} />)
        ) : (
          <div className="notice md:col-span-2 lg:col-span-3 flex items-center gap-4 p-6">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ucao-success-soft text-ucao-success">
              <PackageOpen size={26} />
            </span>
            <div>
              <p className="font-bold">Aucun stand ne correspond à votre recherche.</p>
              <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">Essayez avec d&apos;autres mots-clés ou explorez nos catégories.</p>
            </div>
          </div>
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