import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import { IMAGE_ASSETS } from "@/lib/constants";
import type { Stand } from "@/lib/types";
import { RoleBadge } from "./role-badge";

/** A full-width, clickable banner leading to the stand detail page. */
export function StandCard({ stand }: { stand: Stand }) {
  const productCount = stand.products?.length ?? 0;

  return (
    <Link
      href={`/stands/${stand.id}`}
      className="group relative flex min-h-44 w-full overflow-hidden rounded-ucao bg-ucao-navy text-white shadow-ucao transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ucao-red sm:min-h-48"
    >
      <Image src={stand.banner_url || IMAGE_ASSETS.standFallback} alt="" fill className="object-cover opacity-55 transition duration-300 group-hover:scale-105" sizes="100vw" />
      <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,38,.92),rgba(18,36,78,.72)_58%,rgba(122,30,45,.48))]" />
      <span className="relative flex w-full flex-wrap items-center justify-between gap-4 p-6 sm:px-8">
        <span>
          <RoleBadge tier={stand.seller_tier} />
          <span className="mt-2 block text-2xl font-bold">{stand.name}</span>
          <span className="mt-1 block max-w-2xl truncate text-sm text-white/80">{stand.description}</span>
          <span className="mt-2 block text-sm font-medium text-white/90">{productCount} produit{productCount > 1 ? "s" : ""}</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-ucao border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold">
          Voir le stand <ArrowRight size={16} />
        </span>
      </span>
    </Link>
  );
}
