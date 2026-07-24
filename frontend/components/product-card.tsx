import Image from "next/image";
import Link from "next/link";
import { Eye, MessageCircle } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { RoleBadge } from "./role-badge";

export function ProductCard({ product, showDescription = false }: { product: Product; showDescription?: boolean }) {
  const whatsapp = buildWhatsAppUrl(
    product.seller?.phone,
    `Bonjour, je suis intéressé(e) par "${product.name}" sur UCAO Marketplace.`,
  );
  return (
    <article className="panel">
      <div className="relative h-[220px] w-full">
        <Image
          src={product.image_url || "/images/product-fournitures-etudiant.jpg"}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-5">
        <RoleBadge tier={product.seller_tier} />
        <h3 className="mt-3.5 mb-2 text-[21px] font-bold">{product.name}</h3>
        {showDescription && <p className="text-ucao-muted dark:text-[#a8b8cc]">{product.description}</p>}
        <p className="price">{formatPrice(product.price)}</p>
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-ucao-muted dark:text-[#a8b8cc]">
          <span>{product.seller?.name || "Vendeur UCAO"}</span>
          <span>{product.category}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {whatsapp ? (
            <a className="btn btn-primary flex-1" href={whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} /> Discuter sur WhatsApp
            </a>
          ) : (
            <span className="btn btn-ghost flex-1 opacity-60" aria-disabled="true">
              Contact indisponible
            </span>
          )}
          <Link className="btn btn-ghost flex-1" href={`/products/${product.id}`}>
            <Eye size={18} /> Voir le détail
          </Link>
        </div>
      </div>
    </article>
  );
}