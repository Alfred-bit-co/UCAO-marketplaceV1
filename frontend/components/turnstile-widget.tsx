"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Widget Cloudflare Turnstile (anti-robot) à brancher sur les formulaires.
 *
 * - Si NEXT_PUBLIC_TURNSTILE_SITE_KEY n'est pas défini, le composant n'affiche rien
 *   (le site fonctionne comme avant : pratique en développement).
 * - `onToken` reçoit le jeton quand la vérification réussit, ou null quand il expire /
 *   échoue. Un jeton ne sert qu'UNE fois : après chaque envoi de formulaire, changez
 *   `resetKey` pour obtenir un nouveau jeton.
 * - La vérification du jeton est faite par Supabase Auth (option « CAPTCHA protection »
 *   du tableau de bord) : on lui transmet le jeton via `options.captchaToken`.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Turnstile : pas de navigateur"));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile : script indisponible"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type TurnstileWidgetProps = {
  onToken: (token: string | null) => void;
  /** Changez cette valeur pour redemander un jeton (après chaque envoi de formulaire). */
  resetKey?: number;
  /** Nom de l'action, visible dans les statistiques Cloudflare (ex. "login"). */
  action?: string;
  className?: string;
};

export function TurnstileWidget({ onToken, resetKey = 0, action, className }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        setFailed(false);
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: "auto",
          language: "fr",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            onTokenRef.current(null);
            setFailed(true);
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        onTokenRef.current(null);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [siteKey, action]);

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current(null);
    }
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <div className={className}>
      <div ref={containerRef} />
      {failed && (
        <p className="mt-2 text-sm text-ucao-red" role="alert">
          La vérification anti-robot n&apos;a pas pu se charger. Rechargez la page ou vérifiez votre connexion.
        </p>
      )}
    </div>
  );
}
