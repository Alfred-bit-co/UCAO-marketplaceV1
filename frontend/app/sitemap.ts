import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getProducts } from "@/lib/products";
import { getStands } from "@/lib/stands";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/stands",
    "/clubs",
    "/a-propos",
    "/comment-ca-marche",
    "/faq",
    "/devenir-vendeur",
    "/login",
    "/mentions-legales",
    "/conditions-generales",
    "/politique-confidentialite",
    "/politique-securite",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const [products, stands] = await Promise.all([
    getProducts({ page: 1, perPage: 100 }),
    getStands(1, 100),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.items.map((product) => ({
    url: `${SITE_URL}/products/${product.id}`,
    lastModified: product.created_at ? new Date(product.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const standRoutes: MetadataRoute.Sitemap = stands.items.map((stand) => ({
    url: `${SITE_URL}/stands/${stand.id}`,
    lastModified: stand.created_at ? new Date(stand.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes, ...standRoutes];
}
