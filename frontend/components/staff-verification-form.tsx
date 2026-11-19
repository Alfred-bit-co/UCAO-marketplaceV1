"use client";

import { useState } from "react";
import { Send } from "@/lib/icons";
import { submitStaffVerification } from "@/lib/verification";
import type { Profile } from "@/lib/types";

/**
 * Formulaire « Personnel de l'UCAO » : la profession remplace la carte d'étudiant.
 * Elle est vérifiée par un administrateur avant que la personne puisse vendre.
 */
export function StaffVerificationForm({ profile, onSwitch }: { profile: Profile; onSwitch?: () => void }) {
  const [profession, setProfession] = useState(profile.profession ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const declared = profile.account_type === "personnel" && Boolean(profile.profession);
  const status = profile.verification_status;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const clean = profession.trim();
    if (clean.length < 2 || clean.length > 80) {
      setError("Indiquez votre profession (2 à 80 caractères).");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await submitStaffVerification(clean, phone.trim() || undefined);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    window.location.href = "/compte-personnel";
  }

  return (
    <section className="container-ucao max-w-3xl pb-[84px] pt-[42px]">
      <form className="panel grid gap-5 p-6" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-xl font-medium">Personnel de l&apos;UCAO</h2>
          <p className="mt-1 text-sm text-ucao-muted">
            Pas de carte d&apos;étudiant : indiquez votre profession. Un administrateur la vérifie avant que vous puissiez vendre.
          </p>
        </div>

        {declared && status === "pending" && (
          <p className="notice text-sm" role="status">Votre profession est en cours de vérification. Vous pouvez la corriger ci-dessous si besoin.</p>
        )}
        {declared && status === "rejected" && (
          <p className="notice notice-error text-sm" role="alert">
            Votre profession n&apos;a pas été validée{profile.verification_note ? ` : ${profile.verification_note}` : "."} Corrigez-la puis renvoyez-la.
          </p>
        )}

        <label className="grid gap-2 font-medium">
          Profession
          <input
            className="input-field"
            value={profession}
            onChange={(event) => setProfession(event.target.value)}
            maxLength={80}
            required
            placeholder="Ex. Enseignant en droit, Secrétaire de la scolarité"
          />
        </label>

        {!profile.phone && (
          <label className="grid gap-2 font-medium">
            Téléphone
            <input className="input-field" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+22892982926" required />
          </label>
        )}

        {error && <p className="notice notice-error" role="alert">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary w-fit" type="submit" disabled={submitting}>
            <Send size={18} aria-hidden="true" />
            {submitting ? "Envoi..." : declared ? "Mettre à jour ma profession" : "Envoyer ma profession"}
          </button>
          {onSwitch && (
            <button className="text-sm font-medium text-ucao-red underline-offset-4 hover:underline" type="button" onClick={onSwitch}>
              Je suis plutôt étudiant(e)
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
