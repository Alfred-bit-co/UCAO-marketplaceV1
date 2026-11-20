import type { Metadata } from "next";
import { Suspense } from "react";
import { AnnouncementCard } from "@/components/clubs/announcement-card";
import { ClubCard } from "@/components/clubs/club-card";
import { ClubWeekCalendar } from "@/components/clubs/club-week-calendar";
import { ClubsTabs } from "@/components/clubs/clubs-tabs";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { getClubAnnouncements, getClubSessions, getClubs } from "@/lib/clubs";
import { sortAnnouncements } from "@/lib/club-schedule";

export const metadata: Metadata = {
  alternates: { canonical: "/clubs" },
  title: "Clubs",
  description: "Découvrez les clubs étudiants de l'UCAO-UUT, leur programme de la semaine et leurs annonces, et rejoignez celui qui te ressemble.",
};

// Page recalculée au plus toutes les 60 s : une modification faite par le représentant
// des clubs apparaît en moins d'une minute, sans peser sur la base à chaque visite.
export const revalidate = 60;

export default async function ClubsPage() {
  const [clubs, sessions, announcementsRaw] = await Promise.all([getClubs(), getClubSessions(), getClubAnnouncements()]);
  const announcements = sortAnnouncements(announcementsRaw);
  const clubById = new Map(clubs.map((club) => [club.id, club]));

  const clubsPanel = (
    <section className="grid gap-10 py-8 pb-[84px] lg:gap-16" aria-label="Liste des clubs">
      {clubs.length ? (
        clubs.map((club, index) => <ClubCard key={club.id} club={club} reverse={index % 2 === 1} priority={index === 0} />)
      ) : (
        <p className="rounded-ucao bg-ucao-soft p-8 text-center font-medium text-ucao-muted dark:bg-[#132238]">La liste des clubs sera bientôt publiée.</p>
      )}
    </section>
  );

  const programmePanel = (
    <div className="grid gap-10 py-8 pb-[84px]">
      <section aria-labelledby="annonces-title">
        <p className="eyebrow">Annonces</p>
        <h2 id="annonces-title" className="text-2xl font-bold sm:text-3xl">Les dernières nouvelles des clubs</h2>
        {announcements.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} club={announcement.club_id ? clubById.get(announcement.club_id) ?? null : null} />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-ucao bg-ucao-soft p-6 text-center font-medium text-ucao-muted dark:bg-[#132238]">Aucune annonce pour le moment.</p>
        )}
      </section>

      <section aria-labelledby="programme-title">
        <p className="eyebrow">Programme</p>
        <h2 id="programme-title" className="text-2xl font-bold sm:text-3xl">La semaine des clubs</h2>
        <p className="mt-2 max-w-2xl text-ucao-muted dark:text-[#a8b8cc]">
          Chaque club a sa couleur. Touche une case pour voir qui se réunit, à quelle heure et où ; touche un club dans la légende pour ne voir que lui.
        </p>
        <div className="panel mt-5 p-4 sm:p-6">
          <ClubWeekCalendar clubs={clubs} sessions={sessions} />
        </div>
      </section>
    </div>
  );

  return (
    <PageShell>
      <main>
        <PageHero eyebrow="Vie étudiante" title="Clubs UCAO" backgroundImage="/images/hero-clubs.jpg">
          Retrouvez les associations et clubs du campus, leur programme et leurs annonces.
        </PageHero>
        <div className="container-ucao pt-6">
          <Suspense fallback={clubsPanel}>
            <ClubsTabs clubsPanel={clubsPanel} programmePanel={programmePanel} />
          </Suspense>
        </div>
      </main>
    </PageShell>
  );
}
