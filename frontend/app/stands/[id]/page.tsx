import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, MessageCircle, ShieldCheck } from "@/lib/icons";
import { PageShell } from "@/components/page-shell";
import { RoleBadge } from "@/components/role-badge";
import { StandCategoryIcon } from "@/components/stand-category-icon";
import { IMAGE_ASSETS, SITE_URL } from "@/lib/constants";
import { buildStandActions, getContactModeLabel, getStandCategoryLabel } from "@/lib/stand-catalog";
import { getStandById } from "@/lib/stands";

type Props = { params: Promise<{ id: string }> };

const STATUS_NOTICE: Record<string, string> = {
  pending: "Ce stand est en attente de validation : seuls son propriétaire et l'équipe peuvent le voir pour l'instant.",
  rejected: "Ce stand n'a pas été validé : il n'est pas visible du public.",
};

const STEPS = [
  { title: "Choisis ce que tu veux faire", text: "Commander, réserver ou prendre rendez-vous, selon ce que le vendeur propose." },
  { title: "WhatsApp s'ouvre avec un message prêt", text: "Tu peux le modifier avant de l'envoyer." },
  { title: "Retrouve le vendeur sur le campus", text: "Pour ta sécurité, choisis un lieu fréquenté." },
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "S";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const stand = await getStandById(id);
  if (!stand) return { title: "Stand introuvable — UCAO Marketplace" };

  const description = stand.description.slice(0, 160);
  const image = stand.banner_url || stand.logo_url;
  return {
    title: stand.name + " — UCAO Marketplace",
    description,
    openGraph: {
      title: stand.name,
      description,
      type: "website",
      url: SITE_URL + "/stands/" + id,
      images: image ? [{ url: image, alt: stand.name }] : undefined,
    },
  };
}

export default async function StandDetailPage({ params }: Props) {
  const { id } = await params;
  const stand = await getStandById(id);
  if (!stand) notFound();

  const category = stand.category ?? "autres";
  const modes = stand.contact_modes ?? [];
  const actions = buildStandActions(stand);
  const statusNotice = stand.status && stand.status !== "approved" ? STATUS_NOTICE[stand.status] : null;

  return (
    <PageShell>
      <main className="container-ucao py-8 sm:py-10">
        <Link className="btn btn-ghost mb-5" href="/stands">
          <ArrowLeft size={18} /> Retour aux stands
        </Link>

        {statusNotice && (
          <div className="notice mb-6 flex items-start gap-3 p-4" role="status">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm">{statusNotice}</p>
          </div>
        )}

        <header>
          <div className="relative">
            <div className="relative h-56 overflow-hidden rounded-ucao bg-ucao-navy shadow-ucao sm:h-72">
              <Image
                src={stand.banner_url || IMAGE_ASSETS.standFallback}
                alt=""
                fill
                priority
                sizes="(min-width: 1200px) 1200px, 100vw"
                className="object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </div>
            <span className="absolute -bottom-10 left-5 grid size-24 place-items-center overflow-hidden rounded-full border-4 border-white bg-ucao-soft text-2xl font-bold text-ucao-navy shadow-md sm:left-8 sm:size-28 dark:border-[#0b1626] dark:bg-[#1b2d47] dark:text-white">
              {stand.logo_url ? (
                <Image src={stand.logo_url} alt={"Logo de " + stand.name} fill sizes="112px" className="object-cover" />
              ) : (
                initials(stand.name)
              )}
            </span>
          </div>

          <div className="mt-14 px-1 sm:px-3 sm:pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ucao-soft px-3 py-1 text-xs font-semibold text-ucao-navy dark:bg-[#1b2d47] dark:text-white">
                <StandCategoryIcon category={category} size={14} />
                {getStandCategoryLabel(category)}
              </span>
              <RoleBadge tier={stand.seller_tier} />
            </div>
            <h1 className="mt-3 text-[clamp(30px,5vw,46px)] font-semibold leading-tight">{stand.name}</h1>
            {modes.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Modes proposés">
                {modes.map((mode) => (
                  <li
                    key={mode}
                    className="rounded-full border border-ucao-line px-2.5 py-1 text-xs font-medium text-ucao-navy dark:border-[#2a3a52] dark:text-white"
                  >
                    {getContactModeLabel(mode)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="panel p-6" aria-labelledby="about-title">
              <h2 id="about-title" className="text-xl font-semibold">
                À propos du stand
              </h2>
              <p className="mt-3 whitespace-pre-line text-ucao-muted dark:text-[#a8b8cc]">{stand.description}</p>
              <p className="mt-5 text-sm">
                Responsable : <strong>{stand.seller?.name || "Vendeur UCAO"}</strong>
              </p>
            </section>

            <section className="panel p-6" aria-labelledby="steps-title">
              <h2 id="steps-title" className="text-xl font-semibold">
                Comment ça se passe
              </h2>
              <ol className="mt-4 space-y-4">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ucao-red text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-semibold">{step.title}</span>
                      <span className="block text-sm text-ucao-muted dark:text-[#a8b8cc]">{step.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Contacter le vendeur">
            <section className="panel p-5">
              <h2 className="text-lg font-semibold">Contacter le vendeur</h2>
              {actions.length > 0 ? (
                <>
                  <div className="mt-4 flex flex-col gap-3">
                    {actions.map((action) => (
                      <a
                        key={action.key}
                        className={"btn w-full justify-center " + (action.primary ? "btn-primary" : "btn-ghost")}
                        href={action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle size={18} /> {action.label}
                      </a>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-ucao-muted dark:text-[#a8b8cc]">
                    WhatsApp s’ouvre avec un message déjà écrit. Tu peux le modifier avant de l’envoyer.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-ucao-muted dark:text-[#a8b8cc]">
                  Ce vendeur n’a pas encore ajouté de numéro WhatsApp. Reviens un peu plus tard.
                </p>
              )}
            </section>

            <section className="panel p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-ucao-success-soft text-ucao-success">
                  <ShieldCheck size={20} />
                </span>
                <h2 className="text-lg font-semibold">Acheter en sécurité</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ucao-success" />
                  <span>Rencontre-toi sur le campus, dans un lieu fréquenté.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ucao-success" />
                  <span>Ne paie jamais à l’avance sans avoir vu le produit ou le service.</span>
                </li>
              </ul>
              <Link href="/politique-securite" className="mt-4 inline-block text-sm font-semibold text-ucao-red hover:underline">
                Lire nos conseils de sécurité
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
