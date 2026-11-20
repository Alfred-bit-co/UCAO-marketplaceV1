"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, UserPlus, UsersRound, X } from "@/lib/icons";
import { ConfirmDialog } from "@/components/clubs/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { listClubTeam, setClubTeamMember } from "@/lib/clubs";
import type { ClubTeamMember } from "@/lib/types";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Onglet « Équipe » de l'espace clubs : le représentant voit les comptes inscrits comme
 * « Personnel de l'UCAO » et peut les ajouter comme gestionnaires des clubs.
 * Toutes les règles (qui peut ajouter, qui peut retirer) sont vérifiées par la base.
 */
export function ClubTeam() {
  const toast = useToast();
  const [members, setMembers] = useState<ClubTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<ClubTeamMember | null>(null);

  async function load() {
    setLoading(true);
    const result = await listClubTeam();
    setMembers(result.data);
    setUnavailable(result.unavailable);
    setLoadError(result.error);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(member: ClubTeamMember) {
    setBusyId(member.user_id);
    const result = await setClubTeamMember(member.user_id, true);
    setBusyId(null);
    if (result.error) {
      toast.error("Ajout impossible", result.error);
      return;
    }
    toast.success("Ajouté à l'équipe des clubs", member.full_name ?? member.email ?? "");
    await load();
  }

  async function confirmRemove() {
    if (!toRemove) return;
    const removed = toRemove;
    setBusyId(removed.user_id);
    const result = await setClubTeamMember(removed.user_id, false);
    setBusyId(null);
    if (result.error) {
      toast.error("Retrait impossible", result.error);
      return;
    }
    setToRemove(null);
    toast.success("Accès retiré", removed.full_name ?? removed.email ?? "");
    await load();
  }

  const managers = members.filter((member) => member.is_manager);
  const candidates = members.filter((member) => !member.is_manager);

  return (
    <article className="panel p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Équipe</p>
          <h2 className="text-2xl font-bold">Gestionnaires des clubs</h2>
          <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">
            Ajoutez les autres représentants : ils pourront, comme vous, gérer les clubs, le programme et les annonces.
          </p>
        </div>
        <button className="btn btn-ghost min-h-10 px-3 text-sm" type="button" onClick={() => void load()} disabled={loading}>
          <RefreshCcw size={15} aria-hidden="true" /> Actualiser
        </button>
      </div>

      {unavailable ? (
        <p className="notice" role="status">Cette fonction sera bientôt disponible. En attendant, l&apos;administrateur peut ajouter un gestionnaire pour vous.</p>
      ) : loadError ? (
        <p className="notice notice-error" role="alert">{loadError}</p>
      ) : loading ? (
        <p className="rounded-ucao bg-ucao-soft p-6 text-center text-sm font-medium text-ucao-muted dark:bg-[#132238]">Chargement…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><UsersRound size={17} aria-hidden="true" /> Équipe actuelle ({managers.length})</h3>
            {managers.length ? (
              <ul className="space-y-2">
                {managers.map((member) => (
                  <li key={member.user_id} className="flex items-center justify-between gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#132238]">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {member.full_name ?? "Sans nom"}
                        {member.is_me && <span className="ml-2 rounded-full bg-ucao-success-soft px-2 py-0.5 text-[10px] font-bold uppercase text-ucao-success">Vous</span>}
                      </p>
                      <p className="truncate text-xs text-ucao-muted">
                        {member.email ?? "e-mail inconnu"}
                        {member.added_at ? ` · depuis le ${formatDate(member.added_at)}` : ""}
                      </p>
                    </div>
                    {member.can_remove && (
                      <button className="btn btn-ghost min-h-9 shrink-0 px-3 text-xs text-ucao-red" type="button" onClick={() => setToRemove(member)} disabled={busyId !== null}>
                        <X size={14} aria-hidden="true" /> Retirer
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-ucao bg-ucao-soft p-4 text-sm text-ucao-muted dark:bg-[#132238]">Aucun gestionnaire pour le moment.</p>
            )}
          </section>

          <section>
            <h3 className="mb-1 flex items-center gap-2 font-semibold"><UserPlus size={17} aria-hidden="true" /> Comptes du personnel ({candidates.length})</h3>
            <p className="mb-3 text-xs text-ucao-muted dark:text-[#a8b8cc]">
              Personnes inscrites avec le choix « Personnel de l&apos;UCAO » (e-mail confirmé). Si un représentant n&apos;apparaît pas,
              demandez-lui de créer son compte avec ce choix, puis de confirmer son e-mail.
            </p>
            {candidates.length ? (
              <ul className="space-y-2">
                {candidates.map((member) => (
                  <li key={member.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#132238]">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{member.full_name ?? "Sans nom"}</p>
                      <p className="truncate text-xs text-ucao-muted">
                        {member.profession ? `${member.profession} · ` : ""}
                        {member.email ?? "e-mail inconnu"} · inscrit le {formatDate(member.signed_up_at)}
                      </p>
                    </div>
                    <button className="btn btn-primary min-h-9 shrink-0 px-3 text-xs" type="button" onClick={() => void add(member)} disabled={busyId !== null}>
                      <UserPlus size={14} aria-hidden="true" /> {busyId === member.user_id ? "Ajout…" : "Ajouter à l'équipe"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-ucao bg-ucao-soft p-4 text-sm text-ucao-muted dark:bg-[#132238]">Aucun compte du personnel à ajouter pour le moment.</p>
            )}
          </section>
        </div>
      )}

      {toRemove && (
        <ConfirmDialog
          title="Retirer l'accès ?"
          description={`${toRemove.full_name ?? toRemove.email ?? "Cette personne"} ne pourra plus gérer les clubs. Son compte reste intact.`}
          confirmLabel="Retirer l'accès"
          busy={busyId !== null}
          onConfirm={confirmRemove}
          onCancel={() => setToRemove(null)}
        />
      )}
    </article>
  );
}
