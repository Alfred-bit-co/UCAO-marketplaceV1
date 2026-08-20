"use client";

import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { Brand } from "./navbar";
import { ThemeProvider } from "./theme-provider";
import { createClient } from "@/lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+\d{8,15}$/;
const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const password = String(form.get("password") || "");

    if (!EMAIL_PATTERN.test(email)) {
      setError(true);
      setMessage("Veuillez saisir une adresse email valide (ex : nom@domaine.com).");
      return;
    }

    if (mode === "register") {
      if (!PASSWORD_PATTERN.test(password)) {
        setError(true);
        setMessage("Le mot de passe doit contenir au moins 8 caractères, un chiffre et un caractère spécial.");
        return;
      }
      if (!PHONE_PATTERN.test(phone)) {
        setError(true);
        setMessage("Le numéro de téléphone doit être au format +xxxxxxxxxxx (uniquement des chiffres après le +, sans espace).");
        return;
      }
      if (!accepted) {
        setError(true);
        setMessage("Veuillez accepter les Conditions Générales d'Utilisation pour créer un compte.");
        return;
      }
    }

    const supabase = createClient();
    if (!supabase) {
      setError(true);
      setMessage("Supabase n'est pas encore configuré. Ajoutez les clés dans frontend/.env.local.");
      return;
    }

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setError(Boolean(loginError));
      setMessage(loginError ? loginError.message : "Connexion réussie. Redirection vers le tableau de bord...");
      if (!loginError) window.setTimeout(() => (window.location.href = "/dashboard"), 700);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: String(form.get("name")),
          phone,
        },
      },
    });
    setError(Boolean(signUpError));
    setRegisteredEmail(signUpError ? "" : email);
    setMessage(signUpError ? signUpError.message : "Compte créé. Vérifiez votre email puis connectez-vous pour choisir votre palier vendeur.");
  }

  async function resendConfirmationEmail() {
    const email = registeredEmail;
    if (!email) return;

    const supabase = createClient();
    if (!supabase) {
      setError(true);
      setMessage("Supabase n'est pas encore configuré.");
      return;
    }

    setResending(true);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setError(Boolean(resendError));
    setMessage(resendError ? resendError.message : "L'email de confirmation a été renvoyé. Vérifiez aussi vos spams.");
  }

  return (
    <ThemeProvider>
      <main className="grid min-h-screen place-items-center bg-ucao-soft px-4 py-16 dark:bg-[#0a1628]">
        <form className="panel w-[min(520px,100%)] p-8" onSubmit={submit}>
          <Link
            className="mb-5 inline-flex size-10 items-center justify-center rounded-ucao text-ucao-ink transition-colors hover:bg-ucao-soft dark:text-white dark:hover:bg-white/10"
            href="/"
            aria-label="Retourner à l'accueil"
            title="Retour à l'accueil"
          >
            <ArrowLeft size={20} />
          </Link>
          <Brand />
          <h1 className="mt-7 text-3xl font-bold">{mode === "login" ? "Connexion" : "Devenir vendeur"}</h1>
          <p className="mb-5 text-ucao-muted dark:text-[#a8b8cc]">
            {mode === "login"
              ? "Accédez à votre tableau de bord vendeur ou administrateur."
              : "La création de compte est réservée aux vendeurs. Les acheteurs n'ont besoin d'aucun compte pour parcourir le catalogue et contacter un vendeur sur WhatsApp."}
          </p>
          {mode === "register" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  Nom complet
                  <input className="input-field" name="name" required minLength={2} />
                </label>
                <label className="grid gap-1">
                  Email
                  <input className="input-field" name="email" type="email" required autoComplete="email" />
                </label>
              </div>
              <label className="mt-4 grid gap-1">
                Téléphone
                <input
                  className="input-field"
                  name="phone"
                  type="tel"
                  placeholder="+22892982926"
                  pattern="\+\d{8,15}"
                  required
                />
                <span className="text-xs text-ucao-muted dark:text-[#a8b8cc]">
                  Format obligatoire : +suivi uniquement de chiffres, sans espace (ex : +22892982926).
                </span>
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
            <span className="relative">
              <input
                className="input-field pr-12"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                pattern={mode === "register" ? "(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}" : undefined}
                title={mode === "register" ? "8 caractères minimum, avec au moins un chiffre et un caractère spécial." : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-ucao text-ucao-muted hover:bg-ucao-soft dark:hover:bg-white/10"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            {mode === "register" && (
              <span className="text-xs text-ucao-muted dark:text-[#a8b8cc]">
                8 caractères minimum, avec au moins un chiffre et un caractère spécial.
              </span>
            )}
          </label>
          {mode === "login" && (
            <Link className="mt-2 block text-right text-sm font-bold text-ucao-red hover:underline" href="/mot-de-passe-oublie">
              Mot de passe oublié ?
            </Link>
          )}
          {mode === "register" && (
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <span>
                J&apos;accepte les{" "}
                <a className="font-bold text-ucao-red underline" href="/conditions-generales" target="_blank" rel="noopener noreferrer">
                  Conditions Générales d&apos;Utilisation
                </a>{" "}
                et la{" "}
                <a className="font-bold text-ucao-red underline" href="/politique-confidentialite" target="_blank" rel="noopener noreferrer">
                  Politique de confidentialité
                </a>
                .
              </span>
            </label>
          )}
          {message && <div className={`notice ${error ? "notice-error" : ""} mt-4`}>{message}</div>}
          {mode === "register" && registeredEmail && !error && (
            <button
              className="btn btn-ghost mt-3 w-full"
              type="button"
              onClick={resendConfirmationEmail}
              disabled={resending}
            >
              {resending ? "Renvoi en cours..." : "Renvoyer l'email de confirmation"}
            </button>
          )}
          <button className="btn btn-primary mt-5 w-full" type="submit">
            {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === "login" ? "Se connecter" : "Créer mon compte vendeur"}
          </button>
          <Link className="mt-5 block text-center font-bold text-ucao-green dark:text-ucao-gold" href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Devenir vendeur" : "J’ai déjà un compte"}
          </Link>
        </form>
      </main>
    </ThemeProvider>
  );
}