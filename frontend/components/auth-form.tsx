"use client";

import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { Brand } from "./navbar";
import { ThemeProvider } from "./theme-provider";
import { createClient } from "@/lib/supabase";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    if (!supabase) {
      setError(true);
      setMessage("Supabase n'est pas encore configuré. Ajoutez les clés dans frontend/.env.local.");
      return;
    }

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      setError(Boolean(loginError));
      setMessage(loginError ? loginError.message : "Connexion réussie. Redirection vers le tableau de bord...");
      if (!loginError) window.setTimeout(() => (window.location.href = "/dashboard"), 700);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        data: {
          full_name: String(form.get("name")),
          phone: String(form.get("phone") || ""),
        },
      },
    });
    setError(Boolean(signUpError));
    setMessage(signUpError ? signUpError.message : "Compte créé. Vérifiez votre email puis connectez-vous.");
  }

  return (
    <ThemeProvider>
      <main className="grid min-h-screen place-items-center bg-ucao-soft px-4 py-16 dark:bg-[#0a1628]">
        <form className="panel w-[min(520px,100%)] p-8" onSubmit={submit}>
          <Brand />
          <h1 className="mt-7 text-3xl font-bold">{mode === "login" ? "Connexion" : "Créer mon compte"}</h1>
          <p className="mb-5 text-ucao-muted dark:text-[#a8b8cc]">
            {mode === "login"
              ? "Accédez à votre tableau de bord vendeur ou administrateur."
              : "Publiez votre stand après validation par l’équipe UCAO UUT."}
          </p>
          {mode === "register" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  Nom complet
                  <input className="input-field" name="name" required minLength={2} />
                </label>
                <label className="grid gap-1">
                  Email universitaire
                  <input className="input-field" name="email" type="email" required autoComplete="email" />
                </label>
              </div>
              <label className="mt-4 grid gap-1">
                Téléphone vendeur
                <input className="input-field" name="phone" type="tel" placeholder="+221 77 000 00 00" />
              </label>
            </>
          )}
          {mode === "login" && (
            <label className="grid gap-1">
              Email
              <input className="input-field" name="email" type="email" required autoComplete="email" />
            </label>
          )}
          <label className="mt-4 grid gap-1">
            Mot de passe
            <input className="input-field" name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>
          {mode === "login" && (
            <Link className="mt-2 block text-right text-sm font-bold text-ucao-red hover:underline" href="/mot-de-passe-oublie">
              Mot de passe oublié ?
            </Link>
          )}
          {message && <div className={`notice ${error ? "notice-error" : ""}`}>{message}</div>}
          <button className="btn btn-primary mt-5 w-full" type="submit">
            {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>
          <Link className="mt-5 block text-center font-bold text-ucao-green dark:text-ucao-gold" href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Créer un compte" : "J’ai déjà un compte"}
          </Link>
        </form>
      </main>
    </ThemeProvider>
  );
}