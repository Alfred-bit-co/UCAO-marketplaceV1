import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "@/lib/icons";
import { CLUBS } from "@/lib/club-catalog";
import { IMAGE_ASSETS } from "@/lib/constants";
import { getStandCategoryLabel } from "@/lib/stand-catalog";
import type { Stand } from "@/lib/types";
import { StandsCta } from "./stands-cta";

function formatOpening(date?: string): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const SAFETY_TIPS = [
  "Rencontre-toi sur le campus, dans un lieu fréquenté.",
  "Ne paie jamais à l'avance sans avoir vu le produit ou le service.",
  "Vérifie le stand et le vendeur avant de t'engager.",
];

/** Colonne de droite de la page Stands. Tout ce qui s'y affiche vient de données réelles ou de textes fixes. */
export function StandsAside({ latest }: { latest: Stand[] }) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Informations complémentaires">
      <StandsCta />

      {latest.length > 0 && (
        <section className="panel p-5">
          <h2 className="text-lg font-bold">Nouveaux stands</h2>
          <ul className="mt-4 space-y-4">
            {latest.map((stand) => {
              const opening = formatOpening(stand.created_at);
              return (
                <li key={stand.id}>
                  <Link
                    href={"/stands/" + stand.id}
                    className="group flex items-center gap-3 rounded-ucao focus:outline-none focus-visible:ring-2 focus-visible:ring-ucao-red"
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-ucao bg-ucao-soft dark:bg-[#1b2d47]">
                      <Image
                        src={stand.logo_url || stand.banner_url || IMAGE_ASSETS.standFallback}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold group-hover:text-ucao-red">{stand.name}</span>
                      <span className="block truncate text-sm text-ucao-muted dark:text-[#a8b8cc]">
                        {getStandCategoryLabel(stand.category)}
                      </span>
                      {opening && <span className="block text-xs text-ucao-muted dark:text-[#a8b8cc]">{"Ouvert le " + opening}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="relative overflow-hidden rounded-ucao bg-ucao-navy p-5 text-white shadow-ucao">
        <Image src="/images/hero-clubs.jpg" alt="" fill sizes="320px" className="object-cover opacity-40" />
        <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,20,38,.92),rgba(18,36,78,.75)_60%,rgba(122,30,45,.55))]" />
        <div className="relative">
          <h2 className="text-xl font-bold">Rejoins un club du campus</h2>
          <p className="mt-1 text-sm text-white/85">{"Sport, culture, tech… " + CLUBS.length + " clubs t'attendent à l'UCAO."}</p>
          <Link
            href="/clubs"
            className="mt-4 inline-flex items-center gap-2 rounded-ucao border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20"
          >
            Découvrir les clubs <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-ucao-success-soft text-ucao-success">
            <ShieldCheck size={20} />
          </span>
          <h2 className="text-lg font-bold">Acheter en sécurité</h2>
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {SAFETY_TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ucao-success" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <Link href="/politique-securite" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ucao-red hover:underline">
          Lire nos conseils de sécurité <ArrowRight size={14} />
        </Link>
      </section>
    </aside>
  );
}
