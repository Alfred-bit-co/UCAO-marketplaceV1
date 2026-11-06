import { SHARE_IMAGE_ALT, SHARE_IMAGE_SIZE, renderShareImage } from "@/lib/share-image";

// Image de partage 1200x630 (Open Graph).
export const alt = SHARE_IMAGE_ALT;
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderShareImage();
}
