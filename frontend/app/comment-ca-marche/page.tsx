import Link from "next/link";
import {
  BadgeCheck,
  Eye,
  Handshake,
  MessageCircle,
  PackagePlus,
  Search,
  ShieldCheck,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageShell } from "@/components/page-shell";

const ICON_STROKE = 2.2;

const buyerSteps: { Icon: LucideIcon; title: string; text: string }[] = [
  {
    Icon: Search,
    title: "Parcours les offres",
    text: "Explore les produits, services et stands disponibles sur le campus.",
  },
  {
    Icon: Eye,
    title: "Consulte la fiche produit",
    text: "Vérifie le prix, les photos et les informations du vendeur avant de le contacter.",
  },
  {
    Icon: MessageCircle,
    title: "Contacte le vendeur sur WhatsApp",
    text: "Convenez ensemble du prix, du lieu et de l'heure pour finaliser l'échange en personne, sur le campus.",
  },
];

const sellerSteps: { Icon: LucideIcon; title: string; text: string }[] = [
  {
    Icon: Store,
    title: "Crée ton stand",
    text: "Présente ton activité, ton club ou ton projet étudiant.",
  },
  {
    Icon: PackagePlus,
    title: "Publie tes produits",
    text: "Ajoute photos, prix et descriptions claires pour attirer les acheteurs.",
  },
  {
    Icon: Handshake,
    title: "Échange avec les acheteurs",
    text: "Réponds-leur sur WhatsApp et organise la remise du produit en personne, sur le campus.",
  },
];

const securityItems: { Icon: LucideIcon; title: string; text: string }[] = [
  {
    Icon: BadgeCheck,
    title: "Vendeurs identifiés",
    text: "Chaque vendeur a payé un abonnement pour publier, ce qui limite les comptes créés à la légère.",
  },
  {
    Icon: ShieldCheck,
    title: "Échanges sur le campus",
    text: "Le paiement et la remise du produit se font toujours en personne, sur le campus. Vérifiez la marchandise avant de payer en espèces.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <PageShell fullFooter>
      <main className="bg-ucao-soft dark:bg-[#071426]">
        <section className="bg-[linear-gradient(110deg,rgba(30,42,110,.96),rgba(30,42,110,.82)_52%,rgba(122,30,45,.68)),url('/images/hero-etudiants-campus.jpg')] bg-cover bg-center py-20 text-white">
          <div className="container-ucao">
            <p className="mb-4 inline-flex items-center gap-2 rounded-ucao bg-ucao-success px-3 py-2 text-sm font-black uppercase">
              <ShieldCheck size={17} strokeWidth={ICON_STROKE} /> Guide étudiant
            </p>
            <h1 className="max-w-3xl text-[clamp(38px,6vw,68px)] font-extrabold leading-tight">
              Comment ça marche ?
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium text-white/88">
              Acheter et vendre entre étudiants UCAO UUT, simplement, via WhatsApp et en personne sur le campus.
            </p>
          </div>
        </section>

        <section className="container-ucao grid gap-8 py-16 lg:grid-cols-2">
          <StepGroup title="Acheter" intro="Trouve rapidement ce dont tu as besoin pour les cours, les projets ou la vie de campus." steps={buyerSteps} />
          <StepGroup title="Vendre" intro="Transforme ton idée, ton service ou ton stock en stand visible par la communauté." steps={sellerSteps} />
        </section>

        <section className="container-ucao pb-16">
          <div className="rounded-ucao bg-ucao-navy p-7 text-white shadow-ucao md:p-9">
            <p className="eyebrow">
              <BadgeCheck size={16} strokeWidth={ICON_STROKE} /> Sécurité
            </p>
            <h2 className="mb-6 text-[clamp(28px,4vw,44px)] font-bold leading-tight">
              Des échanges plus fiables sur le campus.
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {securityItems.map(({ Icon, title, text }) => (
                <article key={title} className="rounded-ucao bg-white/10 p-5">
                  <span className="grid size-12 place-items-center rounded-ucao bg-ucao-success text-white">
                    <Icon size={25} strokeWidth={ICON_STROKE} />
                  </span>
                  <h3 className="mt-4 text-xl font-bold">{title}</h3>
                  <p className="mt-2 text-white/78">{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="btn btn-primary" href="/products">
                Voir les produits
              </Link>
              <Link className="btn btn-primary" href="/devenir-vendeur">
                Devenir vendeur
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function StepGroup({
  title,
  intro,
  steps,
}: {
  title: string;
  intro: string;
  steps: { Icon: LucideIcon; title: string; text: string }[];
}) {
  return (
    <section className="panel p-6 md:p-7">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="mt-3 text-ucao-muted dark:text-[#a8b8cc]">{intro}</p>
      <div className="mt-7 grid gap-4">
        {steps.map(({ Icon, title: stepTitle, text }, index) => (
          <article key={stepTitle} className="flex gap-4 rounded-ucao bg-ucao-soft p-4 dark:bg-[#0b1c31]">
            <span className="grid size-12 shrink-0 place-items-center rounded-ucao bg-ucao-success text-white">
              <Icon size={24} strokeWidth={ICON_STROKE} />
            </span>
            <div>
              <span className="text-xs font-black uppercase text-ucao-red">Étape {index + 1}</span>
              <h3 className="text-xl font-bold">{stepTitle}</h3>
              <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}