import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { NavigationProgress } from "@/components/navigation-progress";
import { THEME_INIT_SCRIPT } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UCAO Marketplace",
    template: "%s | UCAO Marketplace",
  },
  description:
    "Marketplace étudiante indépendante pour stands, produits, services et projets de la communauté UCAO-UUT.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ucaomarketplace.vercel.app"),
  openGraph: {
    title: "UCAO Marketplace",
    description:
      "Marketplace étudiante indépendante pour stands, produits, services et projets de la communauté UCAO-UUT.",
    type: "website",
    locale: "fr_FR",
    siteName: "UCAO Marketplace",
  },
  twitter: {
    card: "summary_large_image",
    title: "UCAO Marketplace",
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
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
