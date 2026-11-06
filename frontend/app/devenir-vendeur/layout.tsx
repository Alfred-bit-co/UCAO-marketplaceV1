import type { Metadata } from "next";

// La page est un composant client (« use client ») et ne peut pas exporter de metadata :
// on déclare ici son adresse canonique. Ce layout n'ajoute aucun élément visuel.
export const metadata: Metadata = {
  alternates: { canonical: "/devenir-vendeur" },
};

export default function DevenirVendeurLayout({ children }: { children: React.ReactNode }) {
  return children;
}
