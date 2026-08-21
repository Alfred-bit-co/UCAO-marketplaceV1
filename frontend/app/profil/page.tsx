"use client";

import { Check, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import type { Profile } from "@/lib/types";
import { getCurrentProfile, updateCurrentProfile } from "@/lib/users";

const PHONE_PATTERN = /^\+\d{8,15}$/;

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() ?? "",
    lastName: parts.join(" "),
  };
}

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
    const firstName = String(form.get("first_name") || "").trim();
    const lastName = String(form.get("last_name") || "").trim();
    const result = await updateCurrentProfile({
      full_name: `${firstName} ${lastName}`.trim(),
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

  const phoneIsValid = PHONE_PATTERN.test(profile.phone ?? "");

  return (
    <PageShell>
      <main>
        <PageHero icon={UserRound} eyebrow="Compte" title="Mon profil">Gérez votre identité et consultez vos informations de compte.</PageHero>
        <section className="container-ucao grid max-w-4xl gap-5 py-[54px] pb-[84px] md:grid-cols-[0.75fr_1.25fr]">
          <aside className="panel h-fit p-6">
            <div className="mb-5 grid size-16 place-items-center rounded-full bg-ucao-navy text-2xl font-black text-white">
              {profile.full_name.trim().charAt(0).toUpperCase() || "U"}
            </div>
            <h2 className="text-xl font-black">{profile.full_name}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-ucao-muted dark:text-[#a8b8cc]"><Mail size={15} /> {profile.email}</p>
            <span className="tag mt-4"><ShieldCheck size={15} /> {profile.role}</span>
            <button className="btn btn-primary mt-5 w-full" form="profile-form" type="submit" disabled={saving}>
              <Check size={16} />{saving ? "Enregistrement..." : "Enregistrer les changements"}
            </button>
            {message && <Link className="text-center text-sm font-bold text-ucao-red hover:underline" href="/">Retour à la page d&apos;accueil</Link>}
          </aside>

          <form id="profile-form" className="panel grid gap-5 p-6" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-xl font-black">Informations personnelles</h2>
              <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">Votre nom sera affiché sur la marketplace.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 font-bold">Prénom<input className="input-field" name="first_name" defaultValue={splitFullName(profile.full_name).firstName} required minLength={2} /></label>
              <label className="grid gap-1.5 font-bold">Nom<input className="input-field" name="last_name" defaultValue={splitFullName(profile.full_name).lastName} required minLength={2} /></label>
            </div>
            <label className="grid gap-1.5 font-bold">Email<input className="input-field opacity-70" value={profile.email} readOnly aria-readonly="true" /></label>
            <label className="grid gap-1.5 font-bold">Numéro de téléphone
              <span className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-ucao-muted" size={17} />
                <input className="input-field bg-ucao-soft pl-10 opacity-70 dark:bg-[#172d48]" type="tel" value={profile.phone ?? "Non renseigné"} placeholder="+22892982926" readOnly aria-readonly="true" aria-invalid={!phoneIsValid} />
              </span>
              <span className="text-xs font-normal text-ucao-muted dark:text-[#a8b8cc]">Ce numéro est associé à votre compte et ne peut pas être modifié depuis le profil. Le format attendu est +xxxxxxxxxxx, uniquement des chiffres après le + et sans espace.</span>
            </label>
            {error && <p className="notice notice-error">{error}</p>}
            {message && <p className="notice">{message}</p>}
          </form>
        </section>
      </main>
    </PageShell>
  );
}