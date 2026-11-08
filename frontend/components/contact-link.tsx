"use client";

import type { ReactNode } from "react";
import { recordContactClick } from "@/lib/contacts";

type ContactLinkProps = {
  productId: string;
  href: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

/** Lien WhatsApp vers le vendeur qui compte le contact au passage (pour son tableau de bord). */
export function ContactLink({ productId, href, className, ariaLabel, children }: ContactLinkProps) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={() => recordContactClick(productId)}
    >
      {children}
    </a>
  );
}
