import { redirect } from "next/navigation";

// Ancienne adresse, remplacée par /compte-personnel.
export default function AdminAccountPage() {
  redirect("/compte-personnel");
}
