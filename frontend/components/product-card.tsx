import Image from "next/image";
import Link from "next/link";
import { Eye, MessageCircle } from "@/lib/icons";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { IMAGE_ASSETS } from "@/lib/constants";
import { RoleBadge } from "./role-badge";

export function ProductCard({ product, showDescription = false }: { product: Product; showDescription?: boolean }) {
  const whatsapp = buildWhatsAppUrl(
    product.seller?.phone,
    `Bonjour, je suis intéressé(e) par "${product.name}" sur UCAO Marketplace.`,
  );
  return (
    <article className="panel">
      <div className="relative h-36 w-full sm:h-40">
        <Image
          src={product.image_url || IMAGE_ASSETS.productSupplies}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      <div className="p-3.5">
        <RoleBadge tier={product.seller_tier} />
        <h3 className="mt-2 line-clamp-1 text-base font-bold">{product.name}</h3>
        {showDescription && <p className="mt-1 line-clamp-2 text-sm text-ucao-muted dark:text-[#a8b8cc]">{product.description}</p>}
        <p className="my-2 text-lg font-bold text-ucao-success">{formatPrice(product.price)}</p>
        <div className="mb-3 flex flex-wrap gap-2 text-xs text-ucao-muted dark:text-[#a8b8cc]">
          <span>{product.seller?.name || "Vendeur UCAO"}</span>
          <span>{product.category}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {whatsapp ? (
            <a className="btn btn-primary min-h-9 flex-1 px-2 text-xs" href={whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={15} /> WhatsApp
            </a>
          ) : (
            <span className="btn btn-ghost min-h-9 flex-1 px-2 text-xs opacity-60" aria-disabled="true">
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
