import { SITE_URL } from "./constants";

/** Nom de la marque, identique partout (titres, Open Graph, données structurées). */
export const SITE_NAME = "UCAO Marketplace";
export const SITE_TAGLINE = "Achète, vends et échange entre étudiants";
export const SITE_DESCRIPTION =
  "Marketplace étudiante indépendante pour stands, produits, services et projets de la communauté UCAO-UUT.";

export const CONTACT = {
  email: "ucaomarketplace2026@gmail.com",
  telephone: "+22892982926",
  instagram: "https://www.instagram.com/ucaomarketplace",
} as const;

/**
 * Données structurées de l'accueil (schema.org) : le site et l'organisation qui l'édite.
 * Pas de parentOrganization : la plateforme est indépendante, non affiliée officiellement
 * à l'UCAO-UUT (voir le pied de page).
 */
export function buildHomeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: "ucaomarketplace",
        url: `${SITE_URL}/`,
        inLanguage: "fr",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo-ucao.png`,
        email: CONTACT.email,
        telephone: CONTACT.telephone,
        sameAs: [CONTACT.instagram],
      },
    ],
  };
}

/** Sérialise le JSON-LD sans permettre de fermer la balise <script> (« < » échappé). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
