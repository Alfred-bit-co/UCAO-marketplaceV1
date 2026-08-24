import Link from "next/link";
import { SearchX } from "lucide-react";
import { PageShell } from "@/components/page-shell";

export default function NotFound() {
  return (
    <PageShell>
      <main className="container-ucao grid min-h-[55vh] place-items-center py-16 text-center">
        <section className="max-w-md">
          <SearchX className="mx-auto mb-5 text-ucao-red" size={48} aria-hidden="true" />
          <p className="eyebrow">Page introuvable</p>
          <h1 className="text-3xl font-bold">Cette offre n&apos;est plus disponible.</h1>
          <p className="mt-3 text-ucao-muted dark:text-[#a8b8cc]">
            Elle a peut-être été supprimée, expirée ou l&apos;adresse est incorrecte.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="btn btn-primary" href="/products">Voir les produits</Link>
            <Link className="btn btn-ghost" href="/stands">Voir les stands</Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
