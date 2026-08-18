"use client";
import { KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Supabase non configuré.");
      return;
    }
    setStatus("sending");
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    if (error) {
      console.error("RESET PASSWORD ERROR:", error);
      setStatus("error");
      setMessage("Impossible d'envoyer l'email. Vérifiez l'adresse saisie.");
      return;
    }
    setStatus("sent");
  }

  return (
    <PageShell>
      <main>
        <PageHero icon={KeyRound} eyebrow="Compte" title="Mot de passe oublié">
          Recevez un lien par email pour réinitialiser votre mot de passe.
        </PageHero>
        <section className="container-ucao max-w-md py-[54px] pb-[84px]">
          {status === "sent" ? (
            <p className="notice">
              Si un compte existe avec cet email, un lien de réinitialisation vient d&apos;être envoyé. Vérifiez votre boîte de réception (et vos spams).
            </p>
          ) : (
            <form className="panel grid gap-4 p-6" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ucao-muted" size={16} />
                <input
                  id="email"
                  className="input-field pl-9"
                  type="email"
                  placeholder="Votre email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {message && <p className="notice notice-error">{message}</p>}
              <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Envoi..." : "Recevoir le lien"}
              </button>
            </form>
          )}
        </section>
      </main>
    </PageShell>
  );
}