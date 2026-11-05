"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

/**
 * Bouton officiel « Se connecter avec Google » (Google Identity Services).
 *
 * Google parle directement au site : l'écran de connexion affiche le domaine du site
 * et non plus l'adresse Supabase. Le composant ne fait QUE la partie Google :
 * il renvoie le jeton d'identité (credential) et le nonce brut à `onCredential`,
 * qui se charge de la connexion Supabase (signInWithIdToken).
 *
 * Nonce : un nonce aléatoire est généré à chaque initialisation. Google reçoit son
 * hachage SHA-256 (hexadécimal) et l'inscrit dans le jeton ; Supabase reçoit le nonce
 * brut, le hache et compare. Changer `resetKey` régénère un nonce (un par essai).
 */

type GoogleCredentialResponse = { credential?: string };

type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            nonce?: string;
            context?: "signin" | "signup" | "use";
            ux_mode?: "popup" | "redirect";
            use_fedcm_for_prompt?: boolean;
            itp_support?: boolean;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
// Google n'accepte pas de bouton plus large que 400 px.
const MAX_BUTTON_WIDTH = 400;

function createRawNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

type GoogleSignInButtonProps = {
  /** Reçoit le jeton Google et le nonce BRUT, à transmettre tels quels à Supabase. */
  onCredential: (credential: string, rawNonce: string) => void;
  /** Appelé si Google ne renvoie pas de jeton. */
  onError: () => void;
  /** Faux tant que le jeton Turnstile manque ou qu'une connexion est en cours. */
  ready: boolean;
  /** Message affiché à la place du bouton quand `ready` est faux. */
  notReadyMessage: string;
  /** Changez cette valeur après chaque essai : nouveau nonce, bouton réinitialisé. */
  resetKey: number;
  mode: "login" | "register";
};

export function GoogleSignInButton({ onCredential, onError, ready, notReadyMessage, resetKey, mode }: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacksRef = useRef({ onCredential, onError });
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    callbacksRef.current = { onCredential, onError };
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId || !scriptReady || !ready || !containerRef.current || !window.google) return;
    let cancelled = false;
    const container = containerRef.current;

    (async () => {
      const rawNonce = createRawNonce();
      const hashedNonce = await sha256Hex(rawNonce);
      if (cancelled || !window.google) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashedNonce,
        context: mode === "register" ? "signup" : "signin",
        ux_mode: "popup",
        use_fedcm_for_prompt: true,
        itp_support: true,
        callback: (response) => {
          if (response.credential) callbacksRef.current.onCredential(response.credential, rawNonce);
          else callbacksRef.current.onError();
        },
      });

      container.replaceChildren();
      const isDark = document.documentElement.classList.contains("dark");
      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: isDark ? "filled_black" : "outline",
        size: "large",
        text: mode === "register" ? "signup_with" : "continue_with",
        shape: "rectangular",
        logo_alignment: "center",
        width: Math.min(Math.max(container.clientWidth, 200), MAX_BUTTON_WIDTH),
        locale: "fr",
      });
    })();

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [clientId, scriptReady, ready, resetKey, mode]);

  if (!clientId) {
    return <p className="notice text-center text-sm">La connexion avec Google n&apos;est pas disponible pour le moment.</p>;
  }

  return (
    <>
      <Script
        src={GIS_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setScriptFailed(true)}
      />
      {scriptFailed ? (
        <p className="notice notice-error text-center text-sm" role="alert">
          Le bouton Google n&apos;a pas pu se charger. Vérifiez votre connexion ou désactivez votre bloqueur de publicité, puis rechargez la page.
        </p>
      ) : ready ? (
        // min-h évite que le formulaire « saute » pendant le chargement du bouton Google.
        <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />
      ) : (
        <p className="notice text-center text-sm" aria-live="polite">{notReadyMessage}</p>
      )}
    </>
  );
}
