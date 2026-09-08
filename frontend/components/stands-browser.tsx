"use client";

import { ChevronLeft, ChevronRight, PackageOpen, Search } from "@/lib/icons";
import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import type { PaginatedResult, Stand } from "@/lib/types";
import { StandCard } from "./stand-card";
import { ProductGridSkeleton } from "./skeletons";

export function StandsBrowser({ initialData, initialCategory, initialSearch }: { initialData: PaginatedResult<Stand>; initialCategory?: string; initialSearch?: string }) {
  const router = useRouter(); const currentParams = useSearchParams(); const [pending, startTransition] = useTransition();
  const category = initialCategory || "tous"; const search = initialSearch || "";
  const update = useCallback((updates: Record<string, string | null>) => { const params = new URLSearchParams(currentParams.toString()); Object.entries(updates).forEach(([key, value]) => value && value !== "tous" ? params.set(key, value) : params.delete(key)); startTransition(() => router.push(`/stands?${params.toString()}`)); }, [currentParams, router]);
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); update({ search: String(form.get("search") || "").trim() || null, page: "1" }); }
  return <section className="container-ucao"><form className="my-8 flex flex-wrap gap-3.5" onSubmit={submit}><label className="min-w-[280px] flex-1"><span className="sr-only">Rechercher un stand</span><input className="input-field" name="search" type="search" defaultValue={search} placeholder="Rechercher un stand ou une description" /></label><select className="select-field min-w-[190px]" name="category" defaultValue={category} onChange={(event) => update({ category: event.target.value, page: "1" })}>{PRODUCT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button className="btn btn-primary" type="submit"><Search size={16} /> Rechercher</button></form><div className="mb-6 flex flex-wrap gap-3">{PRODUCT_CATEGORIES.map((item) => <button key={item.value} type="button" onClick={() => update({ category: item.value, page: "1" })} className={`rounded-full border px-4 py-2 text-sm font-medium ${category === item.value ? "border-ucao-red bg-ucao-red text-white" : "border-ucao-line text-ucao-navy"}`}>{item.label}</button>)}</div><p className="mb-4 text-sm text-ucao-muted">{initialData.total} stand{initialData.total > 1 ? "s" : ""} — {PRODUCTS_PER_PAGE} par page</p>{pending ? <ProductGridSkeleton /> : <div className="grid gap-6 pb-[42px] md:grid-cols-2 lg:grid-cols-3">{initialData.items.length ? initialData.items.map((stand) => <StandCard key={stand.id} stand={stand} />) : <div className="notice md:col-span-2 lg:col-span-3 flex items-center gap-4 p-6"><PackageOpen size={26} />Aucun stand ne correspond à votre recherche.</div>}</div>}<div className="flex items-center justify-center gap-3 pb-[84px]"><button className="btn btn-ghost" type="button" disabled={initialData.page <= 1 || pending} onClick={() => update({ page: String(initialData.page - 1) })}><ChevronLeft size={18} /> Précédent</button><span className="font-bold">Page {initialData.page} / {initialData.pages}</span><button className="btn btn-ghost" type="button" disabled={initialData.page >= initialData.pages || pending} onClick={() => update({ page: String(initialData.page + 1) })}>Suivant <ChevronRight size={18} /></button></div></section>;
}
