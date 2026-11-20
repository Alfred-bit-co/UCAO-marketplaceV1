/**
 * Palette des clubs : 20 couleurs bien distinctes (pas deux nuances proches), toutes lisibles
 * sur fond clair. Chaque club en choisit une, unique parmi les clubs non supprimés : c'est
 * elle qui colore ses cases dans le calendrier de la semaine.
 */
export type ClubColor = { hex: string; label: string };

export const CLUB_COLORS: ClubColor[] = [
  { hex: "#1E88E5", label: "Bleu" },
  { hex: "#E53935", label: "Rouge" },
  { hex: "#43A047", label: "Vert" },
  { hex: "#FB8C00", label: "Orange" },
  { hex: "#8E24AA", label: "Violet" },
  { hex: "#4DD0E1", label: "Cyan" },
  { hex: "#EC407A", label: "Framboise" },
  { hex: "#FDD835", label: "Jaune" },
  { hex: "#6D4C41", label: "Brun" },
  { hex: "#00897B", label: "Turquoise" },
  { hex: "#3949AB", label: "Indigo" },
  { hex: "#9CCC65", label: "Vert clair" },
  { hex: "#827717", label: "Olive" },
  { hex: "#546E7A", label: "Gris bleu" },
  { hex: "#C0CA33", label: "Lime" },
  { hex: "#B39DDB", label: "Lavande" },
  { hex: "#A5D6A7", label: "Menthe" },
  { hex: "#1B5E20", label: "Vert foncé" },
  { hex: "#4A148C", label: "Prune" },
  { hex: "#F48FB1", label: "Rose" },
];

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}

/** Normalise « #1e88e5 » en « #1E88E5 » pour comparer deux couleurs. */
export function normalizeHex(value: string): string {
  return value.trim().toUpperCase();
}

/** Nom lisible d'une couleur de la palette (ou le code brut si elle n'en fait pas partie). */
export function colorLabel(hex: string): string {
  const found = CLUB_COLORS.find((color) => normalizeHex(color.hex) === normalizeHex(hex));
  return found ? found.label : hex;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Luminance relative (WCAG) d'une couleur #RRGGBB, entre 0 (noir) et 1 (blanc). */
export function relativeLuminance(hex: string): number {
  if (!isHexColor(hex)) return 0;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Couleur du texte à poser sur un fond de cette couleur : celle des deux (blanc ou presque-noir)
 * qui donne le meilleur contraste. Le seuil 0,179 est le point où les deux contrastes s'égalent.
 */
export function readableTextColor(hex: string): "#ffffff" | "#071426" {
  return relativeLuminance(hex) > 0.179 ? "#071426" : "#ffffff";
}
