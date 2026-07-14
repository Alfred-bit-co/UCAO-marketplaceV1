import { HomePage } from "@/components/home-page";
import { PageShell } from "@/components/page-shell";
import { getFeaturedProducts } from "@/lib/products";

export default async function Page() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <PageShell showTopbar fullFooter>
      <HomePage featuredProducts={featuredProducts} />
    </PageShell>
  );
}
