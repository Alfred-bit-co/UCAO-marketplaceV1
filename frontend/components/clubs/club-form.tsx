"use client";
/* eslint-disable @next/next/no-img-element -- l'aperçu local (URL blob) ne passe pas par l'optimiseur d'images. */

import { useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "@/lib/icons";
import { CLUB_COLORS, normalizeHex } from "@/lib/club-colors";
import { createClub, updateClub, uploadClubImage, validateClubImage, type ClubPayload } from "@/lib/clubs";
import type { Club } from "@/lib/types";
import { ColorPicker } from "./color-picker";
import { Modal } from "./modal";

const DESCRIPTION_MAX = 400;

type ClubFormProps = {
  /** Club à modifier, ou null pour en créer un. */
  club: Club | null;
  /** Tous les clubs connus (pour griser les couleurs prises et proposer l'ordre suivant). */
  clubs: Club[];
  onSaved: (club: Club, created: boolean) => void;
  onCancel: () => void;
};

function firstFreeColor(clubs: Club[]): string {
  const taken = new Set(clubs.filter((club) => !club.deleted_at).map((club) => normalizeHex(club.color)));
  return CLUB_COLORS.find((color) => !taken.has(normalizeHex(color.hex)))?.hex ?? CLUB_COLORS[0].hex;
}

export function ClubForm({ club, clubs, onSaved, onCancel }: ClubFormProps) {
  const editing = Boolean(club);
  const [name, setName] = useState(club?.name ?? "");
  const [description, setDescription] = useState(club?.short_description ?? "");
  const [whatsapp, setWhatsapp] = useState(club?.whatsapp ?? "");
  const [externalUrl, setExternalUrl] = useState(club?.external_url ?? "");
  const [sortOrder, setSortOrder] = useState(String(club?.sort_order ?? (Math.max(0, ...clubs.map((item) => item.sort_order)) + 10)));
  const [color, setColor] = useState(club?.color ?? firstFreeColor(clubs));
  const [isActive, setIsActive] = useState(club?.is_active ?? true);
  const [bannerUrl, setBannerUrl] = useState<string | null>(club?.banner_url ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Identifiant du club dès le formulaire : il sert au chemin de l'image envoyée avant l'enregistrement.
  const clubIdRef = useRef(club?.id ?? crypto.randomUUID());

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFile(list: FileList | null) {
    const picked = list?.[0];
    if (!picked) return;
    const invalid = validateClubImage(picked);
    if (invalid) {
      setError(invalid);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError(null);
    setFile(picked);
  }

  function removeImage() {
    setFile(null);
    setBannerUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    let imageUrl = bannerUrl;
    if (file) {
      const uploaded = await uploadClubImage(file, clubIdRef.current);
      if (uploaded.error) {
        setError(uploaded.error);
        setSubmitting(false);
        return;
      }
      imageUrl = uploaded.data;
    }

    const payload: ClubPayload = {
      name,
      short_description: description,
      banner_url: imageUrl,
      external_url: externalUrl,
      whatsapp,
      sort_order: Number(sortOrder),
      color,
      is_active: isActive,
    };
    const result = club ? await updateClub(club.id, payload) : await createClub(payload, clubIdRef.current);
    setSubmitting(false);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    onSaved(result.data, !editing);
  }

  const shownImage = preview ?? bannerUrl;

  return (
    <Modal title={editing ? "Modifier le club" : "Ajouter un club"} eyebrow="Clubs" onClose={onCancel} locked={submitting}>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Nom du club</span>
          <input className="input-field" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required placeholder="Ex. Basketball" />
        </label>

        <label className="grid gap-1.5">
          <span className="flex items-center justify-between text-sm font-medium">
            Description courte
            <span className={"text-xs " + (description.length > DESCRIPTION_MAX ? "text-ucao-red" : "text-ucao-muted")}>{description.length}/{DESCRIPTION_MAX}</span>
          </span>
          <textarea className="textarea-field" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={DESCRIPTION_MAX} rows={4} placeholder="Ce que fait le club, pour qui, et pourquoi le rejoindre." />
        </label>

        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Image du club</span>
          {shownImage ? (
            <div className="relative overflow-hidden rounded-ucao">
              <img src={shownImage} alt="Aperçu de l'image du club" className="h-40 w-full object-cover" />
              {preview && <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-0.5 text-xs font-medium text-white">Envoyée à l&apos;enregistrement</span>}
              <button type="button" className="btn btn-light absolute right-2 top-2 size-9 min-h-0 p-0 text-ucao-red" onClick={removeImage} aria-label="Retirer l'image" disabled={submitting}>
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-ucao border-2 border-dashed border-ucao-line bg-ucao-soft/60 p-5 text-center text-sm text-ucao-muted transition hover:border-ucao-red dark:border-[#2a3a52] dark:bg-[#132238]/60">
              <Upload className="text-ucao-red" size={24} aria-hidden="true" />
              <span className="font-medium text-ucao-ink dark:text-white">Choisir une image</span>
              <span>JPG, PNG ou WebP — 3 Mo max.</span>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => handleFile(event.target.files)} disabled={submitting} />
            </label>
          )}
        </div>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Numéro WhatsApp du responsable</span>
          <input className="input-field" type="tel" inputMode="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+22890123456" />
          <span className="text-xs text-ucao-muted">Facultatif. Sans numéro, la carte affiche « Contact bientôt disponible ».</span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Lien externe (facultatif)</span>
          <input className="input-field" type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://…" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Ordre d&apos;affichage</span>
            <input className="input-field" type="number" inputMode="numeric" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
          </label>
          <label className="flex items-end gap-2 pb-2.5">
            <input type="checkbox" className="size-5 accent-ucao-red" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            <span className="text-sm font-medium">Visible sur le site</span>
          </label>
        </div>

        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Couleur du club</span>
          <ColorPicker value={color} onChange={setColor} clubs={clubs} currentClubId={club?.id ?? null} disabled={submitting} />
          <span className="text-xs text-ucao-muted">Chaque club a sa couleur dans le calendrier. Les couleurs grisées sont déjà prises.</span>
        </div>

        {error && <p className="notice notice-error text-sm" role="alert">{error}</p>}

        <div className="flex flex-wrap justify-end gap-3">
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={submitting}>Annuler</button>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Enregistrement..." : editing ? "Enregistrer" : "Créer le club"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
