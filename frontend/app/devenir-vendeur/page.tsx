"use client";
import { BadgeCheck, Check, CheckCircle2, Crown, Gem, Loader2, Mail, Phone, ShieldAlert, Store, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { SUBSCRIPTION_PLANS, initiateSubscriptionPayment } from "@/lib/subscriptions";
import { getCurrentProfile, updateCurrentProfile } from "@/lib/users";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/types";

const PHONE_PATTERN = /^\+\d{8,15}$/;

const TIER_STYLES: Record<SubscriptionTier, { Icon: typeof Store; iconBg: string; button: string }> = {
  STANDARD: {
    Icon: BadgeCheck,
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    button: "border-2 border-ucao-navy bg-transparent text-ucao-navy hover:bg-ucao-navy hover:text-white dark:text-white dark:border-white/40",
  },
  PREMIUM: {
    Icon: Gem,
    iconBg: "bg-red-50 text-ucao-red dark:bg-red-500/10",
    button: "btn-primary",
  },
  VIP: {
    Icon: Crown,
    iconBg: "bg-green-50 text-ucao-success dark:bg-green-500/10",
    button: "border-2 border-ucao-success bg-transparent text-ucao-success hover:bg-ucao-success hover:text-white",
  },
};

export default function DevenirVendeurPage() {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getCurrentProfile>>>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [sellerName, setSellerName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [formCompleted, setFormCompleted] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tiersSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    getCurrentProfile().then((currentProfile) => {
      setProfile(currentProfile);
      setSellerName(currentProfile?.full_name ?? "");
      setLoadingProfile(false);
    });
  }, []);

  async function handleSellerFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!profile) {
      setError("Connectez-vous pour devenir vendeur.");
      return;
    }
    const name = sellerName.trim();
    if (name.length < 2) {
      setError("Veuillez saisir votre nom complet.");
      return;
    }
    if (!PHONE_PATTERN.test(profile.phone ?? "")) {
      setError("Votre numéro doit respecter le format +xxxxxxxxxxx, uniquement des chiffres après le + et sans espace.");
      return;
    }
    if (!accepted) {
      setError("Veuillez accepter les Conditions Générales d'Utilisation avant de continuer.");
      return;
    }
    setSavingForm(true);
    const result = await updateCurrentProfile({ full_name: name });
    setSavingForm(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setProfile({ ...profile, full_name: name });
    setFormCompleted(true);
  }

  useEffect(() => {
    if (formCompleted) {
      tiersSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [formCompleted]);

  async function handleChoose(tier: SubscriptionTier) {
    setError(null);
    if (!formCompleted) {
      setError("Veuillez compléter le formulaire vendeur avant de choisir un palier.");
      return;
    }
    if (!profile) {
      setError("Connectez-vous pour choisir un abonnement vendeur.");
      return;
    }
    if (!PHONE_PATTERN.test(profile.phone ?? "")) {
      setError("Votre numéro doit respecter le format +xxxxxxxxxxx, uniquement des chiffres après le + et sans espace. Consultez votre profil pour vérifier votre compte.");
      return;
    }
    setLoadingTier(tier);
    const result = await initiateSubscriptionPayment(tier);
    setLoadingTier(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    window.location.href = result.paymentUrl;
  }

  return (
    <PageShell>
      <main>
        <PageHero icon={ShieldAlert} eyebrow="Devenir vendeur" title="Préparez votre espace vendeur">
          Complétez vos informations avant de choisir un abonnement mensuel payé via Mobile Money (TMoney, Flooz).
        </PageHero>
        <section className="container-ucao max-w-2xl py-[42px] pb-[54px]">
          <form className="panel grid gap-5 p-6" onSubmit={handleSellerFormSubmit}>
            <div>
              <p className="eyebrow">Étape 1</p>
              <h2 className="text-2xl font-black">Vos informations vendeur</h2>
              <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">Ces informations seront associées à votre compte vendeur.</p>
            </div>
            {loadingProfile ? (
              <p className="text-ucao-muted dark:text-[#a8b8cc]">Chargement de votre profil...</p>
            ) : !profile ? (
              <p className="notice notice-error">Connectez-vous pour compléter votre inscription vendeur.</p>
            ) : (
              <>
                <label className="grid gap-1.5 font-bold">
                  Nom complet
                  <input className="input-field" value={sellerName} onChange={(event) => setSellerName(event.target.value)} minLength={2} required />
                </label>
                <label className="grid gap-1.5 font-bold">
                  Email
                  <span className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ucao-muted" size={17} />
                    <input className="input-field bg-ucao-soft pl-10 opacity-70 dark:bg-[#172d48]" value={profile.email} readOnly aria-readonly="true" />
                  </span>
                </label>
                <label className="grid gap-1.5 font-bold">
                  Numéro de téléphone
                  <span className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-ucao-muted" size={17} />
                    <input className="input-field bg-ucao-soft pl-10 opacity-70 dark:bg-[#172d48]" value={profile.phone ?? "Non renseigné"} placeholder="+22892982926" readOnly aria-readonly="true" />
                  </span>
                  <span className="text-xs font-normal text-ucao-muted dark:text-[#a8b8cc]">Format attendu : +xxxxxxxxxxx, uniquement des chiffres après le + et sans espace. Ce numéro ne peut pas être modifié.</span>
                </label>
                <label className="flex items-start gap-3 text-sm font-normal">
                  <input type="checkbox" className="mt-1" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
                  <span>
                    J&apos;ai lu et j&apos;accepte les{" "}
                    <a className="font-bold text-ucao-red underline" href="/conditions-generales" target="_blank" rel="noopener noreferrer">Conditions Générales d&apos;Utilisation</a>.
                  </span>
                </label>
                <button className="btn btn-primary w-full sm:w-fit" type="submit" disabled={savingForm || formCompleted}>
                  {savingForm ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  {formCompleted ? "Informations validées" : "Continuer vers les paliers"}
                </button>
                {formCompleted && (
                  <p className="notice" aria-live="polite">
                    Vos informations sont validées. Le choix de votre palier se trouve juste en dessous.
                  </p>
                )}
              </>
            )}
          </form>
        </section>

        {formCompleted && <section ref={tiersSectionRef} className="container-ucao grid scroll-mt-24 gap-6 pb-[54px] md:grid-cols-3">
          <div className="md:col-span-3">
            <p className="eyebrow">Étape 2</p>
            <h2 className="text-2xl font-black">Choisissez votre palier</h2>
          </div>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const style = TIER_STYLES[plan.tier];
            return (
              <article
                key={plan.tier}
                className={cn(
                  "panel relative flex flex-col gap-3 p-6",
                  plan.recommended && "border-2 border-ucao-red",
                )}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ucao-red px-3 py-1 text-xs font-black text-white">
                    Recommandé
                  </span>
                )}
                <span className={cn("grid size-12 place-items-center rounded-full", style.iconBg)}>
                  <style.Icon size={22} />
                </span>
                <h2 className="text-2xl font-bold">{plan.tier}</h2>
                <p className="text-3xl font-black">
                  {plan.price.toLocaleString("fr-FR")} FCFA<span className="text-sm font-normal"> / mois</span>
                </p>
                <ul className="flex-1 space-y-2 border-t border-ucao-line pt-3 text-sm dark:border-[#2a3a52]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-ucao-success" /> {plan.productLimit} produits maximum
                  </li>
                  <li className="flex items-center gap-2">
                    {plan.standLimit === 0 ? (
                      <XCircle size={18} className="text-ucao-red" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 size={16} className="text-ucao-success" aria-hidden="true" />
                    )}
                    {plan.standLimit === 0 ? "Aucun stand" : `${plan.standLimit} stand(s) maximum`}
                  </li>
                </ul>
                <button
                  type="button"
                  className={cn("btn w-full", style.button === "btn-primary" ? "btn-primary" : style.button)}
                  disabled={loadingTier !== null}
                  onClick={() => handleChoose(plan.tier)}
                >
                  {loadingTier === plan.tier ? <Loader2 className="animate-spin" size={18} /> : null}
                  Choisir {plan.tier}
                </button>
              </article>
            );
          })}
        </section>
        }
        <section className="container-ucao pb-[84px]">
          {error && <p className="notice notice-error mt-4">{error}</p>}
        </section>
      </main>
    </PageShell>
  );
}