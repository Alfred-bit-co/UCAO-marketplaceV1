"use client";

import { AlertTriangle, CheckCircle2, Clock3, Crown, Loader2, Save, Send, ShieldAlert, Star, UserPlus, X } from "@/lib/icons";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { PageSkeleton } from "@/components/skeletons";
import { SUBSCRIPTION_PLANS, initiateSubscriptionPayment } from "@/lib/subscriptions";
import { TRIAL_DURATIONS, getTrialStatus, startTrial } from "@/lib/trial";
import type { TrialStatus } from "@/lib/trial";
import { cn } from "@/lib/utils";
import { getCurrentProfile, updateProfile } from "@/lib/users";
import type { Profile, SubscriptionTier } from "@/lib/types";

const PHONE_PATTERN = /^\+\d{8,15}$/;

const TIER_STYLES: Record<SubscriptionTier, { Icon: typeof Send; iconBg: string; button: string }> = {
  STANDARD: {
    Icon: Send,
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    button: "border-2 border-ucao-navy bg-transparent text-ucao-navy hover:bg-ucao-navy hover:text-white dark:text-white dark:border-white/40",
  },
  PREMIUM: { Icon: Star, iconBg: "bg-red-50 text-ucao-red dark:bg-red-500/10", button: "btn-primary" },
  VIP: {
    Icon: Crown,
    iconBg: "bg-green-50 text-ucao-success dark:bg-green-500/10",
    button: "border-2 border-ucao-success bg-transparent text-ucao-success hover:bg-ucao-success hover:text-white",
  },
};

const TIER_TAGLINES: Record<SubscriptionTier, string> = {
  STANDARD: "Pour démarrer",
  PREMIUM: "Pour développer votre activité",
  VIP: "Pour vendre au maximum",
};

// Passer à false le jour où la page des demandes d'étudiants est en ligne : la mention « Bientôt » disparaît du palier VIP.
const VIP_REQUESTS_SOON = true;

type PageState = "loading" | "error" | "unauthenticated" | "missing_phone" | "ready";

export default function DevenirVendeurPage() {
  const [state, setState] = useState<PageState>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "saving" | "error">("idle");
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const [loadingTrialTier, setLoadingTrialTier] = useState<SubscriptionTier | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    setState("loading");
    try {
      const current = await getCurrentProfile();
      if (!current) {
        setState("unauthenticated");
        return;
      }
      setProfile(current);
      if (current.phone) {
        setTrialStatus(await getTrialStatus());
        setState("ready");
      } else {
        setState("missing_phone");
      }
    } catch (err) {
      console.error("DEVENIR-VENDEUR ERROR: échec du chargement du profil", err);
      setState("error");
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function handleSavePhone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setPhoneMessage(null);
    if (!PHONE_PATTERN.test(phone)) {
      setPhoneStatus("error");
      setPhoneMessage("Le numéro doit être au format +xxxxxxxxxxx (uniquement des chiffres après le +).");
      return;
    }
    setPhoneStatus("saving");
    const { error: saveError } = await updateProfile(profile.id, { phone });
    setPhoneStatus(saveError ? "error" : "idle");
    setPhoneMessage(saveError);
    if (!saveError) {
      setProfile({ ...profile, phone });
      setTrialStatus(await getTrialStatus());
      setState("ready");
    }
  }

  async function handleChoose(tier: SubscriptionTier) {
    setError(null);
    if (!accepted) {
      setError("Veuillez accepter les Conditions Générales d'Utilisation avant de continuer.");
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

  async function handleTrial(tier: SubscriptionTier) {
    setError(null);
    if (!accepted) {
      setError("Veuillez accepter les Conditions Générales d'Utilisation avant de continuer.");
      return;
    }
    setLoadingTrialTier(tier);
    const result = await startTrial(tier);
    if (!result.ok) {
      setLoadingTrialTier(null);
      setError(result.message);
      if (result.reason === "already_used" || result.reason === "already_active") {
        setTrialStatus({ eligible: false, reason: result.reason });
      }
      return;
    }
    // L'essai est actif : on garde le bouton en chargement pendant la redirection.
    window.location.href = "/dashboard";
  }

  if (state === "loading") {
    return <PageShell><PageSkeleton /></PageShell>;
  }

  if (state === "error") {
    return (
      <PageShell>
        <main className="container-ucao py-[84px] text-center">
          <AlertTriangle className="mx-auto mb-3 text-ucao-red" size={28} />
          <p className="mb-4 text-xl font-medium">Impossible de charger votre profil.</p>
          <p className="mb-6 text-ucao-muted dark:text-[#a8b8cc]">Vérifiez votre connexion internet et réessayez.</p>
          <button className="btn btn-primary" type="button" onClick={loadProfile}>Réessayer</button>
        </main>
      </PageShell>
    );
  }

  if (state === "unauthenticated") {
    return (
      <PageShell>
        <main>
          <PageHero icon={ShieldAlert} eyebrow="Devenir vendeur" title="Créez votre compte vendeur">
            La création de compte est réservée aux vendeurs et ne prend qu&apos;une minute.
          </PageHero>
          <section className="container-ucao max-w-md py-[54px] pb-[84px] text-center">
            <p className="mb-6 text-ucao-muted dark:text-[#a8b8cc]">Vous devez d&apos;abord créer un compte (avec votre numéro de téléphone) avant de choisir un palier.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a className="btn btn-primary" href="/register"><UserPlus size={18} /> Créer un compte vendeur</a>
              <a className="btn btn-ghost" href="/login">J&apos;ai déjà un compte</a>
            </div>
          </section>
        </main>
      </PageShell>
    );
  }

  if (state === "missing_phone" && profile) {
    return (
      <PageShell>
        <main>
          <PageHero icon={ShieldAlert} eyebrow="Devenir vendeur" title="Une dernière étape">Un numéro de téléphone est requis avant de choisir un palier.</PageHero>
          <section className="container-ucao max-w-md py-[54px] pb-[84px]">
            <form className="panel grid gap-4 p-6" onSubmit={handleSavePhone}>
              <label className="grid gap-1 text-sm">
                Numéro de téléphone
                <input className="input-field" type="tel" placeholder="+22892982926" pattern="\+\d{8,15}" value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </label>
              {phoneMessage && <p className={"notice " + (phoneStatus === "error" ? "notice-error" : "")}>{phoneMessage}</p>}
              <button className="btn btn-primary" type="submit" disabled={phoneStatus === "saving"}>
                <Save size={16} /> {phoneStatus === "saving" ? "Enregistrement..." : "Continuer"}
              </button>
            </form>
          </section>
        </main>
      </PageShell>
    );
  }

  const canTrial = trialStatus?.eligible === true;
  const trialUsed = trialStatus?.reason === "already_used";
  const busy = loadingTier !== null || loadingTrialTier !== null;

  return (
    <PageShell>
      <main>
        <PageHero icon={ShieldAlert} eyebrow="Devenir vendeur" title="Choisissez votre palier">
          Chaque palier est un abonnement mensuel payé via Mobile Money (TMoney, Flooz). Aucun renouvellement automatique : pensez à renouveler chaque mois.
        </PageHero>

        {canTrial && (
          <section className="container-ucao pt-[42px]">
            <div className="panel flex items-start gap-3 border-2 border-ucao-success/40 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-green-50 text-ucao-success dark:bg-green-500/10">
                <Clock3 size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold">Essayez avant de payer</h2>
                <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">
                  Testez gratuitement le palier de votre choix, sans aucun paiement. Un seul essai par personne. À la fin de l&apos;essai, vos produits sont masqués au public mais conservés : ils redeviennent visibles dès que vous vous abonnez.
                </p>
              </div>
            </div>
          </section>
        )}

        {trialUsed && (
          <section className="container-ucao pt-[42px]">
            <p className="notice" role="status">Votre essai gratuit a déjà été utilisé. Choisissez un abonnement pour continuer à vendre.</p>
          </section>
        )}

        <section className={cn("container-ucao grid gap-6 pb-[54px] md:grid-cols-3", canTrial || trialUsed ? "pt-[28px]" : "pt-[42px]")}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const style = TIER_STYLES[plan.tier];
            const trialLabel = TRIAL_DURATIONS[plan.tier].label;
            const paidButtonClass = canTrial ? "btn-ghost" : style.button === "btn-primary" ? "btn-primary" : style.button;
            const hasStand = plan.standLimit > 0;
            return (
              <article
                key={plan.tier}
                className={cn(
                  "panel relative flex flex-col overflow-hidden p-0",
                  plan.recommended && "border-ucao-red shadow-ucao ring-2 ring-ucao-red",
                )}
              >
                {plan.recommended && (
                  <span className="absolute right-4 top-4 rounded-full bg-ucao-red px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Recommandé
                  </span>
                )}
                <header className="flex items-center gap-3 px-6 pt-6">
                  <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", style.iconBg)}>
                    <style.Icon size={24} />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold tracking-wide">{plan.tier}</h2>
                    <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">{TIER_TAGLINES[plan.tier]}</p>
                  </div>
                </header>
                <p className="flex items-baseline gap-1.5 px-6 pt-5">
                  <span className="text-4xl font-bold tracking-tight">{plan.price.toLocaleString("fr-FR")}</span>
                  <span className="text-base font-semibold">FCFA</span>
                  <span className="text-sm text-ucao-muted dark:text-[#a8b8cc]">/ mois</span>
                </p>
                <ul className="mt-5 flex-1 space-y-3 border-t border-ucao-line px-6 pt-5 text-sm dark:border-[#2a3a52]">
                  <PlanFeature variant="yes">{plan.productLimit} produits maximum</PlanFeature>
                  <PlanFeature variant={hasStand ? "yes" : "no"}>
                    {hasStand ? plan.standLimit + " stand" + (plan.standLimit > 1 ? "s" : "") + " maximum" : "Aucun stand"}
                  </PlanFeature>
                  {plan.tier === "VIP" && (
                    <PlanFeature variant="yes" badge={VIP_REQUESTS_SOON ? "Bientôt" : undefined}>
                      Voir les demandes des étudiants
                    </PlanFeature>
                  )}
                  {canTrial && <PlanFeature variant="trial">Essai gratuit : {trialLabel}</PlanFeature>}
                </ul>
                <div className="mt-6 grid gap-2 px-6 pb-6">
                  {canTrial && (
                    <button type="button" className="btn btn-primary w-full" disabled={busy} onClick={() => handleTrial(plan.tier)}>
                      {loadingTrialTier === plan.tier ? <Loader2 className="animate-spin" size={18} /> : null}
                      Essayer gratuitement · {trialLabel}
                    </button>
                  )}
                  <button type="button" className={cn("btn w-full", paidButtonClass)} disabled={busy} onClick={() => handleChoose(plan.tier)}>
                    {loadingTier === plan.tier ? <Loader2 className="animate-spin" size={18} /> : null}
                    {canTrial ? "S'abonner directement" : "Choisir " + plan.tier}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
        <section className="container-ucao pb-[84px]">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>
              J&apos;ai lu et j&apos;accepte les{" "}
              <a className="font-medium text-ucao-red underline" href="/conditions-generales" target="_blank" rel="noopener noreferrer">Conditions Générales d&apos;Utilisation</a>
              , notamment la clause sur les échanges au sein du campus et l&apos;absence de renouvellement automatique.
            </span>
          </label>
          {error && <p className="notice notice-error mt-4" role="alert">{error}</p>}
        </section>
      </main>
    </PageShell>
  );
}

type PlanFeatureProps = {
  /** yes : inclus (coche verte) ; no : non inclus (croix rouge) ; trial : essai gratuit (horloge verte). */
  variant: "yes" | "no" | "trial";
  /** Petite étiquette à droite de la ligne, par exemple « Bientôt ». */
  badge?: string;
  children: React.ReactNode;
};

function PlanFeature({ variant, badge, children }: PlanFeatureProps) {
  return (
    <li className={cn("flex items-start gap-2.5", variant === "trial" && "font-medium")}>
      {variant === "yes" && <CheckCircle2 size={18} weight="fill" className="mt-0.5 shrink-0 text-ucao-success" aria-hidden="true" />}
      {variant === "trial" && <Clock3 size={18} className="mt-0.5 shrink-0 text-ucao-success" aria-hidden="true" />}
      {variant === "no" && (
        <span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
          <X size={12} weight="bold" aria-hidden="true" />
        </span>
      )}
      <span className={cn(variant === "no" && "text-ucao-muted dark:text-[#a8b8cc]")}>
        {children}
        {variant === "no" && <span className="sr-only"> (non inclus)</span>}
      </span>
      {badge && (
        <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
          {badge}
        </span>
      )}
    </li>
  );
}
