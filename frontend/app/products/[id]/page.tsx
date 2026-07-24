import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { RoleBadge } from "@/components/role-badge";
import { getProductById } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  const whatsapp = product
    ? buildWhatsAppUrl(
        product.seller?.phone,
        `Bonjour, je suis intéressé(e) par "${product.name}" sur UCAO Marketplace.`,
      )
    : null;
  return (
    <PageShell>
      <main className="container-ucao grid gap-8 py-[54px] md:grid-cols-2">
        {product && (
          <>
            <div className="relative min-h-[420px] overflow-hidden rounded-ucao shadow-ucao">
              <Image
                src={product.image_url || "/images/product-fournitures-etudiant.jpg"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <section>
              <RoleBadge tier={product.seller_tier} />
              <h1 className="my-4 text-[clamp(34px,5vw,52px)] font-bold leading-tight">{product.name}</h1>
              <p className="price">{formatPrice(product.price)}</p>
              <p className="text-ucao-muted dark:text-[#a8b8cc]">{product.description}</p>
              <div className="my-5 rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
                <h2 className="text-xl font-bold">Vendeur</h2>
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
          </>
        )}
      </main>
    </PageShell>
  );
}