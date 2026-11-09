"use client";

import { useState } from "react";
import { Check, Share2 } from "@/lib/icons";
import { whatsappShareUrl } from "@/lib/share";

type ShareButtonProps = {
  title: string;
  text: string;
  url: string;
  className?: string;
  /** Icône seule (liste du tableau de bord) ; le texte reste lu par les lecteurs d'écran. */
  iconOnly?: boolean;
};

/**
 * Bouton « Partager » (réservé au vendeur, dans son tableau de bord) :
 * - téléphone (et navigateurs compatibles) : menu de partage du système (WhatsApp, Instagram, SMS…) ;
 * - sinon : WhatsApp s'ouvre avec le texte et le lien prêts, on choisit le contact.
 */
export function ShareButton({ title, text, url, className = "btn btn-ghost", iconOnly = false }: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        setShared(true);
        window.setTimeout(() => setShared(false), 2500);
      } catch {
        // Partage annulé par l'utilisateur : rien à faire.
      }
      return;
    }
    window.open(whatsappShareUrl(text, url), "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleShare}
      aria-label={iconOnly ? `${shared ? "Partagé" : "Partager"} ${title}` : undefined}
      title={iconOnly ? "Partager ce produit" : undefined}
    >
      {shared ? <Check size={iconOnly ? 15 : 18} aria-hidden="true" /> : <Share2 size={iconOnly ? 15 : 18} aria-hidden="true" />}
      {!iconOnly && (shared ? "Partagé" : "Partager")}
    </button>
  );
}
