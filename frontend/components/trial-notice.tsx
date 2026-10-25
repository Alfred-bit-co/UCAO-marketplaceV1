"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3 } from "@/lib/icons";
import { createClient } from "@/lib/supabase";
import { TRIAL_DURATIONS } from "@/lib/trial";

const TIERS = ["STANDARD", "PREMIUM", "VIP"] as const;

/**
 * Paragraphe sur l'essai gratuit.
 * Il n'apparaît que si les essais sont ouverts (fonction SQL publique trials_open) :
 * tant qu'ils sont fermés, rien n'est affiché. Les durées viennent de lib/trial.ts.
 */
export function TrialNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      if (!supabase) return;
      const { data, error } = await supabase.rpc("trials_open");
      if (error) {
        console.error("SUPABASE ERROR (trials_open):", error);
        return;
      }
      if (!cancelled) setOpen(data === true);
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!open) return null;

  return (
    <section className="container-ucao pb-16">
      <div className="panel flex flex-col gap-6 border-2 border-ucao-success/40 p-6 md:flex-row md:items-center md:justify-between md:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-ucao bg-ucao-success text-white">
            <Clock3 size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-2xl font-medium">Essayez avant de payer</h2>
            <p className="mt-2 text-ucao-muted dark:text-[#a8b8cc]">
              Choisissez le palier qui vous convient et testez-le gratuitement, sans aucun paiement. Un seul essai par personne.
              À la fin de l&apos;essai, vos produits sont masqués au public mais conservés : ils redeviennent visibles dès que vous vous abonnez.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {TIERS.map((tier) => (
                <li
                  key={tier}
                  className="rounded-full bg-ucao-soft px-3 py-1 text-sm font-medium dark:bg-[#0b1c31]"
                >
                  {tier} : {TRIAL_DURATIONS[tier].label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Link className="btn btn-primary shrink-0" href="/devenir-vendeur">
          Choisir ma version d&apos;essai
        </Link>
      </div>
    </section>
  );
}
