import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UCAO UUT Marketplace",
  description:
    "Marketplace officielle UCAO UUT pour stands, produits, services et projets universitaires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
