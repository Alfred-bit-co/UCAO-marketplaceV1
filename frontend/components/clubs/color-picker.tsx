"use client";

import { Check } from "@/lib/icons";
import { CLUB_COLORS, normalizeHex, readableTextColor } from "@/lib/club-colors";
import type { Club } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Grille des 20 couleurs de la palette. Les couleurs déjà prises par un autre club sont
 * grisées et indiquent, au survol ou à l'appui, le nom du club qui les utilise.
 */
type ColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;
  clubs: Club[];
  /** Club en cours de modification : sa propre couleur reste disponible. */
  currentClubId?: string | null;
  disabled?: boolean;
};

export function ColorPicker({ value, onChange, clubs, currentClubId = null, disabled = false }: ColorPickerProps) {
  const takenBy = new Map<string, string>();
  for (const club of clubs) {
    if (club.id === currentClubId || club.deleted_at) continue;
    takenBy.set(normalizeHex(club.color), club.name);
  }
  const selected = normalizeHex(value);

  return (
    <div role="radiogroup" aria-label="Couleur du club" className="grid grid-cols-5 gap-2 sm:grid-cols-10">
      {CLUB_COLORS.map((color) => {
        const hex = normalizeHex(color.hex);
        const owner = takenBy.get(hex);
        const isSelected = selected === hex;
        const title = owner ? `${color.label} — utilisée par ${owner}` : color.label;
        return (
          <button
            key={hex}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={title}
            title={title}
            disabled={disabled || Boolean(owner)}
            onClick={() => onChange(hex)}
            className={cn(
              "relative grid aspect-square place-items-center rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ucao-navy dark:focus-visible:outline-white",
              owner ? "cursor-not-allowed opacity-30 saturate-50" : "hover:scale-105",
              isSelected && "ring-2 ring-ucao-navy ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-[#10233b]",
            )}
            style={{ backgroundColor: hex, color: readableTextColor(hex) }}
          >
            {isSelected && <Check size={16} aria-hidden="true" />}
            {owner && <span aria-hidden="true" className="absolute inset-x-1 bottom-1 truncate rounded bg-black/55 px-1 text-[9px] font-semibold text-white">{owner}</span>}
          </button>
        );
      })}
    </div>
  );
}
