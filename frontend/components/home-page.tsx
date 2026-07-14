"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CirclePlus,
  CreditCard,
  Landmark,
  LockKeyhole,
  MessagesSquare,
  PackageCheck,
  Rocket,
  ScanSearch,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trophy,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { HERO_IMAGES } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export function HomePage({ featuredProducts }: { featuredProducts: Product[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((value) => (value + 1) % HERO_IMAGES.length), 6500);
    return () => window.clearInterval(id);
  }, []);

  const setNext = (step: number) => setIndex((value) => (value + step + HERO_IMAGES.length) % HERO_IMAGES.length);

  const features: { Icon: LucideIcon; number: string; title: string; text: string }[] = [
    { Icon: ShieldCheck, number: "01", title: "Vendeurs vérifiés", text: "Les comptes sont contrôlés pour protéger les échanges sur le campus." },
    { Icon: Landmark, number: "02", title: "Esprit UCAO UUT", text: "Une vitrine pensée pour les étudiants, les clubs et les projets académiques." },
    { Icon: WalletCards, number: "03", title: "Prix accessibles", text: "Des offres adaptées à la vie étudiante et aux besoins du quotidien." },
    { Icon: MessagesSquare, number: "04", title: "Contact rapide", text: "Chaque stand indique clairement comment joindre le vendeur." },
  ];

  const stats: { Icon: LucideIcon; number: string; label: string }[] = [
    { Icon: Store, number: "48", label: "stands actifs" },
    { Icon: PackageCheck, number: "320", label: "produits publiés" },
    { Icon: UsersRound, number: "1900", label: "étudiants touchés" },
    { Icon: Trophy, number: "12", label: "projets primés" },
  ];

  return (
    <main>
      <section className="relative grid min-h-[640px] items-center overflow-visible lg:min-h-[630px]">
        <div className="absolute inset-0">
          {HERO_IMAGES.map((image, imageIndex) => (
            <Image
              key={image.src}
              src={image.src}
              alt={image.alt}
              fill
              priority={imageIndex === 0}
              className={`object-cover transition-opacity duration-700 ${imageIndex === index ? "opacity-100" : "opacity-0"}`}
              sizes="100vw"
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,28,54,.86),rgba(9,28,54,.58)_45%,rgba(9,28,54,.2))]" />
        <button
          className="absolute left-5 top-1/2 z-10 hidden size-[42px] -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white md:grid"
          type="button"
          aria-label="Image précédente"
          onClick={() => setNext(-1)}
        >
          ‹
        </button>
        <button
          className="absolute right-5 top-1/2 z-10 hidden size-[42px] -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white md:grid"
          type="button"
          aria-label="Image suivante"
          onClick={() => setNext(1)}
        >
          ›
        </button>
        <div className="container-ucao relative z-10 pb-24 text-white">
          <p className="eyebrow">
            <BadgeCheck size={16} /> Bienvenue à UCAO UUT Marketplace
          </p>
          <h1 className="max-w-[760px] text-[clamp(42px,6vw,72px)] font-bold leading-[.98]">
            La marketplace universitaire pour acheter, vendre et créer ensemble.
          </h1>
          <p className="my-6 max-w-[620px] text-lg text-white/85">
            Découvrez les produits, services et projets des étudiants, clubs et entrepreneurs du campus dans un espace fiable,
            moderne et sécurisé.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Link className="btn btn-primary" href="/products">
              <ShoppingBag size={18} /> Explorer le marché
            </Link>
            <Link className="btn btn-light" href="/register">
              <Store size={18} /> Ouvrir mon stand
            </Link>
          </div>
        </div>
      </section>

      <section className="container-ucao relative z-10 -mt-[92px] grid gap-[18px] md:grid-cols-2 lg:grid-cols-4" aria-label="Avantages de la plateforme">
        {features.map(({ Icon, number, title, text }) => (
          <article key={title} className="relative min-h-[186px] overflow-hidden rounded-ucao bg-white p-6 shadow-ucao dark:bg-[#132238]">
            <span className="mb-[18px] grid size-[54px] place-items-center rounded-full bg-ucao-green text-white">
              <Icon size={28} />
            </span>
            <span className="absolute right-5 top-[18px] text-3xl font-black text-ucao-green/25">{number}</span>
            <h2 className="mb-2 text-lg font-bold">{title}</h2>
            <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">{text}</p>
          </article>
        ))}
      </section>

      <section className="container-ucao grid gap-[70px] py-[110px] md:grid-cols-[.95fr_1.05fr] md:items-center">
        <div className="relative grid grid-cols-2 gap-[18px]" aria-hidden="true">
          <Image className="row-span-2 h-[438px] rounded-ucao object-cover shadow-card" src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=900&q=85" alt="" width={450} height={438} />
          <Image className="h-[210px] rounded-ucao object-cover shadow-card" src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=600&q=85" alt="" width={300} height={210} />
          <Image className="h-[210px] rounded-ucao object-cover shadow-card" src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=85" alt="" width={300} height={210} />
          <div className="absolute bottom-6 left-7 w-[170px] rounded-ucao bg-ucao-gold p-[18px] text-white shadow-ucao">
            <strong className="block text-[28px]">100%</strong>
            <span className="text-[13px] font-extrabold">communauté campus</span>
          </div>
        </div>
        <div>
          <p className="eyebrow">
            <BookOpenCheck size={16} /> À propos
          </p>
          <h2 className="mb-4 text-[clamp(30px,4vw,48px)] font-bold leading-tight">
            Un écosystème qui valorise les talents de l’université.
          </h2>
          <p className="mb-6 text-ucao-muted dark:text-[#a8b8cc]">
            UCAO Market rassemble les petites ventes, services, créations, événements et initiatives étudiantes dans une seule
            expérience claire.
          </p>
          <div className="my-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
              <ScanSearch className="text-ucao-green" size={26} />
              <strong className="block">Recherche claire</strong>
              <span className="mt-1.5 block text-sm text-ucao-muted dark:text-[#a8b8cc]">Produits et stands filtrables en quelques secondes.</span>
            </div>
            <div className="rounded-ucao bg-ucao-soft p-[18px] dark:bg-[#132238]">
              <LockKeyhole className="text-ucao-green" size={26} />
              <strong className="block">Sécurité renforcée</strong>
              <span className="mt-1.5 block text-sm text-ucao-muted dark:text-[#a8b8cc]">Auth Supabase, RLS et micro-service paiement dédié.</span>
            </div>
          </div>
          <Link className="btn btn-primary" href="/stands">
            <ArrowRight size={18} /> Voir les stands
          </Link>
        </div>
      </section>

      <section className="bg-[linear-gradient(rgba(0,122,99,.86),rgba(0,122,99,.86)),url('https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center py-[72px] text-white">
        <div className="container-ucao grid gap-5 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ Icon, number, label }) => (
            <div key={label} className="grid justify-items-center gap-2">
              <Icon className="rounded-full bg-ucao-gold p-3.5" size={58} />
              <strong className="text-[42px] leading-none">{number}</strong>
              <span className="font-extrabold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container-ucao pb-[60px]">
        <div className="py-[76px] pb-7 text-center">
          <p className="eyebrow">
            <CreditCard size={16} /> Abonnements
          </p>
          <h2 className="mx-auto mb-4 text-[clamp(30px,4vw,48px)] font-bold leading-tight">Choisissez le niveau adapté à votre activité.</h2>
          <p className="mx-auto max-w-[620px] text-ucao-muted dark:text-[#a8b8cc]">
            L’activation sera automatisée via FedaPay. Le backend ne garde que l’initiation de transaction et le webhook.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Simple", "Découverte", "Compte vendeur de base pour consulter la marketplace et publier progressivement.", "0 FCFA"],
            ["Premium", "Mensuel ou annuel", "Jusqu’à 3 stands, meilleure visibilité et outils vendeur avancés.", "Activation paiement"],
            ["VIP", "Performance", "Jusqu’à 5 stands, priorité d’affichage, médaille VIP et accès IA futur.", "FedaPay"],
          ].map(([role, title, text, price], cardIndex) => (
            <article key={role} className={`rounded-ucao border bg-white p-6 shadow-card dark:bg-[#132238] ${cardIndex === 1 ? "-translate-y-2 border-ucao-gold" : "border-ucao-line dark:border-[#2a3a52]"}`}>
              <span className="role-badge">{role}</span>
              <h3 className="my-4 text-2xl font-bold">{title}</h3>
              <p className="text-ucao-muted dark:text-[#a8b8cc]">{text}</p>
              <strong className="mt-[18px] block text-xl text-ucao-green dark:text-[#4dd4b8]">{price}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="container-ucao py-[76px] pb-7 text-center">
        <p className="eyebrow">
          <ShoppingCart size={16} /> Marketplace
        </p>
        <h2 className="mb-4 text-[clamp(30px,4vw,48px)] font-bold leading-tight">Découvrez les offres populaires</h2>
        <p className="mx-auto max-w-[620px] text-ucao-muted dark:text-[#a8b8cc]">Une sélection de produits et services pensés pour la communauté UCAO UUT.</p>
      </section>
      <section className="container-ucao grid gap-6 pb-[84px] md:grid-cols-3">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      <section className="bg-ucao-ink py-[62px] text-white dark:bg-[#071827]">
        <div className="container-ucao flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">
              <Rocket size={16} /> Prêt à lancer votre activité ?
            </p>
            <h2 className="text-[clamp(30px,4vw,48px)] font-bold leading-tight">Créez votre stand en quelques minutes.</h2>
          </div>
          <Link className="btn btn-light" href="/register">
            <CirclePlus size={18} /> Commencer
          </Link>
        </div>
      </section>
    </main>
  );
}
