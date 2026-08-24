import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Connexion — UCAO Marketplace",
  description: "Connectez-vous à votre compte vendeur UCAO Marketplace.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
