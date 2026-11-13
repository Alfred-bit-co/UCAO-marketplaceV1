import Image from "next/image";
import { ArrowRight, ExternalLink } from "@/lib/icons";
import { getClubJoinLink } from "@/lib/club-schedule";
import { readableTextColor } from "@/lib/club-colors";
import type { Club } from "@/lib/types";

type ClubCardProps = {
  club: Club;
  /** true : la carte est à droite et le texte d'accompagnement à gauche (une ligne sur deux : zigzag). */
  reverse: boolean;
  /** true pour la première carte : son image est chargée en priorité. */
  priority?: boolean;
};

/**
 * Carte d'un club sur la page publique : photo avec le nom et le bouton « Rejoindre le club »
 * d'un côté, description de l'autre. Les lignes alternent pour former un zigzag.
 */
export function ClubCard({ club, reverse, priority = false }: ClubCardProps) {
  const joinLink = getClubJoinLink(club);
  const textOnColor = readableTextColor(club.color);
  // Le fond s'assombrit du côté du texte pour qu'il reste lisible quelle que soit la photo.
  const overlay =
    "linear-gradient(" +
    (reverse ? "270deg" : "90deg") +
    ", rgba(7,20,38,0.95) 0%, rgba(7,20,38,0.80) 45%, rgba(7,20,38,0.10) 100%)";

  return (
    <div
      className={
        "grid items-center gap-6 lg:gap-10 " +
        (reverse ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]" : "lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]")
      }
    >
      <article
        className={
          "relative isolate min-h-[300px] overflow-hidden rounded-ucao bg-[#071426] text-white shadow-ucao" +
          (reverse ? " lg:order-2" : "")
        }
      >
        {club.banner_url ? (
          <Image src={club.banner_url} alt="" fill priority={priority} sizes="(min-width: 1024px) 60vw, 100vw" className="-z-20 object-cover" />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 -z-20" style={{ backgroundImage: `linear-gradient(135deg, ${club.color}, #071426)` }} />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ backgroundImage: overlay }} />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#071426]/40 lg:hidden" />
        {/* Liseré de la couleur du club : le lien avec le calendrier de la semaine. */}
        <span aria-hidden="true" className={"absolute inset-y-0 w-1.5 " + (reverse ? "right-0" : "left-0")} style={{ backgroundColor: club.color }} />

        <div className={"relative flex min-h-[300px] items-center p-6 sm:p-8" + (reverse ? " justify-end" : "")}>
          <div className="w-full max-w-[26rem]">
            <div className="flex items-center gap-3">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-full text-base font-bold"
                style={{ backgroundColor: club.color, color: textOnColor }}
                aria-hidden="true"
              >
                {club.name.trim().charAt(0).toLocaleUpperCase("fr")}
              </span>
              <h2 className="leading-tight">
                <span className="block text-sm font-semibold uppercase tracking-[0.14em] text-white/70">Club</span>
                <span className="block text-3xl font-bold sm:text-4xl">{club.name}</span>
              </h2>
            </div>

            {/* Sur téléphone, pas de colonne de côté : la description reste dans la carte. */}
            {club.short_description && <p className="mt-4 text-sm leading-relaxed text-white/90 lg:hidden">{club.short_description}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {joinLink ? (
                <a
                  href={joinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={"Rejoindre le club " + club.name + " (ouvre WhatsApp)"}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={{ backgroundColor: club.color, color: textOnColor }}
                >
                  Rejoindre le club <ArrowRight size={16} aria-hidden="true" />
                </a>
              ) : (
                <span
                  role="note"
                  title="Le responsable du club sera bientôt joignable"
                  className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 ring-1 ring-white/25"
                >
                  Contact bientôt disponible
                </span>
              )}
              {club.external_url && (
                <a
                  href={club.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-white/85 underline-offset-4 hover:underline"
                >
                  En savoir plus <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>
      </article>

      <div className={"hidden gap-4 lg:flex lg:px-2" + (reverse ? " lg:order-1" : "")}>
        <span aria-hidden="true" className="w-1 shrink-0 self-stretch rounded-full" style={{ backgroundColor: club.color }} />
        <div>
          <h3 className="text-2xl font-semibold leading-snug text-ucao-navy dark:text-white">Club {club.name}</h3>
          {club.short_description && <p className="mt-3 text-ucao-muted dark:text-[#a8b8cc]">{club.short_description}</p>}
          <span
            aria-hidden="true"
            className="mt-5 block h-1 w-14 rounded-full"
            style={{ backgroundImage: `linear-gradient(90deg, ${club.color}, ${club.color}66)` }}
          />
        </div>
      </div>
    </div>
  );
}
