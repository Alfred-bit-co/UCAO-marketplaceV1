"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CirclePlus,
  Clock3,
  ExternalLink,
  Lock,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Store,
  Trash2,
  UserCheck,
  X,
} from "@/lib/icons";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { PageShell } from "@/components/page-shell";
import { DashboardSkeleton } from "@/components/skeletons";
import { createProduct, deleteProduct, getMyProducts, updateProduct } from "@/lib/products";
import { createStand, getMyStands } from "@/lib/stands";
import { daysUntilExpiry, formatSubscriptionDate, getMySubscriptionStatus, SUBSCRIPTION_PLANS } from "@/lib/subscriptions";
import type { SubscriptionStatus } from "@/lib/subscriptions";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import type { Product, ProductCategory, Profile, Stand } from "@/lib/types";
import { getCurrentProfile } from "@/lib/users";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "V";
}

function currency(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function ProgressBar({ value, limit, tone = "red" }: { value: number; limit: number; tone?: "red" | "green" }) {
  const percent = limit > 0 ? Math.min((value / limit) * 100, 100) : 0;
  return <div className="h-2 overflow-hidden rounded-full bg-[#e9edf4] dark:bg-[#1a304b]"><div className={`h-full rounded-full ${tone === "green" ? "bg-ucao-success" : "bg-ucao-red"}`} style={{ width: `${percent}%` }} /></div>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [standError, setStandError] = useState<string | null>(null);
  const [standSubmitting, setStandSubmitting] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [standBanner, setStandBanner] = useState<string[]>([]);
  const [, setCurrentTime] = useState(Date.now());

  async function refreshAll(userId: string) {
    const [nextStatus, nextProducts, nextStands] = await Promise.all([getMySubscriptionStatus(), getMyProducts(userId), getMyStands(userId)]);
    setStatus(nextStatus);
    setProducts(nextProducts);
    setStands(nextStands);
  }

  useEffect(() => {
    void (async () => {
      const currentProfile = await getCurrentProfile();
      setProfile(currentProfile);
      if (currentProfile) await refreshAll(currentProfile.id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  async function handleProductSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setProductError(null); setProductSubmitting(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      category: form.get("category") as ProductCategory,
      price: Number(form.get("price") || 0),
      description: String(form.get("description") || ""),
      image_urls: productImages,
    };
    const result = editingProduct ? await updateProduct(profile.id, String(editingProduct.id), payload) : await createProduct(profile.id, payload);
    setProductSubmitting(false);
    if (result.error) { setProductError(result.error); return; }
    setEditingProduct(null); setProductImages([]); event.currentTarget.reset(); await refreshAll(profile.id);
  }

  async function handleDeleteProduct(productId: string) {
    if (!profile || !window.confirm("Supprimer définitivement ce produit ?")) return;
    const ok = await deleteProduct(profile.id, productId);
    if (!ok) { setProductError("Impossible de supprimer ce produit."); return; }
    if (String(editingProduct?.id) === productId) setEditingProduct(null);
    await refreshAll(profile.id);
  }

  async function handleStandSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setStandError(null); setStandSubmitting(true);
    const form = new FormData(event.currentTarget);
    const result = await createStand(profile.id, { name: String(form.get("name") || ""), description: String(form.get("description") || ""), banner_url: standBanner[0] || String(form.get("banner_url") || "") || undefined });
    setStandSubmitting(false);
    if (result.error) { setStandError(result.error); return; }
    event.currentTarget.reset(); setStandBanner([]); await refreshAll(profile.id);
  }

  function editProduct(product: Product) {
    setEditingProduct(product); setProductImages(product.images?.map((image) => image.url) ?? []); setProductError(null);
    document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) return <PageShell><DashboardSkeleton /></PageShell>;
  if (!profile) return <PageShell><main className="container-ucao py-24 text-center"><p className="mb-4 text-xl font-medium">Connectez-vous pour accéder à votre tableau de bord.</p><a className="btn btn-primary" href="/login">Se connecter</a></main></PageShell>;
  if (profile.role === "ADMIN") return <PageShell><main className="container-ucao py-24 text-center"><p className="mb-4 text-xl font-medium">Vous êtes connecté en tant qu&apos;administrateur.</p><a className="btn btn-primary" href="/admin">Aller à l&apos;administration</a></main></PageShell>;
  if (profile.role === "ACHETEUR") return <PageShell><main className="container-ucao py-24 text-center"><p className="mb-4 text-xl font-medium">Vous n&apos;êtes pas encore vendeur.</p><p className="mb-6 text-ucao-muted">Choisissez un palier pour publier vos produits et ouvrir un stand.</p><a className="btn btn-primary" href="/devenir-vendeur"><CirclePlus size={18} /> Devenir vendeur</a></main></PageShell>;

  const daysLeft = daysUntilExpiry(status?.expiresAt ?? null);
  const plan = SUBSCRIPTION_PLANS.find((item) => item.tier === status?.tier);
  const atProductLimit = Boolean(status && !editingProduct && status.productCount >= status.productLimit);
  const atStandLimit = Boolean(status && status.standCount >= status.standLimit);
  const productCapacity = Math.max((status?.productLimit ?? 0) - (status?.productCount ?? 0), 0);
  const standCapacity = Math.max((status?.standLimit ?? 0) - (status?.standCount ?? 0), 0);
  const recentProducts = products.slice(0, 4);

  return (
    <PageShell>
      <main className="min-h-screen bg-[#f5f7fb] pb-20 dark:bg-[#071426]">
        <section className="relative overflow-hidden bg-[linear-gradient(120deg,#18245f_0%,#1e2a6e_56%,#7a1e2d_145%)] pb-28 pt-12 text-white">
          <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 size-56 rounded-full bg-ucao-success/20 blur-3xl" />
          <div className="container-ucao relative">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/65"><UserCheck size={15} /> Espace vendeur</p>
                <h1 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tight">Bonjour, {profile.full_name.split(" ")[0]}.</h1>
                <p className="mt-2 max-w-xl text-white/72">Pilotez votre vitrine, vos produits et votre abonnement depuis un seul espace.</p>
              </div>
              <div className="flex items-center gap-3">
                <a className="inline-flex min-h-11 items-center gap-2 rounded-ucao border border-white/20 bg-white/10 px-4 font-medium text-white transition hover:bg-white/20" href="/products" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Voir le catalogue</a>
                <span className="grid size-12 place-items-center rounded-full bg-white text-sm font-bold text-ucao-navy shadow-lg">{initials(profile.full_name)}</span>
              </div>
            </div>

            <div className="mt-9 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <article className="rounded-ucao border border-white/15 bg-white p-6 text-ucao-ink shadow-2xl shadow-[#071426]/20 dark:bg-[#10233b] dark:text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-ucao-muted dark:text-[#9db0c8]">Abonnement actif</p><h2 className="mt-2 text-3xl font-bold">{status?.tier ?? "—"}</h2><p className="mt-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">{plan ? `${currency(plan.price)} / mois` : "Aucun palier actif"}</p></div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ucao-success-soft px-3 py-1.5 text-xs font-bold text-ucao-success"><CheckCircle2 size={15} /> {status?.isBlocked ? "À renouveler" : "Actif"}</span>
                </div>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div><div className="mb-2 flex justify-between text-xs font-medium text-ucao-muted dark:text-[#a8b8cc]"><span>Produits publiés</span><span>{status?.productCount ?? 0}/{status?.productLimit ?? 0}</span></div><ProgressBar value={status?.productCount ?? 0} limit={status?.productLimit ?? 0} /></div>
                  <div><div className="mb-2 flex justify-between text-xs font-medium text-ucao-muted dark:text-[#a8b8cc]"><span>Stands ouverts</span><span>{status?.standCount ?? 0}/{status?.standLimit ?? 0}</span></div><ProgressBar value={status?.standCount ?? 0} limit={status?.standLimit ?? 0} tone="green" /></div>
                </div>
                <div className="mt-5 grid gap-1 text-sm text-ucao-muted dark:text-[#a8b8cc]">
                  {status?.activatedAt && <p className="flex items-center gap-2"><Clock3 size={15} /> Activé le {formatSubscriptionDate(status.activatedAt)}</p>}
                  {status?.expiresAt && <p className="flex items-center gap-2"><Clock3 size={15} /> Expire le {formatSubscriptionDate(status.expiresAt)}{daysLeft !== null ? status.isBlocked ? " (expiré)" : ` — expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}` : ""}</p>}
                </div>
              </article>
              <article className="rounded-ucao bg-ucao-success p-6 text-white shadow-2xl shadow-[#071426]/20">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Action rapide</p><h2 className="mt-2 text-2xl font-bold">Développez votre vitrine</h2></div><BarChart3 size={24} className="text-white/70" /></div>
                <p className="mt-3 text-sm leading-6 text-white/80">Il vous reste <strong className="text-white">{productCapacity} emplacement{productCapacity > 1 ? "s" : ""}</strong> produit{productCapacity > 1 ? "s" : ""} sur votre palier.</p>
                <button className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-ucao bg-white px-4 font-bold text-ucao-success transition hover:bg-white/90" type="button" onClick={() => document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth" })}><Plus size={17} /> Ajouter un produit</button>
              </article>
            </div>
          </div>
        </section>

        <section className="container-ucao relative z-10 -mt-16 grid gap-4 sm:grid-cols-3">
          <article className="panel p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-ucao bg-ucao-red-soft text-ucao-red"><Package size={19} /></span><ArrowUpRight size={17} className="text-ucao-muted" /></div><p className="mt-5 text-sm font-medium text-ucao-muted">Produits publiés</p><p className="mt-1 text-3xl font-bold">{status?.productCount ?? 0}<span className="ml-1 text-base font-medium text-ucao-muted">/ {status?.productLimit ?? 0}</span></p></article>
          <article className="panel p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-ucao bg-ucao-success-soft text-ucao-success"><Store size={19} /></span><ArrowUpRight size={17} className="text-ucao-muted" /></div><p className="mt-5 text-sm font-medium text-ucao-muted">Stands ouverts</p><p className="mt-1 text-3xl font-bold">{status?.standCount ?? 0}<span className="ml-1 text-base font-medium text-ucao-muted">/ {status?.standLimit ?? 0}</span></p></article>
          <article className="panel p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-ucao bg-ucao-navy-soft text-ucao-navy"><ShieldCheck size={19} /></span><span className="text-xs font-bold text-ucao-success">{status?.isBlocked ? "Inactif" : "Actif"}</span></div><p className="mt-5 text-sm font-medium text-ucao-muted">Statut vendeur</p><p className="mt-1 text-3xl font-bold">{status?.isBlocked ? "Bloqué" : "En ligne"}</p></article>
        </section>

        {(status?.isBlocked || (!status?.isBlocked && daysLeft !== null && daysLeft <= 5)) && <section className="container-ucao mt-5"><div className={`flex flex-wrap items-center gap-3 rounded-ucao px-4 py-3 text-sm font-medium ${status?.isBlocked ? "bg-[#ffe8e8] text-ucao-red dark:bg-[#3a1a1c]" : "bg-ucao-gold-soft text-ucao-red"}`}><Lock size={18} /><span>{status?.isBlocked ? "Votre abonnement a expiré. Vos produits sont masqués publiquement." : `Votre abonnement expire dans ${daysLeft} jour${daysLeft && daysLeft > 1 ? "s" : ""}.`}</span><a className="btn btn-primary ml-auto min-h-9 px-3 text-xs" href="/devenir-vendeur">Renouveler</a></div></section>}

        <section className="container-ucao mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <article className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Votre activité</p><h2 className="text-2xl font-bold">Derniers produits</h2></div><button className="btn btn-ghost min-h-10 px-3 text-sm" type="button" onClick={() => profile && refreshAll(profile.id)}><RefreshCcw size={15} /> Actualiser</button></div>
            {recentProducts.length ? <ul className="mt-5 divide-y divide-ucao-line dark:divide-[#263d5c]">{recentProducts.map((product) => <li key={product.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="relative size-12 shrink-0 overflow-hidden rounded-ucao bg-ucao-soft dark:bg-[#132238]">{product.image_url ? <Image src={product.image_url} alt={product.name} fill sizes="48px" className="object-cover" /> : <Package className="absolute inset-0 m-auto text-ucao-muted" size={19} />}</div><div className="min-w-0 flex-1"><p className="truncate font-medium">{product.name}</p><p className="text-sm text-ucao-muted">{currency(product.price)}</p></div><span className="hidden rounded-full bg-ucao-success-soft px-2.5 py-1 text-xs font-bold text-ucao-success sm:inline-flex">Publié</span><button className="grid size-9 place-items-center rounded-ucao text-ucao-muted transition hover:bg-ucao-soft hover:text-ucao-red" type="button" onClick={() => editProduct(product)} aria-label={`Modifier ${product.name}`}><Pencil size={16} /></button></li>)}</ul> : <div className="mt-5 rounded-ucao bg-ucao-soft p-6 text-center dark:bg-[#132238]"><Package className="mx-auto text-ucao-muted" size={28} /><p className="mt-2 font-medium">Votre catalogue est encore vide.</p><p className="mt-1 text-sm text-ucao-muted">Ajoutez votre premier produit pour commencer.</p></div>}
          </article>
          <article className="panel p-5 sm:p-6"><p className="eyebrow">Capacité</p><h2 className="text-2xl font-bold">Votre palier</h2><div className="mt-6 space-y-5"><div><div className="mb-2 flex justify-between text-sm font-medium"><span>Produits</span><span>{productCapacity} restant{productCapacity > 1 ? "s" : ""}</span></div><ProgressBar value={status?.productCount ?? 0} limit={status?.productLimit ?? 0} /></div><div><div className="mb-2 flex justify-between text-sm font-medium"><span>Stands</span><span>{standCapacity} restant{standCapacity > 1 ? "s" : ""}</span></div><ProgressBar value={status?.standCount ?? 0} limit={status?.standLimit ?? 0} tone="green" /></div></div><div className="mt-7 rounded-ucao bg-ucao-soft p-4 dark:bg-[#132238]"><p className="text-sm font-medium text-ucao-muted">Besoin de plus de visibilité ?</p><a className="mt-3 inline-flex items-center gap-2 font-bold text-ucao-red hover:underline" href="/devenir-vendeur">Changer de palier <ArrowUpRight size={16} /></a></div></article>
        </section>

        <section className="container-ucao mt-5 grid gap-5 lg:grid-cols-2">
          <form id="product-form" className="panel scroll-mt-6 p-5 sm:p-6" onSubmit={handleProductSubmit} key={editingProduct ? String(editingProduct.id) : "new"}>
            <div className="mb-5 flex items-start justify-between gap-3"><div><p className="eyebrow">Catalogue</p><h2 className="text-2xl font-bold">{editingProduct ? "Modifier le produit" : "Ajouter un produit"}</h2></div>{editingProduct && <button className="btn btn-ghost min-h-9 px-3 text-sm" type="button" onClick={() => { setEditingProduct(null); setProductImages([]); }}><X size={15} /> Annuler</button>}</div>
            <div className="grid gap-3"><input className="input-field" name="name" placeholder="Nom du produit" defaultValue={editingProduct?.name ?? ""} required /><select className="select-field" name="category" defaultValue={editingProduct?.category ?? ""} required><option value="" disabled>Catégorie</option>{PRODUCT_CATEGORIES.filter((category) => category.value !== "tous").map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select><input className="input-field" name="price" type="number" min="0" placeholder="Prix en FCFA" defaultValue={editingProduct?.price ?? ""} required /><ImageUpload folder="products" multiple maxFiles={5} label="Photos du produit" value={productImages} onChange={setProductImages} /><textarea className="textarea-field" name="description" placeholder="Description complète" defaultValue={editingProduct?.description ?? ""} required />{productError && <p className="notice notice-error flex items-center gap-2"><AlertTriangle size={16} /> {productError}</p>}{atProductLimit && <p className="notice">Limite atteinte. <a className="underline" href="/devenir-vendeur">Changer de palier</a></p>}<button className="btn btn-primary" type="submit" disabled={productSubmitting || atProductLimit}><CirclePlus size={18} /> {productSubmitting ? "Enregistrement..." : editingProduct ? "Enregistrer les modifications" : "Publier le produit"}</button></div>
          </form>

          <div className="grid gap-5"><form className="panel p-5 sm:p-6" onSubmit={handleStandSubmit}><div className="mb-5 flex items-start justify-between gap-3"><div><p className="eyebrow">Vitrine</p><h2 className="text-2xl font-bold">Ouvrir un stand</h2></div><Store className="text-ucao-success" size={25} /></div><div className="grid gap-3"><input className="input-field" name="name" placeholder="Nom du stand" required /><ImageUpload folder="stands" label="Bannière du stand" value={standBanner} onChange={setStandBanner} compact /><input className="input-field" name="banner_url" type="url" placeholder="URL de bannière (optionnel)" /><textarea className="textarea-field" name="description" placeholder="Description du stand" required />{standError && <p className="notice notice-error flex items-center gap-2"><AlertTriangle size={16} /> {standError}</p>}{atStandLimit && <p className="notice">Votre palier ne permet pas de créer un stand supplémentaire. <a className="underline" href="/devenir-vendeur">Changer de palier</a>.</p>}<button className="btn btn-primary" type="submit" disabled={standSubmitting || atStandLimit}><Store size={18} /> {standSubmitting ? "Création..." : "Créer le stand"}</button></div></form>
            <article className="panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Vos vitrines</p><h2 className="text-2xl font-bold">Stands actifs</h2></div><span className="grid size-10 place-items-center rounded-full bg-ucao-success-soft text-ucao-success"><Store size={18} /></span></div>{stands.length ? <ul className="mt-4 space-y-3">{stands.map((stand) => <li key={stand.id} className="flex items-center justify-between gap-3 rounded-ucao bg-ucao-soft px-3 py-3 dark:bg-[#132238]"><div><p className="font-medium">{stand.name}</p><p className="text-xs text-ucao-muted">{stand.status === "approved" ? "Visible dans le catalogue" : "En attente de validation"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stand.status === "approved" ? "bg-ucao-success-soft text-ucao-success" : "bg-ucao-red-soft text-ucao-red"}`}>{stand.status}</span></li>)}</ul> : <p className="mt-4 rounded-ucao bg-ucao-soft p-4 text-sm font-medium text-ucao-muted dark:bg-[#132238]">Aucun stand pour le moment.</p>}</article></div>
        </section>

        {products.length > 4 && <section className="container-ucao mt-5"><article className="panel p-5"><div className="mb-4 flex items-center justify-between"><div><p className="eyebrow">Gestion</p><h2 className="text-2xl font-bold">Tous vos produits</h2></div><span className="text-sm font-medium text-ucao-muted">{products.length} article{products.length > 1 ? "s" : ""}</span></div><ul className="grid gap-2 sm:grid-cols-2">{products.slice(4).map((product) => <li key={product.id} className="flex items-center justify-between rounded-ucao border border-ucao-line p-3 dark:border-[#263d5c]"><div><p className="font-medium">{product.name}</p><p className="text-sm text-ucao-muted">{currency(product.price)}</p></div><div className="flex gap-1"><button className="btn btn-ghost min-h-9 size-9 p-0" type="button" onClick={() => editProduct(product)} aria-label={`Modifier ${product.name}`}><Pencil size={15} /></button><button className="btn btn-ghost min-h-9 size-9 p-0 text-ucao-red" type="button" onClick={() => handleDeleteProduct(String(product.id))} aria-label={`Supprimer ${product.name}`}><Trash2 size={15} /></button></div></li>)}</ul></article></section>}
      </main>
    </PageShell>
  );
}
