import Link from "next/link";
import { BookOpen, Cpu, ShoppingBasket, Shirt, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProductCategory } from "@/lib/types";

const CATEGORY_ICONS: { value: ProductCategory; label: string; Icon: LucideIcon }[] = [
  { value: "nourriture", label: "Nourriture", Icon: ShoppingBasket },
  { value: "vetements", label: "Vêtements", Icon: Shirt },
  { value: "numerique", label: "Numérique", Icon: Cpu },
  { value: "livres", label: "Livres", Icon: BookOpen },
  { value: "services", label: "Services", Icon: Wrench },
];

export function CategoryStrip() {
  return (
    <nav className="border-b border-ucao-line bg-white py-4 dark:border-[#1c3050] dark:bg-[#0b1c31]" aria-label="Catégories rapides">
      <div className="container-ucao flex flex-wrap justify-center gap-3 md:justify-start">
        {CATEGORY_ICONS.map(({ value, label, Icon }) => (
          <Link
            key={value}
            href={`/products?category=${value}`}
            className="flex items-center gap-2 rounded-full border border-ucao-line px-4 py-2 text-sm font-bold text-ucao-navy transition-colors hover:border-ucao-red hover:text-ucao-red dark:border-[#1c3050] dark:text-white dark:hover:border-[#ff9aa0] dark:hover:text-[#ff9aa0]"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}