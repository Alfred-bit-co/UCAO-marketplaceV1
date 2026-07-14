import { createClient, isSupabaseConfigured } from "./supabase";
import { DEMO_PRODUCTS } from "./constants";
import type { PaginatedResult, Product, ProductCategory, UserRole } from "./types";
import { ROLE_PRIORITY } from "./types";

type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  image_url: string | null;
  user_id: string;
  stand_id: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    role: UserRole;
    phone: string | null;
  };
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    image_url: row.image_url,
    user_id: row.user_id,
    stand_id: row.stand_id,
    created_at: row.created_at,
    seller: row.profiles
      ? {
          name: row.profiles.full_name,
          role: row.profiles.role,
          phone: row.profiles.phone ?? undefined,
        }
      : null,
    seller_role: row.profiles?.role ?? "SIMPLE",
  };
}

function filterDemoProducts(
  page: number,
  perPage: number,
  search?: string,
  category?: string,
): PaginatedResult<Product> {
  const query = (search ?? "").trim().toLowerCase();
  const filtered = DEMO_PRODUCTS.filter((product) => {
    const haystack = `${product.name} ${product.seller?.name ?? ""} ${product.category}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesCategory = !category || category === "tous" || product.category === category;
    return matchesSearch && matchesCategory;
  }).sort(
    (a, b) =>
      ROLE_PRIORITY[a.seller_role ?? "SIMPLE"] - ROLE_PRIORITY[b.seller_role ?? "SIMPLE"],
  );

  const start = (page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);

  return {
    items,
    page,
    pages: Math.max(Math.ceil(filtered.length / perPage), 1),
    total: filtered.length,
  };
}

export async function getProducts(options?: {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
}): Promise<PaginatedResult<Product>> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 5;

  if (!isSupabaseConfigured()) {
    return filterDemoProducts(page, perPage, options?.search, options?.category);
  }

  const supabase = createClient();
  if (!supabase) {
    return filterDemoProducts(page, perPage, options?.search, options?.category);
  }

  // TODO: Uncomment and test once Supabase tables + RLS are created (see SETUP.md).
  let query = supabase
    .from("products")
    .select("*, profiles(full_name, role, phone)", { count: "exact" });

  if (options?.category && options.category !== "tous") {
    query = query.eq("category", options.category);
  }
  if (options?.search?.trim()) {
    query = query.or(
      `name.ilike.%${options.search.trim()}%,description.ilike.%${options.search.trim()}%`,
    );
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return filterDemoProducts(page, perPage, options?.search, options?.category);
  }

  const total = count ?? data.length;
  return {
    items: (data as ProductRow[]).map(mapProduct),
    page,
    pages: Math.max(Math.ceil(total / perPage), 1),
    total,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_PRODUCTS.find((p) => String(p.id) === id) ?? DEMO_PRODUCTS[0] ?? null;
  }

  const supabase = createClient();
  if (!supabase) {
    return DEMO_PRODUCTS.find((p) => String(p.id) === id) ?? null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, profiles(full_name, role, phone)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return DEMO_PRODUCTS.find((p) => String(p.id) === id) ?? null;
  }

  return mapProduct(data as ProductRow);
}

export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
  const result = await getProducts({ page: 1, perPage: limit });
  return result.items.slice(0, limit);
}

export async function getMyProducts(userId: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*, profiles(full_name, role, phone)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ProductRow[]).map(mapProduct);
}

export async function createProduct(
  userId: string,
  payload: {
    name: string;
    category: ProductCategory;
    price: number;
    description: string;
    image_url?: string;
    stand_id?: string;
  },
): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .insert({ ...payload, user_id: userId })
    .select("*, profiles(full_name, role, phone)")
    .single();

  if (error || !data) return null;
  return mapProduct(data as ProductRow);
}

export async function deleteProduct(userId: string, productId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("user_id", userId);

  return !error;
}
