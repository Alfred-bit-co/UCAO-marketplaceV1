"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Clock3, Lock } from "@/lib/icons";

/**
 * Bandeau d'alerte avant l'expiration de l'abonnement d'un vendeur.
 *
 * Paliers décidés pour le projet :
 *   - de 7 jours à 3 jours avant l'expiration  -> "info"
 *   - de 3 jours à 30 minutes avant            -> "warning"
 *   - les 30 dernières minutes (compte à rebours en direct) -> "critical"
 *   - après l'expiration                        -> "expired"
 *
 * Chaque message rappelle les conséquences : produits et stand masqués au public.
 * Le calcul se base sur Date.now() : la base de données reste la référence réelle
 * (la policy RLS masque les contenus à la seconde où l'abonnement expire).
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const INFO_MS = 7 * DAY;
const WARNING_MS = 3 * DAY;
const CRITICAL_MS = 30 * MINUTE;

type AlertLevel = "none" | "info" | "warning" | "critical" | "expired";

type SubscriptionAlertProps = {
  /** Date d'expiration de l'abonnement (ISO string ou Date), null si inconnue. */
  expiresAt: string | Date | null;
  /** Vrai quand l'abonnement est déjà considéré comme expiré/bloqué côté serveur. */
  isBlocked: boolean;
  /** Appelé une seule fois quand le compte à rebours atteint zéro (pour recharger le statut). */
  onExpired?: () => void;
};

function getLevel(msLeft: number | null, isBlocked: boolean): AlertLevel {
  if (isBlocked || (msLeft !== null && msLeft <= 0)) return "expired";
  if (msLeft === null) return "none";
  if (msLeft <= CRITICAL_MS) return "critical";
  if (msLeft <= WARNING_MS) return "warning";
  if (msLeft <= INFO_MS) return "info";
  return "none";
}

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

/** "6 jours et 5 heures", "2 heures et 10 minutes", "42 minutes" */
function formatRemaining(ms: number) {
  const totalMinutes = Math.max(Math.ceil(ms / MINUTE), 1);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${plural(days, "jour")} et ${plural(hours, "heure")}` : plural(days, "jour");
  }
  if (hours > 0) {
    return minutes > 0 ? `${plural(hours, "heure")} et ${plural(minutes, "minute")}` : plural(hours, "heure");
  }
  return plural(minutes, "minute");
}

/** "07:42" */
function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.ceil(ms / SECOND), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const STYLES: Record<Exclude<AlertLevel, "none">, string> = {
  info: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
  warning: "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-100",
  critical: "border-red-300 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-100",
  expired: "border-transparent bg-[#ffe8e8] text-ucao-red dark:bg-[#3a1a1c]",
};

export function SubscriptionAlert({ expiresAt, isBlocked, onExpired }: SubscriptionAlertProps) {
  const parsed = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
  const expiresAtMs = Number.isNaN(parsed) ? null : parsed;

  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);
  const onExpiredRef = useRef(onExpired);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  const msLeft = expiresAtMs === null ? null : expiresAtMs - now;
  const level = getLevel(msLeft, isBlocked);

  // Une mise à jour par seconde seulement quand on approche des 30 dernières minutes,
  // sinon toutes les 30 secondes : suffisant pour les paliers de 7 jours et 3 jours.
  const nearCritical = msLeft !== null && msLeft > 0 && msLeft <= CRITICAL_MS + MINUTE;
  const tickMs = nearCritical ? SECOND : 30 * SECOND;

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs, expiresAtMs]);

  // Les navigateurs ralentissent les minuteurs des onglets en arrière-plan :
  // on resynchronise l'horloge dès que l'onglet redevient visible.
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // Après un renouvellement, la date change : on réarme la notification d'expiration.
  useEffect(() => {
    firedRef.current = false;
  }, [expiresAtMs]);

  // Quand le compte à rebours atteint zéro, on prévient la page (une seule fois)
  // pour qu'elle recharge le statut de l'abonnement.
  useEffect(() => {
    if (msLeft !== null && msLeft <= 0 && !isBlocked && !firedRef.current) {
      firedRef.current = true;
      onExpiredRef.current?.();
    }
  }, [msLeft, isBlocked]);

  if (level === "none") return null;

  const remaining = msLeft !== null && msLeft > 0 ? formatRemaining(msLeft) : "";
  const expiryLabel =
    expiresAtMs !== null
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(expiresAtMs))
      : "";

  let title = "";
  let body: ReactNode = null;
  let icon: ReactNode = null;

  if (level === "info") {
    title = "Votre abonnement arrive à échéance";
    body = `Votre abonnement expire dans ${remaining} (le ${expiryLabel}). À l'expiration, vos produits et votre stand seront masqués au public.`;
    icon = <Clock3 size={18} className="shrink-0" />;
  } else if (level === "warning") {
    title = "Votre abonnement expire bientôt";
    body = `Votre abonnement expire dans ${remaining}. Sans renouvellement, vos produits et votre stand disparaîtront du catalogue et vos clients ne pourront plus les voir.`;
    icon = <Clock3 size={18} className="shrink-0" />;
  } else if (level === "critical") {
    title = "Dernières minutes avant l'expiration";
    body = (
      <>
        <span aria-hidden="true">
          Votre abonnement expire dans <strong className="tabular-nums">{formatCountdown(msLeft ?? 0)}</strong>.{" "}
        </span>
        <span className="sr-only">Votre abonnement expire dans moins de 30 minutes. </span>
        Renouvelez maintenant pour que vos produits restent visibles.
      </>
    );
    icon = <AlertTriangle size={18} className="shrink-0 motion-safe:animate-pulse" />;
  } else {
    title = "Votre abonnement a expiré.";
    body = "Vos produits et votre stand sont masqués publiquement. Renouvelez votre abonnement pour les rendre de nouveau visibles.";
    icon = <Lock size={18} className="shrink-0" />;
  }

  return (
    <section className="container-ucao mt-5">
      <div
        role={level === "critical" || level === "expired" ? "alert" : "status"}
        className={`flex flex-wrap items-center gap-3 rounded-ucao border px-4 py-3 text-sm ${STYLES[level]}`}
      >
        {icon}
        <div className="min-w-0 flex-1">
          <p className="font-bold">{title}</p>
          <p className="mt-0.5 font-normal opacity-90">{body}</p>
        </div>
        <a className="btn btn-primary ml-auto min-h-9 px-3 text-xs" href="/devenir-vendeur">
          Renouveler
        </a>
      </div>
    </section>
  );
}