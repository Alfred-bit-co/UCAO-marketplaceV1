import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "@/lib/icons";
import { ContactLink } from "@/components/contact-link";
import { PageShell } from "@/components/page-shell";
import { ProductGallery } from "@/components/product-gallery";
import { RoleBadge } from "@/components/role-badge";
import { ShareButton } from "@/components/share-button";
import { SITE_URL } from "@/lib/constants";
import { getProductById } from "@/lib/products";
import { productShareText } from "@/lib/share";
import { formatPrice, productPageTitle } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  // Le modèle du layout ajoute « | UCAO Marketplace » : on ne le répète pas ici.
  if (!product) return { title: "Produit introuvable" };

  const description = product.description?.slice(0, 160) || `${product.name} sur UCAO Marketplace`;
  const image = product.image_url || product.images?.[0]?.url;
  const title = productPageTitle(product.name, product.price);
  const url = `${SITE_URL}/products/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    // Sans photo, l'image de partage générique (app/twitter-image.tsx) reste utilisée.
    twitter: image ? { card: "summary_large_image", title, description, images: [image] } : undefined,
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
            {whatsapp ? (
              <ContactLink productId={id} className="btn btn-primary" href={whatsapp}>
                <MessageCircle size={18} /> Discuter sur WhatsApp
              </ContactLink>
            ) : (
              // Vendeur sans numéro : pas de lien WhatsApp de remplacement.
              <button className="btn btn-ghost" type="button" disabled title="Ce vendeur n'a pas encore ajouté son numéro WhatsApp">
                <MessageCircle size={18} /> Contact indisponible
              </button>
            )}
            <ShareButton
              title={product.name}
              text={productShareText(product.name, product.price)}
              url={`${SITE_URL}/products/${id}`}
            />
            <Link className="btn btn-ghost" href="/products">
              <ArrowLeft size={18} /> Retour aux produits
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
