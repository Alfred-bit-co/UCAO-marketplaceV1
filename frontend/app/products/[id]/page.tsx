import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { RoleBadge } from "@/components/role-badge";
import { getProductById } from "@/lib/products";
import { formatPrice } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  return (
    <PageShell>
      <main className="container-ucao grid gap-8 py-[54px] md:grid-cols-2">
        {product && (
          <>
            <div className="relative min-h-[420px] overflow-hidden rounded-ucao shadow-ucao">
              <Image
                src={product.image_url || "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=85"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <section>
              <RoleBadge role={product.seller_role} />
              <h1 className="my-4 text-[clamp(34px,5vw,52px)] font-bold leading-tight">{product.name}</h1>
              <p className="price">{formatPrice(product.price)}</p>
              <p className="text-ucao-muted dark:text-[#a8b8cc]">{product.description}</p>
              <div className="my-5 rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
                <h2 className="text-xl font-bold">Vendeur</h2>
                <p>
                  <strong>{product.seller?.name || "Vendeur UCAO"}</strong>
                </p>
                <p>Rôle : {product.seller?.role || product.seller_role || "SIMPLE"}</p>
                <p>Contact : {product.seller?.phone || "Non renseigné"}</p>
              </div>
              <Link className="btn btn-primary" href="/products">
                <ArrowLeft size={18} /> Retour aux produits
              </Link>
            </section>
          </>
        )}
      </main>
    </PageShell>
  );
}
