import {
  BookOpen,
  DotsThree,
  ForkKnife,
  GearSix,
  Heartbeat,
  Laptop,
  SquaresFour,
  TShirt,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

// Icône de chaque catégorie de stand (clé = valeur stockée en base, voir lib/stand-catalog.ts)
const CATEGORY_ICONS: Record<string, Icon> = {
  tous: SquaresFour,
  alimentation: ForkKnife,
  "mode-accessoires": TShirt,
  informatique: Laptop,
  services: GearSix,
  education: BookOpen,
  "sante-bien-etre": Heartbeat,
  autres: DotsThree,
};

export function StandCategoryIcon({ category, size = 16, className }: { category: string; size?: number; className?: string }) {
  const CategoryIcon = CATEGORY_ICONS[category] ?? DotsThree;
  return <CategoryIcon size={size} className={className} aria-hidden="true" />;
}
