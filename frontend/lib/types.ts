// ============================================
// RÔLE (statut) — séparé du palier d'abonnement
// ============================================
export type UserRole = "ACHETEUR" | "VENDEUR" | "ADMIN";

// ============================================
// PALIER D'ABONNEMENT — uniquement pertinent pour un VENDEUR
// ============================================
export type SubscriptionTier = "STANDARD" | "PREMIUM" | "VIP";

export type Seller = {
  id?: string;
  name: string;
  email?: string;
  role: UserRole;
  phone?: string;
  subscription_tier?: SubscriptionTier | null;
};

export type Product = {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  images?: ProductImage[];
  image_url?: string | null;
  user_id?: string;
  stand_id?: string | null;
  seller?: Seller | null;
  seller_tier?: SubscriptionTier | null;
  created_at?: string;
};

export type ProductImage = {
  url: string;
  position: number;
};

export type Stand = {
  id: string | number;
  name: string;
  description: string;
  banner_url?: string | null;
  user_id?: string;
  seller?: Seller | null;
  seller_tier?: SubscriptionTier | null;
  products?: Product[];
  status?: "pending" | "approved" | "rejected";
  created_at?: string;
};

export type ProductCategory =
  | "nourriture"
  | "vetements"
  | "numerique"
  | "livres"
  | "services";

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pages: number;
  total: number;
};

export type Order = {
  id: string;
  user_id: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  fedapay_transaction_id?: string;
  items: OrderItem[];
  created_at?: string;
};

export type OrderItem = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: {
    name: string;
    category: ProductCategory;
  } | null;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  subscription_tier?: SubscriptionTier | null;
  subscription_expires_at?: string | null;
  stands_count?: number;
  products_count?: number;
};

// ============================================
// HISTORIQUE DES PAIEMENTS D'ABONNEMENT
// ============================================
export type SubscriptionPayment = {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  amount: number;
  fedapay_transaction_id?: string | null;
  status: "pending" | "paid" | "failed" | "cancelled";
  created_at: string;
};

export const PRODUCT_CATEGORIES: { value: ProductCategory | "tous"; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "nourriture", label: "Nourriture" },
  { value: "vetements", label: "Vêtements" },
  { value: "numerique", label: "Numérique" },
  { value: "livres", label: "Livres" },
  { value: "services", label: "Services" },
];

// Priorité d'affichage dans le catalogue : VIP en premier, puis PREMIUM, puis STANDARD.
// Un profil sans palier (ex: pas encore vendeur) tombe en dernier.
export const TIER_PRIORITY: Record<SubscriptionTier, number> = {
  VIP: 1,
  PREMIUM: 2,
  STANDARD: 3,
};

// Grille tarifaire (doit rester synchronisée avec les fonctions SQL tier_price / tier_product_limit / tier_stand_limit)
export const SUBSCRIPTION_PLANS: {
  tier: SubscriptionTier;
  price: number;
  productLimit: number;
  standLimit: number;
  recommended?: boolean;
}[] = [
  { tier: "STANDARD", price: 500, productLimit: 5, standLimit: 0 },
  { tier: "PREMIUM", price: 1500, productLimit: 10, standLimit: 1, recommended: true },
  { tier: "VIP", price: 5000, productLimit: 30, standLimit: 5 },
];