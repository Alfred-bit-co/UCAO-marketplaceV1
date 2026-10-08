import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Package } from "@/lib/icons";
import { LikeButton } from "@/components/like-button";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import type { Product, SubscriptionTier } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  /** Vrai pour les premières cartes visibles de la page (chargement prioritaire de l'image). */
  priority?: boolean;
  className?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TIER_BADGES: Partial<Record<SubscriptionTier, { label: string; className: string }>> = {
  VIP: { label: "VIP", className: "bg-amber-100 text-amber-900 ring-1 ring-amber-300" },
  PREMIUM: { label: "Premium", className: "bg-ucao-navy text-white ring-1 ring-white/25" },
};

function formatPrice(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

/** Lien WhatsApp avec un message prérempli, ou null si le vendeur n'a pas de numéro exploitable. */
function whatsappUrl(product: Product): string | null {
  let digits = (product.seller?.phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `228${digits}`; // numéro local togolais sans indicatif
  if (digits.length < 10) return null;

  const message = `Bonjour, je suis intéressé(e) par « ${product.name} » (${formatPrice(product.price)}) vu sur UCAO Marketplace.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function ProductCard({ product, priority = false, className = "" }: ProductCardProps) {
  const id = String(product.id);
  const href = `/products/${id}`;
  const tier = product.seller_tier ?? product.seller?.subscription_tier ?? null;
  const badge = tier ? TIER_BADGES[tier] : undefined;
  const categoryLabel = PRODUCT_CATEGORIES.find((category) => category.value === product.category)?.label ?? product.category;
  const contactUrl = whatsappUrl(product);
  // Les produits de démonstration n'ont pas d'identifiant UUID : pas de likes pour eux.
  const canLike = UUID_PATTERN.test(id);

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_10px_30px_-14px_rgba(24,36,95,0.35)] ring-1 ring-black/5 transition duration-300 motion-safe:hover:-translate-y-1 hover:shadow-[0_20px_44px_-16px_rgba(24,36,95,0.4)] dark:bg-[#10233b] dark:ring-white/10 ${className}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#e6eafa] to-[#c9d1ee] dark:from-[#132238] dark:to-[#1a304b]">
        <Link href={href} className="absolute inset-0 block" aria-label={`Voir ${product.name}`} tabIndex={-1}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-ucao-muted">
              <Package size={40} aria-hidden="true" />
            </span>
          )}
        </Link>

        {badge && (
          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm ${badge.className}`}>
            {badge.label}
          </span>
        )}

        {canLike && <LikeButton productId={id} className="absolute right-3 top-3 z-10" />}
      </div>

      {/* Contenu : le panneau blanc recouvre légèrement le bas de l'image */}
      <div className="relative -mt-5 flex flex-1 flex-col rounded-t-[22px] bg-white p-4 pt-5 dark:bg-[#10233b]">
        <span className="mb-2 inline-flex w-fit rounded-md border border-ucao-line px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ucao-muted dark:border-[#263d5c] dark:text-[#a8b8cc]">
          {categoryLabel}
        </span>

        <h3 className="text-lg font-bold leading-snug text-ucao-ink dark:text-white">
          <Link href={href} className="hover:underline focus-visible:underline">
            {product.name}
          </Link>
        </h3>

        {product.seller?.name && (
          <p className="mt-0.5 truncate text-xs font-medium text-ucao-muted dark:text-[#a8b8cc]">par {product.seller.name}</p>
        )}

        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-ucao-muted dark:text-[#a8b8cc]">{product.description}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ucao-muted dark:text-[#9db0c8]">Prix</p>
            <p className="text-xl font-bold leading-tight text-ucao-ink dark:text-white">{formatPrice(product.price)}</p>
          </div>

          {contactUrl ? (
            <a
              className="btn btn-primary min-h-10 shrink-0 gap-2 px-4 text-sm"
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contacter le vendeur de ${product.name} sur WhatsApp`}
            >
              <MessageCircle size={16} aria-hidden="true" /> Contacter
            </a>
          ) : (
            <Link className="btn btn-ghost min-h-10 shrink-0 px-4 text-sm" href={href}>
              Voir le produit
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}