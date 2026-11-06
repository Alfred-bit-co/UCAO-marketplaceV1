import path from "node:path";
import type { NextConfig } from "next";
import { buildContentSecurityPolicy, ENFORCED_CSP, SUPABASE_HOST } from "./lib/security-headers";

// En-têtes de sécurité envoyés avec chaque page.
// - La CSP complète est en mode « Report-Only » : le navigateur signale (console) ce qu'elle
//   bloquerait, sans rien bloquer. À passer en « Content-Security-Policy » après vérification.
// - Une CSP minimale, elle, est appliquée tout de suite : frame-ancestors, object-src et
//   base-uri ne sont pas pris en compte en mode Report-Only.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: ENFORCED_CSP },
  { key: "Content-Security-Policy-Report-Only", value: buildContentSecurityPolicy() },
];

const nextConfig: NextConfig = {
  // Keep tracing scoped to the frontend package when a parent workspace has
  // another lockfile (otherwise Next may pick the wrong project root).
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
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
