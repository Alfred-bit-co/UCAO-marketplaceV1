"use client";
import {
  AlertTriangle,
  CirclePlus,
  Clock,
  Lock,
  PackageCheck,
  Pencil,
  ShieldCheck,
  Store,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { createProduct, deleteProduct, getMyProducts, updateProduct } from "@/lib/products";
import { createStand, getMyStands } from "@/lib/stands";
import { daysUntilExpiry, getMySubscriptionStatus, SUBSCRIPTION_PLANS } from "@/lib/subscriptions";
import type { SubscriptionStatus } from "@/lib/subscriptions";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import type { Product, Profile, ProductCategory, Stand } from "@/lib/types";
import { getCurrentProfile } from "@/lib/users";

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

  async function refreshAll(userId: string) {
    const [nextStatus, nextProducts, nextStands] = await Promise.all([
      getMySubscriptionStatus(),
      getMyProducts(userId),
      getMyStands(userId),
    ]);
    setStatus(nextStatus);
    setProducts(nextProducts);
    setStands(nextStands);
  }

  useEffect(() => {
    (async () => {
      const currentProfile = await getCurrentProfile();
      setProfile(currentProfile);
      if (currentProfile) {
        await refreshAll(currentProfile.id);
      }
      setLoading(false);
    })();
  }, []);

  async function handleProductSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setProductError(null);
    setProductSubmitting(true);

    const form = new FormData(event.currentTarget);
    const imageUrlsRaw = String(form.get("image_urls") || "");
    const image_urls = imageUrlsRaw
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);

    const payload = {
      name: String(form.get("name") || ""),
      category: form.get("category") as ProductCategory,
      price: Number(form.get("price") || 0),
      description: String(form.get("description") || ""),
      image_urls,
    };

    const { error } = editingProduct
      ? await updateProduct(profile.id, String(editingProduct.id), payload)
      : await createProduct(profile.id, payload);

    setProductSubmitting(false);
    if (error) {
      setProductError(error);
      return;
    }
    setEditingProduct(null);
    (event.target as HTMLFormElement).reset();
    await refreshAll(profile.id);
  }

  async function handleDeleteProduct(productId: string) {
    if (!profile) return;
    if (!window.confirm("Supprimer définitivement ce produit ?")) return;
    const ok = await deleteProduct(profile.id, productId);
    if (!ok) {
      setProductError("Impossible de supprimer ce produit.");
      return;
    }
    if (editingProduct && String(editingProduct.id) === productId) {
      setEditingProduct(null);
    }
    await refreshAll(profile.id);
  }

  async function handleStandSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setStandError(null);
    setStandSubmitting(true);

    const form = new FormData(event.currentTarget);
    const { error } = await createStand(profile.id, {
      name: String(form.get("name") || ""),
      description: String(form.get("description") || ""),
      banner_url: String(form.get("banner_url") || "") || undefined,
    });

    setStandSubmitting(false);
    if (error) {
      setStandError(error);
      return;
    }
    (event.target as HTMLFormElement).reset();
    await refreshAll(profile.id);
  }

  if (loading) {
    return (
      <PageShell>
        <main className="container-ucao py-[84px] text-center">Chargement...</main>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell>
        <main className="container-ucao py-[84px] text-center">
          <p className="mb-4 text-xl font-bold">Connectez-vous pour accéder à votre tableau de bord.</p>
          <a className="btn btn-primary" href="/login">
            Se connecter
          </a>
        </main>
      </PageShell>
    );
  }

  if (profile.role === "ADMIN") {
    return (
      <PageShell>
        <main className="container-ucao py-[84px] text-center">
          <p className="mb-4 text-xl font-bold">Vous êtes connecté en tant qu&apos;administrateur.</p>
          <a className="btn btn-primary" href="/admin">
            Aller à l&apos;administration
          </a>
        </main>
      </PageShell>
    );
  }

  if (profile.role === "ACHETEUR") {
    return (
      <PageShell>
        <main className="container-ucao py-[84px] text-center">
          <p className="mb-4 text-xl font-bold">Vous n&apos;êtes pas encore vendeur.</p>
          <p className="mb-6 text-ucao-muted dark:text-[#a8b8cc]">
            Choisissez un palier pour publier vos produits et ouvrir un stand.
          </p>
          <a className="btn btn-primary" href="/devenir-vendeur">
            <CirclePlus size={18} /> Devenir vendeur
          </a>
        </main>
      </PageShell>
    );
  }

  const daysLeft = daysUntilExpiry(status?.expiresAt ?? null);
  const plan = SUBSCRIPTION_PLANS.find((item) => item.tier === status?.tier);
  const atProductLimit = !editingProduct && (status?.productCount ?? 0) >= (status?.productLimit ?? 0);
  const atStandLimit = (status?.standCount ?? 0) >= (status?.standLimit ?? 0);

  return (
    <PageShell>
      <main>
        <PageHero icon={UserCheck} eyebrow="Tableau de bord" title="Suivi de votre activité">
          Gardez une vue claire sur votre abonnement, vos produits et vos stands.
        </PageHero>

        {status?.isBlocked && (
          <section className="container-ucao pt-[42px]">
            <div className="notice notice-error flex items-center gap-3">
              <Lock size={20} />
              <div>
                <strong>Votre abonnement a expiré.</strong> Vos produits et votre stand sont masqués publiquement.
                Renouvelez pour reprendre la publication.
              </div>
              <a className="btn btn-primary ml-auto" href="/devenir-vendeur">
                Renouveler
              </a>
            </div>
          </section>
        )}

        {!status?.isBlocked && daysLeft !== null && daysLeft <= 5 && (
          <section className="container-ucao pt-[42px]">
            <div className="notice flex items-center gap-3">
              <Clock size={20} />
              <div>
                Votre abonnement expire dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}. Pensez à renouveler.
              </div>
              <a className="btn btn-ghost ml-auto" href="/devenir-vendeur">
                Renouveler
              </a>
            </div>
          </section>
        )}

        <section className="container-ucao grid gap-5 py-[42px] pb-[84px] md:grid-cols-3">
          <article className="panel p-5">
            <span className="tag">
              <ShieldCheck size={16} /> Palier
            </span>
            <h2 className="mt-3 text-3xl font-bold">{status?.tier ?? "—"}</h2>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">
              {plan ? `${plan.price.toLocaleString("fr-FR")} FCFA / mois` : ""}
              {status?.expiresAt && ` — expire le ${new Date(status.expiresAt).toLocaleDateString("fr-FR")}`}
            </p>
          </article>
          <article className="panel p-5">
            <span className="tag">
              <PackageCheck size={16} /> Produits
            </span>
            <h2 className="mt-3 text-3xl font-bold">
              {status?.productCount ?? 0} / {status?.productLimit ?? 0}
            </h2>
            {atProductLimit && (
              <p className="mt-1 text-sm text-ucao-red">
                Limite atteinte —{" "}
                <a className="underline" href="/devenir-vendeur">
                  changer de palier
                </a>
              </p>
            )}
          </article>
          <article className="panel p-5">
            <span className="tag">
              <Store size={16} /> Stands
            </span>
            <h2 className="mt-3 text-3xl font-bold">
              {status?.standCount ?? 0} / {status?.standLimit ?? 0}
            </h2>
            {atStandLimit && status?.standLimit !== 0 && (
              <p className="mt-1 text-sm text-ucao-red">
                Limite atteinte —{" "}
                <a className="underline" href="/devenir-vendeur">
                  changer de palier
                </a>
              </p>
            )}
          </article>
        </section>

        <section className="container-ucao grid gap-5 pb-[84px] md:grid-cols-2">
          <form className="panel p-5" onSubmit={handleProductSubmit} key={editingProduct ? String(editingProduct.id) : "new"}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
              {editingProduct && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductError(null);
                  }}
                >
                  <X size={16} /> Annuler
                </button>
              )}
            </div>
            <div className="grid gap-4">
              <label className="sr-only" htmlFor="product-name">Nom du produit</label>
              <input
                id="product-name"
                className="input-field"
                name="name"
                placeholder="Nom du produit"
                defaultValue={editingProduct?.name ?? ""}
                required
              />
              <label className="sr-only" htmlFor="product-category">Catégorie</label>
              <select
                id="product-category"
                className="select-field"
                name="category"
                required
                defaultValue={editingProduct?.category ?? ""}
              >
                <option value="" disabled>Catégorie</option>
                {PRODUCT_CATEGORIES.filter((c) => c.value !== "tous").map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="product-price">Prix en FCFA</label>
              <input
                id="product-price"
                className="input-field"
                name="price"
                type="number"
                min="0"
                placeholder="Prix en FCFA"
                defaultValue={editingProduct?.price ?? ""}
                required
              />
              <label className="sr-only" htmlFor="product-images">Images</label>
              <input
                id="product-images"
                className="input-field"
                name="image_urls"
                type="text"
                placeholder="URL(s) image Supabase Storage, séparées par une virgule"
                defaultValue={editingProduct?.images?.map((img) => img.url).join(", ") ?? ""}
              />
              <label className="sr-only" htmlFor="product-description">Description complète</label>
              <textarea
                id="product-description"
                className="textarea-field"
                name="description"
                placeholder="Description complète"
                defaultValue={editingProduct?.description ?? ""}
                required
              />
              {productError && (
                <p className="notice notice-error flex items-center gap-2">
                  <AlertTriangle size={16} /> {productError}
                </p>
              )}
              {atProductLimit && (
                <p className="notice">
                  Vous avez atteint la limite de produits de votre palier ({status?.productLimit}).{" "}
                  <a className="underline" href="/devenir-vendeur">Changer de palier</a> pour en publier davantage.
                </p>
              )}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={productSubmitting || atProductLimit}
              >
                <CirclePlus size={18} />{" "}
                {productSubmitting ? "Enregistrement..." : editingProduct ? "Enregistrer les modifications" : "Publier"}
              </button>
            </div>
          </form>

          <form className="panel p-5" onSubmit={handleStandSubmit}>
            <h2 className="mb-4 text-2xl font-bold">Nouveau stand</h2>
            <div className="grid gap-4">
              <label className="sr-only" htmlFor="stand-name">Nom du stand</label>
              <input id="stand-name" className="input-field" name="name" placeholder="Nom du stand" required />
              <label className="sr-only" htmlFor="stand-banner">URL bannière</label>
              <input id="stand-banner" className="input-field" name="banner_url" type="url" placeholder="URL bannière Supabase Storage" />
              <label className="sr-only" htmlFor="stand-description">Description du stand</label>
              <textarea id="stand-description" className="textarea-field" name="description" placeholder="Description du stand" required />
              {standError && (
                <p className="notice notice-error flex items-center gap-2">
                  <AlertTriangle size={16} /> {standError}
                </p>
              )}
              {atStandLimit && (
                <p className="notice">
                  Votre palier ({status?.tier}) ne permet pas de créer de stand supplémentaire.{" "}
                  <a className="underline" href="/devenir-vendeur">Changer de palier</a>.
                </p>
              )}
              <button className="btn btn-primary" type="submit" disabled={standSubmitting || atStandLimit}>
                <Store size={18} /> {standSubmitting ? "Création..." : "Créer le stand"}
              </button>
              <p className="notice text-sm">
                {SUBSCRIPTION_PLANS.map((p) => `${p.tier} : ${p.standLimit === 0 ? "aucun stand" : `${p.standLimit} stand(s) max`}`).join(" · ")}
              </p>
            </div>
          </form>
        </section>

        <section className="container-ucao grid gap-5 pb-[84px] md:grid-cols-2">
          <div className="panel p-5">
            <h2 className="mb-4 text-2xl font-bold">Mes produits</h2>
            {products.length === 0 ? (
              <p>Aucun produit pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 border-b border-ucao-soft pb-2 dark:border-[#1c3050]">
                    <div>
                      <p className="font-bold">{product.name}</p>
                      <p className="text-sm text-ucao-muted dark:text-[#a8b8cc]">{product.price.toLocaleString("fr-FR")} FCFA</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setEditingProduct(product);
                          setProductError(null);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-ucao-red"
                        onClick={() => handleDeleteProduct(String(product.id))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="panel p-5">
            <h2 className="mb-4 text-2xl font-bold">Mes stands</h2>
            {stands.length === 0 ? (
              <p>Aucun stand pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {stands.map((stand) => (
                  <li key={stand.id} className="flex items-center justify-between border-b border-ucao-soft pb-2 dark:border-[#1c3050]">
                    <span>{stand.name}</span>
                    <span className="text-sm text-ucao-muted dark:text-[#a8b8cc]">{stand.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </PageShell>
  );
}