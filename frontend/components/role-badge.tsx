import { Gem, Medal, User } from "lucide-react";
import type { SubscriptionTier } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RoleBadge({ tier = "STANDARD" }: { tier?: SubscriptionTier | string | null }) {
  const normalized = String(tier ?? "STANDARD").toUpperCase();
  const Icon = normalized === "VIP" ? Medal : normalized === "PREMIUM" ? Gem : User;
  const label = normalized === "VIP" ? "VIP" : normalized === "PREMIUM" ? "Premium" : "Standard";
  return (
    <span
      className={cn(
        "role-badge",
        normalized === "VIP" && "role-badge-vip",
        normalized === "PREMIUM" && "role-badge-premium",
      )}
    >
      <Icon size={15} aria-hidden /> {label}
    </span>
  );
}