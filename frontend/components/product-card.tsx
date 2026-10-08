import Image from "next/image";
import Link from "next/link";
import { Clock3, MessageCircle, Package } from "@/lib/icons";
import { LikeButton } from "@/components/like-button";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import type { Product, SubscriptionTier } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  /** Affiche la description (à partir de la taille tablette). Absent = pas de description. */
  showDescription?: boolean;
  /** Affiche le bouton « Contacter » (WhatsApp). Vrai par défaut. */
  showContact?: boolean;
  /** Vrai pour les premières cartes visibles de la page (chargement prioritaire de l'image). */
  priority?: boolean;
  className?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TIER_BADGES: Partial<Record<SubscriptionTier, { label: string; className: string }>> = {
  VIP: { label: "VIP", className: "bg-amber-100 text-amber-900 ring-1 ring-amber-300" },
  PREMIUM: { label: "Premium", className: "bg-ucao-navy text-white" },
};

function formatPrice(value: number) {
  return value.toLocaleString("fr-FR");
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "V";
}

/** « il y a 8 min », « il y a 3 h », « il y a 2 j »… */
function timeAgo(iso?: string): string | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const minutes = Math.max(Math.floor((Date.now() - time) / 60000), 0);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

/** Lien WhatsApp avec un message prérempli, ou null si le vendeur n'a pas de numéro exploitable. */
function whatsappUrl(product: Product): string | null {
  let digits = (product.seller?.phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `228${digits}`; // numéro local togolais sans indicatif
  if (digits.length < 10) return null;

  const message = `Bonjour, je suis intéressé(e) par « ${product.name} » (${formatPrice(product.price)} FCFA) vu sur UCAO Marketplace.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Carte de produit, pensée pour une grille de 2 colonnes sur téléphone
 * (image carrée, heure de publication, cœur à cheval sur le bas de l'image,
 * prix, titre, catégorie, vendeur avec son badge de palier).
 */
export function ProductCard({
  product,
  showDescription = false,
  showContact = true,
  priority = false,
  className = "",
}: ProductCardProps) {
  const id = String(product.id);
  const href = `/products/${id}`;
  const tier = product.seller_tier ?? product.seller?.subscription_tier ?? null;
  const badge = tier ? TIER_BADGES[tier] : undefined;
  const categoryLabel = PRODUCT_CATEGORIES.find((category) => category.value === product.category)?.label ?? product.category;
  const contactUrl = showContact ? whatsappUrl(product) : null;
  const published = timeAgo(product.created_at);
  const sellerName = product.seller?.name;
  // Les produits de démonstration n'ont pas d'identifiant UUID : pas de likes pour eux.
  const canLike = UUID_PATTERN.test(id);

  return (
    <article
      className={`group relative flex h-full min-w-0 flex-col rounded-2xl bg-white shadow-[0_8px_26px_-14px_rgba(24,36,95,0.4)] ring-1 ring-black/5 transition duration-300 motion-safe:hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(24,36,95,0.45)] dark:bg-[#10233b] dark:ring-white/10 ${className}`}
    >
      {/* Image : le conteneur n'est pas coupé pour que le cœur puisse dépasser sur le contenu */}
      <div className="relative">
        <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#e6eafa] to-[#c9d1ee] dark:from-[#132238] dark:to-[#1a304b]">
          <Link href={href} className="absolute inset-0 block" aria-label={`Voir ${product.name}`} tabIndex={-1}>
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority={priority}
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition duration-500 motion-safe:group-hover:scale-105"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-ucao-muted">
                <Package size={36} aria-hidden="true" />
              </span>
            )}
          </Link>

          {published && (
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
              <Clock3 size={12} aria-hidden="true" />
              <span suppressHydrationWarning>{published}</span>
            </span>
          )}
        </div>

        {canLike && <LikeButton productId={id} className="absolute bottom-0 right-3 z-10 translate-y-1/2" />}
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-3 pt-6">
        <p className="text-base font-bold leading-tight text-ucao-red sm:text-lg dark:text-[#f0b429]">
          {formatPrice(product.price)} <span className="text-xs font-semibold">FCFA</span>
        </p>

        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ucao-ink dark:text-white">
          <Link href={href} className="hover:underline focus-visible:underline">
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 text-xs font-medium text-ucao-muted dark:text-[#a8b8cc]">{categoryLabel}</p>

        {showDescription && product.description && (
          <p className="mt-2 line-clamp-2 hidden text-sm leading-6 text-ucao-muted sm:block dark:text-[#a8b8cc]">{product.description}</p>
        )}

        <div className="mt-auto">
          {sellerName && (
            <div className="mt-3 flex items-center gap-2 border-t border-ucao-line pt-2.5 dark:border-[#263d5c]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ucao-navy text-[10px] font-bold text-white" aria-hidden="true">
                {initials(sellerName)}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ucao-muted dark:text-[#a8b8cc]">{sellerName}</span>
              {badge && (
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </div>
          )}

          {showContact &&
            (contactUrl ? (
              <a
                className="btn btn-primary mt-3 min-h-9 w-full gap-1.5 px-3 text-xs sm:text-sm"
                href={contactUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Contacter le vendeur de ${product.name} sur WhatsApp`}
              >
                <MessageCircle size={14} aria-hidden="true" /> Contacter
              </a>
            ) : (
              <Link className="btn btn-ghost mt-3 min-h-9 w-full px-3 text-xs sm:text-sm" href={href}>
                Voir le produit
              </Link>
            ))}
        </div>
      </div>
    </article>
  );
}