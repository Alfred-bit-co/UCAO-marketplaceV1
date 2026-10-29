"use client";

import { AlertTriangle, ChevronLeft, ChevronRight, PackageOpen, RefreshCcw, Search } from "@/lib/icons";
import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isStandCategory, STAND_CATEGORY_FILTERS } from "@/lib/stand-catalog";
import type { PaginatedResult, Stand } from "@/lib/types";
import { ProductGridSkeleton } from "./skeletons";
import { StandCard } from "./stand-card";
import { StandCategoryIcon } from "./stand-category-icon";

export function StandsBrowser({
  initialData,
  initialCategory,
  initialSearch,
}: {
  initialData: PaginatedResult<Stand>;
  initialCategory?: string;
  initialSearch?: string;
}) {
  const router = useRouter();
  const currentParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const category = isStandCategory(initialCategory) ? initialCategory : "tous";
  const search = initialSearch || "";

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(currentParams.toString());
      Object.entries(updates).forEach(([key, value]) => (value && value !== "tous" ? params.set(key, value) : params.delete(key)));
      const query = params.toString();
      startTransition(() => router.push(query ? "/stands?" + query : "/stands"));
    },
    [currentParams, router],
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({ search: String(form.get("search") || "").trim() || null, page: "1" });
  }

  const hasFilters = Boolean(search) || category !== "tous";

  return (
    <section aria-label="Liste des stands" className="min-w-0">
      <form className="flex gap-3" onSubmit={submit} role="search">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Rechercher un stand</span>
          <input
            className="input-field"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Rechercher un stand, un service…"
          />
        </label>
        <button className="btn btn-primary" type="submit">
          <Search size={16} /> <span className="hidden sm:inline">Rechercher</span>
        </button>
      </form>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap" role="group" aria-label="Filtrer par catégorie">
          {STAND_CATEGORY_FILTERS.map((item) => {
            const active = category === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => update({ category: item.value, page: "1" })}
                className={
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition " +
                  (active
                    ? "border-ucao-red bg-ucao-red text-white"
                    : "border-ucao-line bg-white text-ucao-navy hover:border-ucao-red hover:text-ucao-red dark:border-[#2a3a52] dark:bg-[#132238] dark:text-white")
                }
              >
                <StandCategoryIcon category={item.value} size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 mt-6 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-bold">Les stands du campus</h2>
        {!initialData.unavailable && (
          <p className="text-sm text-ucao-muted" aria-live="polite">
            {initialData.total} stand{initialData.total > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {pending ? (
        <ProductGridSkeleton />
      ) : initialData.unavailable ? (
        <div className="notice flex flex-wrap items-center gap-4 p-6" role="alert">
          <AlertTriangle size={26} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Les stands sont momentanément indisponibles.</p>
            <p className="text-sm">Vérifie ta connexion puis réessaie dans un instant.</p>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => router.refresh()}>
            <RefreshCcw size={16} /> Réessayer
          </button>
        </div>
      ) : initialData.items.length ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {initialData.items.map((stand) => (
            <StandCard key={stand.id} stand={stand} />
          ))}
        </div>
      ) : (
        <div className="notice flex flex-wrap items-center gap-4 p-6">
          <PackageOpen size={26} />
          <p className="min-w-0 flex-1">Aucun stand ne correspond à ta recherche.</p>
          {hasFilters && (
            <button className="btn btn-ghost" type="button" onClick={() => update({ search: null, category: null, page: null })}>
              Voir tous les stands
            </button>
          )}
        </div>
      )}

      {!initialData.unavailable && initialData.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            className="btn btn-ghost"
            type="button"
            disabled={initialData.page <= 1 || pending}
            onClick={() => update({ page: String(initialData.page - 1) })}
          >
            <ChevronLeft size={18} /> Précédent
          </button>
          <span className="font-bold">
            Page {initialData.page} / {initialData.pages}
          </span>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={initialData.page >= initialData.pages || pending}
            onClick={() => update({ page: String(initialData.page + 1) })}
          >
            Suivant <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}
