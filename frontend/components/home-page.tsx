"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  GraduationCap,
  HandCoins,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { HERO_IMAGES } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

const ICON_STROKE = 2.2;

export function HomePage({ featuredProducts }: { featuredProducts: Product[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((value) => (value + 1) % HERO_IMAGES.length), 6500);
    return () => window.clearInterval(id);
  }, []);

  const setNext = (step: number) => setIndex((value) => (value + step + HERO_IMAGES.length) % HERO_IMAGES.length);

  const promises: { Icon: LucideIcon; title: string; text: string; tone: "green" | "navy" }[] = [
    {
      Icon: ShieldCheck,
      title: "Vendeurs vérifiés",
      text: "Des stands identifiés, des profils suivis et des échanges plus sûrs sur le campus.",
      tone: "green",
    },
    {
      Icon: GraduationCap,
      title: "Esprit UCAO UUT",
      text: "Une vitrine simple pour les étudiants, clubs et projets qui font vivre l'université.",
      tone: "navy",
    },
  ];

  const steps: { Icon: LucideIcon; label: string }[] = [
    { Icon: ShoppingBag, label: "Acheter utile" },
    { Icon: Store, label: "Vendre vite" },
    { Icon: HandCoins, label: "Payer Mobile Money" },
  ];

  return (
    <main>
      <section className="relative grid min-h-[640px] items-center overflow-hidden lg:min-h-[650px]">
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
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,20,38,.92),rgba(11,37,69,.76)_48%,rgba(46,125,91,.62)_78%,rgba(193,39,45,.45))]" />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-[linear-gradient(0deg,rgba(246,249,251,1),rgba(246,249,251,0))] dark:bg-[linear-gradient(0deg,rgba(7,20,38,1),rgba(7,20,38,0))]" />

        <button
          className="absolute left-5 top-1/2 z-10 hidden size-[42px] -translate-y-1/2 place-items-center rounded-ucao bg-white/18 text-white backdrop-blur md:grid"
          type="button"
          aria-label="Image précédente"
          onClick={() => setNext(-1)}
        >
          <ChevronLeft size={22} strokeWidth={ICON_STROKE} />
        </button>
        <button
          className="absolute right-5 top-1/2 z-10 hidden size-[42px] -translate-y-1/2 place-items-center rounded-ucao bg-white/18 text-white backdrop-blur md:grid"
          type="button"
          aria-label="Image suivante"
          onClick={() => setNext(1)}
        >
          <ChevronRight size={22} strokeWidth={ICON_STROKE} />
        </button>

        <div className="container-ucao relative z-10 grid gap-9 py-20 text-white lg:grid-cols-[1.05fr_.75fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-ucao bg-ucao-success/90 px-3 py-2 text-sm font-black uppercase">
              <BadgeCheck size={17} strokeWidth={ICON_STROKE} /> Campus vérifié
            </p>
            <h1 className="max-w-[760px] text-[clamp(44px,7vw,82px)] font-extrabold leading-[.95]">
              Achète. Vends. Avance.
            </h1>
            <p className="my-6 max-w-[620px] text-lg font-medium text-white/88">
              Le marché simple pour acheter, vendre et trouver des services entre étudiants UCAO UUT.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Link className="btn btn-primary" href="/products">
                <ShoppingBag size={18} strokeWidth={ICON_STROKE} /> Explorer
              </Link>
              <Link className="btn btn-light" href="/comment-ca-marche">
                <Sparkles size={18} strokeWidth={ICON_STROKE} /> Comment ça marche
              </Link>
              <Link className="btn bg-ucao-success text-white shadow-[0_14px_28px_rgba(46,125,91,0.3)] hover:bg-ucao-green-dark" href="/register">
                <CirclePlus size={18} strokeWidth={ICON_STROKE} /> Créer un stand
              </Link>
            </div>
          </div>

          <div className="hidden rounded-ucao border border-white/20 bg-white/12 p-5 shadow-ucao backdrop-blur-md lg:block">
            <div className="grid gap-4">
              {steps.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-ucao bg-white/14 p-4">
                  <span className="grid size-11 place-items-center rounded-ucao bg-ucao-success text-white">
                    <Icon size={22} strokeWidth={ICON_STROKE} />
                  </span>
                  <strong>{label}</strong>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-ucao bg-white p-5 text-ucao-navy">
              <span className="role-badge">Vendeur vérifié</span>
              <strong className="mt-3 block text-2xl">Stand actif en quelques minutes</strong>
              <p className="mt-2 text-sm text-ucao-muted">Publie tes produits, reçois les commandes et garde le contact avec les acheteurs.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-ucao relative z-10 -mt-8 grid gap-5 md:grid-cols-2" aria-label="Avantages de la plateforme">
        {promises.map(({ Icon, title, text, tone }) => (
          <article key={title} className="panel p-6">
            <span className={`mb-5 grid size-[54px] place-items-center rounded-ucao text-white ${tone === "green" ? "bg-ucao-success" : "bg-ucao-navy"}`}>
              <Icon size={28} strokeWidth={ICON_STROKE} />
            </span>
            <h2 className="mb-2 text-2xl font-bold">{title}</h2>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">{text}</p>
          </article>
        ))}
      </section>

      <section className="container-ucao grid gap-8 py-[86px] md:grid-cols-[.9fr_1.1fr] md:items-center">
        <div>
          <p className="eyebrow">
            <UsersRound size={16} strokeWidth={ICON_STROKE} /> Simple et campus
          </p>
          <h2 className="mb-4 text-[clamp(30px,4vw,48px)] font-bold leading-tight">
            Tout ce qu&apos;il faut pour vendre entre étudiants.
          </h2>
          <p className="max-w-xl text-ucao-muted dark:text-[#a8b8cc]">
            Moins de bruit, plus d&apos;utile : produits, services, stands et paiements pensés pour la vie à l&apos;UCAO UUT.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ Icon, label }) => (
            <div key={label} className="rounded-ucao bg-ucao-success-soft p-5 text-ucao-success dark:bg-[#123628] dark:text-[#7bd3ad]">
              <Icon size={28} strokeWidth={ICON_STROKE} />
              <strong className="mt-3 block text-ucao-navy dark:text-white">{label}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="container-ucao pb-[84px]">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">
              <ShoppingBag size={16} strokeWidth={ICON_STROKE} /> Marketplace
            </p>
            <h2 className="text-[clamp(30px,4vw,48px)] font-bold leading-tight">Produits en vedette</h2>
          </div>
          <Link className="btn btn-ghost" href="/products">
            Voir tout <ArrowRight size={18} strokeWidth={ICON_STROKE} />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featuredProducts.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
