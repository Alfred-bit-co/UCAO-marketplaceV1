"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3 } from "@/lib/icons";
import { PageSkeleton } from "@/components/skeletons";
import { amIAdmin } from "@/lib/admin-team";
import { createClient } from "@/lib/supabase";

type Status = { loading: true } | { loading: false; email: string | null; isAdmin: boolean };

/** Page affichée après la confirmation de l'e-mail : l'accès est ouvert, ou en attente de nomination. */
export function AdminAccountStatus() {
  const [status, setStatus] = useState<Status>({ loading: true });

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
      const email = data.user?.email ?? null;
      setStatus({ loading: false, email, isAdmin: email ? await amIAdmin() : false });
    })();
  }, []);

  if (status.loading) return <PageSkeleton />;

  if (!status.email) {
    return (
      <main className="container-ucao py-24 text-center">
        <p className="mb-4 text-xl font-medium">Connectez-vous pour voir l&apos;état de votre accès.</p>
        <Link className="btn btn-primary" href="/login?next=%2Fadmin">Se connecter</Link>
      </main>
    );
  }

  return (
    <main className="container-ucao py-16">
      <article className="panel mx-auto max-w-xl p-6 text-center sm:p-8">
        {status.isAdmin ? (
          <>
            <CheckCircle2 className="mx-auto text-ucao-success" size={40} aria-hidden="true" />
            <h1 className="mt-3 text-2xl font-bold">Votre accès est ouvert</h1>
            <p className="mt-2 text-ucao-muted dark:text-[#a8b8cc]">Vous êtes administrateur de la plateforme.</p>
            <Link className="btn btn-primary mt-6" href="/admin">Ouvrir le centre de pilotage</Link>
          </>
        ) : (
          <>
            <Clock3 className="mx-auto text-ucao-navy dark:text-white" size={40} aria-hidden="true" />
            <h1 className="mt-3 text-2xl font-bold">Votre compte est prêt</h1>
            <p className="mt-2 text-ucao-muted dark:text-[#a8b8cc]">
              Communiquez cette adresse au propriétaire du site pour qu&apos;il vous nomme administrateur :
            </p>
            <p className="mt-3 break-all rounded-ucao bg-ucao-soft p-3 font-semibold dark:bg-[#132238]">{status.email}</p>
            <p className="mt-3 text-sm text-ucao-muted dark:text-[#a8b8cc]">Une fois nommé, rechargez cette page pour accéder à l&apos;administration.</p>
          </>
        )}
      </article>
    </main>
  );
}
