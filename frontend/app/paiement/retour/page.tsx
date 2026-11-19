"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, RefreshCcw } from "@/lib/icons";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase";

/**
 * Page de retour après un paiement FedaPay.
 *
 * FedaPay renvoie le vendeur ici (callback_url définie par le backend) avec ?id=<transaction>&status=<statut>.
 * Ces paramètres viennent de l'adresse : n'importe qui peut les modifier, ils ne servent donc QU'À l'affichage.
 * La seule source de vérité est la ligne de subscription_payments, que le webhook FedaPay passe à « paid »
 * côté serveur. Cette page se contente de la relire (lecture limitée à ses propres paiements par RLS).
 */

type ViewState = "checking" | "paid" | "failed" | "slow" | "signed_out";

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 40; // environ 2 minutes
const FAILED_PROVIDER_STATUSES = new Set(["declined", "canceled", "cancelled"]);
const TIER_LABELS: Record<string, string> = { STANDARD: "Standard", PREMIUM: "Premium", VIP: "VIP" };

export default function PaymentReturnPage() {
  const [view, setView] = useState<ViewState>("checking");
  const [tier, setTier] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get("id");
    const providerStatus = (params.get("status") || "").toLowerCase();
    let timer: number | undefined;
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      if (!supabase) {
        setView("slow");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setView("signed_out");
        return;
      }

      let query = supabase
        .from("subscription_payments")
        .select("status, tier, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (transactionId && /^\d+$/.test(transactionId)) {
        query = query.eq("fedapay_transaction_id", transactionId);
      }

      const { data } = await query;
      if (cancelled) return;
      const payment = data?.[0] as { status: string; tier: string } | undefined;

      if (payment?.status === "paid") {
        setTier(payment.tier);
        setView("paid");
        return;
      }
      if (payment && (payment.status === "failed" || payment.status === "cancelled")) {
        setView("failed");
        return;
      }
      // FedaPay annonce un échec et la base n'a encore rien confirmé : inutile d'attendre 2 minutes.
      if (FAILED_PROVIDER_STATUSES.has(providerStatus) && attemptsRef.current >= 3) {
        setView("failed");
        return;
      }

      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setView("slow");
        return;
      }
      timer = window.setTimeout(() => void check(), POLL_INTERVAL_MS);
    }

    void check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  // Une fois l'abonnement actif, on recharge complètement /dashboard pour que le middleware relise le rôle VENDEUR.
  useEffect(() => {
    if (view !== "paid") return;
    const redirect = window.setTimeout(() => {
      window.location.href = "/dashboard";
    }, 4000);
    return () => window.clearTimeout(redirect);
  }, [view]);

  return (
    <PageShell>
      <main className="container-ucao flex min-h-[60vh] items-center justify-center py-16">
        <section className="w-full max-w-lg rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#10233a]">
          {view === "checking" && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                <RefreshCcw size={28} className="animate-spin" />
              </div>
              <h1 className="mb-2 text-2xl font-semibold">Confirmation du paiement…</h1>
              <p className="text-ucao-muted">
                Nous attendons la confirmation de l&apos;opérateur Mobile Money. Cela prend en général quelques secondes.
                Ne fermez pas cette page.
              </p>
            </>
          )}

          {view === "paid" && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                <CheckCircle2 size={30} />
              </div>
              <h1 className="mb-2 text-2xl font-semibold">Abonnement activé</h1>
              <p className="mb-6 text-ucao-muted">
                Votre palier {tier ? TIER_LABELS[tier] ?? tier : ""} est actif pour un mois. Vous allez être redirigé vers
                votre tableau de bord.
              </p>
              <a className="btn btn-primary" href="/dashboard">
                Aller au tableau de bord <ArrowUpRight size={18} />
              </a>
            </>
          )}

          {view === "failed" && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10">
                <AlertTriangle size={30} />
              </div>
              <h1 className="mb-2 text-2xl font-semibold">Le paiement n&apos;a pas abouti</h1>
              <p className="mb-6 text-ucao-muted">
                Aucun montant n&apos;a été validé pour cette tentative. Vous pouvez réessayer, avec le même numéro ou un
                autre.
              </p>
              <Link className="btn btn-primary" href="/devenir-vendeur">
                Réessayer le paiement
              </Link>
            </>
          )}

          {view === "slow" && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10">
                <Clock3 size={30} />
              </div>
              <h1 className="mb-2 text-2xl font-semibold">Confirmation en attente</h1>
              <p className="mb-6 text-ucao-muted">
                La confirmation prend plus de temps que prévu. Si vous avez été débité, votre abonnement s&apos;activera
                automatiquement dans les prochaines minutes. Sans activation après 15 minutes, contactez-nous au{" "}
                <a className="font-medium underline" href="https://wa.me/22892982926">+228 92 98 29 26</a> ou à{" "}
                <a className="font-medium underline" href="mailto:ucaomarketplace2026@gmail.com">
                  ucaomarketplace2026@gmail.com
                </a>
                .
              </p>
              <a className="btn btn-primary" href="/dashboard">
                Voir mon tableau de bord
              </a>
            </>
          )}

          {view === "signed_out" && (
            <>
              <h1 className="mb-2 text-2xl font-semibold">Connectez-vous</h1>
              <p className="mb-6 text-ucao-muted">
                Connectez-vous pour vérifier l&apos;état de votre paiement. Si vous avez payé, votre abonnement est
                activé même sans cette page.
              </p>
              <Link className="btn btn-primary" href="/login?next=/dashboard">
                Se connecter
              </Link>
            </>
          )}
        </section>
      </main>
    </PageShell>
  );
}
