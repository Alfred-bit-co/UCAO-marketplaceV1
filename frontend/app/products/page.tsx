import type { Metadata } from "next";
import { Suspense } from "react";
import { ShoppingBag } from "@/lib/icons";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { ProductsBrowser } from "@/components/products-browser";
import { ProductGridSkeleton } from "@/components/skeletons";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Produits — UCAO Marketplace",
  description: "Parcourez les produits proposés par les vendeurs étudiants de l'UCAO-UUT.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page) || 1, 1);
  const products = await getProducts({
    page,
    perPage: PRODUCTS_PER_PAGE,
    search: params.search,
    category: params.category,
  });

  return (
    <PageShell>
      <main>
        <PageHero icon={ShoppingBag} eyebrow="Produits" title="Les offres du campus">
          Recherchez, filtrez et contactez les vendeurs UCAO UUT.
        </PageHero>
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductsBrowser
            initialData={products}
            initialCategory={params.category}
            initialSearch={params.search}
          />
        </Suspense>
      </main>
    </PageShell>
  );
}
