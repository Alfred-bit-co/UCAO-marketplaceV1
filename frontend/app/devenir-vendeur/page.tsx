"use client";
import { CheckCircle2, Crown, Loader2, Send, ShieldAlert, Star } from "lucide-react";
import { useState } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { SUBSCRIPTION_PLANS, initiateSubscriptionPayment } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/lib/types";

const TIER_STYLES: Record<SubscriptionTier, { Icon: typeof Send; iconBg: string; button: string }> = {
  STANDARD: {
    Icon: Send,
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    button: "border-2 border-ucao-navy bg-transparent text-ucao-navy hover:bg-ucao-navy hover:text-white dark:text-white dark:border-white/40",
  },
  PREMIUM: {
    Icon: Star,
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
  const [accepted, setAccepted] = useState(false);
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <PageShell>
      <main>
        <PageHero icon={ShieldAlert} eyebrow="Devenir vendeur" title="Choisissez votre palier">
          Chaque palier est un abonnement mensuel payé via Mobile Money (TMoney, Flooz). Aucun renouvellement automatique : pensez à renouveler chaque mois.
        </PageHero>
        <section className="container-ucao grid gap-6 py-[42px] pb-[54px] md:grid-cols-3">
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
                    <CheckCircle2 size={16} className="text-ucao-success" />
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
        <section className="container-ucao pb-[84px]">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span>
              J&apos;ai lu et j&apos;accepte les{" "}
              <a className="font-bold text-ucao-red underline" href="/conditions-generales" target="_blank" rel="noopener noreferrer">
                Conditions Générales d&apos;Utilisation
              </a>
              , notamment la clause sur les échanges au sein du campus et l&apos;absence de renouvellement automatique.
            </span>
          </label>
          {error && <p className="notice notice-error mt-4">{error}</p>}
        </section>
      </main>
    </PageShell>
  );
}