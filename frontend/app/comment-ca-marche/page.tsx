import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Eye,
  Handshake,
  Headset,
  Mail,
  MessageCircle,
  PackagePlus,
  Phone,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
} from "@/lib/icons";
import type { IconComponent } from "@/lib/icons";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { TrialNotice } from "@/components/trial-notice";

export const metadata: Metadata = {
  title: "Comment ça marche — UCAO Marketplace",
  description: "Découvrez comment acheter et vendre entre étudiants sur UCAO Marketplace, et qui contacter en cas de problème.",
};

const ICON_STROKE = 2.2;

// Contact de l'équipe de la plateforme
const SUPPORT_PHONE_DISPLAY = "+228 92 98 29 26";
const SUPPORT_PHONE_LINK = "+22892982926";
const SUPPORT_EMAIL = "ucaomarketplace2026@gmail.com";

type Step = { Icon: IconComponent; title: string; text: string };

const buyerSteps: Step[] = [
  {
    Icon: Search,
    title: "Parcourez les offres",
    text: "Explorez les produits, services et stands du campus, et filtrez par catégorie pour trouver plus vite ce que vous cherchez.",
  },
  {
    Icon: Eye,
    title: "Consultez la fiche produit",
    text: "Vérifiez le prix, les photos et les informations du vendeur. Le cœur permet de dire que vous aimez un produit, même sans compte : le nombre de cœurs est public, jamais l'identité de ceux qui aiment.",
  },
  {
    Icon: MessageCircle,
    title: "Contactez le vendeur sur WhatsApp",
    text: "Convenez du prix, du lieu et de l'heure. Le paiement et la remise du produit se font toujours en personne, sur le campus.",
  },
];

const sellerSteps: Step[] = [
  {
    Icon: UserPlus,
    title: "Créez votre compte vendeur",
    text: "Inscrivez-vous avec votre numéro de téléphone et votre carte d'étudiant : c'est ce qui permet de vérifier que les vendeurs sont de vrais étudiants.",
  },
  {
    Icon: Star,
    title: "Choisissez votre palier",
    text: "STANDARD, PREMIUM ou VIP : un abonnement mensuel payé par Mobile Money (TMoney, Flooz), sans renouvellement automatique.",
  },
  {
    Icon: PackagePlus,
    title: "Publiez vos produits",
    text: "Ajoutez des photos, un prix et une description claire. Les stands, vos vitrines personnalisées, sont disponibles à partir du palier PREMIUM.",
  },
  {
    Icon: Handshake,
    title: "Échangez avec les acheteurs",
    text: "Répondez-leur sur WhatsApp et organisez la remise du produit en personne, sur le campus.",
  },
];

const securityItems: Step[] = [
  {
    Icon: BadgeCheck,
    title: "Vendeurs identifiés",
    text: "Pour vendre, il faut un compte avec un numéro de téléphone et une carte d'étudiant, ce qui limite les comptes créés à la légère.",
  },
  {
    Icon: ShieldCheck,
    title: "Échanges sur le campus",
    text: "Le paiement et la remise du produit se font toujours en personne, sur le campus. Vérifiez la marchandise avant de payer en espèces.",
  },
  {
    Icon: AlertTriangle,
    title: "Signalement simple",
    text: "Un produit ou un comportement vous semble abusif ? Utilisez le lien « Signaler un abus » en bas de chaque page.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <PageShell fullFooter>
      <main className="bg-ucao-soft dark:bg-[#071426]">
        <section className="bg-[linear-gradient(110deg,rgba(30,42,110,.96),rgba(30,42,110,.82)_52%,rgba(122,30,45,.68)),url('/images/hero-etudiants-campus.jpg')] bg-cover bg-center py-20 text-white">
          <div className="container-ucao">
            <p className="mb-4 inline-flex items-center gap-2 rounded-ucao bg-ucao-success px-3 py-2 text-sm font-bold uppercase">
              <ShieldCheck size={17} strokeWidth={ICON_STROKE} /> Guide étudiant
            </p>
            <h1 className="max-w-3xl text-[clamp(38px,6vw,68px)] font-semibold leading-tight">
              Comment ça marche ?
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium text-white/88">
              Acheter et vendre entre étudiants UCAO UUT, simplement : on se contacte sur WhatsApp et on échange en personne sur le campus.
            </p>
          </div>
        </section>

        <section className="container-ucao grid gap-8 py-16 lg:grid-cols-2 lg:items-start">
          <StepGroup title="Acheter" intro="Trouvez rapidement ce dont vous avez besoin pour les cours, les projets ou la vie de campus." steps={buyerSteps} />
          <StepGroup title="Vendre" intro="Transformez votre idée, votre service ou votre stock en une vitrine visible par toute la communauté." steps={sellerSteps} />
        </section>

        <TrialNotice />

        <section className="container-ucao pb-16">
          <div className="rounded-ucao bg-ucao-navy p-7 text-white shadow-ucao md:p-9">
            <p className="eyebrow">
              <BadgeCheck size={16} strokeWidth={ICON_STROKE} /> Sécurité
            </p>
            <h2 className="mb-6 text-[clamp(28px,4vw,44px)] font-medium leading-tight">
              Des échanges plus fiables sur le campus.
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {securityItems.map(({ Icon, title, text }) => (
                <article key={title} className="rounded-ucao bg-white/10 p-5">
                  <span className="grid size-12 place-items-center rounded-ucao bg-ucao-success text-white">
                    <Icon size={25} strokeWidth={ICON_STROKE} />
                  </span>
                  <h3 className="mt-4 text-xl font-medium">{title}</h3>
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

        <section className="container-ucao pb-[84px]">
          <div className="panel p-6 md:p-7">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-ucao bg-ucao-success text-white">
                <Headset size={24} strokeWidth={ICON_STROKE} />
              </span>
              <div>
                <h2 className="text-2xl font-medium">Un problème ? Contactez-nous</h2>
                <p className="mt-2 max-w-2xl text-ucao-muted dark:text-[#a8b8cc]">
                  Un souci avec un vendeur, un abonnement ou votre compte ? L&apos;équipe de la plateforme est joignable par téléphone,
                  sur WhatsApp et par e-mail. Vous trouverez aussi des réponses rapides dans la{" "}
                  <Link className="font-medium text-ucao-red underline" href="/faq">
                    FAQ
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="btn btn-primary" href={"tel:" + SUPPORT_PHONE_LINK}>
                <Phone size={18} strokeWidth={ICON_STROKE} /> {SUPPORT_PHONE_DISPLAY}
              </a>
              <a
                className="btn btn-ghost"
                href={"https://wa.me/" + SUPPORT_PHONE_LINK.replace("+", "")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} strokeWidth={ICON_STROKE} /> WhatsApp
              </a>
              <a className="btn btn-ghost" href={"mailto:" + SUPPORT_EMAIL}>
                <Mail size={18} strokeWidth={ICON_STROKE} /> {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function StepGroup({ title, intro, steps }: { title: string; intro: string; steps: Step[] }) {
  return (
    <section className="panel p-6 md:p-7">
      <h2 className="text-3xl font-medium">{title}</h2>
      <p className="mt-3 text-ucao-muted dark:text-[#a8b8cc]">{intro}</p>
      <div className="mt-7 grid gap-4">
        {steps.map(({ Icon, title: stepTitle, text }, index) => (
          <article key={stepTitle} className="flex gap-4 rounded-ucao bg-ucao-soft p-4 dark:bg-[#0b1c31]">
            <span className="grid size-12 shrink-0 place-items-center rounded-ucao bg-ucao-success text-white">
              <Icon size={24} strokeWidth={ICON_STROKE} />
            </span>
            <div>
              <span className="text-xs font-bold uppercase text-ucao-red">Étape {index + 1}</span>
              <h3 className="text-xl font-medium">{stepTitle}</h3>
              <p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
