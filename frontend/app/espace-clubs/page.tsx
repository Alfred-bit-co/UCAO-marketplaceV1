"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Eye, EyeOff, Mail, MessageSquareQuote, Pencil, Phone, Plus, Trash2, UsersRound } from "@/lib/icons";
import Image from "next/image";
import { AnnouncementCard } from "@/components/clubs/announcement-card";
import { AnnouncementForm } from "@/components/clubs/announcement-form";
import { ClubForm } from "@/components/clubs/club-form";
import { ClubWeekCalendar } from "@/components/clubs/club-week-calendar";
import { ConfirmDialog } from "@/components/clubs/confirm-dialog";
import { SessionForm } from "@/components/clubs/session-form";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { DashboardSkeleton } from "@/components/skeletons";
import { useToast } from "@/components/toast-provider";
import { amIClubManager, deleteClub, deleteClubAnnouncement, getClubAnnouncements, getClubSessions, getClubs, setClubActive } from "@/lib/clubs";
import { readableTextColor } from "@/lib/club-colors";
import { sortAnnouncements, type PeriodKey } from "@/lib/club-schedule";
import { CONTACT } from "@/lib/seo";
import type { Club, ClubAnnouncement, ClubSession, Profile } from "@/lib/types";
import { getCurrentProfile } from "@/lib/users";
import { cn } from "@/lib/utils";

type Tab = "clubs" | "programme" | "annonces";

const TABS: { key: Tab; label: string; Icon: typeof UsersRound }[] = [
  { key: "clubs", label: "Clubs", Icon: UsersRound },
  { key: "programme", label: "Programme", Icon: CalendarDays },
  { key: "annonces", label: "Annonces", Icon: MessageSquareQuote },
];

export default function EspaceClubsPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("clubs");

  const [clubs, setClubs] = useState<Club[]>([]);
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);

  const [clubForm, setClubForm] = useState<{ open: boolean; club: Club | null }>({ open: false, club: null });
  const [clubToDelete, setClubToDelete] = useState<Club | null>(null);
  const [sessionForm, setSessionForm] = useState<{ open: boolean; session: ClubSession | null; defaults: { day: number; period: PeriodKey } | null }>({ open: false, session: null, defaults: null });
  const [announcementForm, setAnnouncementForm] = useState<{ open: boolean; announcement: ClubAnnouncement | null }>({ open: false, announcement: null });
  const [announcementToDelete, setAnnouncementToDelete] = useState<ClubAnnouncement | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    const [clubsData, sessionsData, announcementsData] = await Promise.all([getClubs(), getClubSessions(), getClubAnnouncements()]);
    setClubs(clubsData);
    setSessions(sessionsData);
    setAnnouncements(announcementsData);
  }

  useEffect(() => {
    void (async () => {
      try {
        const me = await getCurrentProfile();
        setProfile(me);
        if (!me) {
          setAllowed(false);
          return;
        }
        const manager = await amIClubManager();
        setAllowed(manager);
        if (manager) await loadAll();
      } catch (error) {
        console.error("ESPACE CLUBS LOAD ERROR:", error);
        toast.error("Impossible de charger l'espace clubs", "Actualisez la page.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Clubs =====
  function onClubSaved(club: Club, created: boolean) {
    setClubs((items) => (created ? [...items, club] : items.map((item) => (item.id === club.id ? club : item))).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "fr")));
    setClubForm({ open: false, club: null });
    toast.success(created ? "Club ajouté" : "Club modifié", club.name);
  }

  async function toggleVisibility(club: Club) {
    setBusy(true);
    const result = await setClubActive(club.id, !club.is_active);
    setBusy(false);
    if (result.error) {
      toast.error("Impossible de changer la visibilité", result.error);
      return;
    }
    setClubs((items) => items.map((item) => (item.id === club.id ? { ...item, is_active: !club.is_active } : item)));
    toast.success(club.is_active ? "Club caché du public" : "Club visible", club.name);
  }

  async function confirmClubDeletion() {
    if (!clubToDelete) return;
    setBusy(true);
    const result = await deleteClub(clubToDelete.id);
    setBusy(false);
    if (result.error) {
      toast.error("Suppression impossible", result.error);
      return;
    }
    const removed = clubToDelete;
    setClubs((items) => items.filter((item) => item.id !== removed.id));
    setSessions((items) => items.filter((item) => item.club_id !== removed.id));
    setAnnouncements((items) => items.filter((item) => item.club_id !== removed.id));
    setClubToDelete(null);
    toast.success("Club supprimé", `${removed.name} n'apparaît plus sur le site. L'administrateur peut annuler cette suppression.`);
  }

  // ===== Séances =====
  function onSessionSaved(session: ClubSession, created: boolean) {
    setSessions((items) => (created ? [...items, session] : items.map((item) => (item.id === session.id ? session : item))));
    setSessionForm({ open: false, session: null, defaults: null });
    toast.success(created ? "Séance ajoutée" : "Séance modifiée");
  }

  function onSessionDeleted(id: string) {
    setSessions((items) => items.filter((item) => item.id !== id));
    setSessionForm({ open: false, session: null, defaults: null });
    toast.success("Séance supprimée");
  }

  // ===== Annonces =====
  function onAnnouncementSaved(announcement: ClubAnnouncement, created: boolean) {
    setAnnouncements((items) => (created ? [announcement, ...items] : items.map((item) => (item.id === announcement.id ? announcement : item))));
    setAnnouncementForm({ open: false, announcement: null });
    toast.success(created ? "Annonce publiée" : "Annonce modifiée", announcement.title);
  }

  async function confirmAnnouncementDeletion() {
    if (!announcementToDelete) return;
    setBusy(true);
    const result = await deleteClubAnnouncement(announcementToDelete.id);
    setBusy(false);
    if (result.error) {
      toast.error("Suppression impossible", result.error);
      return;
    }
    const removed = announcementToDelete;
    setAnnouncements((items) => items.filter((item) => item.id !== removed.id));
    setAnnouncementToDelete(null);
    toast.success("Annonce supprimée", removed.title);
  }

  if (loading) {
    return (
      <PageShell>
        <DashboardSkeleton />
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell>
        <main className="container-ucao py-24 text-center">
          <p className="text-xl font-medium">Connectez-vous pour accéder à l&apos;espace clubs.</p>
          <Link className="btn btn-primary mt-6" href="/login?next=/espace-clubs">Se connecter</Link>
        </main>
      </PageShell>
    );
  }

  if (!allowed) {
    return (
      <PageShell>
        <main>
          <PageHero eyebrow="Vie étudiante" title="Espace clubs" backgroundImage="/images/hero-clubs.jpg">
            Gestion des clubs, de leur programme et de leurs annonces.
          </PageHero>
          <section className="container-ucao py-16">
            <article className="panel mx-auto max-w-xl p-6 text-center sm:p-8">
              <p className="eyebrow justify-center">Accès réservé</p>
              <h2 className="text-2xl font-bold">Accès réservé au représentant des clubs</h2>
              <p className="mt-3 text-ucao-muted dark:text-[#a8b8cc]">
                Cet espace permet au représentant des clubs de mettre à jour la liste des clubs, le programme de la semaine et les annonces.
                Si vous êtes ce représentant, contactez la plateforme pour obtenir l&apos;accès.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a className="btn btn-ghost" href={`mailto:${CONTACT.email}`}><Mail size={16} aria-hidden="true" /> {CONTACT.email}</a>
                <a className="btn btn-ghost" href={`tel:${CONTACT.telephone}`}><Phone size={16} aria-hidden="true" /> +228 92 98 29 26</a>
              </div>
              <Link className="mt-6 inline-block font-medium text-ucao-red underline-offset-4 hover:underline" href="/clubs">Voir la page des clubs</Link>
            </article>
          </section>
        </main>
      </PageShell>
    );
  }

  const sortedAnnouncements = sortAnnouncements(announcements);
  const clubById = new Map(clubs.map((club) => [club.id, club]));

  return (
    <PageShell>
      <main className="min-h-screen bg-[#f5f7fb] pb-20 dark:bg-[#071426]">
        <section className="relative isolate overflow-hidden bg-[#18245f] pb-10 pt-10 text-white">
          <Image src="/images/hero-clubs.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,20,38,0.78)_0%,rgba(7,20,38,0.6)_60%,rgba(7,20,38,0.75)_100%)]" />
          <div className="container-ucao relative">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/65"><UsersRound size={15} aria-hidden="true" /> Espace clubs</p>
            <h1 className="text-[clamp(28px,5vw,44px)] font-bold tracking-tight">Bonjour, {profile.full_name.split(" ")[0]}.</h1>
            <p className="mt-2 max-w-xl text-white/75">Mettez à jour les clubs, leur programme de la semaine et leurs annonces. Les changements apparaissent sur le site en moins d&apos;une minute.</p>
            <Link href="/clubs?vue=programme" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold hover:bg-white/20">Voir la page publique</Link>
          </div>
        </section>

        <div className="sticky top-[72px] z-30 border-b border-ucao-line bg-white/95 backdrop-blur-sm dark:border-[#263d5c] dark:bg-[#0b1c31]/95 lg:top-[82px]">
          <div className="container-ucao">
            <div role="tablist" aria-label="Sections de l'espace clubs" className="grid grid-cols-3">
              {TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "inline-flex min-h-12 items-center justify-center gap-2 border-b-2 text-sm font-semibold transition",
                    tab === key ? "border-ucao-red text-ucao-red dark:text-[#ff9aa0]" : "border-transparent text-ucao-muted hover:text-ucao-ink dark:hover:text-white",
                  )}
                >
                  <Icon size={16} aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="container-ucao mt-6">
          {tab === "clubs" && (
            <article className="panel p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Clubs</p>
                  <h2 className="text-2xl font-bold">{clubs.length} club{clubs.length > 1 ? "s" : ""}</h2>
                </div>
                <button className="btn btn-primary" type="button" onClick={() => setClubForm({ open: true, club: null })}>
                  <Plus size={16} aria-hidden="true" /> Ajouter un club
                </button>
              </div>
              {clubs.length ? (
                <ul className="grid gap-3">
                  {clubs.map((club) => (
                    <li key={club.id} className={cn("flex items-center gap-3 rounded-ucao bg-ucao-soft p-3 dark:bg-[#132238]", !club.is_active && "opacity-75")}>
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#071426]" style={{ boxShadow: `inset 0 0 0 2px ${club.color}` }}>
                        {club.banner_url && <Image src={club.banner_url} alt="" fill sizes="56px" className="object-cover" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-semibold">
                          <span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: club.color }} aria-hidden="true" />
                          <span className="truncate">{club.name}</span>
                          {!club.is_active && <span className="shrink-0 rounded-full bg-ucao-red-soft px-2 py-0.5 text-[10px] font-bold uppercase text-ucao-red dark:bg-[#3a171d] dark:text-[#ff9aa0]">Caché</span>}
                        </p>
                        <p className="truncate text-xs text-ucao-muted">{club.whatsapp ?? "Pas de numéro WhatsApp"} · ordre {club.sort_order}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          className="grid size-10 place-items-center rounded-ucao text-ucao-muted transition hover:bg-white hover:text-ucao-ink dark:hover:bg-[#1b2d47] dark:hover:text-white"
                          onClick={() => toggleVisibility(club)}
                          disabled={busy}
                          aria-pressed={club.is_active}
                          aria-label={club.is_active ? `Cacher ${club.name}` : `Rendre ${club.name} visible`}
                          title={club.is_active ? "Visible : cliquer pour cacher" : "Caché : cliquer pour rendre visible"}
                        >
                          {club.is_active ? <Eye size={17} /> : <EyeOff size={17} />}
                        </button>
                        <button type="button" className="grid size-10 place-items-center rounded-ucao text-ucao-muted transition hover:bg-white hover:text-ucao-ink dark:hover:bg-[#1b2d47] dark:hover:text-white" onClick={() => setClubForm({ open: true, club })} aria-label={`Modifier ${club.name}`} title="Modifier">
                          <Pencil size={17} />
                        </button>
                        <button type="button" className="grid size-10 place-items-center rounded-ucao text-ucao-red transition hover:bg-ucao-red-soft" onClick={() => setClubToDelete(club)} aria-label={`Supprimer ${club.name}`} title="Supprimer">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-ucao bg-ucao-soft p-6 text-center text-sm font-medium text-ucao-muted dark:bg-[#132238]">Aucun club pour le moment. Ajoutez le premier !</p>
              )}
            </article>
          )}

          {tab === "programme" && (
            <article className="panel p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Programme</p>
                  <h2 className="text-2xl font-bold">La semaine des clubs</h2>
                  <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">Touchez une case vide pour ajouter une séance, ou une séance pour la modifier.</p>
                </div>
                <button className="btn btn-primary" type="button" onClick={() => setSessionForm({ open: true, session: null, defaults: null })} disabled={clubs.length === 0}>
                  <Plus size={16} aria-hidden="true" /> Ajouter une séance
                </button>
              </div>
              <ClubWeekCalendar
                clubs={clubs}
                sessions={sessions}
                mode="edit"
                onCreate={(day, period) => setSessionForm({ open: true, session: null, defaults: { day, period } })}
                onEdit={(session) => setSessionForm({ open: true, session, defaults: null })}
              />
            </article>
          )}

          {tab === "annonces" && (
            <article className="panel p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Annonces</p>
                  <h2 className="text-2xl font-bold">{announcements.length} annonce{announcements.length > 1 ? "s" : ""}</h2>
                  <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">Une annonce reste visible jusqu&apos;au lendemain de l&apos;événement, ou 30 jours sans date.</p>
                </div>
                <button className="btn btn-primary" type="button" onClick={() => setAnnouncementForm({ open: true, announcement: null })}>
                  <Plus size={16} aria-hidden="true" /> Nouvelle annonce
                </button>
              </div>
              {sortedAnnouncements.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {sortedAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      club={announcement.club_id ? clubById.get(announcement.club_id) ?? null : null}
                      manage
                      onEdit={(item) => setAnnouncementForm({ open: true, announcement: item })}
                      onDelete={setAnnouncementToDelete}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-ucao bg-ucao-soft p-6 text-center text-sm font-medium text-ucao-muted dark:bg-[#132238]">Aucune annonce. Publiez la première !</p>
              )}
            </article>
          )}
        </section>

        <p className="container-ucao mt-6 text-xs text-ucao-muted">
          Légende des couleurs :{" "}
          {clubs.map((club) => (
            <span key={club.id} className="mr-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: club.color, color: readableTextColor(club.color) }}>{club.name}</span>
          ))}
        </p>
      </main>

      {clubForm.open && <ClubForm club={clubForm.club} clubs={clubs} onSaved={onClubSaved} onCancel={() => setClubForm({ open: false, club: null })} />}
      {clubToDelete && (
        <ConfirmDialog
          title={`Supprimer ${clubToDelete.name} ?`}
          description="Ce club disparaîtra de la page des clubs avec tout son programme et ses annonces. Seul l'administrateur peut annuler cette suppression."
          confirmLabel="Supprimer le club"
          busy={busy}
          onConfirm={confirmClubDeletion}
          onCancel={() => setClubToDelete(null)}
        />
      )}
      {sessionForm.open && (
        <SessionForm
          session={sessionForm.session}
          clubs={clubs}
          sessions={sessions}
          defaults={sessionForm.defaults}
          onSaved={onSessionSaved}
          onDeleted={onSessionDeleted}
          onCancel={() => setSessionForm({ open: false, session: null, defaults: null })}
        />
      )}
      {announcementForm.open && <AnnouncementForm announcement={announcementForm.announcement} clubs={clubs} onSaved={onAnnouncementSaved} onCancel={() => setAnnouncementForm({ open: false, announcement: null })} />}
      {announcementToDelete && (
        <ConfirmDialog
          title="Supprimer cette annonce ?"
          description={`« ${announcementToDelete.title} » sera supprimée définitivement. Cette action ne peut pas être annulée.`}
          confirmLabel="Supprimer définitivement"
          busy={busy}
          onConfirm={confirmAnnouncementDeletion}
          onCancel={() => setAnnouncementToDelete(null)}
        />
      )}
    </PageShell>
  );
}
