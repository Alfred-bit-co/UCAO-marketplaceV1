import Link from "next/link";
import { Brand } from "./navbar";

export function Footer({ full = false }: { full?: boolean }) {
  if (!full) {
    return (
      <footer className="bg-ucao-footer px-4 py-6 text-center text-white/75">
        <p>© 2026 UCAO UUT Marketplace. Tous droits réservés.</p>
      </footer>
    );
  }

  return (
    <footer className="bg-ucao-footer pt-[60px] pb-6 text-white/75">
      <div className="container-ucao grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Brand footer />
          <p className="my-2">La marketplace universitaire de UCAO UUT.</p>
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
          <p className="my-2">marketplace@ucao-uut.edu</p>
          <p className="my-2">Campus UCAO UUT</p>
        </div>
      </div>
      <p className="mx-auto mt-10 border-t border-white/10 pt-5 text-center">
        © 2026 UCAO UUT Marketplace. Tous droits réservés.
      </p>
    </footer>
  );
}
