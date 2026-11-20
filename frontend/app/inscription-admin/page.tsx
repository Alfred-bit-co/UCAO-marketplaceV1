import { redirect } from "next/navigation";

// Ancienne adresse : l'inscription du personnel se fait maintenant par le choix « Personnel de l'UCAO ».
export default function AdminSignupPage() {
  redirect("/register?profil=personnel");
}
