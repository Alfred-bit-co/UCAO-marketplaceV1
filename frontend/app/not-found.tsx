import Link from "next/link";
import { SearchX } from "@/lib/icons";
import { PageShell } from "@/components/page-shell";

export default function NotFound() {
  return (
    <PageShell>
      <main className="container-ucao grid min-h-[55vh] place-items-center py-16 text-center">
        <section className="max-w-md">
          <SearchX className="mx-auto mb-5 text-ucao-red" size={48} aria-hidden="true" />
          <p className="eyebrow">Page introuvable</p>
          <h1 className="text-3xl font-bold">La page demandée est introuvable.</h1>
          <p className="mt-3 text-ucao-muted dark:text-[#a8b8cc]">
            Vérifiez l&apos;adresse ou revenez à l&apos;accueil pour continuer votre navigation.
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
