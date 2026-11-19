import type { Metadata } from "next";
import { AdminAccountStatus } from "@/components/admin-account-status";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Compte administrateur",
  description: "État de l'accès à l'administration de la plateforme.",
  robots: { index: false, follow: false },
};

export default function AdminAccountPage() {
  return (
    <PageShell>
      <AdminAccountStatus />
    </PageShell>
  );
}
