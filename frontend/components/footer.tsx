import Link from "next/link";
import { Instagram, MessageCircle } from "lucide-react";
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
      <div className="container-ucao grid gap-10 sm:grid-cols-2 md:grid-cols-5">
        <div className="sm:col-span-2 md:col-span-1">
          <Brand footer />
          <p className="my-2">La marketplace universitaire de UCAO UUT.</p>
          <p className="my-2 text-sm">UCAO Marketplace est un projet étudiant indépendant, non affilié officiellement à l&apos;administration de l&apos;UCAO-UUT.</p>
          <div className="mt-4 flex gap-2">
            <a className="grid size-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20" href="https://www.instagram.com/ucaomarketplace?igsi=MTFuZnQ5Y3JyM2FhcA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram UCAO Marketplace">
              <Instagram size={16} />
            </a>
            <a className="grid size-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20" href="https://wa.me/22892982926" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp UCAO Marketplace">
              <MessageCircle size={16} />
            </a>
          </div>
        </div>
        <div>
          <h2 className="mb-3.5 text-base font-bold text-white">Navigation</h2>
          <Link className="my-2 block" href="/products">Produits</Link>
          <Link className="my-2 block" href="/stands">Stands</Link>
          <Link className="my-2 block" href="/devenir-vendeur">Devenir vendeur</Link>
          <Link className="my-2 block" href="/dashboard">Tableau de bord</Link>
        </div>
        <div>
          <h2 className="mb-3.5 text-base font-bold text-white">Informations</h2>
          <Link className="my-2 block" href="/a-propos">À propos</Link>
          <Link className="my-2 block" href="/comment-ca-marche">Comment ça marche</Link>
          <a className="my-2 block" href="mailto:ucaomarketplace2026@gmail.com">Nous contacter</a>
        </div>
        <div>
          <h2 className="mb-3.5 text-base font-bold text-white">Aide &amp; Support</h2>
          <Link className="my-2 block" href="/faq">Centre d&apos;aide</Link>
          <a className="my-2 block" href="mailto:ucaomarketplace2026@gmail.com">Support</a>
          <Link className="my-2 block" href="/faq">FAQ</Link>
        </div>
        <div>
          <h2 className="mb-3.5 text-base font-bold text-white">Légal</h2>
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
      <Link className={className} href="/mentions-legales">Mentions légales</Link>
      <Link className={className} href="/politique-confidentialite">Confidentialité</Link>
      <Link className={className} href="/politique-securite">Sécurité</Link>
      <Link className={className} href="/conditions-generales">CGU</Link>
    </nav>
  );
}