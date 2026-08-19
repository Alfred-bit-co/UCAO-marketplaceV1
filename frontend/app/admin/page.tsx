"use client";
import { Check, MessageSquareQuote, Search, Shield, ShieldCheck, Trash2, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { Stars } from "@/components/testimonials";
import { deleteUserAccount, getVendorSignupsByMonth, searchProfiles } from "@/lib/admin";
import type { MonthlySignup } from "@/lib/admin";
import { getAllReviewsForAdmin, getReviewStats, updateReviewStatus } from "@/lib/reviews";
import type { PlatformReview } from "@/lib/reviews";
import { getAllStandsForAdmin, updateStandStatus } from "@/lib/stands";
import type { Profile, Stand } from "@/lib/types";
import { getCurrentProfile } from "@/lib/users";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signups, setSignups] = useState<MonthlySignup[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [search, setSearch] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function refreshAll() {
    const [signupsData, standsData, usersData, reviewsData, reviewStatsData] = await Promise.all([
      getVendorSignupsByMonth(),
      getAllStandsForAdmin(),
      searchProfiles(""),
      getAllReviewsForAdmin(),
      getReviewStats(),
    ]);
    setSignups(signupsData);
    setStands(standsData);
    setUsers(usersData);
    setReviews(reviewsData);
    setReviewStats(reviewStatsData);
  }

  useEffect(() => {
    (async () => {
      const profile = await getCurrentProfile();
      setMe(profile);
      if (profile?.role === "ADMIN") {
        await refreshAll();
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (me?.role === "ADMIN") {
        setUsers(await searchProfiles(search));
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, me]);

  const pendingStands = useMemo(() => stands.filter((s) => s.status === "pending"), [stands]);
  const otherStands = useMemo(() => stands.filter((s) => s.status !== "pending"), [stands]);

  async function handleStandDecision(standId: string, status: "approved" | "rejected") {
    setActionMessage(null);
    const ok = await updateStandStatus(standId, status);
    if (!ok) {
      setActionMessage("Impossible de mettre à jour ce stand.");
      return;
    }
    await refreshAll();
  }

  async function handleReviewDecision(reviewId: string, status: "approved" | "rejected") {
    setActionMessage(null);
    const ok = await updateReviewStatus(reviewId, status);
    if (!ok) {
      setActionMessage("Impossible de mettre à jour cet avis.");
      return;
    }
    setReviews((current) => current.map((review) => review.id === reviewId ? { ...review, status } : review));
    setReviewStats(await getReviewStats());
  }

  async function handleDeleteUser(userId: string, name: string) {
    if (!window.confirm(`Supprimer définitivement le compte de ${name} ? Cette action est irréversible.`)) {
      return;
    }
    setActionMessage(null);
    const result = await deleteUserAccount(userId);
    if (!result.ok) {
      setActionMessage(result.message || "Impossible de supprimer ce compte.");
      return;
    }
    setUsers((current) => current.filter((u) => u.id !== userId));
  }

  if (loading) {
    return (
      <PageShell>
        <main className="container-ucao py-[84px] text-center">Chargement...</main>
      </PageShell>
    );
  }

  if (!me || me.role !== "ADMIN") {
    return (
      <PageShell>
        <main className="container-ucao py-[84px] text-center">
          <p className="text-xl font-bold">Accès réservé aux administrateurs.</p>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main>
        <PageHero icon={Shield} eyebrow="Administration" title="Tableau de bord admin">
          Contrôlez les inscriptions, les vendeurs et gardez la marketplace fiable.
        </PageHero>

        <section className="container-ucao flex items-center gap-4 pt-[42px]">
          <span className="grid size-16 place-items-center rounded-full bg-ucao-navy text-xl font-black text-white">
            {initials(me.full_name || "Admin")}
          </span>
          <div>
            <p className="text-2xl font-bold">Bonjour, {me.full_name} 👋</p>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Ravi de vous revoir sur l&apos;administration.</p>
          </div>
        </section>

        {actionMessage && (
          <section className="container-ucao pt-6">
            <p className="notice notice-error">{actionMessage}</p>
          </section>
        )}

        <section className="container-ucao grid gap-5 py-[42px] md:grid-cols-4">
          <article className="panel p-5">
            <span className="tag">
              <ShieldCheck size={16} /> Stands en attente
            </span>
            <h2 className="mt-3 text-3xl font-bold">{pendingStands.length}</h2>
          </article>
          <article className="panel p-5">
            <span className="tag">
              <ShieldCheck size={16} /> Stands validés
            </span>
            <h2 className="mt-3 text-3xl font-bold">{stands.filter((s) => s.status === "approved").length}</h2>
          </article>
          <article className="panel p-5">
            <span className="tag">
              <TrendingUp size={16} /> Vendeurs (total historique)
            </span>
            <h2 className="mt-3 text-3xl font-bold">{signups.reduce((sum, item) => sum + item.count, 0)}</h2>
          </article>
          <article className="panel p-5">
            <span className="tag">
              <MessageSquareQuote size={16} /> Avis total
            </span>
            <h2 className="mt-3 text-3xl font-bold">{reviewStats.total}</h2>
          </article>
        </section>

        <section className="container-ucao panel mb-[54px] p-5">
          <h2 className="mb-4 text-2xl font-bold">Nouveaux vendeurs par mois</h2>
          {signups.length === 0 ? (
            <p className="text-ucao-muted dark:text-[#a8b8cc]">
              Aucune souscription payée enregistrée pour le moment.
            </p>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7A1E2D" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="container-ucao panel mb-[54px] overflow-x-auto p-5">
          <h2 className="mb-4 text-2xl font-bold">Validation des stands</h2>
          {pendingStands.length === 0 ? (
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Aucun stand en attente.</p>
          ) : (
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Stand</th>
                  <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Responsable</th>
                  <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingStands.map((stand) => (
                  <tr key={stand.id}>
                    <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">{stand.name}</td>
                    <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">{stand.seller?.name}</td>
                    <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">
                      <div className="flex gap-2">
                        <button className="btn btn-primary" type="button" onClick={() => handleStandDecision(String(stand.id), "approved")}>
                          <Check size={16} /> Valider
                        </button>
                        <button className="btn btn-ghost" type="button" onClick={() => handleStandDecision(String(stand.id), "rejected")}>
                          <X size={16} /> Rejeter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {otherStands.length > 0 && (
            <p className="mt-4 text-sm text-ucao-muted dark:text-[#a8b8cc]">
              {otherStands.length} autre(s) stand(s) déjà traité(s).
            </p>
          )}
        </section>

        <section className="container-ucao panel mb-[54px] overflow-x-auto p-5">
          <h2 className="mb-4 text-2xl font-bold">Modération des avis</h2>
          <p className="mb-4 text-sm text-ucao-muted dark:text-[#a8b8cc]">
            {reviewStats.approved} validé(s), {reviewStats.pending} en attente, {reviewStats.rejected} rejeté(s).
          </p>
          {reviews.length === 0 ? (
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Aucun avis enregistré.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-ucao border border-ucao-line p-4 dark:border-[#2a3a52]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Stars rating={review.rating} />
                      <p className="mt-2 text-ucao-muted dark:text-[#a8b8cc]">&laquo;{review.comment}&raquo;</p>
                      <p className="mt-1 text-sm font-bold">
                        {review.author?.name ?? "Utilisateur"} — {review.author?.role ?? ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tag">{review.status}</span>
                      {review.status === "pending" && <>
                      <button className="btn btn-primary" type="button" onClick={() => handleReviewDecision(review.id, "approved")}>
                        <Check size={16} /> Valider
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => handleReviewDecision(review.id, "rejected")}>
                        <X size={16} /> Rejeter
                      </button>
                      </>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="container-ucao panel mb-[84px] overflow-x-auto p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Utilisateurs</h2>
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ucao-muted" size={16} />
              <input
                className="input-field pl-9"
                type="search"
                placeholder="Rechercher un nom ou un email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Nom</th>
                <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Email</th>
                <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Rôle</th>
                <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Palier</th>
                <th className="border-b border-ucao-line p-3.5 text-left dark:border-[#2a3a52]">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">{user.full_name}</td>
                  <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">{user.email}</td>
                  <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">{user.role}</td>
                  <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">{user.subscription_tier ?? "—"}</td>
                  <td className="border-b border-ucao-line p-3.5 dark:border-[#2a3a52]">
                    {user.id !== me.id && (
                      <button
                        className="btn btn-ghost text-ucao-red"
                        type="button"
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                      >
                        <Trash2 size={16} /> Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </PageShell>
  );
}