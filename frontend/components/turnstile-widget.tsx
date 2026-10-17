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
 * - En cas d'échec, le code d'erreur Cloudflare et l'adresse du site sont affichés à
 *   l'écran : c'est ce qui permet de diagnostiquer sans ouvrir la console du navigateur.
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

/** Explication en français pour les codes d'erreur les plus fréquents (indicative). */
function hintFor(code: string | null): string {
  if (!code) return "";
  if (code === "script") return "Le script de Cloudflare n'a pas pu être chargé : bloqueur de publicité, réseau filtré ou connexion coupée.";
  if (code === "render") return "Le widget n'a pas pu démarrer : la clé de site est probablement invalide.";
  if (code.startsWith("110200")) return "Cette adresse n'est probablement pas autorisée : ajoutez-la dans les Hostnames du widget Cloudflare, puis enregistrez.";
  if (code.startsWith("110100") || code.startsWith("110110")) return "La clé de site est probablement invalide ou mal copiée.";
  if (code.startsWith("200100")) return "L'horloge de l'ordinateur est probablement décalée : synchronisez l'heure de Windows.";
  return "Notez ce code et envoyez-le au développeur.";
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
  const [errorCode, setErrorCode] = useState<string | null>(null);

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
        setErrorCode(null);
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme: "auto",
            language: "fr",
            callback: (token: string) => {
              setFailed(false);
              setErrorCode(null);
              onTokenRef.current(token);
            },
            "expired-callback": () => onTokenRef.current(null),
            "error-callback": (code?: string | number) => {
              console.error("TURNSTILE ERROR:", code, "adresse :", window.location.hostname);
              onTokenRef.current(null);
              setErrorCode(code === undefined ? null : String(code));
              setFailed(true);
            },
          });
        } catch (error) {
          console.error("TURNSTILE RENDER ERROR:", error);
          onTokenRef.current(null);
          setErrorCode("render");
          setFailed(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        onTokenRef.current(null);
        setErrorCode("script");
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
        <div className="mt-2 text-sm text-ucao-red" role="alert">
          <p>La vérification anti-robot n&apos;a pas pu se charger. Rechargez la page ou vérifiez votre connexion.</p>
          <p className="mt-1 text-xs opacity-90">
            Code : <strong>{errorCode ?? "inconnu"}</strong> · Adresse : <strong>{typeof window !== "undefined" ? window.location.hostname : ""}</strong>
          </p>
          {hintFor(errorCode) && <p className="mt-1 text-xs opacity-90">{hintFor(errorCode)}</p>}
        </div>
      )}
    </div>
  );
}
