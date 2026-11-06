import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, ENFORCED_CSP, PAYMENT_API_ORIGIN, SUPABASE_HOST } from "@/lib/security-headers";

const csp = buildContentSecurityPolicy();
const directive = (name: string) => csp.split("; ").find((part) => part.startsWith(name + " ")) ?? "";

describe("CSP (Report-Only)", () => {
  it("autorise Google Identity Services et Cloudflare Turnstile (scripts et cadres)", () => {
    for (const name of ["script-src", "frame-src"]) {
      expect(directive(name)).toContain("https://accounts.google.com");
      expect(directive(name)).toContain("https://challenges.cloudflare.com");
    }
  });

  it("autorise Supabase en https et wss, et le backend Render", () => {
    expect(SUPABASE_HOST).toBe("kodlozakvjuegwtetewm.supabase.co");
    expect(directive("connect-src")).toContain("https://kodlozakvjuegwtetewm.supabase.co");
    expect(directive("connect-src")).toContain("wss://kodlozakvjuegwtetewm.supabase.co");
    expect(PAYMENT_API_ORIGIN).toBe("https://ucao-marketplace-api.onrender.com");
    expect(directive("connect-src")).toContain(PAYMENT_API_ORIGIN);
  });

  it("interdit les cadres, les plugins et tout projet Supabase autre que le nôtre", () => {
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(csp).not.toContain("*.supabase.co");
    expect(csp).not.toMatch(/(^|\s)\*(\s|;|$)/);
  });

  it("applique dès maintenant la partie anti-clickjacking", () => {
    expect(ENFORCED_CSP).toContain("frame-ancestors 'none'");
    expect(ENFORCED_CSP).toContain("object-src 'none'");
  });
});

describe("script du thème (avant affichage)", () => {
  const script = readFileSync(join(__dirname, "..", "public", "theme-init.js"), "utf8");
  // Lu comme texte : le composant React (JSX) n'est pas importable directement par vitest ici.
  const provider = readFileSync(join(__dirname, "..", "components", "theme-provider.tsx"), "utf8");
  const THEME_STORAGE_KEY = provider.match(/THEME_STORAGE_KEY = "([^"]+)"/)?.[1];

  it("est un fichier du site (couvert par script-src 'self'), avec la même clé que le ThemeProvider", () => {
    expect(directive("script-src")).toContain("'self'");
    expect(THEME_STORAGE_KEY).toBe("ucao-theme");
    expect(script).toContain(`"${THEME_STORAGE_KEY}"`);
  });

  it("n'est plus écrit en ligne dans le layout", () => {
    const layout = readFileSync(join(__dirname, "..", "app", "layout.tsx"), "utf8");
    expect(layout).toContain('src="/theme-init.js"');
    expect(layout).not.toContain("THEME_INIT_SCRIPT");
  });
});
