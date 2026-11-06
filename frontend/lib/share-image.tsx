import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

// Image de partage (Facebook, WhatsApp, LinkedIn, X…) : 1200x630, fond bordeaux, sans photo.
// Utilisée par app/opengraph-image.tsx et app/twitter-image.tsx, générée une seule fois au build.
export const SHARE_IMAGE_ALT = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

const BORDEAUX = "#7B1E2B";

export async function renderShareImage() {
  const logo = await readFile(join(process.cwd(), "public", "logo-ucao.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: BORDEAUX,
          color: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={120} height={120} alt="" style={{ borderRadius: 24, background: "#ffffff" }} />
        <div style={{ marginTop: 48, fontSize: 92, fontWeight: 700, lineHeight: 1, letterSpacing: -2 }}>{SITE_NAME}</div>
        <div style={{ marginTop: 28, fontSize: 40, opacity: 0.9 }}>{SITE_TAGLINE}</div>
        <div style={{ marginTop: 56, width: 160, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.55)" }} />
      </div>
    ),
    SHARE_IMAGE_SIZE,
  );
}
