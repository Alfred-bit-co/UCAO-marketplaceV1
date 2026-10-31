"use client";

import { useState } from "react";
import { AlertTriangle, MessageCircle, Store, X } from "@/lib/icons";
import { ImageUpload } from "@/components/image-upload";
import {
  STAND_CATEGORIES,
  STAND_CONTACT_MODES,
  buildStandActions,
  modesNeedPhone,
  normalizeWhatsAppPhone,
} from "@/lib/stand-catalog";
import type { StandPayload } from "@/lib/stands";
import type { Stand, StandContactMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type StandFormProps = {
  /** Le stand à modifier, ou null pour en créer un. */
  stand: Stand | null;
  suspended: boolean;
  /** true : le palier ne permet pas de créer un stand de plus (n'empêche pas de modifier un stand existant). */
  limitReached: boolean;
  onSubmit: (payload: StandPayload) => Promise<{ error: string | null }>;
  onCancel: () => void;
};

export function StandForm({ stand, suspended, limitReached, onSubmit, onCancel }: StandFormProps) {
  const [name, setName] = useState(stand?.name ?? "");
  const [description, setDescription] = useState(stand?.description ?? "");
  const [category, setCategory] = useState<string>(stand?.category ?? "");
  const [phone, setPhone] = useState(stand?.whatsapp_phone ?? "");
  const [modes, setModes] = useState<StandContactMode[]>(stand?.contact_modes ?? []);
  const [banner, setBanner] = useState<string[]>(stand?.banner_url ? [stand.banner_url] : []);
  const [logo, setLogo] = useState<string[]>(stand?.logo_url ? [stand.logo_url] : []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const editing = Boolean(stand);
  const blocked = suspended || (!editing && limitReached);
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const phoneInvalid = phone.trim() !== "" && !normalizedPhone;
  const needsPhone = modesNeedPhone(modes);
  const previewActions = buildStandActions({
    name: name.trim() || "Mon stand",
    whatsapp_phone: normalizedPhone,
    contact_modes: modes,
  });

  function toggleMode(mode: StandContactMode) {
    setModes((current) => (current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]));
  }

  function resetForm() {
    setName("");
    setDescription("");
    setCategory("");
    setPhone("");
    setModes([]);
    setBanner([]);
    setLogo([]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked || submitting) return;
    setError(null);
    if (phoneInvalid) {
      setError("Numéro WhatsApp invalide. Format attendu : +22890123456.");
      return;
    }
    if (needsPhone && !normalizedPhone) {
      setError("Ajoutez un numéro WhatsApp pour proposer Commander, Réserver ou Rendez-vous.");
      return;
    }
    setSubmitting(true);
    const result = await onSubmit({
      name,
      description,
      category,
      banner_url: banner[0] ?? null,
      logo_url: logo[0] ?? null,
      whatsapp_phone: normalizedPhone,
      contact_modes: modes,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!editing) resetForm();
  }

  return (
    <form id="stand-form" className="panel scroll-mt-6 p-5 sm:p-6" onSubmit={handleSubmit}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Vitrine</p>
          <h2 className="text-2xl font-bold">{editing ? "Modifier mon stand" : "Ouvrir un stand"}</h2>
        </div>
        {editing ? (
          <button className="btn btn-ghost min-h-9 px-3 text-sm" type="button" onClick={onCancel}>
            <X size={15} /> Annuler
          </button>
        ) : (
          <Store className="text-ucao-success" size={25} />
        )}
      </div>

      <div className="grid gap-3">
        <input
          className="input-field"
          name="name"
          placeholder="Nom du stand"
          aria-label="Nom du stand"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          required
        />
        <select
          className="select-field"
          name="category"
          aria-label="Catégorie du stand"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        >
          <option value="" disabled>
            Catégorie
          </option>
          {STAND_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <textarea
          className="textarea-field"
          name="description"
          placeholder="Description du stand"
          aria-label="Description du stand"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={600}
          required
        />

        <ImageUpload
          folder="stands"
          label="Logo du stand"
          hint="Image carrée conseillée — JPG, PNG ou WebP, 5 Mo max."
          value={logo}
          onChange={setLogo}
          compact
        />
        <ImageUpload folder="stands" label="Bannière du stand" value={banner} onChange={setBanner} compact />

        <fieldset className="grid gap-2">
          <legend className="font-medium">Ce que propose votre stand</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {STAND_CONTACT_MODES.map((mode) => {
              const checked = modes.includes(mode.value);
              return (
                <label
                  key={mode.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-ucao border p-3 text-sm transition",
                    checked
                      ? "border-ucao-red bg-ucao-red-soft/40 dark:border-[#ff9aa0] dark:bg-[#132238]"
                      : "border-ucao-line hover:border-ucao-red dark:border-[#2a3a52]",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-[#7a1e2d]"
                    checked={checked}
                    onChange={() => toggleMode(mode.value)}
                  />
                  <span>
                    <span className="block font-medium">{mode.label}</span>
                    <span className="block text-xs text-ucao-muted dark:text-[#a8b8cc]">{mode.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-1.5">
          <label htmlFor="stand-whatsapp" className="font-medium">
            Numéro WhatsApp du stand <span className="font-normal text-ucao-muted">(facultatif)</span>
          </label>
          <input
            id="stand-whatsapp"
            className="input-field"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+22890123456"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            onBlur={() => {
              if (normalizedPhone) setPhone(normalizedPhone);
            }}
            aria-invalid={phoneInvalid}
            aria-describedby="stand-whatsapp-help"
          />
          <p
            id="stand-whatsapp-help"
            className={cn("text-xs", phoneInvalid ? "text-ucao-red" : "text-ucao-muted dark:text-[#a8b8cc]")}
          >
            {phoneInvalid
              ? "Format attendu : +22890123456 (indicatif du pays puis numéro)."
              : "Ce numéro sera visible par tous les visiteurs de votre stand. Utilisez un numéro que vous acceptez de rendre public."}
          </p>
        </div>

        <div className="rounded-ucao border border-dashed border-ucao-line p-4 dark:border-[#2a3a52]">
          <p className="text-sm font-medium">Boutons que verront les étudiants</p>
          {previewActions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {previewActions.map((action) => (
                <span
                  key={action.key}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-ucao px-3 py-2 text-sm font-semibold",
                    action.primary ? "bg-ucao-red text-white" : "border border-ucao-line dark:border-[#2a3a52]",
                  )}
                >
                  <MessageCircle size={14} /> {action.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ucao-muted dark:text-[#a8b8cc]">
              Sans numéro WhatsApp valide, aucun bouton de contact n’est affiché sur votre stand.
            </p>
          )}
        </div>

        {error && (
          <p className="notice notice-error flex items-center gap-2" role="alert">
            <AlertTriangle size={16} /> {error}
          </p>
        )}
        {suspended && <p className="notice notice-error">Modification désactivée : votre compte est suspendu.</p>}
        {!editing && limitReached && !suspended && (
          <p className="notice">
            Votre palier ne permet pas de créer un stand supplémentaire.{" "}
            <a className="underline" href="/devenir-vendeur">
              Changer de palier
            </a>
            .
          </p>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting || blocked}>
          <Store size={18} />{" "}
          {submitting
            ? editing
              ? "Enregistrement..."
              : "Création..."
            : editing
              ? "Enregistrer les modifications"
              : "Créer le stand"}
        </button>
      </div>
    </form>
  );
}
