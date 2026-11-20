import { describe, expect, it } from "vitest";
import { isTrustedMediaUrl, trustedMediaUrl } from "@/lib/media";

const OK = "https://kodlozakvjuegwtetewm.supabase.co/storage/v1/object/public/marketplace-media/products/0abe7373-34bc-4e4c-8a89-b2a0bfb95981/photo.jpg";

describe("isTrustedMediaUrl (images de notre stockage uniquement)", () => {
  it("accepte une image du stockage public du projet", () => {
    expect(isTrustedMediaUrl(OK)).toBe(true);
    expect(trustedMediaUrl(OK)).toBe(OK);
  });

  it("refuse une image hébergée ailleurs, un autre projet ou un autre bucket", () => {
    for (const url of [
      "https://evil.example/pixel.png",
      "https://autre-projet.supabase.co/storage/v1/object/public/marketplace-media/products/a/b.jpg",
      "https://kodlozakvjuegwtetewm.supabase.co.evil.example/storage/v1/object/public/marketplace-media/a.jpg",
      "https://kodlozakvjuegwtetewm.supabase.co/storage/v1/object/public/student-ids/a/carte.jpg",
      "http://kodlozakvjuegwtetewm.supabase.co/storage/v1/object/public/marketplace-media/a.jpg",
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
    ]) {
      expect(isTrustedMediaUrl(url)).toBe(false);
    }
  });

  it("refuse les chemins qui remontent, les espaces et les valeurs vides", () => {
    expect(isTrustedMediaUrl(OK.replace("products/", "products/../../student-ids/"))).toBe(false);
    expect(isTrustedMediaUrl(OK + " x")).toBe(false);
    expect(trustedMediaUrl(null)).toBeNull();
    expect(trustedMediaUrl("")).toBeNull();
  });
});
