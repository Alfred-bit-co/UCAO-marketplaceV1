"use client";

import { Check, IdCard, Search, Shield, ShieldCheck, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AdminCharts } from "@/components/admin-charts";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { AdminSkeleton } from "@/components/skeletons";
import { Stars } from "@/components/testimonials";
import {
  deleteUserAccount,
  getAdminStats,
  getMonthlyUserSignups,
  getProductPublishByMonth,
  getSubscriptionTierDistribution,
  getUsersByRole,
  getVendorSignupsByMonth,
  searchProfiles,
} from "@/lib/admin";
import type { AdminStats } from "@/lib/admin";
import { deleteReviewForAdmin, getAllReviewsForAdmin, getReviewStats, updateReviewStatus } from "@/lib/reviews";
import type { PlatformReview } from "@/lib/reviews";
import { getAllStandsForAdmin, updateStandStatus } from "@/lib/stands";
import { getPendingVerifications, getStudentIdSignedUrl, setVerificationStatus } from "@/lib/verification";
import type { Profile, Stand } from "@/lib/types";
import { cn, roleLabel, verificationLabel } from "@/lib/utils";
import { getCurrentProfile } from "@/lib/users";
import { createClub, deleteClub, getClubs } from "@/lib/clubs";
import type { Club } from "@/lib/types";

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
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [signups, setSignups] = useState<Awaited<ReturnType<typeof getVendorSignupsByMonth>>>([]);
  const [productPublishes, setProductPublishes] = useState<Awaited<ReturnType<typeof getProductPublishByMonth>>>([]);
  const [userSignups, setUserSignups] = useState<Awaited<ReturnType<typeof getMonthlyUserSignups>>>([]);
  const [roles, setRoles] = useState<Awaited<ReturnType<typeof getUsersByRole>>>([]);
  const [tiers, setTiers] = useState<Awaited<ReturnType<typeof getSubscriptionTierDistribution>>>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [verifications, setVerifications] = useState<Profile[]>([]);
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [search, setSearch] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function refreshAll() {
    const [
      statsData,
      signupsData,
      productPublishesData,
      userSignupsData,
      rolesData,
      tiersData,
      standsData,
      usersData,
      verificationsData,
      reviewsResult,
      reviewStatsData,
      clubsData,
    ] = await Promise.all([
      getAdminStats(),
      getVendorSignupsByMonth(),
      getProductPublishByMonth(),
      getMonthlyUserSignups(),
      getUsersByRole(),
      getSubscriptionTierDistribution(),
      getAllStandsForAdmin(),
      searchProfiles(""),
      getPendingVerifications(),
      getAllReviewsForAdmin(),
      getReviewStats(),
      getClubs(),
    ]);
    setStats(statsData);
    setSignups(signupsData);
    setProductPublishes(productPublishesData);
    setUserSignups(userSignupsData);
    setRoles(rolesData);
    setTiers(tiersData);
    setStands(standsData);
    setUsers(usersData);
    setVerifications(verificationsData);
    setReviews(reviewsResult.reviews);
    setReviewStats(reviewStatsData);
    setClubs(clubsData);
    if (reviewsResult.error) setActionMessage(`Avis : ${reviewsResult.error}`);
  }

  useEffect(() => {
    (async () => {
      const profile = await getCurrentProfile();
      setMe(profile);
      if (profile?.role === "ADMIN") await refreshAll();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (me?.role === "ADMIN") setUsers(await searchProfiles(search));
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

  async function handleVerificationDecision(userId: string, status: "approved" | "rejected", note?: string) {
    setActionMessage(null);
    const ok = await setVerificationStatus(userId, status, note);
    if (!ok) {
      setActionMessage("Impossible de mettre à jour cette vérification.");
      return;
    }
    await refreshAll();
  }

  async function handleViewStudentCard(path: string) {
    const result = await getStudentIdSignedUrl(path);
    if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
    else setActionMessage(result.error || "Impossible d'ouvrir la carte.");
  }

  async function handleReviewDecision(reviewId: string, status: "approved" | "rejected") {
    setActionMessage(null);
    const ok = await updateReviewStatus(reviewId, status);
    if (!ok) {
      setActionMessage("Impossible de mettre à jour cet avis.");
      return;
    }
    setReviews((current) => current.map((review) => (review.id === reviewId ? { ...review, status } : review)));
    setReviewStats(await getReviewStats());
  }

  async function handleDeleteReview(reviewId: string) {
    if (!window.confirm("Supprimer définitivement cet avis ?")) return;
    setActionMessage(null);
    const ok = await deleteReviewForAdmin(reviewId);
    if (!ok) {
      setActionMessage("Impossible de supprimer cet avis.");
      return;
    }
    setReviews((current) => current.filter((review) => review.id !== reviewId));
    setReviewStats(await getReviewStats());
  }

  async function handleDeleteUser(userId: string, name: string) {
    if (!window.confirm(`Supprimer définitivement le compte de ${name} ?`)) return;
    setActionMessage(null);
    const result = await deleteUserAccount(userId);
    if (!result.ok) {
      setActionMessage(result.message || "Impossible de supprimer ce compte.");
      return;
    }
    setUsers((current) => current.filter((u) => u.id !== userId));
  }

  async function handleCreateClub(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await createClub({ name: String(form.get("name") || ""), banner_url: String(form.get("banner_url") || ""), external_url: String(form.get("external_url") || ""), short_description: String(form.get("short_description") || "") });
    if (!result.ok) { setActionMessage(result.error || "Impossible de créer le club."); return; }
    event.currentTarget.reset();
    setClubs(await getClubs());
  }

  async function handleDeleteClub(id: string) {
    if (!window.confirm("Supprimer ce club ?")) return;
    if (!await deleteClub(id)) { setActionMessage("Impossible de supprimer ce club."); return; }
    setClubs((current) => current.filter((club) => club.id !== id));
  }

  if (loading) {
    return (
      <PageShell>
        <AdminSkeleton />
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
          Vue d&apos;ensemble, modération et validation des comptes étudiants.
        </PageHero>

        <section className="container-ucao flex items-center justify-between gap-3 pt-[30px]">
          <span className="grid size-12 place-items-center rounded-full bg-ucao-navy text-lg font-black text-white">
            {initials(me.full_name || "Admin")}
          </span>
          <div>
            <p className="text-xl font-bold">Bonjour, {me.full_name}</p>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Pilotage de la marketplace UCAO UUT.</p>
          </div>
          <span className="tag ml-auto hidden sm:inline-flex">
            <ShieldCheck size={15} /> Accès administrateur
          </span>
        </section>

        {actionMessage && (
          <section className="container-ucao pt-6">
            <p className="notice notice-error">{actionMessage}</p>
          </section>
        )}

        <section className="container-ucao py-[30px]">
          {stats && (
            <AdminCharts stats={stats} signups={signups} productPublishes={productPublishes} userSignups={userSignups} roles={roles} tiers={tiers} />
          )}
        </section>

        <section className="container-ucao panel mb-[42px] p-4">
          <div className="mb-4 flex items-center gap-2">
            <IdCard size={20} className="text-ucao-red" />
            <h2 className="text-xl font-bold">Validation des cartes d&apos;étudiant</h2>
          </div>
          {verifications.length === 0 ? (
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Aucune carte en attente de validation.</p>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {verifications.map((user) => (
                <li key={user.id} className="rounded-ucao border border-ucao-line p-4 dark:border-[#2a3a52]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{user.full_name}</p>
                      <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">{user.email}</p>
                      <span className="tag mt-2">{verificationLabel(user.verification_status)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.student_id_url && <button className="btn btn-ghost" type="button" onClick={() => handleViewStudentCard(user.student_id_url!)}><IdCard size={16} /> Voir la carte</button>}
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => handleVerificationDecision(user.id, "approved")}
                      >
                        <Check size={16} /> Valider
                      </button>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => {
                          const note = window.prompt("Motif du refus (optionnel) :") || undefined;
                          handleVerificationDecision(user.id, "rejected", note);
                        }}
                      >
                        <X size={16} /> Refuser
                      </button>
                    </div>
                  </div>
                  {user.student_id_url && (
                    <div className="hidden">
                      <Image
                        src="/logo-ucao.png"
                        alt={`Carte d'étudiant de ${user.full_name}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="container-ucao panel mb-[42px] overflow-x-auto p-4">
          <h2 className="mb-3 text-xl font-bold">Validation des stands</h2>
          {pendingStands.length === 0 ? (
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Aucun stand en attente.</p>
          ) : (
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-ucao-line px-2.5 py-2 text-left text-sm dark:border-[#2a3a52]">Stand</th>
                  <th className="border-b border-ucao-line px-2.5 py-2 text-left text-sm dark:border-[#2a3a52]">Responsable</th>
                  <th className="border-b border-ucao-line px-2.5 py-2 text-left text-sm dark:border-[#2a3a52]">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingStands.map((stand) => (
                  <tr key={stand.id}>
                    <td className="border-b border-ucao-line px-2.5 py-2 dark:border-[#2a3a52]">{stand.name}</td>
                    <td className="border-b border-ucao-line px-2.5 py-2 dark:border-[#2a3a52]">{stand.seller?.name}</td>
                    <td className="border-b border-ucao-line px-2.5 py-2 dark:border-[#2a3a52]">
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
            <p className="mt-4 text-sm text-ucao-muted dark:text-[#a8b8cc]">{otherStands.length} autre(s) stand(s) déjà traité(s).</p>
          )}
        </section>

        <section className="container-ucao panel mb-[42px] overflow-x-auto p-4">
          <h2 className="mb-3 text-xl font-bold">Modération des avis</h2>
          <p className="mb-3 text-sm text-ucao-muted dark:text-[#a8b8cc]">
            {reviewStats.approved} validé(s), {reviewStats.pending} en attente, {reviewStats.rejected} rejeté(s).
          </p>
          {reviews.length === 0 ? (
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Aucun avis enregistré.</p>
          ) : (
            <ul className="space-y-3">
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
                      <span
                        className={cn(
                          "tag",
                          review.status === "approved" && "bg-ucao-success-soft text-ucao-success dark:bg-[#123628] dark:text-[#7bd3ad]",
                          review.status === "rejected" && "bg-[#ffe8e8] text-ucao-danger dark:bg-[#3a1a1c] dark:text-[#ff8a8e]",
                        )}
                      >
                        {review.status}
                      </span>
                      <button className="btn btn-ghost text-ucao-red" type="button" onClick={() => handleDeleteReview(review.id)}>
                        <Trash2 size={16} />
                      </button>
                      {review.status === "pending" && (
                        <>
                          <button className="btn btn-primary" type="button" onClick={() => handleReviewDecision(review.id, "approved")}>
                            <Check size={16} /> Valider
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => handleReviewDecision(review.id, "rejected")}>
                            <X size={16} /> Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="container-ucao panel mb-[42px] p-4">
          <h2 className="mb-4 text-xl font-bold">Gestion des clubs</h2>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateClub}>
            <input className="input-field" name="name" placeholder="Nom du club" required />
            <input className="input-field" name="banner_url" type="url" placeholder="URL de la bannière" required />
            <input className="input-field" name="external_url" type="url" placeholder="Lien externe" required />
            <input className="input-field" name="short_description" placeholder="Description courte (optionnel)" />
            <button className="btn btn-primary w-fit" type="submit">Créer le club</button>
          </form>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {clubs.map((club) => <li key={club.id} className="flex items-center justify-between gap-3 rounded-ucao border border-ucao-line p-3 dark:border-[#2a3a52]"><span className="font-bold">{club.name}</span><button className="btn btn-ghost text-ucao-red" type="button" onClick={() => handleDeleteClub(club.id)}><Trash2 size={16} /> Supprimer</button></li>)}
          </ul>
        </section>

        <section className="container-ucao panel mb-[60px] overflow-x-auto p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Utilisateurs</h2>
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ucao-muted" size={16} />
              <input
                className="input-field min-h-10 py-2 pl-9 text-sm"
                type="search"
                placeholder="Rechercher un nom ou un email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-ucao-line px-2.5 py-2 text-left text-sm dark:border-[#2a3a52]">Nom</th>
                <th className="border-b border-ucao-line px-2.5 py-2 text-left text-sm dark:border-[#2a3a52]">Email</th>
                <th className="border-b border-ucao-line px-2.5 py-2 text-left text-sm dark:border-[#2a3a52]">Rôle</th>
                <th className="border-b border-ucao-line px-2.5 py-2 text-left text-sm dark:border-[#2a3a52]">Vérification</th>
                <th className="border-b border-ucao-line px-2.5 py-2 text-left text-sm dark:border-[#2a3a52]">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border-b border-ucao-line px-2.5 py-2 dark:border-[#2a3a52]">{user.full_name}</td>
                  <td className="border-b border-ucao-line px-2.5 py-2 dark:border-[#2a3a52]">{user.email}</td>
                  <td className="border-b border-ucao-line px-2.5 py-2 dark:border-[#2a3a52]">{roleLabel(user.role)}</td>
                  <td className="border-b border-ucao-line px-2.5 py-2 dark:border-[#2a3a52]">{verificationLabel(user.verification_status)}</td>
                  <td className="border-b border-ucao-line px-2.5 py-2 dark:border-[#2a3a52]">
                    {user.id !== me.id && (
                      <button className="btn btn-ghost text-ucao-red" type="button" onClick={() => handleDeleteUser(user.id, user.full_name)}>
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
