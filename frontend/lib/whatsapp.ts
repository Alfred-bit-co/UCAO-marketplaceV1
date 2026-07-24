export function buildWhatsAppUrl(phone?: string | null, message?: string): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d]/g, "");
  if (!normalized) return null;
  const text = encodeURIComponent(
    message ?? "Bonjour, je suis intéressé(e) par vos produits sur UCAO Marketplace.",
  );
  return `https://wa.me/${normalized}?text=${text}`;
}