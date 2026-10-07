"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadLikeInfo, rememberLikeInfo, toggleLike } from "@/lib/likes";

type LikeButtonProps = {
  productId: string;
  /** Classes supplémentaires (positionnement sur l'image de la carte, par exemple). */
  className?: string;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/**
 * Bouton "j'aime" avec compteur.
 * - Le compteur n'apparaît qu'à partir d'un like (un "0" n'est pas une bonne publicité).
 * - Un visiteur non connecté est invité à se connecter.
 * - La mise à jour est immédiate à l'écran et annulée si la base refuse.
 */
export function LikeButton({ productId, className = "" }: LikeButtonProps) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void loadLikeInfo(productId).then((info) => {
      if (!mounted.current) return;
      setCount(info.count);
      setLiked(info.liked);
    });
    return () => {
      mounted.current = false;
    };
  }, [productId]);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // La carte est souvent un lien : on empêche d'ouvrir la fiche du produit.
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;

    const wasLiked = liked;
    const previousCount = count;
    const nextLiked = !wasLiked;
    const nextCount = Math.max(previousCount + (nextLiked ? 1 : -1), 0);

    setNotice("");
    setBusy(true);
    setLiked(nextLiked);
    setCount(nextCount);

    const result = await toggleLike(productId, wasLiked);
    if (!mounted.current) return;
    setBusy(false);

    if (result.ok) {
      rememberLikeInfo(productId, { count: nextCount, liked: nextLiked });
      return;
    }

    // Échec : on revient à l'état précédent.
    setLiked(wasLiked);
    setCount(previousCount);

    if (result.reason === "login") {
      router.push("/login");
    } else if (result.reason === "own") {
      setNotice("Vous ne pouvez pas aimer vos propres produits.");
    } else {
      setNotice("Impossible de mettre à jour votre j'aime. Réessayez.");
    }
  }

  const label = liked ? "Retirer ce produit de mes j'aime" : "Aimer ce produit";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={count > 0 ? `${label} (${count} j'aime)` : label}
      title={notice || label}
      className={`inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full bg-white/95 px-2.5 text-sm font-semibold shadow-md backdrop-blur transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ucao-navy ${
        liked ? "text-ucao-red" : "text-ucao-navy"
      } ${busy ? "opacity-70" : ""} ${className}`}
    >
      <HeartIcon filled={liked} />
      {count > 0 && <span className="tabular-nums">{count}</span>}
      <span className="sr-only" role="status" aria-live="polite">
        {notice}
      </span>
    </button>
  );
}