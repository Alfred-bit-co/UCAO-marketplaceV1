#!/usr/bin/env node
// =====================================================================
// apply-turnstile.mjs — UCAO Marketplace : anti-robot Cloudflare Turnstile (front)
//
// Usage (depuis la RACINE du projet, le dossier qui contient "frontend") :
//     node apply-turnstile.mjs
//
// Ce que fait le script :
//   1. crée  components/turnstile-widget.tsx  (le widget anti-robot)
//   2. remplace app/api/security/check/route.ts : il ne vérifie plus de jeton (un jeton
//      ne sert qu'une fois ; c'est Supabase qui le vérifie), il garde la limite de débit
//   3. components/auth-form.tsx : widget affiché, jeton envoyé à Supabase
//      (connexion, inscription, renvoi de l'e-mail de confirmation)
//   4. app/mot-de-passe-oublie/page.tsx : widget affiché, jeton envoyé à Supabase
//
// SANS DANGER TANT QUE LA VARIABLE NEXT_PUBLIC_TURNSTILE_SITE_KEY N'EXISTE PAS :
// sans elle, aucun widget ne s'affiche et le site fonctionne comme avant.
// N'ACTIVE le CAPTCHA dans Supabase QU'APRÈS avoir déployé et vérifié le widget.
//
// Il vérifie tout avant d'écrire, sauvegarde en *.bak-turnstile, et peut être relancé
// sans risque (ce qui est déjà appliqué est ignoré).
// =====================================================================
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const decode = (b64) => Buffer.from(b64, "base64").toString("utf8");

const NEW_FILES = {
  "frontend/components/turnstile-widget.tsx": "InVzZSBjbGllbnQiOwoKaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAicmVhY3QiOwoKLyoqCiAqIFdpZGdldCBDbG91ZGZsYXJlIFR1cm5zdGlsZSAoYW50aS1yb2JvdCkgw6AgYnJhbmNoZXIgc3VyIGxlcyBmb3JtdWxhaXJlcy4KICoKICogLSBTaSBORVhUX1BVQkxJQ19UVVJOU1RJTEVfU0lURV9LRVkgbidlc3QgcGFzIGTDqWZpbmksIGxlIGNvbXBvc2FudCBuJ2FmZmljaGUgcmllbgogKiAgIChsZSBzaXRlIGZvbmN0aW9ubmUgY29tbWUgYXZhbnQgOiBwcmF0aXF1ZSBlbiBkw6l2ZWxvcHBlbWVudCkuCiAqIC0gYG9uVG9rZW5gIHJlw6dvaXQgbGUgamV0b24gcXVhbmQgbGEgdsOpcmlmaWNhdGlvbiByw6l1c3NpdCwgb3UgbnVsbCBxdWFuZCBpbCBleHBpcmUgLwogKiAgIMOpY2hvdWUuIFVuIGpldG9uIG5lIHNlcnQgcXUnVU5FIGZvaXMgOiBhcHLDqHMgY2hhcXVlIGVudm9pIGRlIGZvcm11bGFpcmUsIGNoYW5nZXoKICogICBgcmVzZXRLZXlgIHBvdXIgb2J0ZW5pciB1biBub3V2ZWF1IGpldG9uLgogKiAtIExhIHbDqXJpZmljYXRpb24gZHUgamV0b24gZXN0IGZhaXRlIHBhciBTdXBhYmFzZSBBdXRoIChvcHRpb24gwqsgQ0FQVENIQSBwcm90ZWN0aW9uIMK7CiAqICAgZHUgdGFibGVhdSBkZSBib3JkKSA6IG9uIGx1aSB0cmFuc21ldCBsZSBqZXRvbiB2aWEgYG9wdGlvbnMuY2FwdGNoYVRva2VuYC4KICovCgpkZWNsYXJlIGdsb2JhbCB7CiAgaW50ZXJmYWNlIFdpbmRvdyB7CiAgICB0dXJuc3RpbGU/OiB7CiAgICAgIHJlbmRlcjogKGNvbnRhaW5lcjogc3RyaW5nIHwgSFRNTEVsZW1lbnQsIG9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiBzdHJpbmc7CiAgICAgIHJlc2V0OiAod2lkZ2V0SWQ/OiBzdHJpbmcpID0+IHZvaWQ7CiAgICAgIHJlbW92ZTogKHdpZGdldElkPzogc3RyaW5nKSA9PiB2b2lkOwogICAgfTsKICB9Cn0KCmNvbnN0IFNDUklQVF9TUkMgPSAiaHR0cHM6Ly9jaGFsbGVuZ2VzLmNsb3VkZmxhcmUuY29tL3R1cm5zdGlsZS92MC9hcGkuanM/cmVuZGVyPWV4cGxpY2l0IjsKbGV0IHNjcmlwdFByb21pc2U6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbDsKCmZ1bmN0aW9uIGxvYWRUdXJuc3RpbGUoKTogUHJvbWlzZTx2b2lkPiB7CiAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICJ1bmRlZmluZWQiKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCJUdXJuc3RpbGUgOiBwYXMgZGUgbmF2aWdhdGV1ciIpKTsKICBpZiAod2luZG93LnR1cm5zdGlsZSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpOwogIGlmIChzY3JpcHRQcm9taXNlKSByZXR1cm4gc2NyaXB0UHJvbWlzZTsKCiAgc2NyaXB0UHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHsKICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoInNjcmlwdCIpOwogICAgc2NyaXB0LnNyYyA9IFNDUklQVF9TUkM7CiAgICBzY3JpcHQuYXN5bmMgPSB0cnVlOwogICAgc2NyaXB0LmRlZmVyID0gdHJ1ZTsKICAgIHNjcmlwdC5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKCk7CiAgICBzY3JpcHQub25lcnJvciA9ICgpID0+IHsKICAgICAgc2NyaXB0UHJvbWlzZSA9IG51bGw7CiAgICAgIHJlamVjdChuZXcgRXJyb3IoIlR1cm5zdGlsZSA6IHNjcmlwdCBpbmRpc3BvbmlibGUiKSk7CiAgICB9OwogICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpOwogIH0pOwogIHJldHVybiBzY3JpcHRQcm9taXNlOwp9Cgp0eXBlIFR1cm5zdGlsZVdpZGdldFByb3BzID0gewogIG9uVG9rZW46ICh0b2tlbjogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDsKICAvKiogQ2hhbmdleiBjZXR0ZSB2YWxldXIgcG91ciByZWRlbWFuZGVyIHVuIGpldG9uIChhcHLDqHMgY2hhcXVlIGVudm9pIGRlIGZvcm11bGFpcmUpLiAqLwogIHJlc2V0S2V5PzogbnVtYmVyOwogIC8qKiBOb20gZGUgbCdhY3Rpb24sIHZpc2libGUgZGFucyBsZXMgc3RhdGlzdGlxdWVzIENsb3VkZmxhcmUgKGV4LiAibG9naW4iKS4gKi8KICBhY3Rpb24/OiBzdHJpbmc7CiAgY2xhc3NOYW1lPzogc3RyaW5nOwp9OwoKZXhwb3J0IGZ1bmN0aW9uIFR1cm5zdGlsZVdpZGdldCh7IG9uVG9rZW4sIHJlc2V0S2V5ID0gMCwgYWN0aW9uLCBjbGFzc05hbWUgfTogVHVybnN0aWxlV2lkZ2V0UHJvcHMpIHsKICBjb25zdCBzaXRlS2V5ID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfVFVSTlNUSUxFX1NJVEVfS0VZOwogIGNvbnN0IGNvbnRhaW5lclJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7CiAgY29uc3Qgd2lkZ2V0SWRSZWYgPSB1c2VSZWY8c3RyaW5nIHwgbnVsbD4obnVsbCk7CiAgY29uc3Qgb25Ub2tlblJlZiA9IHVzZVJlZihvblRva2VuKTsKICBjb25zdCBbZmFpbGVkLCBzZXRGYWlsZWRdID0gdXNlU3RhdGUoZmFsc2UpOwoKICB1c2VFZmZlY3QoKCkgPT4gewogICAgb25Ub2tlblJlZi5jdXJyZW50ID0gb25Ub2tlbjsKICB9LCBbb25Ub2tlbl0pOwoKICB1c2VFZmZlY3QoKCkgPT4gewogICAgaWYgKCFzaXRlS2V5IHx8ICFjb250YWluZXJSZWYuY3VycmVudCkgcmV0dXJuOwogICAgbGV0IGNhbmNlbGxlZCA9IGZhbHNlOwoKICAgIGxvYWRUdXJuc3RpbGUoKQogICAgICAudGhlbigoKSA9PiB7CiAgICAgICAgaWYgKGNhbmNlbGxlZCB8fCAhY29udGFpbmVyUmVmLmN1cnJlbnQgfHwgIXdpbmRvdy50dXJuc3RpbGUpIHJldHVybjsKICAgICAgICBzZXRGYWlsZWQoZmFsc2UpOwogICAgICAgIHdpZGdldElkUmVmLmN1cnJlbnQgPSB3aW5kb3cudHVybnN0aWxlLnJlbmRlcihjb250YWluZXJSZWYuY3VycmVudCwgewogICAgICAgICAgc2l0ZWtleTogc2l0ZUtleSwKICAgICAgICAgIGFjdGlvbiwKICAgICAgICAgIHRoZW1lOiAiYXV0byIsCiAgICAgICAgICBsYW5ndWFnZTogImZyIiwKICAgICAgICAgIGNhbGxiYWNrOiAodG9rZW46IHN0cmluZykgPT4gb25Ub2tlblJlZi5jdXJyZW50KHRva2VuKSwKICAgICAgICAgICJleHBpcmVkLWNhbGxiYWNrIjogKCkgPT4gb25Ub2tlblJlZi5jdXJyZW50KG51bGwpLAogICAgICAgICAgImVycm9yLWNhbGxiYWNrIjogKCkgPT4gewogICAgICAgICAgICBvblRva2VuUmVmLmN1cnJlbnQobnVsbCk7CiAgICAgICAgICAgIHNldEZhaWxlZCh0cnVlKTsKICAgICAgICAgIH0sCiAgICAgICAgfSk7CiAgICAgIH0pCiAgICAgIC5jYXRjaCgoKSA9PiB7CiAgICAgICAgaWYgKGNhbmNlbGxlZCkgcmV0dXJuOwogICAgICAgIG9uVG9rZW5SZWYuY3VycmVudChudWxsKTsKICAgICAgICBzZXRGYWlsZWQodHJ1ZSk7CiAgICAgIH0pOwoKICAgIHJldHVybiAoKSA9PiB7CiAgICAgIGNhbmNlbGxlZCA9IHRydWU7CiAgICAgIGlmICh3aWRnZXRJZFJlZi5jdXJyZW50ICYmIHdpbmRvdy50dXJuc3RpbGUpIHdpbmRvdy50dXJuc3RpbGUucmVtb3ZlKHdpZGdldElkUmVmLmN1cnJlbnQpOwogICAgICB3aWRnZXRJZFJlZi5jdXJyZW50ID0gbnVsbDsKICAgIH07CiAgfSwgW3NpdGVLZXksIGFjdGlvbl0pOwoKICB1c2VFZmZlY3QoKCkgPT4gewogICAgaWYgKHJlc2V0S2V5ID4gMCAmJiB3aWRnZXRJZFJlZi5jdXJyZW50ICYmIHdpbmRvdy50dXJuc3RpbGUpIHsKICAgICAgd2luZG93LnR1cm5zdGlsZS5yZXNldCh3aWRnZXRJZFJlZi5jdXJyZW50KTsKICAgICAgb25Ub2tlblJlZi5jdXJyZW50KG51bGwpOwogICAgfQogIH0sIFtyZXNldEtleV0pOwoKICBpZiAoIXNpdGVLZXkpIHJldHVybiBudWxsOwoKICByZXR1cm4gKAogICAgPGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZX0+CiAgICAgIDxkaXYgcmVmPXtjb250YWluZXJSZWZ9IC8+CiAgICAgIHtmYWlsZWQgJiYgKAogICAgICAgIDxwIGNsYXNzTmFtZT0ibXQtMiB0ZXh0LXNtIHRleHQtdWNhby1yZWQiIHJvbGU9ImFsZXJ0Ij4KICAgICAgICAgIExhIHbDqXJpZmljYXRpb24gYW50aS1yb2JvdCBuJmFwb3M7YSBwYXMgcHUgc2UgY2hhcmdlci4gUmVjaGFyZ2V6IGxhIHBhZ2Ugb3UgdsOpcmlmaWV6IHZvdHJlIGNvbm5leGlvbi4KICAgICAgICA8L3A+CiAgICAgICl9CiAgICA8L2Rpdj4KICApOwp9Cg==",
};
const REPLACED_FILES = {
  // [contenu, marqueur prouvant que le fichier est déjà à jour]
  "frontend/app/api/security/check/route.ts": ["aW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSAibmV4dC9zZXJ2ZXIiOwoKY29uc3QgUkFURV9MSU1JVF9XSU5ET1dfTVMgPSA1ICogNjAgKiAxMDAwOwpjb25zdCBSQVRFX0xJTUlUX01BWF9SRVFVRVNUUyA9IDg7CmNvbnN0IE1BWF9UUkFDS0VEX0tFWVMgPSA1XzAwMDsKY29uc3QgYXR0ZW1wdHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyW10+KCk7CgpmdW5jdGlvbiBjbGllbnRLZXkocmVxdWVzdDogUmVxdWVzdCk6IHN0cmluZyB7CiAgY29uc3QgdmVyY2VsSXAgPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KCJ4LXZlcmNlbC1mb3J3YXJkZWQtZm9yIik7CiAgY29uc3QgZm9yd2FyZGVkSXAgPSByZXF1ZXN0LmhlYWRlcnMuZ2V0KCJ4LWZvcndhcmRlZC1mb3IiKT8uc3BsaXQoIiwiKVswXT8udHJpbSgpOwogIHJldHVybiB2ZXJjZWxJcCB8fCBmb3J3YXJkZWRJcCB8fCAidW5rbm93biI7Cn0KCi8vIMOJdml0ZSBxdWUgbGEgbcOpbW9pcmUgZ3Jvc3Npc3NlIGluZMOpZmluaW1lbnQgOiBvbiBvdWJsaWUgbGVzIGFkcmVzc2VzIHNhbnMgdGVudGF0aXZlIHLDqWNlbnRlLgpmdW5jdGlvbiBwcnVuZUF0dGVtcHRzKG5vdzogbnVtYmVyKSB7CiAgaWYgKGF0dGVtcHRzLnNpemUgPD0gTUFYX1RSQUNLRURfS0VZUykgcmV0dXJuOwogIGZvciAoY29uc3QgW2tleSwgdGltZXNdIG9mIGF0dGVtcHRzKSB7CiAgICBpZiAodGltZXMuZXZlcnkoKHRpbWUpID0+IG5vdyAtIHRpbWUgPj0gUkFURV9MSU1JVF9XSU5ET1dfTVMpKSBhdHRlbXB0cy5kZWxldGUoa2V5KTsKICB9Cn0KCmZ1bmN0aW9uIGlzUmF0ZUxpbWl0ZWQoa2V5OiBzdHJpbmcpOiBib29sZWFuIHsKICBjb25zdCBub3cgPSBEYXRlLm5vdygpOwogIHBydW5lQXR0ZW1wdHMobm93KTsKICBjb25zdCByZWNlbnRBdHRlbXB0cyA9IChhdHRlbXB0cy5nZXQoa2V5KSA/PyBbXSkuZmlsdGVyKCh0aW1lKSA9PiBub3cgLSB0aW1lIDwgUkFURV9MSU1JVF9XSU5ET1dfTVMpOwogIGlmIChyZWNlbnRBdHRlbXB0cy5sZW5ndGggPj0gUkFURV9MSU1JVF9NQVhfUkVRVUVTVFMpIHsKICAgIGF0dGVtcHRzLnNldChrZXksIHJlY2VudEF0dGVtcHRzKTsKICAgIHJldHVybiB0cnVlOwogIH0KICByZWNlbnRBdHRlbXB0cy5wdXNoKG5vdyk7CiAgYXR0ZW1wdHMuc2V0KGtleSwgcmVjZW50QXR0ZW1wdHMpOwogIHJldHVybiBmYWxzZTsKfQoKLyoqCiAqIExpbWl0ZSBkZSBkw6liaXQgZGUgY29uZm9ydCBwb3VyIGxhIGNvbm5leGlvbiBldCBsJ2luc2NyaXB0aW9uLgogKgogKiBDZXR0ZSByb3V0ZSBuZSB2w6lyaWZpZSBQQVMgbGUgamV0b24gVHVybnN0aWxlIDogdW4gamV0b24gbmUgc2VydCBxdSd1bmUgZm9pcywgZXQgYydlc3QKICogU3VwYWJhc2UgQXV0aCAob3B0aW9uIMKrIENBUFRDSEEgcHJvdGVjdGlvbiDCuykgcXVpIGxlIHbDqXJpZmllLCBjw7R0w6kgc2VydmV1ciwgYXUgbW9tZW50CiAqIGRlIGNyw6llciBsZSBjb21wdGUgb3UgZGUgY29ubmVjdGVyLiBDJ2VzdCBsYSBzZXVsZSB2w6lyaWZpY2F0aW9uIHF1J3VuIHNjcmlwdCBuZSBwZXV0IHBhcwogKiBjb250b3VybmVyIGVuIGFwcGVsYW50IFN1cGFiYXNlIGRpcmVjdGVtZW50LiBMYSBtw6ltb2lyZSBkZSBjZXR0ZSByb3V0ZSBlc3QgcHJvcHJlIMOgIGNoYXF1ZQogKiBpbnN0YW5jZSBzZXJ2ZXJsZXNzIDogbGEgbGltaXRlIGVzdCBkb25jIGluZGljYXRpdmUsIHBhcyBhYnNvbHVlLgogKi8KZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxdWVzdDogUmVxdWVzdCkgewogIGNvbnN0IGJvZHkgPSAoYXdhaXQgcmVxdWVzdC5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCkpIGFzIHsgYWN0aW9uPzogc3RyaW5nIH0gfCBudWxsOwogIGlmICghYm9keSB8fCAhWyJsb2dpbiIsICJyZWdpc3RlciJdLmluY2x1ZGVzKGJvZHkuYWN0aW9uID8/ICIiKSkgewogICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICJSZXF1w6p0ZSBkZSBzw6ljdXJpdMOpIGludmFsaWRlLiIgfSwgeyBzdGF0dXM6IDQwMCB9KTsKICB9CgogIGlmIChpc1JhdGVMaW1pdGVkKGAke2JvZHkuYWN0aW9ufToke2NsaWVudEtleShyZXF1ZXN0KX1gKSkgewogICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKAogICAgICB7IGVycm9yOiAiVHJvcCBkZSB0ZW50YXRpdmVzLiBSw6llc3NheWV6IGRhbnMgcXVlbHF1ZXMgbWludXRlcy4iIH0sCiAgICAgIHsgc3RhdHVzOiA0MjksIGhlYWRlcnM6IHsgIlJldHJ5LUFmdGVyIjogU3RyaW5nKFJBVEVfTElNSVRfV0lORE9XX01TIC8gMTAwMCkgfSB9LAogICAgKTsKICB9CgogIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG9rOiB0cnVlIH0pOwp9Cg==", "MAX_TRACKED_KEYS"],
};

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
function insertBefore(text, regex, insertion) {
  const m = regex.exec(text);
  if (!m) return null;
  return text.slice(0, m.index) + insertion + text.slice(m.index);
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

// ---------- auth-form.tsx ----------
patch("frontend/components/auth-form.tsx", [
  {
    name: "import du widget",
    done: (t) => t.includes('from "./turnstile-widget"'),
    apply: (t, eol) =>
      insertAfter(t, /^import \{ GoogleIcon \} from "\.\/google-icon";/m, eol + 'import { TurnstileWidget } from "./turnstile-widget";'),
  },
  {
    name: "constante CAPTCHA_ENABLED",
    done: (t) => t.includes("const CAPTCHA_ENABLED"),
    apply: (t, eol) =>
      insertAfter(t, /^const PHONE_PATTERN = .*;/m, eol + "const CAPTCHA_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);"),
  },
  {
    name: "états captchaToken et captchaReset",
    done: (t) => t.includes("setCaptchaToken] = useState"),
    apply: (t, eol) =>
      insertAfter(
        t,
        /^([ \t]*)const \[submitting, setSubmitting\] = useState\(false\);/m,
        eol + "  const [captchaToken, setCaptchaToken] = useState<string | null>(null);" + eol + "  const [captchaReset, setCaptchaReset] = useState(0);",
      ),
  },
  {
    name: "vérification anti-robot avant l'envoi",
    done: (t) => t.includes("Veuillez valider la vérification anti-robot"),
    apply: (t, eol) =>
      insertBefore(
        t,
        /^([ \t]*)const rateCheck = await checkAuthRateLimit\(mode\);/m,
        [
          "    if (CAPTCHA_ENABLED && !captchaToken) {",
          "      setError(true);",
          '      setMessage("Veuillez valider la vérification anti-robot avant de continuer.");',
          "      return;",
          "    }",
          "",
          "",
        ].join(eol),
      ),
  },
  {
    name: "jeton envoyé à Supabase (connexion)",
    done: (t) => t.includes("signInWithPassword({ email, password, options: { captchaToken"),
    apply: (t) =>
      t.includes("signInWithPassword({ email, password })")
        ? t.replace("signInWithPassword({ email, password })", "signInWithPassword({ email, password, options: { captchaToken: captchaToken ?? undefined } })")
        : null,
  },
  {
    name: "jeton envoyé à Supabase (inscription)",
    done: (t) => t.includes("captchaToken: captchaToken ?? undefined,"),
    apply: (t, eol) => {
      const re = /^([ \t]*)emailRedirectTo: `\$\{window\.location\.origin\}\/auth\/callback`,/m;
      const m = re.exec(t);
      if (!m) return null;
      const at = m.index + m[0].length;
      return t.slice(0, at) + eol + m[1] + "captchaToken: captchaToken ?? undefined," + t.slice(at);
    },
  },
  {
    name: "nouveau jeton après chaque envoi",
    done: (t) => t.includes("if (CAPTCHA_ENABLED) {"),
    apply: (t, eol) => {
      const re = /^([ \t]*)\} finally \{(\r?\n)([ \t]*)setSubmitting\(false\);/m;
      const m = re.exec(t);
      if (!m) return null;
      const at = m.index + m[0].length;
      const i = m[3];
      return (
        t.slice(0, at) +
        eol + i + "if (CAPTCHA_ENABLED) {" +
        eol + i + "  setCaptchaToken(null);" +
        eol + i + "  setCaptchaReset((count) => count + 1);" +
        eol + i + "}" +
        t.slice(at)
      );
    },
  },
  {
    name: "renvoi de l'e-mail de confirmation (jeton)",
    done: (t) => t.includes('type: "signup", email, options: { captchaToken'),
    apply: (t, eol) => {
      let out = t;
      if (!out.includes('supabase.auth.resend({ type: "signup", email })')) return null;
      out = out.replace(
        'supabase.auth.resend({ type: "signup", email })',
        'supabase.auth.resend({ type: "signup", email, options: { captchaToken: captchaToken ?? undefined } })',
      );
      const before = /^([ \t]*)setResending\(true\);/m.exec(out);
      if (!before) return null;
      const guard = [
        "    if (CAPTCHA_ENABLED && !captchaToken) {",
        "      setError(true);",
        '      setMessage("Veuillez valider la vérification anti-robot, puis réessayez.");',
        "      return;",
        "    }",
        "",
        "",
      ].join(eol);
      out = out.slice(0, before.index) + guard + out.slice(before.index);
      const after = /^([ \t]*)setResending\(false\);/m.exec(out);
      if (!after) return null;
      const at = after.index + after[0].length;
      const i = after[1];
      return (
        out.slice(0, at) +
        eol + i + "if (CAPTCHA_ENABLED) {" +
        eol + i + "  setCaptchaToken(null);" +
        eol + i + "  setCaptchaReset((count) => count + 1);" +
        eol + i + "}" +
        out.slice(at)
      );
    },
  },
  {
    name: "widget affiché dans le formulaire",
    done: (t) => t.includes("<TurnstileWidget"),
    apply: (t, eol) =>
      insertBefore(
        t,
        /^([ \t]*)<button className="btn btn-primary mt-5 w-full" type="submit" disabled=\{submitting\}>/m,
        [
          "        {CAPTCHA_ENABLED && (",
          '          <TurnstileWidget className="mt-5" action={mode} onToken={setCaptchaToken} resetKey={captchaReset} />',
          "        )}",
          "",
        ].join(eol),
      ),
  },
]);

// ---------- mot-de-passe-oublie/page.tsx ----------
patch("frontend/app/mot-de-passe-oublie/page.tsx", [
  {
    name: "import du widget",
    done: (t) => t.includes("turnstile-widget"),
    apply: (t, eol) =>
      insertAfter(t, /^import \{ createClient \} from "@\/lib\/supabase";/m, eol + 'import { TurnstileWidget } from "@/components/turnstile-widget";'),
  },
  {
    name: "constante CAPTCHA_ENABLED",
    done: (t) => t.includes("const CAPTCHA_ENABLED"),
    apply: (t, eol) =>
      insertBefore(
        t,
        /^export default function MotDePasseOubliePage\(\) \{/m,
        "const CAPTCHA_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);" + eol + eol,
      ),
  },
  {
    name: "états captchaToken et captchaReset",
    done: (t) => t.includes("setCaptchaToken] = useState"),
    apply: (t, eol) =>
      insertAfter(
        t,
        /^([ \t]*)const \[message, setMessage\] = useState<string \| null>\(null\);/m,
        eol + "  const [captchaToken, setCaptchaToken] = useState<string | null>(null);" + eol + "  const [captchaReset, setCaptchaReset] = useState(0);",
      ),
  },
  {
    name: "vérification anti-robot avant l'envoi",
    done: (t) => t.includes("Veuillez valider la vérification anti-robot"),
    apply: (t, eol) =>
      insertBefore(
        t,
        /^([ \t]*)setStatus\("sending"\);/m,
        [
          "    if (CAPTCHA_ENABLED && !captchaToken) {",
          '      setStatus("error");',
          '      setMessage("Veuillez valider la vérification anti-robot avant de continuer.");',
          "      return;",
          "    }",
          "",
          "",
        ].join(eol),
      ),
  },
  {
    name: "jeton envoyé à Supabase",
    done: (t) => t.includes("captchaToken: captchaToken ?? undefined"),
    apply: (t, eol) => {
      const re = /^([ \t]*)redirectTo: `\$\{window\.location\.origin\}\/reinitialiser-mot-de-passe`,/m;
      const m = re.exec(t);
      if (!m) return null;
      const at = m.index + m[0].length;
      return t.slice(0, at) + eol + m[1] + "captchaToken: captchaToken ?? undefined," + t.slice(at);
    },
  },
  {
    name: "nouveau jeton après l'envoi",
    done: (t) => t.includes("if (CAPTCHA_ENABLED) {"),
    apply: (t, eol) =>
      insertBefore(
        t,
        /^([ \t]*)if \(error\) \{(\r?\n)[ \t]*console\.error\("RESET PASSWORD ERROR:"/m,
        [
          "    if (CAPTCHA_ENABLED) {",
          "      setCaptchaToken(null);",
          "      setCaptchaReset((count) => count + 1);",
          "    }",
          "",
          "",
        ].join(eol).replace(/\r?\n/g, eol),
      ),
  },
  {
    name: "widget affiché dans le formulaire",
    done: (t) => t.includes("<TurnstileWidget"),
    apply: (t, eol) =>
      insertBefore(
        t,
        /^([ \t]*)\{message && <p className="notice notice-error" role="alert">\{message\}<\/p>\}/m,
        [
          "              {CAPTCHA_ENABLED && (",
          '                <TurnstileWidget action="password-reset" onToken={setCaptchaToken} resetKey={captchaReset} />',
          "              )}",
          "",
        ].join(eol),
      ),
  },
]);

// ---------- nouveaux fichiers / fichiers remplacés ----------
const toWrite = new Map();
for (const [rel, b64] of Object.entries(NEW_FILES)) {
  const full = path.join(root, rel);
  const content = decode(b64);
  if (fs.existsSync(full) && fs.readFileSync(full, "utf8").replace(/\r\n/g, "\n") === content.replace(/\r\n/g, "\n")) {
    console.log(`  =  ${rel} (déjà à jour)`);
    continue;
  }
  console.log(`  ${fs.existsSync(full) ? "↻" : "★"}  ${rel}`);
  toWrite.set(rel, content);
}
for (const [rel, [b64, marker]] of Object.entries(REPLACED_FILES)) {
  const full = path.join(root, rel);
  if (fs.existsSync(full) && fs.readFileSync(full, "utf8").includes(marker)) {
    console.log(`  =  ${rel} (déjà à jour)`);
    continue;
  }
  if (!fs.existsSync(full)) problems.push(`${rel} : fichier introuvable`);
  else {
    console.log(`  ↻  ${rel} (remplacé)`);
    toWrite.set(rel, decode(b64));
  }
}

if (problems.length) {
  console.error("\n✗ Rien n'a été modifié. Problèmes détectés :\n");
  for (const p of problems) console.error("   - " + p);
  console.error("\nEnvoie-moi ce message et je corrige.\n");
  process.exit(1);
}

// ---------- écriture ----------
function backup(rel) {
  const full = path.join(root, rel);
  if (fs.existsSync(full) && !fs.existsSync(full + ".bak-turnstile")) fs.copyFileSync(full, full + ".bak-turnstile");
}

console.log("\nÉcriture des fichiers...\n");
for (const [rel, content] of toWrite) {
  const full = path.join(root, rel);
  backup(rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log(`  ✎ écrit    ${rel}`);
}
for (const [rel, text] of pending) {
  backup(rel);
  fs.writeFileSync(path.join(root, rel), text, "utf8");
  console.log(`  ✎ modifié  ${rel}`);
}
if (toWrite.size === 0 && pending.size === 0) console.log("  (rien à modifier : tout est déjà appliqué)");

console.log(`
✓ Terminé.

Vérifie :
    cd frontend
    npx tsc --noEmit
    npm run dev

Sans NEXT_PUBLIC_TURNSTILE_SITE_KEY, rien ne change à l'écran (c'est voulu).
Pour tester le widget en local, ajoute dans frontend/.env.local la clé de TEST de Cloudflare :
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
puis relance « npm run dev ».

Sauvegardes : fichiers *.bak-turnstile (à supprimer quand tout est bon) :
    PowerShell : Get-ChildItem -Recurse -Filter *.bak-turnstile | Remove-Item
    Bash       : find . -name "*.bak-turnstile" -not -path "*/node_modules/*" -delete
`);
