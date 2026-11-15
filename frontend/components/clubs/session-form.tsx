"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Trash2 } from "@/lib/icons";
import { readableTextColor } from "@/lib/club-colors";
import { createClubSession, deleteClubSession, updateClubSession, type SessionPayload } from "@/lib/clubs";
import { DAY_NAMES, PERIODS, findOverlaps, formatTimeRange, type PeriodKey } from "@/lib/club-schedule";
import type { Club, ClubSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";
import { Modal } from "./modal";

/** Pré-remplissage du formulaire d'ajout (clic sur une case du calendrier). */
export type SessionDefaults = {
  day: number;
  period: PeriodKey;
  /** Séance déjà présente dans la case : on reprend ses heures pour ajouter d'autres clubs au même créneau. */
  like?: ClubSession | null;
};

type SessionFormProps = {
  /** Séance à modifier, ou null pour en créer. */
  session: ClubSession | null;
  clubs: Club[];
  /** Toutes les séances (pour l'avertissement de chevauchement). */
  sessions: ClubSession[];
  defaults?: SessionDefaults | null;
  /** Séances enregistrées (plusieurs à la fois en création : une par club coché). Ne ferme pas le formulaire. */
  onSaved: (sessions: ClubSession[], created: boolean) => void;
  onDeleted: (id: string) => void;
  /** Ferme le formulaire. */
  onCancel: () => void;
};

function toInputTime(time: string): string {
  return time.slice(0, 5);
}

export function SessionForm({ session, clubs, sessions, defaults = null, onSaved, onDeleted, onCancel }: SessionFormProps) {
  const editing = Boolean(session);
  const period = defaults ? PERIODS.find((item) => item.key === defaults.period) : null;
  const like = defaults?.like ?? null;
  // En création, on peut cocher plusieurs clubs : une séance est créée pour chacun, au même créneau.
  const [clubIds, setClubIds] = useState<string[]>(session ? [session.club_id] : []);
  const [day, setDay] = useState(session?.day_of_week ?? defaults?.day ?? 1);
  const [start, setStart] = useState(session ? toInputTime(session.start_time) : like ? toInputTime(like.start_time) : period?.defaultStart ?? "17:00");
  const [end, setEnd] = useState(session ? toInputTime(session.end_time) : like ? toInputTime(like.end_time) : period?.defaultEnd ?? "19:00");
  const [location, setLocation] = useState(session?.location_detail ?? "");
  const [activity, setActivity] = useState(session?.activity ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const timesValid = /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && end > start;

  /** Clubs cochés qui ont déjà une séance chevauchant ce créneau le même jour. */
  const overlaps = useMemo(() => {
    if (!timesValid) return [];
    return clubIds.flatMap((clubId) => {
      const found = findOverlaps({ club_id: clubId, day_of_week: day, start_time: `${start}:00`, end_time: `${end}:00` }, sessions, session?.id ?? null);
      const club = clubs.find((item) => item.id === clubId);
      return found.length && club ? [{ club, found }] : [];
    });
  }, [clubIds, clubs, day, start, end, sessions, session, timesValid]);

  /** Clubs qui se réunissent déjà exactement à ce créneau (indiqué sur leur puce). */
  const alreadyThere = useMemo(() => {
    if (!timesValid) return new Set<string>();
    return new Set(
      sessions
        .filter((item) => item.id !== session?.id && item.day_of_week === day && toInputTime(item.start_time) === start && toInputTime(item.end_time) === end)
        .map((item) => item.club_id),
    );
  }, [sessions, session, day, start, end, timesValid]);

  function toggleClub(id: string) {
    setClubIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    if (clubIds.length === 0) {
      setError("Choisissez au moins un club.");
      return;
    }
    setSubmitting(true);
    const base = { day_of_week: day, start_time: start, end_time: end, location_detail: location, activity };

    if (session) {
      const result = await updateClubSession(session.id, { ...base, club_id: clubIds[0] } satisfies SessionPayload);
      setSubmitting(false);
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      onSaved([result.data], false);
      onCancel();
      return;
    }

    // Création : une séance par club coché. Si l'une échoue, celles déjà créées sont gardées.
    const created: ClubSession[] = [];
    let failure: string | null = null;
    for (const clubId of clubIds) {
      const result = await createClubSession({ ...base, club_id: clubId });
      if (result.error !== null) {
        const name = clubs.find((item) => item.id === clubId)?.name ?? "ce club";
        failure = `${name} : ${result.error}`;
        break;
      }
      created.push(result.data);
    }
    setSubmitting(false);
    if (created.length) onSaved(created, true);
    if (failure) {
      const done = new Set(created.map((item) => item.club_id));
      setClubIds((current) => current.filter((id) => !done.has(id)));
      setError(created.length ? `${created.length} séance(s) ajoutée(s). Échec pour ${failure}` : failure);
      return;
    }
    onCancel();
  }

  async function handleDelete() {
    if (!session) return;
    setSubmitting(true);
    const result = await deleteClubSession(session.id);
    setSubmitting(false);
    setConfirmDelete(false);
    if (result.error) {
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

  const submitLabel = editing ? "Enregistrer" : clubIds.length > 1 ? `Ajouter ${clubIds.length} séances` : "Ajouter";

  return (
    <Modal title={editing ? "Modifier la séance" : "Ajouter au programme"} eyebrow="Programme" onClose={onCancel} locked={submitting}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {editing ? (
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Club</span>
            <select className="select-field" value={clubIds[0] ?? ""} onChange={(event) => setClubIds([event.target.value])} required>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}{club.is_active ? "" : " (caché)"}</option>
              ))}
            </select>
          </label>
        ) : (
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">
              Clubs qui se réunissent à ce créneau
              <span className="ml-2 text-xs font-normal text-ucao-muted">{clubIds.length ? `${clubIds.length} choisi${clubIds.length > 1 ? "s" : ""}` : "un ou plusieurs"}</span>
            </legend>
            {clubs.length === 0 && <p className="text-sm text-ucao-muted">Aucun club : créez-en un d&apos;abord.</p>}
            <div className="flex flex-wrap gap-2">
              {clubs.map((club) => {
                const checked = clubIds.includes(club.id);
                const there = alreadyThere.has(club.id);
                return (
                  <button
                    key={club.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleClub(club.id)}
                    disabled={submitting}
                    title={there ? "Ce club a déjà une séance à ce créneau" : undefined}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition",
                      checked ? "border-transparent shadow-sm" : "border-ucao-line bg-white text-ucao-ink hover:bg-ucao-soft dark:border-[#2a3a52] dark:bg-[#10233b] dark:text-[#e8edf4] dark:hover:bg-[#162b47]",
                    )}
                    style={checked ? { backgroundColor: club.color, color: readableTextColor(club.color) } : undefined}
                  >
                    {checked ? <Check size={14} aria-hidden="true" /> : <span className="size-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: club.color }} aria-hidden="true" />}
                    {club.name}
                    {there && <span className="rounded-full bg-black/15 px-1.5 text-[10px] uppercase">déjà là</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

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
          <span className="text-xs text-ucao-muted">
            Le lieu général est toujours l&apos;université (UCAO-UUT).{!editing && clubIds.length > 1 ? " Le lieu et l'activité saisis ici s'appliquent à tous les clubs cochés ; vous pourrez les ajuster ensuite pour chacun." : ""}
          </span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Activité (facultatif)</span>
          <input className="input-field" value={activity} onChange={(event) => setActivity(event.target.value)} maxLength={80} placeholder="Ex. Entraînement, Répétition" />
        </label>

        {overlaps.length > 0 && (
          <p className="flex items-start gap-2 rounded-ucao bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100" role="status">
            <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
            <span>
              Déjà une séance qui chevauche ce créneau le {DAY_NAMES[day - 1].toLowerCase()} pour :{" "}
              {overlaps.map(({ club, found }) => `${club.name} (${found.map((item) => formatTimeRange(item.start_time, item.end_time)).join(", ")})`).join(" ; ")}. Vous pouvez quand même enregistrer.
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
          <button className="btn btn-primary" type="submit" disabled={submitting || clubIds.length === 0}>
            {submitting ? "Enregistrement..." : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
