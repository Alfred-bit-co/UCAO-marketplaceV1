import { createClient, isSupabaseConfigured } from "./supabase";
import { getPublicProfiles, toSeller, type PublicProfile } from "./public-profiles";
import { PRODUCTS_PER_PAGE, DEMO_PRODUCTS } from "./constants";
import { escapeIlike } from "./utils";
import type { PaginatedResult, Product, ProductCategory, ProductImage, SubscriptionTier } from "./types";
import { TIER_PRIORITY } from "./types";

type ProductImageRow = {
  url: string;
  position: number;
};

type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  product_images?: ProductImageRow[] | null;
  user_id: string;
  stand_id: string | null;
  created_at: string;
};

function sortImages(images?: ProductImageRow[] | null): ProductImage[] {
  return [...(images ?? [])].sort((a, b) => a.position - b.position);
}

function mapProduct(row: ProductRow, profile?: PublicProfile): Product {
  const images = sortImages(row.product_images);
  const tier = profile?.subscription_tier ?? null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    images,
    image_url: images[0]?.url ?? null,
    user_id: row.user_id,
    stand_id: row.stand_id,
    created_at: row.created_at,
    seller: toSeller(profile),
    seller_tier: tier,
  };
}

async function mapProducts(rows: ProductRow[]): Promise<Product[]> {
  const profiles = await getPublicProfiles(rows.map((row) => row.user_id));
  return rows.map((row) => mapProduct(row, profiles.get(row.user_id)));
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
      TIER_PRIORITY[a.seller_tier ?? "STANDARD"] - TIER_PRIORITY[b.seller_tier ?? "STANDARD"],
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
  const perPage = options?.perPage ?? PRODUCTS_PER_PAGE;

  if (!isSupabaseConfigured()) {
    return filterDemoProducts(page, perPage, options?.search, options?.category);
  }

  const supabase = createClient();
  if (!supabase) {
    return filterDemoProducts(page, perPage, options?.search, options?.category);
  }

  let query = supabase
    .from("products")
    .select(
      "*, product_images(url, position)",
      { count: "exact" },
    );

  if (options?.category && options.category !== "tous") {
    query = query.eq("category", options.category);
  }
  if (options?.search?.trim()) {
    const term = escapeIlike(options.search.trim());
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error("SUPABASE ERROR (getProducts):", error);
    return filterDemoProducts(page, perPage, options?.search, options?.category);
  }

  const total = count ?? data.length;
  const items = (await mapProducts(data as ProductRow[]))
    .sort((a, b) => TIER_PRIORITY[a.seller_tier ?? "STANDARD"] - TIER_PRIORITY[b.seller_tier ?? "STANDARD"]);

  return {
    items,
    page,
    pages: Math.max(Math.ceil(total / perPage), 1),
    total,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return DEMO_PRODUCTS.find((p) => String(p.id) === id) ?? null;
  }

  const supabase = createClient();
  if (!supabase) {
    return DEMO_PRODUCTS.find((p) => String(p.id) === id) ?? null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(url, position)")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("SUPABASE ERROR (getProductById):", error);
    return null;
  }

  return (await mapProducts([data as ProductRow]))[0] ?? null;
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
    .select("*, product_images(url, position)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("SUPABASE ERROR (getMyProducts):", error);
    return [];
  }
  return mapProducts(data as ProductRow[]);
}

async function replaceProductImages(
  supabase: ReturnType<typeof createClient>,
  productId: string,
  image_urls?: string[],
) {
  if (!supabase) return;
  await supabase.from("product_images").delete().eq("product_id", productId);

  const imageRows = (image_urls ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, position) => ({ product_id: productId, url, position }));

  if (imageRows.length) {
    const { error } = await supabase.from("product_images").insert(imageRows);
    if (error) console.error("SUPABASE ERROR (replaceProductImages):", error);
  }
}

export async function createProduct(
  userId: string,
  payload: {
    name: string;
    category: ProductCategory;
    price: number;
    description: string;
    image_urls?: string[];
    stand_id?: string;
  },
): Promise<{ product: Product | null; error: string | null }> {
  if (!isSupabaseConfigured()) return { product: null, error: "Supabase non configuré." };

  const supabase = createClient();
  if (!supabase) return { product: null, error: "Supabase non configuré." };

  const { image_urls, ...productPayload } = payload;
  const { data, error } = await supabase
    .from("products")
    .insert({ ...productPayload, user_id: userId })
    .select("*, product_images(url, position)")
    .single();

  if (error || !data) {
    console.error("SUPABASE ERROR (createProduct):", error);
    return { product: null, error: error?.message ?? "Erreur inconnue." };
  }

  if (image_urls?.length) {
    await replaceProductImages(supabase, data.id, image_urls);
    return { product: await getProductById(data.id), error: null };
  }

  return { product: (await mapProducts([data as ProductRow]))[0] ?? null, error: null };
}

export async function updateProduct(
  userId: string,
  productId: string,
  payload: {
    name: string;
    category: ProductCategory;
    price: number;
    description: string;
    image_urls?: string[];
  },
): Promise<{ product: Product | null; error: string | null }> {
  if (!isSupabaseConfigured()) return { product: null, error: "Supabase non configuré." };

  const supabase = createClient();
  if (!supabase) return { product: null, error: "Supabase non configuré." };

  const { image_urls, ...productPayload } = payload;
  const { data, error } = await supabase
    .from("products")
    .update(productPayload)
    .eq("id", productId)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error || !data) {
    console.error("SUPABASE ERROR (updateProduct):", error);
    return { product: null, error: error?.message ?? "Erreur inconnue." };
  }

  await replaceProductImages(supabase, productId, image_urls);
  return { product: await getProductById(productId), error: null };
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

  if (error) console.error("SUPABASE ERROR (deleteProduct):", error);

  return !error;
}
