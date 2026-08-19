"use client";

import { Check, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import type { Profile } from "@/lib/types";
import { getCurrentProfile, updateCurrentProfile } from "@/lib/users";

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentProfile().then((currentProfile) => {
      setProfile(currentProfile);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await updateCurrentProfile({
      full_name: String(form.get("full_name") || ""),
      phone: String(form.get("phone") || ""),
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setProfile(await getCurrentProfile());
    setMessage("Profil mis à jour.");
  }

  if (loading) return <PageShell><main className="container-ucao py-[84px] text-center">Chargement...</main></PageShell>;
  if (!profile) return <PageShell><main className="container-ucao py-[84px] text-center"><p className="text-xl font-bold">Connectez-vous pour gérer votre profil.</p></main></PageShell>;

  return (
    <PageShell>
      <main>
        <PageHero icon={UserRound} eyebrow="Compte" title="Mon profil">Mettez à jour vos informations de contact.</PageHero>
        <section className="container-ucao max-w-2xl py-[54px] pb-[84px]">
          <form className="panel grid gap-4 p-6" onSubmit={handleSubmit}>
            <label className="grid gap-1">Nom complet<input className="input-field" name="full_name" defaultValue={profile.full_name} required minLength={2} /></label>
            <label className="grid gap-1">Email<input className="input-field" value={profile.email} readOnly /></label>
            <label className="grid gap-1">Numéro de téléphone<input className="input-field" name="phone" type="tel" defaultValue={profile.phone ?? ""} required /></label>
            <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">Rôle : {profile.role}</p>
            {error && <p className="notice notice-error">{error}</p>}
            {message && <p className="notice">{message}</p>}
            <button className="btn btn-primary mt-2" type="submit" disabled={saving}><Check size={16} />{saving ? "Enregistrement..." : "Enregistrer"}</button>
          </form>
        </section>
      </main>
    </PageShell>
  );
}