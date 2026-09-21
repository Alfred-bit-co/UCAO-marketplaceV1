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
    <article className="group overflow-hidden rounded-2xl border border-ucao-line bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-[#263d5c] dark:bg-[#10233b]">
      <div className="relative aspect-square w-full overflow-hidden bg-ucao-soft sm:aspect-[4/3]">
        <Image
          src={product.image_url || IMAGE_ASSETS.productSupplies}
          alt={product.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 639px) 33vw, (max-width: 1023px) 25vw, (max-width: 1279px) 20vw, 16vw"
        />
      </div>
      <div className="p-2 sm:p-3">
        <div className="hidden sm:block"><RoleBadge tier={product.seller_tier} /></div>
        <h3 className="mt-1 line-clamp-2 min-h-8 text-[11px] font-bold leading-4 sm:mt-2 sm:min-h-10 sm:text-sm sm:leading-5">{product.name}</h3>
        {showDescription && <p className="mt-1 hidden line-clamp-2 text-sm text-ucao-muted dark:text-[#a8b8cc] lg:block">{product.description}</p>}
        <p className="my-1 text-xs font-extrabold text-ucao-success sm:my-2 sm:text-base">{formatPrice(product.price)}</p>
        <div className="mb-2 hidden flex-wrap gap-2 text-xs text-ucao-muted dark:text-[#a8b8cc] sm:flex">
          <span>{product.seller?.name || "Vendeur UCAO"}</span>
          <span>{product.category}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {whatsapp ? (
            <a className="btn btn-primary min-h-8 px-1 text-[10px] sm:min-h-9 sm:px-2 sm:text-xs" href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label={`Contacter le vendeur de ${product.name} sur WhatsApp`} title="Contacter sur WhatsApp">
              <MessageCircle size={14} /> <span className="hidden sm:inline">WhatsApp</span>
            </a>
          ) : (
            <span className="btn btn-ghost min-h-8 px-1 text-[10px] opacity-60 sm:min-h-9 sm:px-2 sm:text-xs" aria-disabled="true" title="Contact indisponible">
              <MessageCircle size={14} /> <span className="hidden sm:inline">Indisponible</span>
            </span>
          )}
          <Link className="btn btn-ghost min-h-8 px-1 text-[10px] sm:min-h-9 sm:px-2 sm:text-xs" href={`/products/${product.id}`} aria-label={`Voir le détail de ${product.name}`} title="Voir le détail">
            <Eye size={15} /> <span className="hidden sm:inline">Détail</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
