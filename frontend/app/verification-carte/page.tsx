"use client";
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { IdCard, ShieldAlert, ShieldCheck, Upload } from "@/lib/icons";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { PageSkeleton } from "@/components/skeletons";
import { submitStudentIdCard } from "@/lib/verification";
import { getCurrentProfile } from "@/lib/users";
import type { Profile } from "@/lib/types";
import { verificationLabel } from "@/lib/utils";
import { validateImageFile } from "@/lib/storage";

export default function VerificationCartePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentCard, setStudentCard] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentProfile().then((current) => { setProfile(current); setLoading(false); });
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function selectStudentCard(file: File | null) {
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setStudentCard(null);
      setPreview(null);
      setError(validationError);
      return;
    }
    setError(null);
    setStudentCard(file);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!studentCard) { setError("La photo de votre carte d'étudiant est obligatoire."); return; }
    setSubmitting(true); setError(null); setMessage(null);
    const result = await submitStudentIdCard(studentCard);
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setProfile(await getCurrentProfile());
    setMessage("Carte envoyee. Un administrateur validera votre compte sous 24 a 48 h.");
  }

  if (loading) return <PageShell><PageSkeleton /></PageShell>;
  if (!profile) return <PageShell><main className="container-ucao py-[84px] text-center"><p className="mb-4 text-xl font-medium">Connectez-vous pour verifier votre compte.</p><Link className="btn btn-primary" href="/login">Se connecter</Link></main></PageShell>;

  const status = profile.verification_status ?? "pending";
  const hasSubmitted = Boolean(profile.student_id_url);
  return (
    <PageShell>
      <main>
        <PageHero icon={IdCard} eyebrow="Verification" title="Carte d'etudiant UCAO">Envoyez une photo de votre carte d'etudiant de l'annee en cours pour activer votre compte.</PageHero>
        <section className="container-ucao max-w-3xl pb-[84px] pt-[42px]">
          <article className="panel mb-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow mb-1">Statut du compte</p><h2 className="text-2xl font-medium">{verificationLabel(status)}</h2></div><span className="tag">{status === "approved" ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />} {verificationLabel(status)}</span></div>
            {status === "approved" && <p className="mt-4 text-ucao-muted">Votre compte est valide.</p>}
            {status === "pending" && hasSubmitted && <p className="mt-4 text-ucao-muted">Votre carte est en cours de verification par l'equipe UCAO Marketplace.</p>}
            {status === "rejected" && <div className="notice notice-error mt-4"><p className="font-medium">Verification refusee</p><p>{profile.verification_note || "La photo n'etait pas lisible ou ne correspondait pas a une carte UCAO valide."}</p><p className="mt-2 text-sm">Vous pouvez renvoyer une nouvelle photo.</p></div>}
          </article>
          {status !== "approved" && (!hasSubmitted || status === "rejected") && <form className="panel grid gap-5 p-6" onSubmit={handleSubmit}>
            <div><h2 className="text-xl font-medium">Envoyer votre carte <span className="text-ucao-red">*</span></h2><p className="mt-1 text-sm text-ucao-muted">Obligatoire pour activer le compte. Photo nette, recto visible. JPG, PNG, WebP ou AVIF, 5 Mo maximum.</p></div>
            <label className="grid gap-2 font-medium">Photo de la carte d'etudiant <span className="sr-only">(obligatoire)</span><input className="input-field py-2" type="file" accept="image/*" required onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => selectStudentCard(event.target.files?.[0] ?? null)} /><span className="text-sm font-normal text-ucao-muted">Ouvrez votre galerie ou votre gestionnaire de fichiers. Cette image est envoyée dans un stockage privé.</span></label>
            {preview && <img src={preview} alt="Apercu de la carte d'etudiant" className="max-h-64 rounded-ucao border border-ucao-line object-contain" />}
            {error && <p className="notice notice-error">{error}</p>}{message && <p className="notice">{message}</p>}
            <button className="btn btn-primary w-fit" type="submit" disabled={submitting || !studentCard}><Upload size={18} />{submitting ? "Envoi..." : status === "rejected" ? "Renvoyer ma carte" : "Envoyer pour validation"}</button>
          </form>}
          {status === "approved" && <Link className="btn btn-primary" href="/products">Acceder au catalogue</Link>}
        </section>
      </main>
    </PageShell>
  );
}
