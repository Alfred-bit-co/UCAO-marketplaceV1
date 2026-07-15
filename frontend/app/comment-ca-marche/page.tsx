import Link from "next/link";
import {
  BadgeCheck,
  CreditCard,
  PackagePlus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
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
    Icon: ShoppingCart,
    title: "Ajoute au panier",
    text: "Choisis ce qu'il te faut et vérifie les informations du vendeur.",
  },
  {
    Icon: CreditCard,
    title: "Paie via Mobile Money",
    text: "Finalise la transaction avec un paiement mobile simple et sécurisé.",
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
    Icon: Truck,
    title: "Reçois les commandes",
    text: "Suis les demandes et organise la remise sur le campus.",
  },
];

const securityItems: { Icon: LucideIcon; title: string; text: string }[] = [
  {
    Icon: BadgeCheck,
    title: "Vendeurs vérifiés",
    text: "Les stands sérieux sont mieux identifiés pour limiter les échanges douteux.",
  },
  {
    Icon: ShieldCheck,
    title: "Paiement sécurisé",
    text: "La plateforme s'appuie sur Supabase Auth, RLS et une vérification des paiements.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <PageShell fullFooter>
      <main className="bg-ucao-soft dark:bg-[#071426]">
        <section className="bg-[linear-gradient(110deg,rgba(11,37,69,.96),rgba(11,37,69,.82)_52%,rgba(46,125,91,.72)),url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center py-20 text-white">
          <div className="container-ucao">
            <p className="mb-4 inline-flex items-center gap-2 rounded-ucao bg-ucao-success px-3 py-2 text-sm font-black uppercase">
              <ShieldCheck size={17} strokeWidth={ICON_STROKE} /> Guide étudiant
            </p>
            <h1 className="max-w-3xl text-[clamp(38px,6vw,68px)] font-extrabold leading-tight">
              Comment ça marche ?
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium text-white/88">
              Acheter, vendre et payer entre étudiants UCAO UUT, sans compliquer les choses.
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
              <Link className="btn bg-ucao-success text-white hover:bg-ucao-green-dark" href="/register">
                Créer un stand
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
