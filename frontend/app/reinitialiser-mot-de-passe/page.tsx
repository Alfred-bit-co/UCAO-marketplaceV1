"use client";
import { CheckCircle2, KeyRound } from "@/lib/icons";
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
    let mounted = true;
    const updateRecoveryState = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!mounted) return;
      setHasSession(Boolean(session));
      setReady(true);
    };

    // A recovery link establishes its session while the page is loading. Listening
    // to this event prevents a valid link from being rejected during that exchange.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") updateRecoveryState(session);
    });
    void supabase.auth.getSession().then(({ data }) => updateRecoveryState(data.session));

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
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
            <p className="notice flex items-center gap-2" role="status"><CheckCircle2 size={19} />Mot de passe mis à jour. Redirection vers la connexion...</p>
          ) : (
            <form className="panel grid gap-4 p-6" onSubmit={handleSubmit} noValidate>
              <label className="sr-only" htmlFor="password">Nouveau mot de passe</label>
              <input
                id="password"
                className="input-field"
                type="password"
                placeholder="8 caractères min., chiffre et caractère spécial"
                minLength={8}
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
              {message && <p className="notice notice-error" role="alert">{message}</p>}
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
