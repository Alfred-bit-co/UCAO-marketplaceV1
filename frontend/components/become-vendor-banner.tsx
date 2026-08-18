import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

export function BecomeVendorBanner() {
  return (
    <section className="container-ucao pb-[64px]">
      <div className="flex flex-col items-center gap-5 rounded-ucao bg-ucao-navy p-8 text-white sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/15">
            <Store size={26} />
          </span>
          <div>
            <p className="text-xl font-bold">Prêt à rejoindre le marketplace ?</p>
            <p className="text-white/80">
              Crée ton stand, ajoute tes produits et commence à vendre à toute la communauté étudiante.
            </p>
          </div>
        </div>
        <Link className="btn btn-light shrink-0" href="/devenir-vendeur">
          Devenir vendeur maintenant <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}