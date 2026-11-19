import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Créer un compte administrateur",
  description: "Création du compte d'un futur administrateur de la plateforme.",
  robots: { index: false, follow: false },
};

export default function AdminSignupPage() {
  return (
    <PageShell>
      <AuthForm mode="register" embedded adminSignup />
    </PageShell>
  );
}
