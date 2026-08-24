import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir vendeur — UCAO Marketplace",
  description: "Créez votre compte vendeur pour publier vos produits sur UCAO Marketplace.",
};

export default function RegisterPage() {
  return (
    <PageShell>
      <AuthForm mode="register" embedded />
    </PageShell>
  );
}
