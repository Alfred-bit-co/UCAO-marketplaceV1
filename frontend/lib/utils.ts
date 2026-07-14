import { CURRENCY } from "./constants";

export function formatPrice(value: number | string | null | undefined): string {
  return `${Number(value ?? 0).toLocaleString("fr-FR")} ${CURRENCY}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getStandLimit(role: string): number {
  if (role === "VIP") return 5;
  if (role === "PREMIUM") return 3;
  return 0;
}
