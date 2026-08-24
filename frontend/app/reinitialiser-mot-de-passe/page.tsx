"use client";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase";

const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setReady(true);
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!PASSWORD_PATTERN.test(password)) {
      setStatus("error");
      setMessage("Le mot de passe doit contenir au moins 8 caractères, un chiffre et un caractère spécial.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    setStatus("saving");
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error("UPDATE PASSWORD ERROR:", error);
      setStatus("error");
      setMessage("Impossible de mettre à jour le mot de passe.");
      return;
    }
    setStatus("done");
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!ready) {
    return (
      <PageShell>
        <main className="container-ucao py-[84px] text-center">Chargement...</main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main>
        <PageHero icon={KeyRound} eyebrow="Compte" title="Réinitialiser le mot de passe">
          Choisissez un nouveau mot de passe pour votre compte.
        </PageHero>
        <section className="container-ucao max-w-md py-[54px] pb-[84px]">
          {!hasSession ? (
            <p className="notice notice-error">
              Ce lien est invalide ou a expiré. Refaites une demande depuis la page « Mot de passe oublié ».
            </p>
          ) : status === "done" ? (
            <p className="notice">Mot de passe mis à jour. Redirection vers la connexion...</p>
          ) : (
            <form className="panel grid gap-4 p-6" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="password">Nouveau mot de passe</label>
              <input
                id="password"
                className="input-field"
                type="password"
                placeholder="8 caractères min., chiffre et caractère spécial"
                minLength={8}
                pattern="(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}"
                title="8 caractères minimum, avec au moins un chiffre et un caractère spécial."
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <label className="sr-only" htmlFor="confirm-password">Confirmer le mot de passe</label>
              <input
                id="confirm-password"
                className="input-field"
                type="password"
                placeholder="Confirmer le mot de passe"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              {message && <p className="notice notice-error">{message}</p>}
              <button className="btn btn-primary" type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Enregistrement..." : "Mettre à jour le mot de passe"}
              </button>
            </form>
          )}
        </section>
      </main>
    </PageShell>
  );
}
