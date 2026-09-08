import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={poppins.variable}>{children}</body>
    </html>
  );
}
