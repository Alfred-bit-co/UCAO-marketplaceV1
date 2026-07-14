import { ShoppingBag } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { ProductsBrowser } from "@/components/products-browser";
import { getProducts } from "@/lib/products";

export default async function ProductsPage() {
  const products = await getProducts({ page: 1, perPage: 100 });

  return (
    <PageShell>
      <main>
        <PageHero icon={ShoppingBag} eyebrow="Produits" title="Les offres du campus">
          Recherchez, filtrez et contactez les vendeurs UCAO UUT.
        </PageHero>
        <ProductsBrowser initialProducts={products.items} />
      </main>
    </PageShell>
  );
}
