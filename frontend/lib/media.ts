import { STORAGE_BUCKET } from "./constants";
import { SUPABASE_HOST } from "./security-headers";

const MEDIA_PREFIX = `https://${SUPABASE_HOST}/storage/v1/object/public/${STORAGE_BUCKET}/`;

/**
 * Vrai si l'adresse pointe vers une image de NOTRE stockage public.
 * Les adresses d'images sont du texte libre en base : on n'affiche jamais une image
 * hébergée ailleurs (pistage des visiteurs, contenu changé après coup).
 */
export function isTrustedMediaUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.startsWith(MEDIA_PREFIX) && !url.includes("..") && !/[\s\\]/.test(url);
}

/** L'adresse si elle vient de notre stockage, sinon null. */
export function trustedMediaUrl(url: string | null | undefined): string | null {
  return isTrustedMediaUrl(url) ? url : null;
}
