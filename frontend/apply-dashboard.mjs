#!/usr/bin/env node
// =====================================================================
// apply-dashboard.mjs — UCAO Marketplace : essai gratuit dans le tableau de bord
//
// Usage (depuis la RACINE du projet, le dossier qui contient "frontend") :
//     node apply-dashboard.mjs
//
// Ce que fait le script :
//   1. lib/users.ts        : le profil charge enfin `is_active` (le bandeau « compte
//                            suspendu » ne s'affichait jamais) et `trial_ends_at`
//   2. lib/subscriptions.ts: le statut d'abonnement sait maintenant s'il s'agit d'un essai
//   3. app/dashboard       : bandeau d'alerte en mode « essai », carte « Essai gratuit »
//   4. devenir-vendeur     : après le démarrage d'un essai, redirection vers /dashboard
//                            (et non /profil)
//   5. politique-confidentialite : empreintes hachées, essai gratuit et durée de conservation
// Il vérifie tout avant d'écrire, sauvegarde en *.bak-dash, et peut être relancé
// sans risque (ce qui est déjà appliqué est ignoré).
// =====================================================================
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

if (!fs.existsSync(path.join(root, "frontend", "package.json"))) {
  console.error("\n✗ Lance ce script depuis la racine du projet (le dossier qui contient « frontend »).");
  console.error("  Dossier actuel : " + root + "\n");
  process.exit(1);
}

const pending = new Map();
const problems = [];

function insertAfter(text, regex, insertion) {
  const m = regex.exec(text);
  if (!m) return null;
  const at = m.index + m[0].length;
  return text.slice(0, at) + insertion + text.slice(at);
}

function patch(rel, steps) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    problems.push(`${rel} : fichier introuvable`);
    return;
  }
  let text = fs.readFileSync(full, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  let changed = false;
  for (const step of steps) {
    if (step.done(text)) {
      console.log(`  =  ${rel} — ${step.name} (déjà appliqué)`);
      continue;
    }
    const next = step.apply(text, eol);
    if (next === null || next === text) {
      problems.push(`${rel} : impossible d'appliquer « ${step.name} » (le code a-t-il changé ?)`);
      continue;
    }
    text = next;
    changed = true;
    console.log(`  +  ${rel} — ${step.name}`);
  }
  if (changed) pending.set(rel, text);
}

console.log("\nAnalyse des retouches...\n");

// ---------- 1. lib/users.ts ----------
patch("frontend/lib/users.ts", [
  {
    name: "is_active et trial_ends_at chargés dans le profil",
    done: (t) => t.includes("trial_ends_at: data.trial_ends_at"),
    apply: (t, eol) => {
      const re = /^([ \t]*)cgu_accepted_at: data\.cgu_accepted_at,/m;
      const m = re.exec(t);
      if (!m) return null;
      const indent = m[1];
      const at = m.index + m[0].length;
      return (
        t.slice(0, at) +
        eol + indent + "is_active: data.is_active," +
        eol + indent + "trial_ends_at: data.trial_ends_at," +
        t.slice(at)
      );
    },
  },
]);

// ---------- 2. lib/subscriptions.ts ----------
patch("frontend/lib/subscriptions.ts", [
  {
    name: "type SubscriptionStatus : isTrial et trialEndsAt",
    done: (t) => t.includes("isTrial: boolean"),
    apply: (t, eol) =>
      insertAfter(t, /^[ \t]*isBlocked: boolean;/m, eol + "  isTrial: boolean;" + eol + "  trialEndsAt: string | null;"),
  },
  {
    name: "lecture de trial_ends_at",
    done: (t) => t.includes("subscription_expires_at, trial_ends_at"),
    apply: (t) =>
      t.includes('"role, subscription_tier, subscription_activated_at, subscription_expires_at"')
        ? t.replace(
            '"role, subscription_tier, subscription_activated_at, subscription_expires_at"',
            '"role, subscription_tier, subscription_activated_at, subscription_expires_at, trial_ends_at"',
          )
        : null,
  },
  {
    name: "variable trialEndsAt",
    done: (t) => t.includes("const trialEndsAt"),
    apply: (t, eol) =>
      insertAfter(
        t,
        /^[ \t]*const expiresAt = profile\.subscription_expires_at as string \| null;/m,
        eol + "  const trialEndsAt = (profile.trial_ends_at as string | null) ?? null;",
      ),
  },
  {
    name: "valeurs isTrial et trialEndsAt renvoyées",
    done: (t) => t.includes("isTrial: Boolean("),
    apply: (t, eol) => {
      const re = /^([ \t]*)isBlocked,/m;
      const m = re.exec(t);
      if (!m) return null;
      const indent = m[1];
      const at = m.index + m[0].length;
      return (
        t.slice(0, at) +
        eol + indent + "isTrial: Boolean(trialEndsAt && expiresAt && new Date(expiresAt).getTime() <= new Date(trialEndsAt).getTime())," +
        eol + indent + "trialEndsAt," +
        t.slice(at)
      );
    },
  },
]);

// ---------- 3. app/dashboard/page.tsx ----------
patch("frontend/app/dashboard/page.tsx", [
  {
    name: "bandeau d'alerte en mode essai",
    done: (t) => t.includes("isTrial={Boolean(status?.isTrial)}"),
    apply: (t) =>
      t.includes("isBlocked={Boolean(status?.isBlocked)} onExpired=")
        ? t.replace(
            "isBlocked={Boolean(status?.isBlocked)} onExpired=",
            "isBlocked={Boolean(status?.isBlocked)} isTrial={Boolean(status?.isTrial)} onExpired=",
          )
        : null,
  },
  {
    name: "carte « Essai gratuit » (titre)",
    done: (t) => t.includes('status?.isTrial ? "Essai gratuit" : "Abonnement actif"'),
    apply: (t) =>
      t.includes(">Abonnement actif</p>")
        ? t.replace(">Abonnement actif</p>", '>{status?.isTrial ? "Essai gratuit" : "Abonnement actif"}</p>')
        : null,
  },
  {
    name: "carte « Essai gratuit » (prix)",
    done: (t) => t.includes('"Essai gratuit, sans paiement"'),
    apply: (t) => {
      const before = 'plan ? `${currency(plan.price)} / mois` : "Aucun palier actif"';
      const after = 'plan ? (status?.isTrial ? "Essai gratuit, sans paiement" : `${currency(plan.price)} / mois`) : "Aucun palier actif"';
      return t.includes(before) ? t.replace(before, after) : null;
    },
  },
]);

// ---------- 4. app/devenir-vendeur/page.tsx ----------
patch("frontend/app/devenir-vendeur/page.tsx", [
  {
    name: "redirection après l'essai vers /dashboard",
    done: (t) => !t.includes('window.location.href = "/profil"'),
    apply: (t) => t.replace('window.location.href = "/profil"', 'window.location.href = "/dashboard"'),
  },
]);

// ---------- 5. app/politique-confidentialite/page.tsx ----------
patch("frontend/app/politique-confidentialite/page.tsx", [
  {
    name: "données collectées : empreintes hachées et essai gratuit",
    done: (t) => t.includes("empreintes numériques irréversibles"),
    apply: (t, eol) => {
      const re = /^([ \t]*)"La photo de votre carte d'étudiant \(pour les vendeurs\)",/m;
      const m = re.exec(t);
      if (!m) return null;
      const indent = m[1];
      const at = m.index + m[0].length;
      return (
        t.slice(0, at) +
        eol + indent + '"Des empreintes numériques irréversibles (valeurs hachées avec un secret conservé côté serveur) de votre numéro de téléphone, de votre adresse e-mail et du fichier de votre carte d\'étudiant, utilisées pour reconnaître une réinscription frauduleuse et appliquer la règle d\'un seul essai gratuit par personne",' +
        eol + indent + '"La date, le palier et la fin de votre essai gratuit, si vous en démarrez un",' +
        t.slice(at)
      );
    },
  },
  {
    name: "finalités : un seul essai gratuit par personne",
    done: (t) => t.includes("un seul essai gratuit par personne et repérer"),
    apply: (t, eol) => {
      const re = /^([ \t]*)"Protéger la plateforme contre la fraude et vous contacter au sujet de votre compte",/m;
      const m = re.exec(t);
      if (!m) return null;
      const indent = m[1];
      const at = m.index + m[0].length;
      return (
        t.slice(0, at) +
        eol + indent + '"Appliquer la règle d\'un seul essai gratuit par personne et repérer les comptes en double",' +
        t.slice(at)
      );
    },
  },
  {
    name: "conservation : exception pour les empreintes hachées (12 mois)",
    done: (t) => t.includes("conservés 12 mois après la suppression du compte"),
    apply: (t, eol) => {
      const re = /^([ \t]*)"Quand un compte est supprimé,[^\r\n]*",/m;
      const m = re.exec(t);
      if (!m) return null;
      const indent = m[1];
      const at = m.index + m[0].length;
      return (
        t.slice(0, at) +
        eol + indent + '"Exception : les empreintes hachées et l\'historique d\'essai gratuit sont conservés 12 mois après la suppression du compte, uniquement pour empêcher les abus. Elles ne permettent pas de retrouver votre numéro, votre e-mail ou votre carte.",' +
        t.slice(at)
      );
    },
  },
  {
    name: "date de dernière mise à jour",
    done: (t) => t.includes('const LAST_UPDATE = "14 octobre 2026";'),
    apply: (t) => (/const LAST_UPDATE = "[^"]*";/.test(t) ? t.replace(/const LAST_UPDATE = "[^"]*";/, 'const LAST_UPDATE = "14 octobre 2026";') : null),
  },
]);

if (problems.length) {
  console.error("\n✗ Rien n'a été modifié. Problèmes détectés :\n");
  for (const p of problems) console.error("   - " + p);
  console.error("\nEnvoie-moi ce message et je corrige.\n");
  process.exit(1);
}

console.log("\nÉcriture des fichiers...\n");
for (const [rel, text] of pending) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full + ".bak-dash")) fs.copyFileSync(full, full + ".bak-dash");
  fs.writeFileSync(full, text, "utf8");
  console.log(`  ✎ modifié  ${rel}`);
}
if (pending.size === 0) console.log("  (rien à modifier : tout est déjà appliqué)");

console.log(`
✓ Terminé.

Vérifie :
    cd frontend
    npx tsc --noEmit
    npm run dev
    -> /dashboard avec un compte en essai : carte « Essai gratuit » et bandeau adapté
    -> /politique-confidentialite : les nouvelles lignes apparaissent

Sauvegardes : fichiers *.bak-dash (à supprimer quand tout est bon) :
    PowerShell : Get-ChildItem -Recurse -Filter *.bak-dash | Remove-Item
    Bash       : find . -name "*.bak-dash" -not -path "*/node_modules/*" -delete
`);
