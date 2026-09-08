"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, PackageOpen, Search } from "@/lib/icons";
import { useCallback, useTransition } from "react";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import type { PaginatedResult, Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./skeletons";

export function ProductsBrowser({
  initialData,
  initialCategory,
  initialSearch,
}: {
  initialData: PaginatedResult<Product>;
  initialCategory?: string;
  initialSearch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const page = initialData.page;
  const pages = initialData.pages;
  const category = initialCategory || "tous";
  const search = initialSearch || "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "tous") params.delete(key);
        else params.set(key, value);
      });
      startTransition(() => {
        router.push(`/products?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextSearch = String(form.get("search") || "").trim();
    updateParams({ search: nextSearch || null, page: "1" });
  }

  return (
    <section className="container-ucao">
      <form className="my-8 flex flex-wrap gap-3.5" onSubmit={handleSearchSubmit}>
        <label className="min-w-[280px] flex-1">
          <span className="sr-only">Rechercher un produit</span>
          <input
            className="input-field"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Rechercher un produit, un vendeur ou une catégorie"
          />
        </label>
        <label>
          <span className="sr-only">Catégorie</span>
          <select
            className="select-field min-w-[190px]"
            name="category"
            defaultValue={category}
            onChange={(event) => updateParams({ category: event.target.value, page: "1" })}
          >
            {PRODUCT_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" type="submit">
          <Search size={16} /> Rechercher
        </button>
      </form>

      <div className="mb-6 flex flex-wrap gap-3">
        {PRODUCT_CATEGORIES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => updateParams({ category: item.value, page: "1" })}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              category === item.value
                ? "border-ucao-red bg-ucao-red text-white"
                : "border-ucao-line text-ucao-navy hover:border-ucao-red hover:text-ucao-red dark:border-[#1c3050] dark:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-ucao-muted dark:text-[#a8b8cc]">
        {initialData.total} produit{initialData.total > 1 ? "s" : ""} — {PRODUCTS_PER_PAGE} par page
      </p>

      {isPending ? (
        <ProductGridSkeleton />
      ) : (
        <div className="grid gap-6 pb-[42px] md:grid-cols-2 lg:grid-cols-3">
          {initialData.items.length ? (
            initialData.items.map((product) => <ProductCard key={product.id} product={product} showDescription />)
          ) : (
            <div className="notice md:col-span-2 lg:col-span-3 flex items-center gap-4 p-6">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ucao-success-soft text-ucao-success">
                <PackageOpen size={26} />
              </span>
              <div>
                <p className="font-medium">Aucun produit ne correspond à votre recherche.</p>
                <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">
                  Essayez avec d&apos;autres mots-clés ou explorez nos catégories.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pb-[84px]">
        <button
          className="btn btn-ghost"
          type="button"
          disabled={page <= 1 || isPending}
          onClick={() => updateParams({ page: String(page - 1) })}
        >
          <ChevronLeft size={18} /> Précédent
        </button>
        <span className="font-bold">
          Page {page} / {pages}
        </span>
        <button
          className="btn btn-ghost"
          type="button"
          disabled={page >= pages || isPending}
          onClick={() => updateParams({ page: String(page + 1) })}
        >
          Suivant <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
