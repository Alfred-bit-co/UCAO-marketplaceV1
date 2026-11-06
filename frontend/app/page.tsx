import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { PageShell } from "@/components/page-shell";
import { getFeaturedProducts } from "@/lib/products";
import { getPlatformStats } from "@/lib/reviews";
import { SITE_NAME, buildHomeJsonLd, serializeJsonLd } from "@/lib/seo";

const HOME_TITLE = "UCAO Marketplace — Achète, vends et échange entre étudiants UCAO UUT";
const HOME_DESCRIPTION = "Le marché simple pour acheter, vendre et trouver des services entre étudiants de l'UCAO-UUT à Lomé.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  // Adresse officielle de l'accueil : évite que les autres domaines (ex. *.vercel.app) soient vus comme des doublons.
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
  },
};

export default async function Page() {
  const [featuredProducts, stats] = await Promise.all([
    getFeaturedProducts(),
    getPlatformStats(),
  ]);

  return (
    <PageShell showTopbar fullFooter>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildHomeJsonLd()) }} />
      <HomePage
        featuredProducts={featuredProducts}
        initialProducts={stats.products}
        initialVendors={stats.vendors}
      />
    </PageShell>
  );
}
