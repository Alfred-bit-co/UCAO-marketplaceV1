import { HomePage } from "@/components/home-page";
import { PageShell } from "@/components/page-shell";
import { getFeaturedProducts } from "@/lib/products";
import { getPlatformStats } from "@/lib/reviews";

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