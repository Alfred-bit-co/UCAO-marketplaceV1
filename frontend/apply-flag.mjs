#!/usr/bin/env node
// =====================================================================
// apply-flag.mjs — UCAO Marketplace : interrupteur « essais gratuits »
//
// Usage (depuis la RACINE du projet, le dossier qui contient "frontend") :
//     node apply-flag.mjs
//
// Ce que fait le script :
//   Les boutons d'essai gratuit de /devenir-vendeur ne s'affichent que si la variable
//   NEXT_PUBLIC_TRIALS_ENABLED vaut "true". Sans cette variable, la page ressemble à
//   l'ancienne : tu peux donc déployer le reste (Turnstile, tableau de bord, politique de
//   confidentialité) sans ouvrir les essais aux vrais étudiants avant que le paiement marche.
//   Pour tester les essais chez toi : NEXT_PUBLIC_TRIALS_ENABLED=true dans frontend/.env.local
//
// Il vérifie tout avant d'écrire, sauvegarde en *.bak-flag, et peut être relancé sans risque.
// =====================================================================
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const rel = "frontend/app/devenir-vendeur/page.tsx";

if (!fs.existsSync(path.join(root, "frontend", "package.json"))) {
  console.error("\n✗ Lance ce script depuis la racine du projet (le dossier qui contient « frontend »).");
  console.error("  Dossier actuel : " + root + "\n");
  process.exit(1);
}

const full = path.join(root, rel);
if (!fs.existsSync(full)) {
  console.error(`\n✗ ${rel} : fichier introuvable\n`);
  process.exit(1);
}

let text = fs.readFileSync(full, "utf8");
const eol = text.includes("\r\n") ? "\r\n" : "\n";
const problems = [];
let changed = false;

function step(name, done, apply) {
  if (done(text)) {
    console.log(`  =  ${name} (déjà appliqué)`);
    return;
  }
  const next = apply(text);
  if (next === null || next === text) {
    problems.push(`impossible d'appliquer « ${name} » (le code a-t-il changé ?)`);
    return;
  }
  text = next;
  changed = true;
  console.log(`  +  ${name}`);
}

console.log("\nAnalyse...\n");

step(
  "constante TRIALS_ENABLED",
  (t) => t.includes("const TRIALS_ENABLED"),
  (t) => {
    const m = /^const PHONE_PATTERN = .*;/m.exec(t);
    if (!m) return null;
    const at = m.index + m[0].length;
    return (
      t.slice(0, at) +
      eol + eol +
      '// Les essais gratuits restent masqués tant que NEXT_PUBLIC_TRIALS_ENABLED n\'est pas "true".' + eol +
      'const TRIALS_ENABLED = process.env.NEXT_PUBLIC_TRIALS_ENABLED === "true";' +
      t.slice(at)
    );
  },
);

step(
  "canTrial dépend de l'interrupteur",
  (t) => t.includes("TRIALS_ENABLED && trialStatus?.eligible === true"),
  (t) =>
    t.includes("const canTrial = trialStatus?.eligible === true;")
      ? t.replace("const canTrial = trialStatus?.eligible === true;", "const canTrial = TRIALS_ENABLED && trialStatus?.eligible === true;")
      : null,
);

step(
  "trialUsed dépend de l'interrupteur",
  (t) => t.includes('TRIALS_ENABLED && trialStatus?.reason === "already_used"'),
  (t) =>
    t.includes('const trialUsed = trialStatus?.reason === "already_used";')
      ? t.replace('const trialUsed = trialStatus?.reason === "already_used";', 'const trialUsed = TRIALS_ENABLED && trialStatus?.reason === "already_used";')
      : null,
);

step(
  "pas d'appel inutile à trial_status quand l'interrupteur est coupé",
  (t) => !t.includes("setTrialStatus(await getTrialStatus());") || t.includes("if (TRIALS_ENABLED) setTrialStatus(await getTrialStatus());"),
  (t) => t.split("setTrialStatus(await getTrialStatus());").join("if (TRIALS_ENABLED) setTrialStatus(await getTrialStatus());"),
);

if (problems.length) {
  console.error("\n✗ Rien n'a été modifié. Problèmes détectés :\n");
  for (const p of problems) console.error("   - " + p);
  console.error("\nEnvoie-moi ce message et je corrige.\n");
  process.exit(1);
}

if (changed) {
  if (!fs.existsSync(full + ".bak-flag")) fs.copyFileSync(full, full + ".bak-flag");
  fs.writeFileSync(full, text, "utf8");
  console.log(`\n  ✎ modifié  ${rel}`);
} else {
  console.log("\n  (rien à modifier : tout est déjà appliqué)");
}

console.log(`
✓ Terminé.

Pour TESTER les essais chez toi, ajoute dans frontend/.env.local :
    NEXT_PUBLIC_TRIALS_ENABLED=true
puis relance « npm run dev ». Sur Vercel, ne crée PAS cette variable tant que le paiement
n'est pas validé : les essais resteront invisibles pour les vrais étudiants.

Sauvegarde : *.bak-flag (à supprimer quand tout est bon) :
    PowerShell : Get-ChildItem -Recurse -Filter *.bak-flag | Remove-Item
`);
