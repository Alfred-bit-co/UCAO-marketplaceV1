"use client";

import {
  CalendarDays,
  Check,
  IdCard,
  LayoutDashboard,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from "@/lib/icons";
import { useEffect, useState } from "react";
import { AdminCharts } from "@/components/admin-charts";
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
import { createClub, deleteClub, getClubs } from "@/lib/clubs";
import { deleteReviewForAdmin, getAllReviewsForAdmin, getReviewStats, updateReviewStatus } from "@/lib/reviews";
import type { PlatformReview } from "@/lib/reviews";
import { getAllStandsForAdmin, updateStandStatus } from "@/lib/stands";
import { getPendingVerifications, getStudentIdSignedUrl, setVerificationStatus } from "@/lib/verification";
import type { Club, Profile, Stand } from "@/lib/types";
import { roleLabel } from "@/lib/utils";
import { getCurrentProfile } from "@/lib/users";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A";
}

function Kpi({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: "navy" | "red" | "green" | "gold" }) {
  const styles = { navy: "bg-ucao-navy-soft text-ucao-navy", red: "bg-ucao-red-soft text-ucao-red", green: "bg-ucao-success-soft text-ucao-success", gold: "bg-[#f6e8eb] text-ucao-red" };
  return <article className="panel p-5"><div className="flex items-start justify-between gap-3"><span className={`grid size-10 place-items-center rounded-ucao ${styles[tone]}`}><LayoutDashboard size={18} /></span><span className="text-xs font-bold uppercase tracking-wide text-ucao-muted">Admin</span></div><p className="mt-5 text-sm font-medium text-ucao-muted">{label}</p><p className="mt-1 text-3xl font-bold">{value.toLocaleString("fr-FR")}</p><p className="mt-1 text-xs font-medium text-ucao-muted">{hint}</p></article>;
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
  const [accountPendingDeletion, setAccountPendingDeletion] = useState<Profile | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  async function refreshAll() {
    const [statsData, signupsData, productData, userData, rolesData, tiersData, standsData, usersData, verificationData, reviewsResult, reviewStatsData, clubsData] = await Promise.all([
      getAdminStats(), getVendorSignupsByMonth(), getProductPublishByMonth(), getMonthlyUserSignups(), getUsersByRole(), getSubscriptionTierDistribution(), getAllStandsForAdmin(), searchProfiles(""), getPendingVerifications(), getAllReviewsForAdmin(), getReviewStats(), getClubs(),
    ]);
    setStats(statsData); setSignups(signupsData); setProductPublishes(productData); setUserSignups(userData); setRoles(rolesData); setTiers(tiersData); setStands(standsData); setUsers(usersData); setVerifications(verificationData); setReviews(reviewsResult.reviews); setReviewStats(reviewStatsData); setClubs(clubsData);
    if (reviewsResult.error) setActionMessage(`Avis : ${reviewsResult.error}`);
  }

  useEffect(() => {
    void (async () => { const profile = await getCurrentProfile(); setMe(profile); if (profile?.role === "ADMIN") await refreshAll(); setLoading(false); })();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { if (me?.role === "ADMIN") void searchProfiles(search).then(setUsers); }, 300);
    return () => window.clearTimeout(timer);
  }, [search, me]);

  async function decideStand(id: string, status: "approved" | "rejected") { setActionMessage(null); if (!await updateStandStatus(id, status)) { setActionMessage("Impossible de mettre à jour ce stand."); return; } await refreshAll(); }
  async function decideVerification(id: string, status: "approved" | "rejected", note?: string) { setActionMessage(null); if (!await setVerificationStatus(id, status, note)) { setActionMessage("Impossible de mettre à jour cette vérification."); return; } await refreshAll(); }
  async function viewCard(path: string) { const popup = window.open("about:blank", "_blank"); const result = await getStudentIdSignedUrl(path); if (result.url) { if (popup) popup.location.href = result.url; else window.open(result.url, "_blank", "noopener,noreferrer"); } else { popup?.close(); setActionMessage(result.error || "Impossible d'ouvrir la carte."); } }
  async function decideReview(id: string, status: "approved" | "rejected") { if (!await updateReviewStatus(id, status)) { setActionMessage("Impossible de mettre à jour cet avis."); return; } setReviews((items) => items.map((item) => item.id === id ? { ...item, status } : item)); setReviewStats(await getReviewStats()); }
  async function removeReview(id: string) { if (!window.confirm("Supprimer définitivement cet avis ?")) return; if (!await deleteReviewForAdmin(id)) { setActionMessage("Impossible de supprimer cet avis."); return; } setReviews((items) => items.filter((item) => item.id !== id)); setReviewStats(await getReviewStats()); }
  function removeUser(id: string, _name?: string) { void _name; const user = users.find((item) => item.id === id); if (user) { setActionMessage(null); setAccountPendingDeletion(user); } }
  async function confirmUserDeletion() { if (!accountPendingDeletion) return; setActionMessage(null); setDeletingUserId(accountPendingDeletion.id); const result = await deleteUserAccount(accountPendingDeletion.id); setDeletingUserId(null); if (!result.ok) { setActionMessage(result.message || "Impossible de supprimer ce compte."); return; } const deletedName = accountPendingDeletion.full_name; setUsers((items) => items.filter((item) => item.id !== accountPendingDeletion.id)); setStats((current) => current ? { ...current, totalUsers: Math.max(current.totalUsers - 1, 0) } : current); setAccountPendingDeletion(null); setActionMessage(`Le compte de ${deletedName} a été supprimé.`); }
  async function addClub(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const result = await createClub({ name: String(form.get("name") || ""), banner_url: String(form.get("banner_url") || ""), external_url: String(form.get("external_url") || ""), short_description: String(form.get("short_description") || "") }); if (!result.ok) { setActionMessage(result.error || "Impossible de créer le club."); return; } event.currentTarget.reset(); setClubs(await getClubs()); }
  async function removeClub(id: string) { if (!window.confirm("Supprimer ce club ?")) return; if (!await deleteClub(id)) { setActionMessage("Impossible de supprimer ce club."); return; } setClubs((items) => items.filter((item) => item.id !== id)); }

  if (loading) return <PageShell><AdminSkeleton /></PageShell>;
  if (!me || me.role !== "ADMIN") return <PageShell><main className="container-ucao py-24 text-center"><p className="text-xl font-medium">Accès réservé aux administrateurs.</p></main></PageShell>;

  const pendingStands = stands.filter((stand) => stand.status === "pending");
  return <PageShell>
    <main className="min-h-screen bg-[#f5f7fb] pb-20 dark:bg-[#071426]">
      <section className="relative overflow-hidden bg-[linear-gradient(120deg,#18245f_0%,#1e2a6e_55%,#7a1e2d_145%)] pb-28 pt-12 text-white">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="container-ucao relative">
          <div className="flex flex-wrap items-start justify-between gap-6"><div><p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/65"><Shield size={15} /> Centre de pilotage</p><h1 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tight">Bonjour, {me.full_name.split(" ")[0]}.</h1><p className="mt-2 max-w-xl text-white/72">Suivez la croissance de la marketplace et traitez les actions prioritaires.</p></div><div className="flex items-center gap-3"><span className="hidden items-center gap-2 rounded-ucao border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium sm:inline-flex"><CalendarDays size={16} /> Vue du jour</span><span className="grid size-12 place-items-center rounded-full bg-white text-sm font-bold text-ucao-navy shadow-lg">{initials(me.full_name)}</span></div></div>
          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 rounded-ucao border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">État de la plateforme</p><p className="mt-1 text-2xl font-bold">Tout est sous contrôle</p></div><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ucao-success"><ShieldCheck size={15} /> Accès administrateur actif</span></div>
        </div>
      </section>

      <section className="container-ucao relative z-10 -mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats && <><Kpi label="Utilisateurs" value={stats.totalUsers} hint="Comptes enregistrés" tone="navy" /><Kpi label="Vendeurs actifs" value={stats.totalVendors} hint="Abonnements actifs" tone="red" /><Kpi label="Produits publiés" value={stats.totalProducts} hint="Dans le catalogue" tone="green" /><Kpi label="À traiter" value={stats.pendingVerifications + stats.pendingStands} hint={`${stats.pendingVerifications} vérification(s) · ${stats.pendingStands} stand(s)`} tone="gold" /></>}
      </section>

      {actionMessage && <section className="container-ucao mt-5"><p className={`notice ${actionMessage.startsWith("Le compte") ? "" : "notice-error"}`} role="status">{actionMessage}</p></section>}

      {accountPendingDeletion && <div className="fixed inset-0 z-50 grid place-items-center bg-[#071426]/65 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
        <div className="panel w-full max-w-md p-6 shadow-2xl">
          <p className="eyebrow text-ucao-red">Action irréversible</p>
          <h2 id="delete-account-title" className="mt-1 text-2xl font-bold">Supprimer ce compte ?</h2>
          <p className="mt-3 text-sm text-ucao-muted">Le compte de <strong>{accountPendingDeletion.full_name}</strong> et ses données associées seront définitivement supprimés.</p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button className="btn btn-ghost" type="button" onClick={() => setAccountPendingDeletion(null)} disabled={Boolean(deletingUserId)}>Annuler</button>
            <button className="btn bg-ucao-red text-white hover:bg-ucao-red/90" type="button" onClick={confirmUserDeletion} disabled={Boolean(deletingUserId)}>{deletingUserId ? "Suppression..." : "Supprimer définitivement"}</button>
          </div>
        </div>
      </div>}

      <section className="container-ucao mt-8">{stats && <AdminCharts stats={stats} signups={signups} productPublishes={productPublishes} userSignups={userSignups} roles={roles} tiers={tiers} />}</section>

      <section className="container-ucao mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="panel p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Priorité</p><h2 className="text-2xl font-bold">Vérifications étudiantes</h2></div><span className="grid size-10 place-items-center rounded-full bg-ucao-red-soft text-ucao-red"><IdCard size={18} /></span></div>{verifications.length ? <ul className="space-y-3">{verifications.map((user) => <li key={user.id} className="rounded-ucao bg-ucao-soft p-4 dark:bg-[#132238]"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">{user.full_name}</p><p className="text-sm text-ucao-muted">{user.email}</p></div><div className="flex flex-wrap gap-2">{user.student_id_url && <button className="btn btn-ghost min-h-9 px-3 text-xs" type="button" onClick={() => viewCard(user.student_id_url!)}><IdCard size={14} /> Voir la carte</button>}<button className="btn btn-primary min-h-9 px-3 text-xs" type="button" onClick={() => decideVerification(user.id, "approved")}><Check size={14} /> Valider</button><button className="btn btn-ghost min-h-9 px-3 text-xs" type="button" onClick={() => decideVerification(user.id, "rejected", window.prompt("Motif du refus (optionnel) :") || undefined)}><X size={14} /> Rejeter</button></div></div></li>)}</ul> : <p className="rounded-ucao bg-ucao-success-soft p-5 font-medium text-ucao-success">Aucune vérification en attente.</p>}</article>
        <article className="panel p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Modération</p><h2 className="text-2xl font-bold">Stands à traiter</h2></div><span className="text-3xl font-bold text-ucao-red">{pendingStands.length}</span></div>{pendingStands.length ? <ul className="space-y-3">{pendingStands.map((stand) => <li key={stand.id} className="flex items-center justify-between gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#132238]"><div><p className="font-medium">{stand.name}</p><p className="text-xs text-ucao-muted">{stand.seller?.name}</p></div><div className="flex gap-1"><button className="btn btn-primary min-h-9 size-9 p-0" type="button" onClick={() => decideStand(String(stand.id), "approved")} aria-label="Valider"><Check size={15} /></button><button className="btn btn-ghost min-h-9 size-9 p-0" type="button" onClick={() => decideStand(String(stand.id), "rejected")} aria-label="Rejeter"><X size={15} /></button></div></li>)}</ul> : <p className="rounded-ucao bg-ucao-success-soft p-5 font-medium text-ucao-success">Aucun stand à traiter.</p>}</article>
      </section>

      <section className="container-ucao mt-5 grid gap-5 xl:grid-cols-2">
        <article className="panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-ucao-line p-5 dark:border-[#263d5c]"><div><p className="eyebrow">Comptes</p><h2 className="text-2xl font-bold">Utilisateurs</h2></div><label className="relative min-w-[230px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ucao-muted" size={16} /><span className="sr-only">Rechercher</span><input className="input-field min-h-10 py-2 pl-9 text-sm" type="search" placeholder="Nom ou email" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><div className="max-h-[430px] overflow-auto p-3"><ul className="space-y-2">{users.map((user) => <li key={user.id} className="flex items-center gap-3 rounded-ucao p-3 transition hover:bg-ucao-soft dark:hover:bg-[#132238]"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-ucao-navy text-xs font-bold text-white">{initials(user.full_name)}</span><div className="min-w-0 flex-1"><p className="truncate font-medium">{user.full_name}</p><p className="truncate text-xs text-ucao-muted">{user.email} · {roleLabel(user.role)}</p></div>{user.id !== me.id && <button className="grid size-9 place-items-center rounded-ucao text-ucao-red transition hover:bg-ucao-red-soft" type="button" onClick={() => removeUser(user.id, user.full_name)} aria-label={`Supprimer le compte de ${user.full_name}`} title="Supprimer le compte"><Trash2 size={16} /></button>}</li>)}</ul>{users.length === 0 && <p className="p-4 text-sm font-medium text-ucao-muted">Aucun utilisateur trouvé.</p>}</div></article>
        <article className="panel p-5"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Clubs</p><h2 className="text-2xl font-bold">Gestion des clubs</h2></div><UsersRound className="text-ucao-success" size={23} /></div><form className="grid gap-2.5" onSubmit={addClub}><input className="input-field" name="name" placeholder="Nom du club" required /><input className="input-field" name="banner_url" type="url" placeholder="URL de bannière" required /><input className="input-field" name="external_url" type="url" placeholder="Lien externe" required /><input className="input-field" name="short_description" placeholder="Description courte (optionnel)" /><button className="btn btn-primary w-fit" type="submit">Créer le club</button></form><ul className="mt-5 space-y-2">{clubs.map((club) => <li key={club.id} className="flex items-center justify-between gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#132238]"><span className="font-medium">{club.name}</span><button className="btn btn-ghost min-h-9 px-3 text-xs text-ucao-red" type="button" onClick={() => removeClub(club.id)}><Trash2 size={14} /> Supprimer</button></li>)}</ul></article>
      </section>

      <section className="container-ucao mt-5"><article className="panel p-5"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">Avis</p><h2 className="text-2xl font-bold">Modération récente</h2></div><span className="text-sm font-medium text-ucao-muted">{reviewStats.pending} en attente</span></div>{reviews.length ? <ul className="grid gap-3 md:grid-cols-2">{reviews.slice(0, 6).map((review) => <li key={review.id} className="rounded-ucao border border-ucao-line p-4 dark:border-[#263d5c]"><div className="flex items-start justify-between gap-3"><div><Stars rating={review.rating} /><p className="mt-2 line-clamp-2 text-sm text-ucao-muted">«{review.comment}»</p></div><button className="grid size-9 place-items-center rounded-ucao text-ucao-red hover:bg-ucao-red-soft" type="button" onClick={() => removeReview(review.id)} aria-label="Supprimer l'avis"><Trash2 size={15} /></button></div>{review.status === "pending" && <div className="mt-3 flex gap-2"><button className="btn btn-primary min-h-9 px-3 text-xs" type="button" onClick={() => decideReview(review.id, "approved")}><Check size={14} /> Valider</button><button className="btn btn-ghost min-h-9 px-3 text-xs" type="button" onClick={() => decideReview(review.id, "rejected")}><X size={14} /> Rejeter</button></div>}</li>)}</ul> : <p className="rounded-ucao bg-ucao-soft p-5 font-medium text-ucao-muted dark:bg-[#132238]">Aucun avis enregistré.</p>}</article></section>
    </main>
  </PageShell>;
}
