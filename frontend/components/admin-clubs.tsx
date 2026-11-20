"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, RefreshCcw, Trash2, UserPlus, UsersRound, X } from "@/lib/icons";
import { ColorPicker } from "@/components/clubs/color-picker";
import { ConfirmDialog } from "@/components/clubs/confirm-dialog";
import { Modal } from "@/components/clubs/modal";
import { useToast } from "@/components/toast-provider";
import { CLUB_COLORS, normalizeHex } from "@/lib/club-colors";
import { adminListClubManagers, adminListDeletedClubs, adminPurgeClub, adminRestoreClub, adminSetClubManager, getClubs } from "@/lib/clubs";
import type { Club, ClubManager, DeletedClub } from "@/lib/types";

/**
 * Section « Clubs » du centre de pilotage :
 * 1. accès rapide à l'espace clubs (l'admin y a tous les droits) ;
 * 2. gestionnaires des clubs (donner / retirer l'accès par e-mail) ;
 * 3. clubs supprimés : restaurer ou supprimer définitivement.
 */
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminClubs() {
  const toast = useToast();
  const [managers, setManagers] = useState<ClubManager[]>([]);
  const [deleted, setDeleted] = useState<DeletedClub[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [managerToRemove, setManagerToRemove] = useState<ClubManager | null>(null);
  const [clubToPurge, setClubToPurge] = useState<DeletedClub | null>(null);
  const [colorPrompt, setColorPrompt] = useState<{ club: DeletedClub; color: string } | null>(null);

  async function load() {
    const [managersResult, deletedResult, clubsData] = await Promise.all([adminListClubManagers(), adminListDeletedClubs(), getClubs()]);
    setLoadError(managersResult.error ?? deletedResult.error ?? null);
    setManagers(managersResult.data ?? []);
    setDeleted(deletedResult.data ?? []);
    setClubs(clubsData);
  }

  useEffect(() => {
    void load();
  }, []);

  async function grantAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await adminSetClubManager(email, true);
    setBusy(false);
    if (result.error !== null) {
      toast.error("Accès non accordé", result.error);
      return;
    }
    setEmail("");
    toast.success("Accès accordé", result.data.full_name ?? email.trim());
    await load();
  }

  async function confirmRemoveManager() {
    if (!managerToRemove || !managerToRemove.email) return;
    setBusy(true);
    const result = await adminSetClubManager(managerToRemove.email, false);
    setBusy(false);
    if (result.error !== null) {
      toast.error("Retrait impossible", result.error);
      return;
    }
    const removed = managerToRemove;
    setManagers((items) => items.filter((item) => item.user_id !== removed.user_id));
    setManagerToRemove(null);
    toast.success("Accès retiré", removed.full_name ?? removed.email ?? "");
  }

  async function restore(club: DeletedClub, color?: string) {
    setBusy(true);
    const result = await adminRestoreClub(club.id, color);
    setBusy(false);
    if (result.failure === "COLOR_TAKEN") {
      const taken = new Set(clubs.map((item) => normalizeHex(item.color)));
      const free = CLUB_COLORS.find((item) => !taken.has(normalizeHex(item.hex)))?.hex ?? CLUB_COLORS[0].hex;
      setColorPrompt({ club, color: free });
      return;
    }
    if (result.error !== null) {
      toast.error("Restauration impossible", result.error);
      return;
    }
    setColorPrompt(null);
    toast.success("Club restauré", `${club.name} est de nouveau sur le site.`);
    await load();
  }

  async function confirmPurge() {
    if (!clubToPurge) return;
    setBusy(true);
    const result = await adminPurgeClub(clubToPurge.id);
    setBusy(false);
    if (result.error !== null) {
      toast.error("Suppression impossible", result.error);
      return;
    }
    const removed = clubToPurge;
    setDeleted((items) => items.filter((item) => item.id !== removed.id));
    setClubToPurge(null);
    toast.success("Club supprimé définitivement", removed.name);
  }

  return (
    <section className="container-ucao mt-5 grid gap-5 xl:grid-cols-2">
      <article className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow">Clubs</p>
            <h2 className="text-2xl font-bold">Gestionnaires des clubs</h2>
          </div>
          <UsersRound className="text-ucao-success" size={23} aria-hidden="true" />
        </div>
        <Link className="btn btn-ghost mb-5 w-full sm:w-auto" href="/espace-clubs">
          <ArrowUpRight size={16} aria-hidden="true" /> Ouvrir l&apos;espace clubs
        </Link>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={grantAccess}>
          <label className="flex-1">
            <span className="sr-only">E-mail du représentant</span>
            <input className="input-field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail du représentant" required />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            <UserPlus size={16} aria-hidden="true" /> Donner l&apos;accès
          </button>
        </form>
        <p className="mt-2 text-xs text-ucao-muted">Le représentant doit d&apos;abord créer son compte sur la plateforme (inscription normale).</p>
        {loadError && <p className="notice notice-error text-sm" role="alert">{loadError}</p>}
        <ul className="mt-4 space-y-2">
          {managers.map((manager) => (
            <li key={manager.user_id} className="flex items-center justify-between gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#132238]">
              <div className="min-w-0">
                <p className="truncate font-medium">{manager.full_name ?? "Sans nom"}</p>
                <p className="truncate text-xs text-ucao-muted">{manager.email ?? "e-mail inconnu"} · depuis le {formatDate(manager.added_at)}</p>
              </div>
              <button className="btn btn-ghost min-h-9 shrink-0 px-3 text-xs text-ucao-red" type="button" onClick={() => setManagerToRemove(manager)} disabled={busy || !manager.email}>
                <X size={14} aria-hidden="true" /> Retirer l&apos;accès
              </button>
            </li>
          ))}
        </ul>
        {managers.length === 0 && !loadError && <p className="mt-4 rounded-ucao bg-ucao-soft p-4 text-sm text-ucao-muted dark:bg-[#132238]">Aucun gestionnaire pour le moment. Vous avez vous-même tous les droits sur l&apos;espace clubs.</p>}
      </article>

      <article className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow">Clubs</p>
            <h2 className="text-2xl font-bold">Clubs supprimés</h2>
          </div>
          <span className="text-sm font-medium text-ucao-muted">{deleted.length}</span>
        </div>
        {deleted.length ? (
          <ul className="space-y-2">
            {deleted.map((club) => (
              <li key={club.id} className="flex flex-wrap items-center justify-between gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#132238]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-4 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: club.color }} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{club.name}</p>
                    <p className="text-xs text-ucao-muted">
                      Supprimé le {formatDate(club.deleted_at)}{club.deleted_by_name ? ` par ${club.deleted_by_name}` : ""} · {club.sessions_count} séance{club.sessions_count > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost min-h-9 px-3 text-xs" type="button" onClick={() => restore(club)} disabled={busy}>
                    <RefreshCcw size={14} aria-hidden="true" /> Restaurer
                  </button>
                  <button className="btn btn-ghost min-h-9 px-3 text-xs text-ucao-red" type="button" onClick={() => setClubToPurge(club)} disabled={busy}>
                    <Trash2 size={14} aria-hidden="true" /> Supprimer définitivement
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-ucao bg-ucao-soft p-5 text-sm text-ucao-muted dark:bg-[#132238]">Aucun club supprimé.</p>
        )}
      </article>

      {managerToRemove && (
        <ConfirmDialog
          title="Retirer l'accès ?"
          description={`${managerToRemove.full_name ?? managerToRemove.email ?? "Cette personne"} ne pourra plus gérer les clubs. Son compte reste intact.`}
          confirmLabel="Retirer l'accès"
          busy={busy}
          onConfirm={confirmRemoveManager}
          onCancel={() => setManagerToRemove(null)}
        />
      )}
      {clubToPurge && (
        <ConfirmDialog
          title={`Supprimer définitivement ${clubToPurge.name} ?`}
          description="Le club, son programme et ses annonces seront effacés pour de bon. Cette action ne peut pas être annulée."
          confirmLabel="Supprimer définitivement"
          typeToConfirm={clubToPurge.name}
          busy={busy}
          onConfirm={confirmPurge}
          onCancel={() => setClubToPurge(null)}
        />
      )}
      {colorPrompt && (
        <Modal title={`Nouvelle couleur pour ${colorPrompt.club.name}`} eyebrow="Restauration" onClose={() => setColorPrompt(null)} locked={busy}>
          <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">Sa couleur a été reprise par un autre club depuis sa suppression. Choisissez une couleur libre pour le restaurer.</p>
          <div className="mt-4">
            <ColorPicker value={colorPrompt.color} onChange={(hex) => setColorPrompt({ club: colorPrompt.club, color: hex })} clubs={clubs} disabled={busy} />
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button className="btn btn-ghost" type="button" onClick={() => setColorPrompt(null)} disabled={busy}>Annuler</button>
            <button className="btn btn-primary" type="button" onClick={() => restore(colorPrompt.club, colorPrompt.color)} disabled={busy}>
              {busy ? "Restauration..." : "Restaurer avec cette couleur"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
