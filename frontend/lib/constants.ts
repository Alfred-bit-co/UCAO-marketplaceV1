import type { Product, Stand } from "./types";

export const CURRENCY = "FCFA";

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Pack fournitures étudiant",
    category: "livres",
    price: 8500,
    description:
      "Un kit complet pour la rentrée : cahiers, stylos, classeur, fiches et accessoires essentiels.",
    image_url:
      "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=85",
    seller: { name: "Librairie Campus", role: "VIP", phone: "+221 77 000 00 01" },
    seller_role: "VIP",
  },
  {
    id: 2,
    name: "Service de design CV",
    category: "services",
    price: 5000,
    description:
      "Création d'un CV professionnel et moderne, adapté aux stages, jobs étudiants et candidatures académiques.",
    image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85",
    seller: { name: "Studio Étudiant Pro", role: "PREMIUM", phone: "+221 77 000 00 02" },
    seller_role: "PREMIUM",
  },
  {
    id: 3,
    name: "T-shirt UCAO UUT",
    category: "vetements",
    price: 7000,
    description:
      "T-shirt confortable aux couleurs de l'université, disponible en plusieurs tailles.",
    image_url:
      "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=900&q=85",
    seller: { name: "Club Entrepreneuriat", role: "SIMPLE", phone: "+221 77 000 00 03" },
    seller_role: "SIMPLE",
  },
  {
    id: 4,
    name: "Pack déjeuner campus",
    category: "nourriture",
    price: 2500,
    description: "Repas rapide, boisson et dessert pour les pauses entre deux cours.",
    image_url:
      "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=900&q=85",
    seller: { name: "UCAO Food", role: "VIP", phone: "+221 77 000 00 04" },
    seller_role: "VIP",
  },
  {
    id: 5,
    name: "Réparation ordinateur",
    category: "numerique",
    price: 10000,
    description:
      "Diagnostic, nettoyage logiciel et petites réparations pour ordinateurs étudiants.",
    image_url:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=85",
    seller: { name: "Club Informatique", role: "PREMIUM", phone: "+221 77 000 00 05" },
    seller_role: "PREMIUM",
  },
  {
    id: 6,
    name: "Livre économie générale",
    category: "livres",
    price: 6000,
    description: "Livre en bon état pour les cours d'économie générale et de gestion.",
    image_url:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=85",
    seller: { name: "Occasion Étudiante", role: "SIMPLE", phone: "+221 77 000 00 06" },
    seller_role: "SIMPLE",
  },
];

export const DEMO_STANDS: Stand[] = [
  {
    id: 1,
    name: "Librairie Campus",
    banner_url:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=85",
    description:
      "Fournitures, livres, impressions et kits de rentrée pour les étudiants UCAO UUT.",
    seller: { name: "Association des étudiants", role: "VIP" },
    seller_role: "VIP",
    status: "approved",
    products: [],
  },
  {
    id: 2,
    name: "UCAO Food",
    banner_url:
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=85",
    description: "Collations, repas rapides et boissons pour les pauses entre les cours.",
    seller: { name: "Coopérative étudiante", role: "PREMIUM" },
    seller_role: "PREMIUM",
    status: "approved",
    products: [],
  },
  {
    id: 3,
    name: "Studio Digital",
    banner_url:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85",
    description: "Création graphique, mini-sites, CV et supports de présentation.",
    seller: { name: "Club informatique", role: "VIP" },
    seller_role: "VIP",
    status: "approved",
    products: [],
  },
];

export const DEMO_ADMIN_STANDS: Stand[] = [
  {
    id: 1,
    name: "Librairie Campus",
    description: "Fournitures et livres",
    seller: { name: "Association des étudiants", role: "VIP" },
    seller_role: "VIP",
    status: "approved",
  },
];

export const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1800&q=85",
    alt: "Étudiants sur le campus universitaire",
  },
  {
    src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1800&q=85",
    alt: "Bâtiment universitaire moderne",
  },
  {
    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1800&q=85",
    alt: "Groupe d'étudiants en discussion",
  },
];

export const PAYMENT_API_URL =
  process.env.NEXT_PUBLIC_PAYMENT_API_URL ?? "http://127.0.0.1:5000/api";
