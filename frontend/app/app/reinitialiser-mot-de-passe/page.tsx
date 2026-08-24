import { redirect } from "next/navigation";

export default function LegacyResetPasswordPage() {
  redirect("/reinitialiser-mot-de-passe");
}
