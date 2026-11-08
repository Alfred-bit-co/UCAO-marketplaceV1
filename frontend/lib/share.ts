import { formatPrice } from "./utils";

/** Texte envoyé avec le lien quand on partage un produit. */
export function productShareText(name: string, price: number): string {
  return `Regarde « ${name} » à ${formatPrice(price)} sur UCAO Marketplace :`;
}

/** Lien WhatsApp « choisir un contact » avec le texte et l'adresse déjà écrits (aucun numéro imposé). */
export function whatsappShareUrl(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}
