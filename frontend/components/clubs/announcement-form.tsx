"use client";

import { useState } from "react";
import { createClubAnnouncement, updateClubAnnouncement, type AnnouncementPayload } from "@/lib/clubs";
import type { Club, ClubAnnouncement } from "@/lib/types";
import { Modal } from "./modal";

const TITLE_MAX = 120;
const BODY_MAX = 1500;

type AnnouncementFormProps = {
  announcement: ClubAnnouncement | null;
  clubs: Club[];
  onSaved: (announcement: ClubAnnouncement, created: boolean) => void;
  onCancel: () => void;
};

/** ISO → valeur d'un champ datetime-local (heure locale du navigateur). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AnnouncementForm({ announcement, clubs, onSaved, onCancel }: AnnouncementFormProps) {
  const editing = Boolean(announcement);
  const [clubId, setClubId] = useState(announcement?.club_id ?? "");
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [eventAt, setEventAt] = useState(toLocalInput(announcement?.event_at ?? null));
  const [pinned, setPinned] = useState(announcement?.is_pinned ?? false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    let eventIso: string | null = null;
    if (eventAt) {
      const date = new Date(eventAt);
      if (Number.isNaN(date.getTime())) {
        setError("Date de l'événement invalide.");
        return;
      }
      eventIso = date.toISOString();
    }
    setSubmitting(true);
    const payload: AnnouncementPayload = { club_id: clubId || null, title, body, event_at: eventIso, is_pinned: pinned };
    const result = announcement ? await updateClubAnnouncement(announcement.id, payload) : await createClubAnnouncement(payload);
    setSubmitting(false);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    onSaved(result.data, !editing);
  }

  return (
    <Modal title={editing ? "Modifier l'annonce" : "Nouvelle annonce"} eyebrow="Annonces" onClose={onCancel} locked={submitting}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Club concerné</span>
          <select className="select-field" value={clubId} onChange={(event) => setClubId(event.target.value)}>
            <option value="">Tous les clubs</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>{club.name}{club.is_active ? "" : " (caché)"}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="flex items-center justify-between text-sm font-medium">
            Titre <span className="text-xs text-ucao-muted">{title.length}/{TITLE_MAX}</span>
          </span>
          <input className="input-field" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={TITLE_MAX} minLength={3} required placeholder="Ex. Tournoi inter-clubs samedi" />
        </label>

        <label className="grid gap-1.5">
          <span className="flex items-center justify-between text-sm font-medium">
            Texte <span className="text-xs text-ucao-muted">{body.length}/{BODY_MAX}</span>
          </span>
          <textarea className="textarea-field" value={body} onChange={(event) => setBody(event.target.value)} maxLength={BODY_MAX} minLength={3} required rows={6} placeholder="Les détails : quoi, quand, où, pour qui…" />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Date et heure de l&apos;événement (facultatives)</span>
          <input className="input-field" type="datetime-local" value={eventAt} onChange={(event) => setEventAt(event.target.value)} />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" className="size-5 accent-ucao-red" checked={pinned} onChange={(event) => setPinned(event.target.checked)} />
          <span className="text-sm font-medium">Épingler en haut</span>
        </label>

        <p className="text-xs text-ucao-muted">Visible jusqu&apos;au lendemain de l&apos;événement, ou 30 jours sans date.</p>

        {error && <p className="notice notice-error text-sm" role="alert">{error}</p>}

        <div className="flex flex-wrap justify-end gap-3">
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={submitting}>Annuler</button>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Enregistrement..." : editing ? "Enregistrer" : "Publier"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
