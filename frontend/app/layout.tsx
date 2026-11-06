import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={poppins.variable}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
