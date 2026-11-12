"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Trash2 } from "@/lib/icons";
import { createClubSession, deleteClubSession, updateClubSession, type SessionPayload } from "@/lib/clubs";
import { DAY_NAMES, PERIODS, findOverlaps, formatTimeRange, type PeriodKey } from "@/lib/club-schedule";
import type { Club, ClubSession } from "@/lib/types";
import { ConfirmDialog } from "./confirm-dialog";
import { Modal } from "./modal";

type SessionFormProps = {
  /** Séance à modifier, ou null pour en créer une. */
  session: ClubSession | null;
  clubs: Club[];
  /** Toutes les séances (pour l'avertissement de chevauchement). */
  sessions: ClubSession[];
  /** Pré-remplissage quand on clique sur une case vide du calendrier. */
  defaults?: { day: number; period: PeriodKey } | null;
  onSaved: (session: ClubSession, created: boolean) => void;
  onDeleted: (id: string) => void;
  onCancel: () => void;
};

function toInputTime(time: string): string {
  return time.slice(0, 5);
}

export function SessionForm({ session, clubs, sessions, defaults = null, onSaved, onDeleted, onCancel }: SessionFormProps) {
  const editing = Boolean(session);
  const period = defaults ? PERIODS.find((item) => item.key === defaults.period) : null;
  const [clubId, setClubId] = useState(session?.club_id ?? clubs[0]?.id ?? "");
  const [day, setDay] = useState(session?.day_of_week ?? defaults?.day ?? 1);
  const [start, setStart] = useState(session ? toInputTime(session.start_time) : period?.defaultStart ?? "17:00");
  const [end, setEnd] = useState(session ? toInputTime(session.end_time) : period?.defaultEnd ?? "19:00");
  const [location, setLocation] = useState(session?.location_detail ?? "");
  const [activity, setActivity] = useState(session?.activity ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const overlaps = useMemo(() => {
    if (!clubId || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start) return [];
    return findOverlaps({ club_id: clubId, day_of_week: day, start_time: `${start}:00`, end_time: `${end}:00` }, sessions, session?.id ?? null);
  }, [clubId, day, start, end, sessions, session]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const payload: SessionPayload = { club_id: clubId, day_of_week: day, start_time: start, end_time: end, location_detail: location, activity };
    const result = session ? await updateClubSession(session.id, payload) : await createClubSession(payload);
    setSubmitting(false);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    onSaved(result.data, !editing);
  }

  async function handleDelete() {
    if (!session) return;
    setSubmitting(true);
    const result = await deleteClubSession(session.id);
    setSubmitting(false);
    setConfirmDelete(false);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    onDeleted(session.id);
  }

  if (confirmDelete && session) {
    return (
      <ConfirmDialog
        title="Supprimer cette séance ?"
        description="Elle disparaîtra du programme de la semaine. Vous pourrez toujours la recréer."
        confirmLabel="Supprimer"
        busy={submitting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    );
  }

  return (
    <Modal title={editing ? "Modifier la séance" : "Ajouter une séance"} eyebrow="Programme" onClose={onCancel} locked={submitting}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Club</span>
          <select className="select-field" value={clubId} onChange={(event) => setClubId(event.target.value)} required>
            {clubs.length === 0 && <option value="">Aucun club : créez-en un d&apos;abord</option>}
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>{club.name}{club.is_active ? "" : " (caché)"}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Jour</span>
          <select className="select-field" value={day} onChange={(event) => setDay(Number(event.target.value))}>
            {DAY_NAMES.map((label, index) => (
              <option key={label} value={index + 1}>{label}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Début</span>
            <input className="input-field" type="time" value={start} onChange={(event) => setStart(event.target.value)} required step={300} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Fin</span>
            <input className="input-field" type="time" value={end} onChange={(event) => setEnd(event.target.value)} required step={300} />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Précision du lieu (facultatif)</span>
          <input className="input-field" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={80} placeholder="Ex. Terrain de basket, Salle B12" />
          <span className="text-xs text-ucao-muted">Le lieu général est toujours l&apos;université (UCAO-UUT).</span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Activité (facultatif)</span>
          <input className="input-field" value={activity} onChange={(event) => setActivity(event.target.value)} maxLength={80} placeholder="Ex. Entraînement, Répétition" />
        </label>

        {overlaps.length > 0 && (
          <p className="flex items-start gap-2 rounded-ucao bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100" role="status">
            <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
            <span>
              Ce club a déjà une séance qui chevauche ce créneau le {DAY_NAMES[day - 1].toLowerCase()} :{" "}
              {overlaps.map((item) => formatTimeRange(item.start_time, item.end_time)).join(", ")}. Vous pouvez quand même enregistrer.
            </span>
          </p>
        )}

        {error && <p className="notice notice-error text-sm" role="alert">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          {editing && (
            <button className="btn btn-ghost mr-auto text-ucao-red" type="button" onClick={() => setConfirmDelete(true)} disabled={submitting}>
              <Trash2 size={15} aria-hidden="true" /> Supprimer
            </button>
          )}
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={submitting}>Annuler</button>
          <button className="btn btn-primary" type="submit" disabled={submitting || !clubId}>
            {submitting ? "Enregistrement..." : editing ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
