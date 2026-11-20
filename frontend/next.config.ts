import path from "node:path";
import type { NextConfig } from "next";
import { buildContentSecurityPolicy, SUPABASE_HOST } from "./lib/security-headers";

// En-têtes de sécurité envoyés avec chaque page.
// La CSP complète est APPLIQUÉE (audit du 20/11/2026) : elle était en Report-Only depuis le 02/11,
// sans violation relevée. Elle n'autorise que nos propres scripts, Google (connexion), Cloudflare
// Turnstile, notre projet Supabase et le service de paiement : un script injecté ne peut ni se
// charger depuis un autre site, ni envoyer des données ailleurs.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
];

const nextConfig: NextConfig = {
  // Keep tracing scoped to the frontend package when a parent workspace has
  // another lockfile (otherwise Next may pick the wrong project root).
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  experimental: {
    // Navigation : une page déjà ouverte reste en mémoire dans le navigateur (30 s pour les pages
    // recalculées à chaque visite, 5 min pour les autres). Revenir en arrière ou recliquer sur
    // « Produits » ne refait donc pas d'aller-retour vers le serveur.
    staleTimes: { dynamic: 30, static: 300 },
  },
  images: {
    // Images optimisées : uniquement les fichiers publics de NOTRE projet Supabase
    // (pas n'importe quel *.supabase.co), pour que personne ne fasse passer ses propres
    // fichiers par notre serveur.
    remotePatterns: [{ protocol: "https", hostname: SUPABASE_HOST, pathname: "/storage/v1/object/public/**" }],
    // Un SVG peut contenir du script : on ne les passe jamais par l'optimiseur.
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
