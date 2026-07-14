export type UserRole = "SIMPLE" | "PREMIUM" | "VIP";

export type Seller = {
  id?: string;
  name: string;
  email?: string;
  role: UserRole;
  phone?: string;
};

export type Product = {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  image_url?: string | null;
  user_id?: string;
  stand_id?: string | null;
  seller?: Seller | null;
  seller_role?: UserRole;
  created_at?: string;
};

export type Stand = {
  id: string | number;
  name: string;
  description: string;
  banner_url?: string | null;
  user_id?: string;
  seller?: Seller | null;
  seller_role?: UserRole;
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
  product_id?: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  fedapay_transaction_id?: string;
  created_at?: string;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  subscription_type?: string | null;
  subscription_expires_at?: string | null;
  stand_limit: number;
  stands_count?: number;
};

export const PRODUCT_CATEGORIES: { value: ProductCategory | "tous"; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "nourriture", label: "Nourriture" },
  { value: "vetements", label: "Vêtements" },
  { value: "numerique", label: "Numérique" },
  { value: "livres", label: "Livres" },
  { value: "services", label: "Services" },
];

export const ROLE_PRIORITY: Record<UserRole, number> = {
  VIP: 1,
  PREMIUM: 2,
  SIMPLE: 3,
};
