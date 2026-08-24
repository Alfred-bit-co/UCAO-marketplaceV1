import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { PageShell } from "@/components/page-shell";
import { getFeaturedProducts } from "@/lib/products";
import { getPlatformStats } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "UCAO Marketplace — Achète, vends et échange entre étudiants UCAO UUT",
  description: "Le marché simple pour acheter, vendre et trouver des services entre étudiants de l'UCAO-UUT à Lomé.",
};

export default async function Page() {
  const [featuredProducts, stats] = await Promise.all([
    getFeaturedProducts(),
    getPlatformStats(),
  ]);

  return (
    <PageShell showTopbar fullFooter>
      <HomePage
        featuredProducts={featuredProducts}
        initialProducts={stats.products}
        initialVendors={stats.vendors}
      />
    </PageShell>
  );
}
