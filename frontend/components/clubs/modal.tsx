"use client";

import { useEffect, useId, type ReactNode } from "react";
import { X } from "@/lib/icons";

/**
 * Fenêtre modale : panneau qui monte du bas sur téléphone, fenêtre centrée sur ordinateur.
 * Fermeture par la croix, la touche Échap ou un clic sur le fond.
 */
type ModalProps = {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  /** Empêche la fermeture pendant un enregistrement. */
  locked?: boolean;
};

export function Modal({ title, eyebrow, onClose, children, locked = false }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !locked) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, locked]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-[#071426]/65" aria-label="Fermer" onClick={() => !locked && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="panel relative max-h-[92dvh] w-full overflow-y-auto rounded-b-none p-5 shadow-2xl sm:max-w-lg sm:rounded-ucao sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 id={titleId} className="text-xl font-bold sm:text-2xl">{title}</h2>
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ucao-muted transition hover:bg-ucao-soft dark:hover:bg-[#1b2d47]"
            onClick={onClose}
            disabled={locked}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
