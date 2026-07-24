import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGE_ASSETS } from "@/lib/constants";
import type { Stand } from "@/lib/types";
import { RoleBadge } from "./role-badge";

export function StandCard({ stand }: { stand: Stand }) {
  return (
    <article className="panel my-[42px] grid min-h-[300px] md:grid-cols-[420px_1fr]">
      <div className="relative min-h-[260px]">
        <Image
          src={stand.banner_url || IMAGE_ASSETS.standFallback}
          alt={stand.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 420px"
        />
      </div>
      <div className="grid content-center p-5">
        <RoleBadge tier={stand.seller_tier} />
        <h3 className="mt-3.5 mb-2 text-[21px] font-bold">{stand.name}</h3>
        <p className="text-ucao-muted dark:text-[#a8b8cc]">{stand.description}</p>
        <div className="my-4 flex flex-wrap gap-3 text-sm text-ucao-muted dark:text-[#a8b8cc]">
          <span>Responsable : {stand.seller?.name || "Vendeur UCAO"}</span>
          <span>{stand.products?.length || 0} produit(s)</span>
        </div>
        <Link className="btn btn-primary w-fit" href={`/stands/${stand.id}`}>
          <ArrowRight size={18} /> Voir le stand
        </Link>
      </div>
    </article>
  );
}