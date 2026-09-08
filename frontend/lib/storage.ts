import { STORAGE_BUCKET } from "./constants";
import { createClient } from "./supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function uploadImage(
  file: File,
  folder: string,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { url: null, error: "Supabase non configuré." };

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: "Format accepté : JPG, PNG ou WebP." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { url: null, error: "L'image ne doit pas dépasser 5 Mo." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Connectez-vous pour envoyer une image." };

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${user.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("STORAGE ERROR (uploadImage):", uploadError);
    return { url: null, error: "Impossible d'envoyer l'image. Vérifiez le bucket Supabase Storage." };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function uploadMultipleImages(
  files: File[],
  folder: string,
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = [];
  for (const file of files) {
    const result = await uploadImage(file, folder);
    if (result.error) return { urls, error: result.error };
    if (result.url) urls.push(result.url);
  }
  return { urls, error: null };
}

/** Uploads a card to the private bucket and returns its storage path only. */
export async function uploadStudentIdCard(file: File): Promise<{ path: string | null; error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { path: null, error: "Supabase non configure." };
  if (!ALLOWED_TYPES.includes(file.type)) return { path: null, error: "Format accepte : JPG, PNG ou WebP." };
  if (file.size > MAX_SIZE_BYTES) return { path: null, error: "L'image ne doit pas depasser 5 Mo." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { path: null, error: "Connectez-vous pour envoyer votre carte." };

  const path = `${user.id}/carte.jpg`;
  const { error } = await supabase.storage.from("student-ids").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    console.error("STORAGE ERROR (uploadStudentIdCard):", error);
    return { path: null, error: "Impossible d'envoyer la carte etudiante." };
  }
  return { path, error: null };
}
