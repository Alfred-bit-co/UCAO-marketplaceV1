import type { Product, Stand } from "./types";

export const CURRENCY = "FCFA";
export const PRODUCTS_PER_PAGE = 12;
export const STORAGE_BUCKET = "marketplace-media";

export const IMAGE_ASSETS = {
  heroCampus: "/images/hero-campus.jpg",
  heroBuilding: "/images/hero-universite-batiment.jpg",
  heroStudents: "/images/hero-etudiants-campus.jpg",
  universityBuilding: "/images/universite-batiment.jpg",
  pageHeroCampus: "/images/page-hero-campus.jpg",
  productSupplies: "/images/hero-etudiants-campus.jpg",
  productCvDesign: "/images/hero-campus.jpg",
  productTshirt: "/images/hero-universite-batiment.jpg",
  productLunch: "/images/page-hero-campus.jpg",
  productComputerRepair: "/images/universite-batiment.jpg",
  productEconomyBook: "/images/hero-etudiants-campus.jpg",
  standBookshop: "/images/universite-batiment.jpg",
  standFood: "/images/hero-campus.jpg",
  standDigital: "/images/hero-etudiants-campus.jpg",
  standFallback: "/images/page-hero-campus.jpg",
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Pack fournitures étudiant",
    category: "livres",
    price: 8500,
    description: "Cahiers, stylos et surligneurs pour la rentrée.",
    image_url: IMAGE_ASSETS.productSupplies,
    seller_tier: "VIP",
    seller: { name: "Marie K.", role: "VENDEUR", phone: "+22890123456", subscription_tier: "VIP" },
  },
  {
    id: 2,
    name: "CV design professionnel",
    category: "services",
    price: 5000,
    description: "Mise en page soignée pour stages et candidatures.",
    image_url: IMAGE_ASSETS.productCvDesign,
    seller_tier: "PREMIUM",
    seller: { name: "Jean A.", role: "VENDEUR", phone: "+22890765432", subscription_tier: "PREMIUM" },
  },
  {
    id: 3,
    name: "T-shirt UCAO édition limitée",
    category: "vetements",
    price: 12000,
    description: "Modèle exclusif campus, tailles S à XL.",
    image_url: IMAGE_ASSETS.productTshirt,
    seller_tier: "STANDARD",
    seller: { name: "Paul D.", role: "VENDEUR", phone: "+22891234567", subscription_tier: "STANDARD" },
  },
  {
    id: 4,
    name: "Déjeuner étudiant",
    category: "nourriture",
    price: 1500,
    description: "Plat du jour livré sur le campus.",
    image_url: IMAGE_ASSETS.productLunch,
    seller_tier: "PREMIUM",
    seller: { name: "Fatou B.", role: "VENDEUR", phone: "+22892345678", subscription_tier: "PREMIUM" },
  },
  {
    id: 5,
    name: "Réparation ordinateur",
    category: "numerique",
    price: 8000,
    description: "Diagnostic et réparation rapide.",
    image_url: IMAGE_ASSETS.productComputerRepair,
    seller_tier: "VIP",
    seller: { name: "Kofi M.", role: "VENDEUR", phone: "+22893456789", subscription_tier: "VIP" },
  },
  {
    id: 6,
    name: "Manuel d'économie",
    category: "livres",
    price: 6000,
    description: "Ouvrage de référence pour le semestre.",
    image_url: IMAGE_ASSETS.productEconomyBook,
    seller_tier: "STANDARD",
    seller: { name: "Awa S.", role: "VENDEUR", phone: "+22894567890", subscription_tier: "STANDARD" },
  },
];

export const DEMO_STANDS: Stand[] = [
  {
    id: 1,
    name: "Librairie Campus",
    description: "Livres, fournitures et ressources pédagogiques.",
    banner_url: IMAGE_ASSETS.standBookshop,
    seller_tier: "VIP",
    seller: { name: "Marie K.", role: "VENDEUR", phone: "+22890123456", subscription_tier: "VIP" },
    status: "approved",
  },
  {
    id: 2,
    name: "Cantine Express",
    description: "Repas rapides et snacks pour étudiants.",
    banner_url: IMAGE_ASSETS.standFood,
    seller_tier: "PREMIUM",
    seller: { name: "Fatou B.", role: "VENDEUR", phone: "+22892345678", subscription_tier: "PREMIUM" },
    status: "approved",
  },
  {
    id: 3,
    name: "Tech Campus",
    description: "Services numériques et réparations.",
    banner_url: IMAGE_ASSETS.standDigital,
    seller_tier: "VIP",
    seller: { name: "Kofi M.", role: "VENDEUR", phone: "+22893456789", subscription_tier: "VIP" },
    status: "approved",
  },
];

export const HERO_IMAGES = [
  { src: IMAGE_ASSETS.heroCampus, alt: "Campus UCAO UUT" },
  { src: IMAGE_ASSETS.heroBuilding, alt: "Bâtiment universitaire UCAO" },
  { src: IMAGE_ASSETS.heroStudents, alt: "Étudiants sur le campus" },
];

export const PAYMENT_API_URL =
  process.env.NEXT_PUBLIC_PAYMENT_API_URL || "http://127.0.0.1:5000/api";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ucaomarketplace.vercel.app";
