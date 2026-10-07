// @ts-nocheck
// Suppression d'un compte par un administrateur.
//
// 1. Authentifie l'appelant avec son jeton (le jeton de session est envoyé automatiquement
//    par supabase.functions.invoke).
// 2. Appelle la fonction SQL public.admin_delete_user avec ce jeton : c'est elle qui vérifie
//    que l'appelant est administrateur, qu'il ne supprime ni son propre compte ni un admin,
//    puis supprime le compte (les produits, stands, avis et paiements partent en cascade).
// 3. Supprime les fichiers du stockage du compte (cartes d'étudiant, images de produits et
//    de stands), ce que le SQL ne peut pas faire, puis nettoie les cartes d'étudiant
//    orphelines (dossiers dont le compte n'existe plus).
//
// Les erreurs de nettoyage du stockage n'annulent jamais la suppression du compte :
// elles sont renvoyées dans `warnings`.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Vous devez être connecté." }, 401);

  let userId: unknown;
  try {
    ({ userId } = await req.json());
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }
  if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) {
    return json({ error: "Identifiant utilisateur invalide." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("Variables d'environnement Supabase manquantes.");
    return json({ error: "Configuration du serveur incomplète." }, 500);
  }

  // Client qui agit AU NOM de l'appelant (ses droits, pas ceux du service).
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) return json({ error: "Session invalide. Reconnectez-vous." }, 401);

  // Les règles (admin uniquement, pas soi-même, pas un admin) sont dans la fonction SQL.
  const { error: rpcError } = await callerClient.rpc("admin_delete_user", { target_id: userId });
  if (rpcError) {
    const message = rpcError.message || "Impossible de supprimer ce compte.";
    const status = message.includes("reservee aux administrateurs") ? 403 : message.includes("introuvable") ? 404 : 400;
    return json({ error: message }, status);
  }

  // A partir d'ici le compte est supprimé : le nettoyage du stockage ne peut plus l'annuler.
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const warnings: string[] = [];
  let filesRemoved = 0;

  async function purgeFolder(bucket: string, folder: string) {
    for (let pass = 0; pass < 5; pass++) {
      const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 1000 });
      if (error) {
        warnings.push(`Lecture de ${bucket}/${folder} impossible : ${error.message}`);
        return;
      }
      // Les dossiers ont un id null : on ne supprime que les fichiers.
      const files = (data ?? []).filter((item) => item.id !== null).map((item) => `${folder}/${item.name}`);
      if (files.length === 0) return;

      const { error: removeError } = await admin.storage.from(bucket).remove(files);
      if (removeError) {
        warnings.push(`Suppression dans ${bucket}/${folder} impossible : ${removeError.message}`);
        return;
      }
      filesRemoved += files.length;
      if (files.length < 1000) return;
    }
  }

  await purgeFolder("student-ids", userId);
  await purgeFolder("marketplace-media", `products/${userId}`);
  await purgeFolder("marketplace-media", `stands/${userId}`);

  // Nettoyage des cartes d'étudiant orphelines (comptes supprimés avant cette fonction).
  // Par prudence, on ne supprime rien si on ne peut pas vérifier quels comptes existent.
  try {
    const { data: roots, error: rootsError } = await admin.storage.from("student-ids").list("", { limit: 1000 });
    if (rootsError) {
      warnings.push(`Lecture de student-ids impossible : ${rootsError.message}`);
    } else {
      const folders = (roots ?? [])
        .filter((item) => item.id === null && UUID_PATTERN.test(item.name))
        .map((item) => item.name);

      if (folders.length > 0) {
        const { data: profiles, error: profilesError } = await admin.from("profiles").select("id").in("id", folders);
        if (profilesError) {
          warnings.push(`Vérification des comptes impossible : ${profilesError.message}`);
        } else {
          const existing = new Set((profiles ?? []).map((row: { id: string }) => row.id));
          for (const folder of folders) {
            if (!existing.has(folder)) await purgeFolder("student-ids", folder);
          }
        }
      }
    }
  } catch (err) {
    warnings.push(`Nettoyage des orphelins interrompu : ${String(err)}`);
  }

  if (warnings.length > 0) console.error("admin-delete-user warnings:", warnings);
  return json({ ok: true, filesRemoved, warnings });
});