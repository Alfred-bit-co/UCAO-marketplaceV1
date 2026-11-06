import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Le layout racine ajoute « | UCAO Marketplace » à chaque titre de page (title.template).
 * Une page qui écrit elle-même « UCAO Marketplace » dans son title produit donc le nom
 * en double (« Clubs — UCAO Marketplace | UCAO Marketplace »).
 *
 * Ce test lit le code source de app/ (sans importer les pages, qui dépendent de Supabase
 * et de Next.js) et refuse toute ligne `title: …` contenant le nom de la marque.
 * Exceptions : le layout racine (qui définit le modèle) et l'accueil (app/page.tsx),
 * auquel le modèle ne s'applique pas et qui commence volontairement par le nom.
 */
const APP_DIR = join(__dirname, "..", "app");
const BRAND = "UCAO Marketplace";
const ALLOWED = new Set(["layout.tsx", "page.tsx"]); // chemins relatifs à app/, racine uniquement

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("titres des pages", () => {
  it("le layout racine ajoute bien « | UCAO Marketplace »", () => {
    const layout = readFileSync(join(APP_DIR, "layout.tsx"), "utf8");
    expect(layout).toMatch(/template:\s*`%s \| \$\{SITE_NAME\}`/);
  });

  it("aucune page n'écrit « UCAO Marketplace » dans son propre titre", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(APP_DIR)) {
      const rel = relative(APP_DIR, file).split(sep).join("/");
      if (ALLOWED.has(rel)) continue;
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (/\btitle\s*:/.test(line) && line.includes(BRAND)) offenders.push(`${rel}:${index + 1} → ${line.trim()}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
