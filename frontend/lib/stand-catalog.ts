import type { Stand, StandCategory, StandContactMode } from "./types";

/** Catégories d'un stand (valeur stockée en base, libellé affiché). Doit rester synchronisé avec stands_category_check. */
export const STAND_CATEGORIES: { value: StandCategory; label: string }[] = [
  { value: "alimentation", label: "Alimentation" },
  { value: "mode-accessoires", label: "Mode & Accessoires" },
  { value: "informatique", label: "Informatique" },
  { value: "services", label: "Services" },
  { value: "education", label: "Éducation" },
  { value: "sante-bien-etre", label: "Santé & Bien-être" },
  { value: "autres", label: "Autres" },
];

/** Filtres de la page Stands : « Tous » puis les catégories. */
export const STAND_CATEGORY_FILTERS: { value: StandCategory | "tous"; label: string }[] = [
  { value: "tous", label: "Tous" },
  ...STAND_CATEGORIES,
];

export function isStandCategory(value: unknown): value is StandCategory {
  return STAND_CATEGORIES.some((item) => item.value === value);
}

export function getStandCategoryLabel(value: string | null | undefined): string {
  return STAND_CATEGORIES.find((item) => item.value === value)?.label ?? "Autres";
}

/**
 * Modes proposés par un stand. Doit rester synchronisé avec stands_contact_modes_check.
 * Les modes marqués « bouton » ajoutent un bouton WhatsApp avec un message déjà écrit.
 */
export const STAND_CONTACT_MODES: { value: StandContactMode; label: string; hint: string; needsPhone: boolean }[] = [
  { value: "sur_place", label: "Sur place", hint: "Les clients viennent sur le campus", needsPhone: false },
  { value: "reservation", label: "Réservation", hint: "Ajoute un bouton « Réserver »", needsPhone: true },
  { value: "livraison", label: "Livraison", hint: "Ajoute un bouton « Commander »", needsPhone: true },
  { value: "sur_commande", label: "Sur commande", hint: "Ajoute un bouton « Commander »", needsPhone: true },
  { value: "en_ligne", label: "En ligne", hint: "Service rendu à distance", needsPhone: false },
  { value: "rendez_vous", label: "Rendez-vous", hint: "Ajoute un bouton « Prendre rendez-vous »", needsPhone: true },
];

export function isStandContactMode(value: unknown): value is StandContactMode {
  return STAND_CONTACT_MODES.some((item) => item.value === value);
}

export function getContactModeLabel(value: string): string {
  return STAND_CONTACT_MODES.find((item) => item.value === value)?.label ?? value;
}

/** Garde uniquement les modes valides, sans doublon, dans l'ordre du catalogue. */
export function sanitizeContactModes(values: unknown): StandContactMode[] {
  if (!Array.isArray(values)) return [];
  return STAND_CONTACT_MODES.map((item) => item.value).filter((mode) => values.includes(mode));
}

/** true si au moins un des modes ajoute un bouton WhatsApp (donc exige un numéro). */
export function modesNeedPhone(modes: readonly StandContactMode[]): boolean {
  return STAND_CONTACT_MODES.some((item) => item.needsPhone && modes.includes(item.value));
}

const PHONE_PATTERN = /^\+\d{8,15}$/;

/** Normalise un numéro saisi à la main : « +228 90 12 34 56 » ou « 00228… » deviennent « +22890123456 ». null si invalide. */
export function normalizeWhatsAppPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let phone = input.replace(/[\s.\-()]/g, "");
  if (phone.startsWith("00")) phone = "+" + phone.slice(2);
  return PHONE_PATTERN.test(phone) ? phone : null;
}

export type StandAction = {
  key: "commander" | "reserver" | "rendez-vous" | "contact";
  label: string;
  url: string;
  primary: boolean;
};

function whatsAppLink(phone: string, message: string): string {
  return "https://wa.me/" + phone.slice(1) + "?text=" + encodeURIComponent(message);
}

/**
 * Boutons WhatsApp d'un stand, avec leur message prêt à envoyer.
 * Renvoie une liste vide si le stand n'a pas de numéro valide.
 */
export function buildStandActions(stand: Pick<Stand, "name" | "whatsapp_phone" | "contact_modes">): StandAction[] {
  const phone = normalizeWhatsAppPhone(stand.whatsapp_phone);
  if (!phone) return [];

  const modes = stand.contact_modes ?? [];
  const intro = "Bonjour, je vous contacte depuis UCAO Marketplace au sujet de votre stand « " + stand.name + " ». ";
  const actions: StandAction[] = [];

  if (modes.includes("sur_commande") || modes.includes("livraison")) {
    actions.push({
      key: "commander",
      label: "Commander",
      url: whatsAppLink(phone, intro + "Je souhaite passer une commande. Pouvez-vous m'indiquer ce qui est disponible et comment procéder ?"),
      primary: true,
    });
  }
  if (modes.includes("reservation")) {
    actions.push({
      key: "reserver",
      label: "Réserver",
      url: whatsAppLink(phone, intro + "Je souhaite faire une réservation. Quelles sont vos disponibilités ?"),
      primary: actions.length === 0,
    });
  }
  if (modes.includes("rendez_vous")) {
    actions.push({
      key: "rendez-vous",
      label: "Prendre rendez-vous",
      url: whatsAppLink(phone, intro + "Je souhaite prendre rendez-vous. Quels créneaux proposez-vous ?"),
      primary: actions.length === 0,
    });
  }
  actions.push({
    key: "contact",
    label: "Contacter sur WhatsApp",
    url: whatsAppLink(phone, intro + "J'aimerais en savoir plus."),
    primary: actions.length === 0,
  });
  return actions;
}
