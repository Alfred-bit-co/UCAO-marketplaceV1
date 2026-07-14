import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { RoleBadge } from "./role-badge";

export function ProductCard({ product, showDescription = false }: { product: Product; showDescription?: boolean }) {
  return (
    <article className="panel">
      <div className="relative h-[220px] w-full">
        <Image
          src={product.image_url || "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=85"}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-5">
        <RoleBadge role={product.seller_role} />
        <h3 className="mt-3.5 mb-2 text-[21px] font-bold">{product.name}</h3>
        {showDescription && <p className="text-ucao-muted dark:text-[#a8b8cc]">{product.description}</p>}
        <p className="price">{formatPrice(product.price)}</p>
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-ucao-muted dark:text-[#a8b8cc]">
          <span>{product.seller?.name || "Vendeur UCAO"}</span>
          <span>{product.category}</span>
        </div>
        <Link className="btn btn-ghost" href={`/products/${product.id}`}>
          <Eye size={18} /> Voir le détail
        </Link>
      </div>
    </article>
  );
}
