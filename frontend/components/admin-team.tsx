"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, X } from "@/lib/icons";
import { ConfirmDialog } from "@/components/clubs/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { listAdminAudit, listPlatformAdmins, setPlatformAdmin, type AdminAuditEntry, type PlatformAdmin } from "@/lib/admin-team";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Équipe d'administration, affichée uniquement au propriétaire du site.
 * L'affichage n'est pas la protection : la base refuse ces actions à tout autre compte.
 */
export function AdminTeam() {
  const toast = useToast();
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmGrant, setConfirmGrant] = useState<string | null>(null);
  const [adminToRemove, setAdminToRemove] = useState<PlatformAdmin | null>(null);

  async function load() {
    const [team, history] = await Promise.all([listPlatformAdmins(), listAdminAudit()]);
    setAdmins(team.admins);
    setLoadError(team.error);
    setUnavailable(team.unavailable);
    setAudit(history);
  }

  useEffect(() => {
    void load();
  }, []);

  async function grant() {
    if (!confirmGrant) return;
    setBusy(true);
    const result = await setPlatformAdmin(confirmGrant, true);
    setBusy(false);
    if (result.error) {
      setConfirmGrant(null);
      toast.error("Nomination refusée", result.error);
      return;
    }
    toast.success("Administrateur nommé", result.name ?? confirmGrant);
    setConfirmGrant(null);
    setEmail("");
    await load();
  }

  async function revoke() {
    if (!adminToRemove?.email) return;
    setBusy(true);
    const result = await setPlatformAdmin(adminToRemove.email, false);
    setBusy(false);
    if (result.error) {
      toast.error("Retrait impossible", result.error);
      return;
    }
    toast.success("Accès retiré", adminToRemove.full_name ?? adminToRemove.email);
    setAdminToRemove(null);
    await load();
  }

  return (
    <section className="container-ucao mt-5">
      <article className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Réservé au propriétaire</p>
            <h2 className="text-2xl font-bold">Équipe d&apos;administration</h2>
          </div>
          <ShieldCheck className="shrink-0 text-ucao-success" size={23} aria-hidden="true" />
        </div>

        {unavailable ? (
          <p className="notice text-sm" role="status">Cette fonction s&apos;activera dès que le fichier SQL aura été lancé dans Supabase.</p>
        ) : (
          <>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setConfirmGrant(email.trim());
              }}
            >
              <label className="flex-1">
                <span className="sr-only">E-mail du futur administrateur</span>
                <input className="input-field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail du futur administrateur" autoComplete="off" required />
              </label>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                <UserPlus size={16} aria-hidden="true" /> Nommer administrateur
              </button>
            </form>
            <p className="mt-2 text-xs text-ucao-muted">La personne crée d&apos;abord un compte normal et confirme son e-mail. Si elle vend sur le site, elle garde son espace vendeur.</p>

            {loadError && <p className="notice notice-error text-sm" role="alert">{loadError}</p>}

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Administrateurs nommés</h3>
                {admins.length ? (
                  <ul className="space-y-2">
                    {admins.map((admin) => (
                      <li key={admin.user_id} className="flex items-center justify-between gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#132238]">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{admin.full_name ?? "Sans nom"}</p>
                          <p className="truncate text-xs text-ucao-muted">{admin.email ?? "e-mail inconnu"} · depuis le {formatDate(admin.added_at)}</p>
                        </div>
                        <button className="btn btn-ghost min-h-9 shrink-0 px-3 text-xs text-ucao-red" type="button" onClick={() => setAdminToRemove(admin)} disabled={busy || !admin.email}>
                          <X size={14} aria-hidden="true" /> Retirer l&apos;accès
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-ucao bg-ucao-soft p-4 text-sm text-ucao-muted dark:bg-[#132238]">Aucun administrateur nommé pour le moment.</p>
                )}
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Historique</h3>
                {audit.length ? (
                  <ul className="max-h-60 space-y-2 overflow-auto pr-1">
                    {audit.map((entry) => (
                      <li key={entry.id} className="rounded-ucao bg-ucao-soft p-3 text-sm dark:bg-[#132238]">
                        <span className="font-medium">{entry.action === "granted" ? "Nommé" : "Accès retiré"}</span> : {entry.target_name ?? entry.target_email ?? "compte supprimé"}
                        <span className="block text-xs text-ucao-muted">{formatDate(entry.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-ucao bg-ucao-soft p-4 text-sm text-ucao-muted dark:bg-[#132238]">Aucune action enregistrée.</p>
                )}
              </div>
            </div>
          </>
        )}
      </article>

      {confirmGrant && (
        <ConfirmDialog
          title="Nommer cet administrateur ?"
          description="Cette personne pourra voir les comptes, les cartes d'étudiant et modérer le site. Elle ne pourra pas nommer d'autres administrateurs."
          confirmLabel="Nommer administrateur"
          typeToConfirm={confirmGrant}
          busy={busy}
          onConfirm={grant}
          onCancel={() => setConfirmGrant(null)}
        />
      )}
      {adminToRemove && (
        <ConfirmDialog
          title="Retirer l'accès administrateur ?"
          description={`${adminToRemove.full_name ?? adminToRemove.email ?? "Cette personne"} perdra l'accès au centre de pilotage. Son compte et son espace vendeur restent intacts.`}
          confirmLabel="Retirer l'accès"
          busy={busy}
          onConfirm={revoke}
          onCancel={() => setAdminToRemove(null)}
        />
      )}
    </section>
  );
}
