import { CirclePlus, LayoutDashboard, PackageCheck, Sparkles, Store, UserCheck } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";

export default function DashboardPage() {
  return (
    <PageShell>
      <main>
        <PageHero icon={LayoutDashboard} eyebrow="Tableau de bord" title="Suivi de votre activité">
          Gardez une vue claire sur vos produits, demandes et validations.
        </PageHero>
        <section className="container-ucao grid gap-5 py-[42px] pb-[84px] md:grid-cols-3">
          <article className="panel p-5">
            <span className="tag">
              <UserCheck size={16} /> Vendeur
            </span>
            <h2 className="mt-3 text-3xl font-bold">Invité</h2>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Connectez-vous pour gérer votre activité.</p>
          </article>
          <article className="panel p-5">
            <span className="tag">
              <PackageCheck size={16} /> Produits
            </span>
            <h2 className="mt-3 text-3xl font-bold">0</h2>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Produits publiés</p>
          </article>
          <article className="panel p-5">
            <span className="tag">
              <Store size={16} /> Stands
            </span>
            <h2 className="mt-3 text-3xl font-bold">0</h2>
            <p className="text-ucao-muted dark:text-[#a8b8cc]">Limite selon votre abonnement.</p>
          </article>
        </section>
        <section className="container-ucao grid gap-5 pb-[84px] md:grid-cols-2">
          <form className="panel p-5">
            <h2 className="mb-4 text-2xl font-bold">Ajouter un produit</h2>
            <div className="grid gap-4">
              <label className="sr-only" htmlFor="product-name">Nom du produit</label>
              <input id="product-name" className="input-field" name="name" placeholder="Nom du produit" required />
              <label className="sr-only" htmlFor="product-category">Catégorie</label>
              <select id="product-category" className="select-field" name="category" required>
                <option value="nourriture">Nourriture</option>
                <option value="vetements">Vêtements</option>
                <option value="numerique">Numérique</option>
                <option value="livres">Livres</option>
                <option value="services">Services</option>
              </select>
              <label className="sr-only" htmlFor="product-price">Prix en FCFA</label>
              <input id="product-price" className="input-field" name="price" type="number" min="0" placeholder="Prix en FCFA" required />
              <label className="sr-only" htmlFor="product-image">URL image</label>
              <input id="product-image" className="input-field" name="image_url" type="url" placeholder="URL image Supabase Storage" />
              <label className="sr-only" htmlFor="product-description">Description complète</label>
              <textarea id="product-description" className="textarea-field" name="description" placeholder="Description complète" required />
              <button className="btn btn-primary" type="button">
                <CirclePlus size={18} /> Publier
              </button>
              <button className="btn btn-ghost" type="button">
                <Sparkles size={18} /> Générer avec IA VIP
              </button>
            </div>
          </form>
          <form className="panel p-5">
            <h2 className="mb-4 text-2xl font-bold">Nouveau stand</h2>
            <div className="grid gap-4">
              <label className="sr-only" htmlFor="stand-name">Nom du stand</label>
              <input id="stand-name" className="input-field" name="name" placeholder="Nom du stand" required />
              <label className="sr-only" htmlFor="stand-banner">URL bannière</label>
              <input id="stand-banner" className="input-field" name="banner_url" type="url" placeholder="URL bannière Supabase Storage" />
              <label className="sr-only" htmlFor="stand-description">Description du stand</label>
              <textarea id="stand-description" className="textarea-field" name="description" placeholder="Description du stand" required />
              <button className="btn btn-primary" type="button">
                <Store size={18} /> Créer le stand
              </button>
              <p className="notice">Les vendeurs Premium ont 3 stands maximum, les VIP 5.</p>
            </div>
          </form>
        </section>
        <section className="container-ucao grid gap-5 pb-[84px] md:grid-cols-2">
          <div className="panel p-5">
            <h2 className="mb-4 text-2xl font-bold">Mes produits</h2>
            <p>Aucun produit pour le moment.</p>
          </div>
          <div className="panel p-5">
            <h2 className="mb-4 text-2xl font-bold">Mes stands</h2>
            <p>Aucun stand pour le moment.</p>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
