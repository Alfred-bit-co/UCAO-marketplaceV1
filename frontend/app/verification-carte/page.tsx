"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IdCard, Upload } from "@/lib/icons";
import { Suspense, useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { PageSkeleton } from "@/components/skeletons";
import { submitStudentVerification } from "@/lib/verification";
import { getCurrentProfile } from "@/lib/users";
import type { Profile } from "@/lib/types";
import { validateImageFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase";

function StudentOnboarding() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentCard, setStudentCard] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [studyLevel, setStudyLevel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  useEffect(() => { getCurrentProfile().then((current) => { setProfile(current); setPhone(current?.phone ?? ""); setFieldOfStudy(current?.field_of_study ?? ""); setStudyLevel(current?.study_level ?? ""); setLoading(false); }); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function selectStudentCard(file: File | null) { if (!file) return; const validationError = validateImageFile(file); if (validationError) { setStudentCard(null); setError(validationError); return; } setError(null); setStudentCard(file); setPreview((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(file); }); }
  async function acceptGoogleTerms() { const supabase = createClient(); if (!profile || !supabase) { setError("Supabase n'est pas configuré."); return; } setAcceptingTerms(true); const { error: updateError } = await supabase.from("profiles").update({ cgu_accepted_at: new Date().toISOString() }).eq("id", profile.id); setAcceptingTerms(false); if (updateError) { setError(updateError.message); return; } setProfile({ ...profile, cgu_accepted_at: new Date().toISOString() }); }
  async function handleSubmit(event: React.FormEvent) { event.preventDefault(); if (!studentCard) { setError("La photo de votre carte d'étudiant est obligatoire."); return; } if (!fieldOfStudy.trim() || !studyLevel.trim()) { setError("La filière et le niveau d'étude sont obligatoires."); return; } setSubmitting(true); setError(null); const result = await submitStudentVerification(studentCard, { phone: phone.trim() || undefined, fieldOfStudy: fieldOfStudy.trim(), studyLevel: studyLevel.trim() }); setSubmitting(false); if (result.error) { setError(result.error); return; } window.location.href = "/devenir-vendeur"; }
  if (loading) return <PageShell><PageSkeleton /></PageShell>;
  if (!profile) return <PageShell><main className="container-ucao py-[84px] text-center"><p className="mb-4 text-xl font-medium">Connectez-vous pour continuer.</p><Link className="btn btn-primary" href="/login">Se connecter</Link></main></PageShell>;
  const needsGoogleConsent = searchParams.get("oauth") === "google" && !profile.cgu_accepted_at;
  return <PageShell><main>
    {needsGoogleConsent && <div className="fixed inset-0 z-50 grid place-items-center bg-[#071426]/65 p-4" role="dialog" aria-modal="true"><article className="panel w-full max-w-lg p-6 shadow-2xl"><p className="eyebrow">Première connexion Google</p><h2 className="mt-1 text-2xl font-bold">Acceptez nos conditions</h2><p className="mt-3 text-sm text-ucao-muted">En continuant, vous acceptez les <Link className="font-medium text-ucao-red underline" href="/conditions-generales" target="_blank">Conditions Générales d&apos;Utilisation</Link> et la <Link className="font-medium text-ucao-red underline" href="/politique-confidentialite" target="_blank">Politique de confidentialité</Link>.</p><button className="btn btn-primary mt-6" type="button" onClick={acceptGoogleTerms} disabled={acceptingTerms}>{acceptingTerms ? "Enregistrement..." : "J'accepte et je continue"}</button></article></div>}
    <PageHero icon={IdCard} eyebrow="Finalisation" title="Vos informations étudiantes">Complétez cette unique étape avant de devenir vendeur.</PageHero>
    <section className="container-ucao max-w-3xl pb-[84px] pt-[42px]"><form className="panel grid gap-5 p-6" onSubmit={handleSubmit}><div><h2 className="text-xl font-medium">Informations obligatoires</h2><p className="mt-1 text-sm text-ucao-muted">La carte est contrôlée en arrière-plan et ne bloque pas votre accès.</p></div>{!profile.phone && <label className="grid gap-2 font-medium">Téléphone<input className="input-field" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+22892982926" required /></label>}<div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 font-medium">Filière<input className="input-field" value={fieldOfStudy} onChange={(event) => setFieldOfStudy(event.target.value)} required /></label><label className="grid gap-2 font-medium">Niveau d&apos;étude<input className="input-field" value={studyLevel} onChange={(event) => setStudyLevel(event.target.value)} required /></label></div><label className="grid gap-2 font-medium">Photo de la carte d&apos;étudiant<input className="input-field py-2" type="file" accept="image/*" required onChange={(event) => selectStudentCard(event.target.files?.[0] ?? null)} /><span className="text-sm font-normal text-ucao-muted">Photo nette, recto visible. JPG, PNG, WebP ou AVIF, 5 Mo maximum.</span></label>{preview && <img src={preview} alt="Aperçu de la carte d&apos;étudiant" className="max-h-64 rounded-ucao border border-ucao-line object-contain" />}{error && <p className="notice notice-error">{error}</p>}<button className="btn btn-primary w-fit" type="submit" disabled={submitting || !studentCard}><Upload size={18} />{submitting ? "Envoi..." : "Continuer vers devenir vendeur"}</button></form></section>
  </main></PageShell>;
}
export default function VerificationCartePage() { return <Suspense fallback={<PageShell><PageSkeleton /></PageShell>}><StudentOnboarding /></Suspense>; }
