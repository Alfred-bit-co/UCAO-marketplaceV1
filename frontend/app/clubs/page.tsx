/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { getClubs } from "@/lib/clubs";

export const metadata: Metadata = { title: "Clubs — UCAO Marketplace", description: "Découvrez les clubs étudiants de l'UCAO-UUT." };

export default async function ClubsPage() {
  const clubs = await getClubs();
  return <PageShell><main><PageHero eyebrow="Vie étudiante" title="Clubs UCAO">Retrouvez les associations et clubs du campus.</PageHero><section className="container-ucao grid gap-6 py-[42px] pb-[84px] sm:grid-cols-2 lg:grid-cols-3"><p className="notice sm:col-span-2 lg:col-span-3" role="status">Page en voie de développement</p>{clubs.length ? clubs.map((club) => <a key={club.id} href={club.external_url} target="_blank" rel="noopener noreferrer" className="group relative min-h-56 overflow-hidden rounded-ucao bg-ucao-navy shadow-ucao"><div className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105" style={{ backgroundImage: `url(${club.banner_url})` }} /><div className="absolute inset-0 bg-gradient-to-t from-[#071426]/90 via-[#071426]/25 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5 text-white"><h2 className="text-2xl font-medium">{club.name}</h2>{club.short_description && <p className="mt-1 text-sm text-white/80">{club.short_description}</p>}</div></a>) : <p className="notice sm:col-span-2 lg:col-span-3">Aucun club n'est encore publié.</p>}</section></main></PageShell>;
}
