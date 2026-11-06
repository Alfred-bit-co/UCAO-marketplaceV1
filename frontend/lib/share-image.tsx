import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

// Image de partage (Facebook, WhatsApp, LinkedIn, X…) : 1200x630, fond bordeaux, sans photo.
// Utilisée par app/opengraph-image.tsx et app/twitter-image.tsx, générée une seule fois au build.
export const SHARE_IMAGE_ALT = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

const BORDEAUX = "#7B1E2B";
// Largeur utile : le carré central fait 630 px, on garde une marge de 35 px de chaque côté.
const SAFE_WIDTH = 560;

export async function renderShareImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo-ucao.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      // WhatsApp affiche une vignette CARRÉE découpée au centre (630x630, de x=285 à x=915) :
      // tout l'essentiel est centré et tient dans une colonne de SAFE_WIDTH px.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BORDEAUX,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: SAFE_WIDTH, textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={250} height={250} alt="" style={{ borderRadius: 40, background: "#ffffff" }} />
          <div style={{ marginTop: 34, fontSize: 56, fontWeight: 700, lineHeight: 1, letterSpacing: -1 }}>{SITE_NAME}</div>
          <div style={{ marginTop: 18, fontSize: 26, lineHeight: 1.3, opacity: 0.9 }}>{SITE_TAGLINE}</div>
        </div>
      </div>
    ),
    SHARE_IMAGE_SIZE,
  );
}
