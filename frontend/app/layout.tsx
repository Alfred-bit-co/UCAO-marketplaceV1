import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { NavigationProgress } from "@/components/navigation-progress";
import { ToastProvider } from "@/components/toast-provider";
import { SITE_URL } from "@/lib/constants";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

// L'image de partage (1200x630) est générée par app/opengraph-image.tsx et
// app/twitter-image.tsx : Next.js ajoute og:image et twitter:image à toutes les pages
// qui n'ont pas leur propre image (les fiches produit gardent la photo du produit).
// Pas de canonical ici : il serait hérité par toutes les pages. Chaque page déclare le sien.
export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "La marketplace des étudiants UCAO-UUT à Lomé.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#071426" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Pose le thème sombre avant le premier affichage (pas de flash blanc). */}
        {/* Fichier externe (public/theme-init.js) et non script en ligne : compatible avec la CSP. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
      </head>
      <body className={poppins.variable}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
