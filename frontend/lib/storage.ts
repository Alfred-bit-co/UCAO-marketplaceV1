import { STORAGE_BUCKET } from "./constants";
import { createClient } from "./supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  // Some mobile galleries omit the MIME type when a picture is selected.
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
    return "Format accepté : JPG, PNG ou WebP.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "L'image ne doit pas dépasser 5 Mo.";
  }
  return null;
}

function extensionFor(file: File): "jpg" | "png" | "webp" | "avif" {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  if (!file.type) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "png" || extension === "webp" || extension === "avif") return extension;
  }
  return "jpg";
}

function storageErrorMessage(message: string, bucket: string): string {
  const detail = message.toLowerCase();
  if (detail.includes("bucket not found") || detail.includes("not found")) {
    return `Le stockage « ${bucket} » n'existe pas encore. Exécutez la migration Supabase fournie dans le projet.`;
  }
  if (detail.includes("row-level security") || detail.includes("permission") || detail.includes("not authorized")) {
    return "Supabase bloque cet envoi : les règles Storage n'ont pas encore été appliquées. Exécutez la migration Supabase puis réessayez.";
  }
  return "Impossible d'envoyer l'image pour le moment. Réessayez dans quelques instants.";
}

export async function uploadImage(
  file: File,
  folder: string,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  if (!supabase) return { url: null, error: "Supabase non configuré." };

  const validationError = validateImageFile(file);
  if (validationError) return { url: null, error: validationError };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null, error: "Connectez-vous pour envoyer une image." };

  const path = `${folder}/${user.id}/${crypto.randomUUID()}.${extensionFor(file)}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("STORAGE ERROR (uploadImage):", uploadError);
    return { url: null, error: storageErrorMessage(uploadError.message, STORAGE_BUCKET) };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function uploadMultipleImages(
  files: File[],
  folder: string,
): Promise<{ urls: string[]; error: string | null }> {
  const invalidFile = files.map(validateImageFile).find(Boolean);
  if (invalidFile) return { urls: [], error: invalidFile };

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
  const validationError = validateImageFile(file);
  if (validationError) return { path: null, error: validationError };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { path: null, error: "Connectez-vous pour envoyer votre carte." };

  const path = `${user.id}/carte-${Date.now()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from("student-ids").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    console.error("STORAGE ERROR (uploadStudentIdCard):", error);
    return { path: null, error: storageErrorMessage(error.message, "student-ids") };
  }
  return { path, error: null };
}
