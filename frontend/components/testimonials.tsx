"use client";
import { MessageSquareQuote, Send, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteReview, getApprovedReviews, getMyReview, submitReview } from "@/lib/reviews";
import type { PlatformReview } from "@/lib/reviews";
import { createClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/users";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-ucao-gold" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={16} fill={n <= rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

export function Testimonials() {
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<PlatformReview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    (async () => {
      setReviews(await getApprovedReviews(6));
      const profile = await getCurrentProfile();
      if (profile) {
        setUserId(profile.id);
        const existing = await getMyReview(profile.id);
        setMyReview(existing);
        if (existing) {
          setRating(existing.rating);
          setComment(existing.comment);
        }
      } else {
        const supabase = createClient();
        const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
        setProfileError(Boolean(user));
      }
    })();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setStatus("saving");
    setMessage(null);
    const { error } = await submitReview(userId, { rating, comment });
    setStatus(error ? "error" : "idle");
    setMessage(error ? error : "Merci ! Votre avis sera visible après validation par l'équipe.");
    if (!error) {
      setMyReview({
        id: myReview?.id ?? "",
        rating,
        comment,
        status: "pending",
        created_at: new Date().toISOString(),
        author: null,
      });
    }
  }

  if (!reviews.length && !userId && !profileError) return null;

  return (
    <section className="container-ucao py-[64px]">
      <p className="eyebrow">
        <MessageSquareQuote size={16} /> Ils nous font confiance
      </p>
      <h2 className="mb-6 text-2xl font-bold">Ce que disent les étudiants</h2>

      {reviews.length > 0 && (
        <div className="mb-10 grid gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.id} className="panel p-5">
              <Stars rating={review.rating} />
              <p className="my-3 text-ucao-muted dark:text-[#a8b8cc]">&laquo;{review.comment}&raquo;</p>
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-full bg-ucao-navy text-sm font-bold text-white">
                  {initials(review.author?.name ?? "?")}
                </span>
                <div>
                  <p className="font-bold">{review.author?.name ?? "Étudiant UCAO"}</p>
                  <p className="text-xs text-ucao-muted dark:text-[#a8b8cc]">
                    {review.author?.role === "VENDEUR" ? "Vendeur sur UCAO Marketplace" : "Étudiant UCAO"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {userId && (
        <form className="panel mx-auto max-w-xl p-6" onSubmit={handleSubmit}>
          <h3 className="mb-3 text-lg font-bold">{myReview ? "Mon avis" : "Laisser un avis"}</h3>
          {myReview ? (
            <>
              <Stars rating={myReview.rating} />
              <p className="my-3 text-ucao-muted dark:text-[#a8b8cc]">&laquo;{myReview.comment}&raquo;</p>
              <p className="notice">Vous avez déjà envoyé votre avis. Vous pouvez le supprimer pour en rédiger un nouveau.</p>
              <button
                className="btn btn-ghost mt-4 text-ucao-red"
                type="button"
                onClick={async () => {
                  if (!window.confirm("Supprimer votre avis ?")) return;
                  const ok = await deleteReview(myReview.id, userId);
                  if (!ok) {
                    setMessage("Impossible de supprimer votre avis.");
                    return;
                  }
                  setMyReview(null);
                  setComment("");
                  setMessage("Votre avis a été supprimé.");
                }}
              >
                <Trash2 size={16} /> Supprimer mon avis
              </button>
            </>
          ) : (
            <>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} étoile(s)`} className="text-ucao-gold">
                <Star size={22} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea
            className="textarea-field"
            placeholder="Votre expérience sur UCAO Marketplace..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            minLength={10}
            maxLength={500}
            required
          />
          {message && <p className="notice mt-3">{message}</p>}
          <button className="btn btn-primary mt-4" type="submit" disabled={status === "saving"}>
            <Send size={16} /> {status === "saving" ? "Envoi..." : "Envoyer"}
          </button>
            </>
          )}
        </form>
      )}
      {profileError && !userId && (
        <p className="notice notice-error">Votre profil n&apos;est pas encore prêt. Reconnectez-vous après la confirmation de votre email ou contactez l&apos;administration.</p>
      )}
    </section>
  );
}