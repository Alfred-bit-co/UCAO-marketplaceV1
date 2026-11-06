import { PageShell } from "@/components/page-shell";
import { StandDetailSkeleton } from "@/components/skeletons";

// Même forme que la page d'un stand : bannière, nom, modes et boutons de contact.
// Aucune grille de produits ni prix (un stand n'affiche jamais les produits du vendeur).
export default function StandLoading() {
  return (
    <PageShell>
      <main>
        <StandDetailSkeleton />
      </main>
    </PageShell>
  );
}
