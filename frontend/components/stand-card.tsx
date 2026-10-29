import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import { IMAGE_ASSETS } from "@/lib/constants";
import { getContactModeLabel, getStandCategoryLabel } from "@/lib/stand-catalog";
import type { Stand } from "@/lib/types";
import { RoleBadge } from "./role-badge";
import { StandCategoryIcon } from "./stand-category-icon";

const MAX_MODES = 3;

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "S";
}

/** Carte d'un stand : couverture, logo rond, catégorie, modes proposés. Aucun produit, aucune note, aucun compteur. */
export function StandCard({ stand }: { stand: Stand }) {
  const category = stand.category ?? "autres";
  const modes = stand.contact_modes ?? [];
  const shownModes = modes.slice(0, MAX_MODES);
  const hiddenModes = modes.length - shownModes.length;

  return (
    <Link
      href={"/stands/" + stand.id}
      className="group flex h-full flex-col overflow-hidden rounded-ucao border border-ucao-line bg-white shadow-ucao transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ucao-red dark:border-[#2a3a52] dark:bg-[#132238]"
    >
      <span className="relative block h-40 shrink-0 overflow-hidden bg-ucao-navy">
        <Image
          src={stand.banner_url || IMAGE_ASSETS.standFallback}
          alt=""
          fill
          sizes="(min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ucao-navy shadow-sm">
          <StandCategoryIcon category={category} size={14} />
          {getStandCategoryLabel(category)}
        </span>
      </span>

      <span className="relative flex flex-1 flex-col gap-3 p-5 pt-10">
        <span className="absolute -top-8 left-5 grid size-16 place-items-center overflow-hidden rounded-full border-4 border-white bg-ucao-soft text-lg font-bold text-ucao-navy shadow-md dark:border-[#132238] dark:bg-[#1b2d47] dark:text-white">
          {stand.logo_url ? (
            <Image src={stand.logo_url} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            initials(stand.name)
          )}
        </span>

        <span className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold leading-tight">{stand.name}</span>
          <RoleBadge tier={stand.seller_tier} />
        </span>

        <span className="line-clamp-2 text-sm text-ucao-muted dark:text-[#a8b8cc]">{stand.description}</span>

        {shownModes.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {shownModes.map((mode) => (
              <span
                key={mode}
                className="rounded-full bg-ucao-soft px-2.5 py-1 text-xs font-medium text-ucao-navy dark:bg-[#1b2d47] dark:text-white"
              >
                {getContactModeLabel(mode)}
              </span>
            ))}
            {hiddenModes > 0 && (
              <span className="rounded-full bg-ucao-soft px-2.5 py-1 text-xs font-medium text-ucao-muted dark:bg-[#1b2d47] dark:text-[#a8b8cc]">
                {"+" + hiddenModes}
              </span>
            )}
          </span>
        )}

        <span className="btn btn-primary mt-auto w-full justify-center">
          Voir le stand <ArrowRight size={16} />
        </span>
      </span>
    </Link>
  );
}
