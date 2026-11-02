import path from "node:path";
import type { NextConfig } from "next";

// Les images optimisées ne viennent que du projet Supabase du site (et pas de n'importe quel
// projet *.supabase.co), pour que personne ne fasse passer ses propres fichiers par notre serveur.
function supabaseImageHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname || "**.supabase.co";
  } catch {
    return "**.supabase.co";
  }
}

// En-têtes de sécurité envoyés avec chaque page.
// La CSP reste volontairement limitée (pas de liste de scripts) pour ne pas casser Turnstile
// ni Supabase : elle interdit surtout d'afficher le site dans un cadre et les plugins.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  // Keep tracing scoped to the frontend package when a parent workspace has
  // another lockfile (otherwise Next may pick the wrong project root).
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseImageHost(), pathname: "/storage/v1/object/public/**" },
    ],
    // Un SVG peut contenir du script : on ne les passe jamais par l'optimiseur.
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
