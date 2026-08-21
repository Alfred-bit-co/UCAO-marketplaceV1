import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";

export default function RegisterPage() {
  return (
    <PageShell>
      <AuthForm mode="register" embedded />
    </PageShell>
  );
}
