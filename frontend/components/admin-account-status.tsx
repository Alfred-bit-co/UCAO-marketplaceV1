"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ShieldCheck } from "@/lib/icons";
import { PageSkeleton } from "@/components/skeletons";
import { amIAdmin } from "@/lib/admin-team";
import type { Profile } from "@/lib/types";
import { getCurrentProfile } from "@/lib/users";

type Status = { loading: true } | { loading: false; profile: Profile | null; isAdmin: boolean };

/**
 * Page affichée après la confirmation de l'e-mail d'un compte « Personnel de l'UCAO » :
 * état de la vérification de la profession, et accès à l'administration s'il a été nommé.
 */
export function AdminAccountStatus() {
  const [status, setStatus] = useState<Status>({ loading: true });

  useEffect(() => {
    void (async () => {
      const profile = await getCurrentProfile();
      setStatus({ loading: false, profile, isAdmin: profile ? profile.role === "ADMIN" || (await amIAdmin()) : false });
    })();
  }, []);

  if (status.loading) return <PageSkeleton />;

  const { profile, isAdmin } = status;
  if (!profile) {
    return (
      <main className="container-ucao py-24 text-center">
        <p className="mb-4 text-xl font-medium">Connectez-vous pour voir l&apos;état de votre compte.</p>
        <Link className="btn btn-primary" href="/login">Se connecter</Link>
      </main>
    );
  }

  const staff = profile.account_type === "personnel";
  const verification = profile.verification_status;

  return (
    <main className="container-ucao grid gap-5 py-16">
      {isAdmin && (
        <article className="panel mx-auto w-full max-w-xl p-6 text-center sm:p-8">
          <ShieldCheck className="mx-auto text-ucao-success" size={40} aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-bold">Votre accès administrateur est ouvert</h1>
          <Link className="btn btn-primary mt-6" href="/admin">Ouvrir le centre de pilotage</Link>
        </article>
      )}

      <article className="panel mx-auto w-full max-w-xl p-6 text-center sm:p-8">
        {staff && verification === "approved" ? (
          <>
            <CheckCircle2 className="mx-auto text-ucao-success" size={40} aria-hidden="true" />
            <h2 className="mt-3 text-2xl font-bold">Votre compte personnel est validé</h2>
            {profile.profession && <p className="mt-2 text-ucao-muted dark:text-[#a8b8cc]">Profession : {profile.profession}</p>}
            <Link className="btn btn-primary mt-6" href="/devenir-vendeur">Devenir vendeur</Link>
          </>
        ) : staff && verification === "rejected" ? (
          <>
            <Clock3 className="mx-auto text-ucao-red" size={40} aria-hidden="true" />
            <h2 className="mt-3 text-2xl font-bold">Votre profession n&apos;a pas été validée</h2>
            {profile.verification_note && <p className="mt-2 text-ucao-muted dark:text-[#a8b8cc]">{profile.verification_note}</p>}
            <Link className="btn btn-primary mt-6" href="/verification-carte">Corriger ma profession</Link>
          </>
        ) : (
          <>
            <Clock3 className="mx-auto text-ucao-navy dark:text-white" size={40} aria-hidden="true" />
            <h2 className="mt-3 text-2xl font-bold">Votre compte est prêt</h2>
            <p className="mt-2 text-ucao-muted dark:text-[#a8b8cc]">
              {staff && profile.profession
                ? `Votre profession (« ${profile.profession} ») est en cours de vérification par un administrateur. Vous pourrez ensuite vendre sur la plateforme.`
                : "Vous pouvez déjà parcourir et acheter sur la plateforme."}
            </p>
            {!staff && (
              <Link className="btn btn-ghost mt-6" href="/verification-carte">Indiquer ma profession</Link>
            )}
          </>
        )}
        {!isAdmin && (
          <p className="mt-6 border-t border-ucao-line pt-4 text-sm text-ucao-muted dark:border-[#263d5c] dark:text-[#a8b8cc]">
            Vous devez devenir administrateur ? Communiquez cette adresse au propriétaire du site :{" "}
            <strong className="break-all text-ucao-ink dark:text-white">{profile.email}</strong>
          </p>
        )}
      </article>
    </main>
  );
}
