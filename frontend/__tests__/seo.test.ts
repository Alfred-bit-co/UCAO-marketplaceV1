import { describe, expect, it } from "vitest";
import { buildHomeJsonLd, serializeJsonLd } from "@/lib/seo";
import { productPageTitle } from "@/lib/utils";

describe("productPageTitle", () => {
  it("donne « {nom} – {prix} FCFA » sans répéter la marque", () => {
    const title = productPageTitle("Adaptateur pour PC", 1500);
    expect(title.replace(/\s/g, " ")).toBe("Adaptateur pour PC – 1 500 FCFA");
    expect(title).not.toContain("UCAO Marketplace");
  });
});

describe("buildHomeJsonLd", () => {
  const graph = buildHomeJsonLd()["@graph"];
  const website = graph.find((node) => node["@type"] === "WebSite")!;
  const organization = graph.find((node) => node["@type"] === "Organization")!;

  it("décrit le site avec son nom et son nom alternatif", () => {
    expect(website.name).toBe("UCAO Marketplace");
    expect(website).toMatchObject({ alternateName: "ucaomarketplace" });
    expect(website.url).toMatch(/^https:\/\/.+\/$/);
  });

  it("décrit l'organisation avec logo absolu et contacts, sans parentOrganization", () => {
    expect(organization).toMatchObject({
      name: "UCAO Marketplace",
      email: "ucaomarketplace2026@gmail.com",
      telephone: "+22892982926",
      sameAs: ["https://www.instagram.com/ucaomarketplace"],
    });
    expect(organization).toHaveProperty("logo");
    expect(String((organization as { logo: string }).logo)).toMatch(/^https:\/\/.+\/logo-ucao\.png$/);
    expect(organization).not.toHaveProperty("parentOrganization");
  });

  it("donne seulement la ville et le pays, et l'image de partage en adresse absolue", () => {
    expect(organization).toMatchObject({
      address: { "@type": "PostalAddress", addressLocality: "Lomé", addressCountry: "TG" },
    });
    const address = (organization as { address: Record<string, string> }).address;
    expect(Object.keys(address).sort()).toEqual(["@type", "addressCountry", "addressLocality"]);
    expect(String((organization as { image: string }).image)).toMatch(/^https:\/\/.+\/opengraph-image$/);
  });

  it("ne permet pas de fermer la balise <script>", () => {
    expect(serializeJsonLd({ a: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
