import Image from "next/image";
import {
  ArrowRight,
  Basketball,
  BowlingBall,
  GameController,
  MaskHappy,
  Megaphone,
  MicrophoneStage,
  PersonArmsSpread,
  Scales,
  SoccerBall,
  Volleyball,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import { getClubFullName, getJoinLink } from "@/lib/club-catalog";
import type { ClubEntry } from "@/lib/club-catalog";

// Icône de chaque club (clé = slug du club dans lib/club-catalog.ts)
const CLUB_ICONS: Record<string, Icon> = {
  basketball: Basketball,
  theatre: MaskHappy,
  "jeux-video": GameController,
  football: SoccerBall,
  communication: Megaphone,
  juristes: Scales,
  petanque: BowlingBall,
  volley: Volleyball,
  chorale: MicrophoneStage,
  dance: PersonArmsSpread,
};

type ClubCardProps = {
  club: ClubEntry;
  /** true : la carte est à droite et le texte d'accompagnement à gauche (une ligne sur deux). */
  reverse: boolean;
  /** true pour la première carte : son image est chargée en priorité. */
  priority?: boolean;
};

export function ClubCard({ club, reverse, priority = false }: ClubCardProps) {
  const ClubIcon = CLUB_ICONS[club.slug] ?? Megaphone;
  const fullName = getClubFullName(club);
  const joinLink = getJoinLink(club);

  // Le fond s'assombrit du côté du texte pour qu'il reste lisible quelle que soit la photo.
  const overlay =
    "linear-gradient(" +
    (reverse ? "270deg" : "90deg") +
    ", rgba(7,20,38,0.95) 0%, rgba(7,20,38,0.80) 45%, rgba(7,20,38,0.10) 100%)";
  const buttonStyle = { backgroundImage: "linear-gradient(90deg, " + club.accent.buttonFrom + ", " + club.accent.buttonTo + ")" };

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
        <Image
          src={club.image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ backgroundImage: overlay }} />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#071426]/40 lg:hidden" />

        <div className="relative flex min-h-[300px] items-center p-6 sm:p-8">
          <div className={"w-full max-w-[26rem]" + (reverse ? " lg:ml-auto" : "")}>
            <div className="flex items-center gap-3">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-full text-white"
                style={{ backgroundColor: club.accent.main }}
              >
                <ClubIcon size={26} weight="bold" aria-hidden="true" />
              </span>
              <h2 className="leading-tight">
                <span className="block text-lg font-medium" style={{ color: club.accent.light }}>
                  {club.prefix}
                </span>
                <span className="block text-3xl font-bold sm:text-4xl">{club.name}</span>
              </h2>
            </div>

            <p className="mt-4 text-base font-bold italic" style={{ color: club.accent.light }}>
              {club.tagline}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-[15px]">{club.description}</p>

            <div className="mt-5">
              {joinLink ? (
                <a
                  href={joinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={"Rejoindre le " + fullName + " (ouvre WhatsApp)"}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={buttonStyle}
                >
                  Rejoindre le club <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </a>
              ) : (
                <span
                  role="note"
                  title="Le responsable du club sera bientôt joignable"
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 ring-1 ring-white/25"
                >
                  Bientôt disponible
                </span>
              )}
            </div>
          </div>
        </div>
      </article>

      <div className={"flex gap-4 lg:px-2" + (reverse ? " lg:order-1" : "")}>
        <span aria-hidden="true" className="w-1 shrink-0 self-stretch rounded-full" style={{ backgroundColor: club.accent.main }} />
        <div>
          <h3 className="text-2xl font-semibold leading-snug text-ucao-navy dark:text-white">
            <span className="block">{club.sideTitle[0]}</span>
            <span className="block">{club.sideTitle[1]}</span>
          </h3>
          <p className="mt-3 text-ucao-muted dark:text-[#a8b8cc]">{club.sideText}</p>
          <span
            aria-hidden="true"
            className="mt-5 block h-1 w-14 rounded-full"
            style={{ backgroundImage: "linear-gradient(90deg, " + club.accent.main + ", " + club.accent.light + ")" }}
          />
        </div>
      </div>
    </div>
  );
}
