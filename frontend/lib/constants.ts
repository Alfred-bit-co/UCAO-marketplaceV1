import type { Product, Stand } from "./types";

export const CURRENCY = "FCFA";

export const IMAGE_ASSETS = {
  heroCampus: "/images/hero-campus.jpg",
  heroBuilding: "/images/hero-universite-batiment.jpg",
  heroStudents: "/images/hero-etudiants-campus.jpg",
  universityBuilding: "/images/universite-batiment.jpg",
  pageHeroCampus: "/images/page-hero-campus.jpg",
  productSupplies: "/images/product-fournitures-etudiant.jpg",
  productCvDesign: "/images/product-service-design-cv.jpg",
  productTshirt: "/images/product-tshirt-ucao.jpg",
  productLunch: "/images/product-dejeuner-campus.jpg",
  productComputerRepair: "/images/product-reparation-ordinateur.jpg",
  productEconomyBook: "/images/product-livre-economie.jpg",
  standBookshop: "/images/stand-librairie-campus.jpg",
  standFood: "/images/stand-ucao-food.jpg",
  standDigital: "/images/stand-studio-digital.jpg",
  standFallback: "/images/stand-banniere-campus.jpg",
};

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Pack fournitures étudiant",
    category: "livres",
    price: 8500,
    description:
      "Un kit complet pour la rentrée : cahiers, stylos, classeur, fiches et accessoires essentiels.",
    image_url: IMAGE_ASSETS.productSupplies,
    seller: { name: "Librairie Campus", role: "VENDEUR", phone: "+228 92 98 29 26", subscription_tier: "VIP" },
    seller_tier: "VIP",
  },
  {
    id: 2,
    name: "Service de design CV",
    category: "services",
    price: 5000,
    description:
      "Création d'un CV professionnel et moderne, adapté aux stages, jobs étudiants et candidatures académiques.",
    image_url: IMAGE_ASSETS.productCvDesign,
    seller: { name: "Studio Étudiant Pro", role: "VENDEUR", phone: "+228 72 23 90 76", subscription_tier: "PREMIUM" },
    seller_tier: "PREMIUM",
  },
  {
    id: 3,
    name: "T-shirt UCAO UUT",
    category: "vetements",
    price: 7000,
    description:
      "T-shirt confortable aux couleurs de l'université, disponible en plusieurs tailles.",
    image_url: IMAGE_ASSETS.productTshirt,
    seller: { name: "Club Entrepreneuriat", role: "VENDEUR", phone: "+228 90 00 00 03", subscription_tier: "STANDARD" },
    seller_tier: "STANDARD",
  },
  {
    id: 4,
    name: "Pack déjeuner campus",
    category: "nourriture",
    price: 2500,
    description: "Repas rapide, boisson et dessert pour les pauses entre deux cours.",
    image_url: IMAGE_ASSETS.productLunch,
    seller: { name: "UCAO Food", role: "VENDEUR", phone: "+228 90 00 00 04", subscription_tier: "VIP" },
    seller_tier: "VIP",
  },
  {
    id: 5,
    name: "Réparation ordinateur",
    category: "numerique",
    price: 10000,
    description:
      "Diagnostic, nettoyage logiciel et petites réparations pour ordinateurs étudiants.",
    image_url: IMAGE_ASSETS.productComputerRepair,
    seller: { name: "Club Informatique", role: "VENDEUR", phone: "+228 90 00 00 05", subscription_tier: "PREMIUM" },
    seller_tier: "PREMIUM",
  },
  {
    id: 6,
    name: "Livre économie générale",
    category: "livres",
    price: 6000,
    description: "Livre en bon état pour les cours d'économie générale et de gestion.",
    image_url: IMAGE_ASSETS.productEconomyBook,
    seller: { name: "Occasion Étudiante", role: "VENDEUR", phone: "+228 90 00 00 06", subscription_tier: "STANDARD" },
    seller_tier: "STANDARD",
  },
];

export const DEMO_STANDS: Stand[] = [
  {
    id: 1,
    name: "Librairie Campus",
    banner_url: IMAGE_ASSETS.standBookshop,
    description:
      "Fournitures, livres, impressions et kits de rentrée pour les étudiants UCAO UUT.",
    seller: { name: "Association des étudiants", role: "VENDEUR", phone: "+228 92 98 29 26", subscription_tier: "VIP" },
    seller_tier: "VIP",
    status: "approved",
    products: [],
  },
  {
    id: 2,
    name: "UCAO Food",
    banner_url: IMAGE_ASSETS.standFood,
    description: "Collations, repas rapides et boissons pour les pauses entre les cours.",
    seller: { name: "Coopérative étudiante", role: "VENDEUR", phone: "+228 72 23 90 76", subscription_tier: "PREMIUM" },
    seller_tier: "PREMIUM",
    status: "approved",
    products: [],
  },
  {
    id: 3,
    name: "Studio Digital",
    banner_url: IMAGE_ASSETS.standDigital,
    description: "Création graphique, mini-sites, CV et supports de présentation.",
    seller: { name: "Club informatique", role: "VENDEUR", phone: "+228 90 00 00 08", subscription_tier: "VIP" },
    seller_tier: "VIP",
    status: "approved",
    products: [],
  },
];

export const DEMO_ADMIN_STANDS: Stand[] = [
  {
    id: 1,
    name: "Librairie Campus",
    description: "Fournitures et livres",
    seller: { name: "Association des étudiants", role: "VENDEUR", subscription_tier: "VIP" },
    seller_tier: "VIP",
    status: "approved",
  },
];

export const HERO_IMAGES = [
  { src: IMAGE_ASSETS.heroCampus, alt: "Étudiants sur le campus universitaire" },
  { src: IMAGE_ASSETS.heroBuilding, alt: "Bâtiment universitaire UCAO-UUT" },
  { src: IMAGE_ASSETS.heroStudents, alt: "Groupe d'étudiants en discussion" },
];

export const PAYMENT_API_URL =
  process.env.NEXT_PUBLIC_PAYMENT_API_URL ?? "http://127.0.0.1:5000/api";