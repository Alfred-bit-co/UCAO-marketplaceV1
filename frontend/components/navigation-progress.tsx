"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "loading" | "done";

/**
 * Fine barre de progression en haut de l'écran pendant un changement de page.
 * Démarre au clic sur un lien interne, se termine quand la nouvelle URL est affichée.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const safetyTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  // Nouvelle URL affichée : on termine la barre.
  useEffect(() => {
    setPhase((current) => (current === "loading" ? "done" : current));
  }, [pathname, searchParams]);

  useEffect(() => {
    if (phase !== "done") return;
    hideTimer.current = window.setTimeout(() => setPhase("idle"), 380);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [phase]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Même page (ancre ou lien vers la page courante) : rien à charger.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      setPhase("loading");
      if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
      // Filet de sécurité : la barre ne reste jamais bloquée.
      safetyTimer.current = window.setTimeout(() => setPhase("done"), 12000);
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    };
  }, []);

  if (phase === "idle") return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div className={`nav-progress h-full ${phase === "done" ? "nav-progress-done" : "nav-progress-loading"}`} />
    </div>
  );
}
