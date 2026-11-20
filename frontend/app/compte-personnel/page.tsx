import type { Metadata } from "next";
import { AdminAccountStatus } from "@/components/admin-account-status";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Mon compte personnel",
  description: "État de la vérification d'un compte du personnel de l'UCAO.",
  robots: { index: false, follow: false },
};

export default function StaffAccountPage() {
  return (
    <PageShell>
      <AdminAccountStatus />
    </PageShell>
  );
}
