import Link from "next/link";
import { Brand } from "./navbar";

export function Footer({ full = false }: { full?: boolean }) {
  if (!full) {
    return (
      <footer className="bg-ucao-footer px-4 py-6 text-center text-white/75">
        <div className="container-ucao flex flex-col items-center justify-between gap-3 text-sm md:flex-row">
          <p>© 2026 UCAO Marketplace. Tous droits réservés.</p>
          <p>UCAO Marketplace est un projet étudiant indépendant, non affilié officiellement à l&apos;administration de l&apos;UCAO-UUT.</p>
          <LegalLinks />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-ucao-footer pt-[60px] pb-6 text-white/75">
      <div className="container-ucao grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Brand footer />
          <p className="my-2">La marketplace universitaire de UCAO UUT.</p>
          <p className="my-2 text-sm">UCAO Marketplace est un projet étudiant indépendant, non affilié officiellement à l&apos;administration de l&apos;UCAO-UUT.</p>
        </div>
        <div>
          <h2 className="mb-3.5 text-base font-bold text-white">Navigation</h2>
          <Link className="my-2 block" href="/products">
            Produits
          </Link>
          <Link className="my-2 block" href="/stands">
            Stands
          </Link>
          <Link className="my-2 block" href="/dashboard">
            Tableau de bord
          </Link>
        </div>
        <div>
          <h2 className="mb-3.5 text-base font-bold text-white">Contact</h2>
          <p className="my-2">ucaomarketplace@gmail.com</p>
          <p className="my-2">Campus UCAO UUT</p>
        </div>
        <div>
          <h2 className="mb-3.5 text-base font-bold text-white">Informations légales</h2>
          <LegalLinks stacked />
        </div>
      </div>
      <p className="mx-auto mt-10 border-t border-white/10 pt-5 text-center">
        © 2026 UCAO Marketplace. Tous droits réservés.
      </p>
    </footer>
  );
}

function LegalLinks({ stacked = false }: { stacked?: boolean }) {
  const className = stacked ? "my-2 block" : "mx-2 inline-block";

  return (
    <nav aria-label="Liens légaux" className={stacked ? "" : "flex flex-wrap justify-center gap-x-2 gap-y-1"}>
      <Link className={className} href="/mentions-legales">
        Mentions légales
      </Link>
      <Link className={className} href="/politique-confidentialite">
        Confidentialité
      </Link>
      <Link className={className} href="/politique-securite">
        Sécurité
      </Link>
    </nav>
  );
}
