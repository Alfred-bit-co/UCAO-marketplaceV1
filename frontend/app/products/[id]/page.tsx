import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "@/lib/icons";
import { PageShell } from "@/components/page-shell";
import { ProductGallery } from "@/components/product-gallery";
import { RoleBadge } from "@/components/role-badge";
import { SITE_URL } from "@/lib/constants";
import { getProductById } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Produit introuvable — UCAO Marketplace" };

  const description = product.description?.slice(0, 160) || `${product.name} sur UCAO Marketplace`;
  const image = product.image_url || product.images?.[0]?.url;

  return {
    title: `${product.name} — UCAO Marketplace`,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: `${SITE_URL}/products/${id}`,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const whatsapp = buildWhatsAppUrl(
    product.seller?.phone,
    `Bonjour, je suis intéressé(e) par "${product.name}" sur UCAO Marketplace.`,
  );

  return (
    <PageShell>
      <main className="container-ucao grid gap-8 py-[54px] md:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />
        <section>
          <RoleBadge tier={product.seller_tier} />
          <h1 className="my-4 text-[clamp(34px,5vw,52px)] font-medium leading-tight">{product.name}</h1>
          <p className="price">{formatPrice(product.price)}</p>
          <p className="text-ucao-muted dark:text-[#a8b8cc]">{product.description}</p>
          <div className="my-5 rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
            <h2 className="text-xl font-medium">Vendeur</h2>
            <p>
              <strong>{product.seller?.name || "Vendeur UCAO"}</strong>
            </p>
            <p>Palier : {product.seller?.subscription_tier ?? product.seller_tier ?? "STANDARD"}</p>
            <p>Contact : {product.seller?.phone || "Non renseigné"}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {whatsapp && (
              <a className="btn btn-primary" href={whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} /> Discuter sur WhatsApp
              </a>
            )}
            <Link className="btn btn-ghost" href="/products">
              <ArrowLeft size={18} /> Retour aux produits
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
