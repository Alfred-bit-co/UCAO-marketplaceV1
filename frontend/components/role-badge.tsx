import { Gem, Medal, User } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RoleBadge({ role = "SIMPLE" }: { role?: UserRole | string }) {
  const normalized = String(role).toUpperCase();
  const Icon = normalized === "VIP" ? Medal : normalized === "PREMIUM" ? Gem : User;
  const label = normalized === "VIP" ? "VIP" : normalized === "PREMIUM" ? "Premium" : "Simple";

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
