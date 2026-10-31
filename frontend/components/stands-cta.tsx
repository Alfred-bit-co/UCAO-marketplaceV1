"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Store } from "@/lib/icons";
import { getCurrentProfile } from "@/lib/users";
import type { Profile } from "@/lib/types";

type Cta = { label: string; href: string; text: string };

const VISITOR_CTA: Cta = {
  label: "Devenir vendeur",
  href: "/devenir-vendeur",
  text: "Crée ton propre stand et fais découvrir tes produits et services à toute la communauté.",
};

/** Le bouton s'adapte à la situation réelle de la personne connectée. */
function resolveCta(profile: Profile | null): Cta | null {
  if (!profile) return VISITOR_CTA;
  if (profile.role === "ADMIN") return null;
  if (profile.role !== "VENDEUR") return VISITOR_CTA;

  const tier = profile.subscription_tier ?? null;
  const expired = Boolean(profile.subscription_expires_at && new Date(profile.subscription_expires_at).getTime() < Date.now());
  if (expired) {
    return { label: "Renouveler mon abonnement", href: "/devenir-vendeur", text: "Ton abonnement a expiré : renouvelle-le pour que tes stands restent visibles." };
  }
  if (tier === "PREMIUM" || tier === "VIP") {
    return { label: "Créer mon stand", href: "/dashboard", text: "Ouvre ta vitrine depuis ton tableau de bord et choisis comment les étudiants te contactent." };
  }
  return { label: "Passer à Premium", href: "/devenir-vendeur", text: "Ton palier actuel ne permet pas d'ouvrir un stand. Passe à Premium pour avoir le tien." };
}

export function StandsCta() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentProfile()
      .then((current) => {
        if (active) setProfile(current);
      })
      .catch(() => {
        // En cas d'erreur, on garde le bouton « Devenir vendeur » par défaut.
      });
    return () => {
      active = false;
    };
  }, []);

  const cta = resolveCta(profile);
  if (!cta) return null;

  return (
    <section className="overflow-hidden rounded-ucao bg-[linear-gradient(135deg,#7a1e2d_0%,#12244e_100%)] p-5 text-white shadow-ucao">
      <span className="grid size-11 place-items-center rounded-full bg-white/15">
        <Store size={22} />
      </span>
      <h2 className="mt-4 text-xl font-bold">Tu es étudiant ?</h2>
      <p className="mt-1 text-sm text-white/85">{cta.text}</p>
      <Link
        href={cta.href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-ucao bg-white px-4 py-2.5 text-sm font-bold text-ucao-red transition hover:bg-white/90"
      >
        {cta.label}
      </Link>
    </section>
  );
}
