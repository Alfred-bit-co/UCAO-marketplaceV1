"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CirclePlus,
  Globe2,
  Instagram,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  MessageCircle,
  Store,
  Sun,
  X,
} from "@/lib/icons";
import { useEffect, useMemo, useState } from "react";
import { amIClubManager } from "@/lib/clubs";
import { createClient } from "@/lib/supabase";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCurrentUserRole, signOut } from "@/lib/users";
import { useTheme } from "./theme-provider";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/products", label: "Produits" },
  { href: "/stands", label: "Stands" },
  { href: "/clubs", label: "Clubs" },
];

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-[20px] font-semibold tracking-tight",
        footer && "text-white",
      )}
    >
      <span className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_18px_rgba(30,42,110,0.14)] ring-1 ring-black/5">
        <Image src="/logo-ucao.png" alt="Logo UCAO Marketplace" width={44} height={44} className="h-11 w-11 object-contain" />
      </span>
      <span className="leading-tight">
        <strong className="text-ucao-red">UCAO</strong> Marketplace
      </span>
    </Link>
  );
}

const TOPBAR_SOCIAL_LINK =
  "grid size-5 shrink-0 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const TOPBAR_CONTACT_LINK =
  "items-center gap-1.5 whitespace-nowrap rounded-full transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Bandeau au-dessus de la navigation : réseaux à gauche, contacts à droite (une seule ligne, 30 px). */
export function Topbar() {
  return (
    <div className="flex h-[30px] items-center justify-between gap-3 bg-[linear-gradient(90deg,#1E2A6E,#2C3A7A_45%,#4C2F4F_72%,#7A1E2D)] px-4 text-[11px] font-medium text-white/95 sm:px-6 sm:text-xs lg:px-[max(24px,calc((100vw-1740px)/2))]">
      <div className="flex min-w-0 items-center gap-2" aria-label="Réseaux UCAO Marketplace">
        <span className="whitespace-nowrap max-[359px]:hidden">
          <span className="sm:hidden">Suivez-nous</span>
          <span className="hidden sm:inline">Suivez UCAO Marketplace</span>
        </span>
        <a className={TOPBAR_SOCIAL_LINK} href="https://www.instagram.com/ucaomarketplace?igsi=MTFuZnQ5Y3JyM2FhcA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram UCAO Marketplace">
          <Instagram size={12} aria-hidden="true" />
        </a>
        <a className={TOPBAR_SOCIAL_LINK} href="https://wa.me/22892982926" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp UCAO Marketplace">
          <MessageCircle size={12} aria-hidden="true" />
        </a>
        <a className={TOPBAR_SOCIAL_LINK} href="https://ucao-uut.tg" target="_blank" rel="noopener noreferrer" aria-label="Site UCAO UUT">
          <Globe2 size={12} aria-hidden="true" />
        </a>
      </div>
      <div className="flex shrink-0 items-center gap-4 lg:gap-5">
        <span className="hidden items-center gap-1.5 whitespace-nowrap lg:inline-flex">
          <MapPin size={12} aria-hidden="true" /> Campus UCAO UUT
        </span>
        <a className={cn(TOPBAR_CONTACT_LINK, "hidden md:inline-flex")} href="mailto:ucaomarketplace2026@gmail.com">
          <Mail size={12} aria-hidden="true" /> ucaomarketplace2026@gmail.com
        </a>
        <a className={cn(TOPBAR_CONTACT_LINK, "inline-flex")} href="tel:+22892982926" aria-label="Appeler UCAO Marketplace au +228 92 98 29 26">
          <Phone size={12} aria-hidden="true" /> +228 92 98 29 26
        </a>
      </div>
    </div>
  );
}

// Rôle mémorisé entre deux pages : la navbar est remontée à chaque navigation, et sans ce cache
// les liens « Connexion » / « Mon profil » clignotaient le temps de relire la session.
// undefined = pas encore connu (premier chargement).
let cachedRole: UserRole | null | undefined;
// Même principe pour le droit « gestionnaire des clubs » (fonction am_i_club_manager, vraie aussi pour l'admin).
let cachedClubManager: boolean | undefined;

export function Navbar({ showTopbar = false }: { showTopbar?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole | null>(cachedRole ?? null);
  const [roleKnown, setRoleKnown] = useState(cachedRole !== undefined);
  const [clubManager, setClubManager] = useState(cachedClubManager ?? false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let active = true;
    const refreshRole = () =>
      getCurrentUserRole().then(async (currentRole) => {
        cachedRole = currentRole;
        if (!active) return;
        setRole(currentRole);
        setRoleKnown(true);
        const manager = currentRole ? await amIClubManager() : false;
        cachedClubManager = manager;
        if (active) setClubManager(manager);
      });
    refreshRole();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange(() => {
      refreshRole();
    }) ?? { data: { subscription: null } };
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Menu mobile : fermeture avec la touche Échap.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function handleSignOut() {
    await signOut();
    cachedRole = null;
    cachedClubManager = false;
    setRole(null);
    setClubManager(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const roleLinks = useMemo(() => {
    const links: { href: string; label: string }[] = [];
    if (role) {
      links.push({ href: "/profil", label: "Mon profil" });
    }
    if (role === "VENDEUR") {
      links.push({ href: "/dashboard", label: "Tableau de bord" });
    }
    if (role === "ADMIN") {
      links.push({ href: "/admin", label: "Administration" });
    }
    // Réservé au représentant des clubs (et à l'admin) : jamais dans la navigation publique.
    if (role && clubManager) {
      links.push({ href: "/espace-clubs", label: "Espace clubs" });
    }
    return links;
  }, [role, clubManager]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    // Tout l'en-tête est collant : un `sticky` posé sur <nav> seul ne fonctionnait pas (son parent
    // ne faisait que sa hauteur). Avec la barre du haut, seule la navigation reste visible.
    <header className={cn("sticky top-0 z-40", showTopbar && "-top-[30px]")}>
      {showTopbar && <Topbar />}
      <nav
        className="relative flex min-h-[72px] items-center border-b border-black/5 bg-white/95 px-4 shadow-[0_4px_20px_rgba(30,42,110,0.06)] backdrop-blur-sm dark:border-white/5 dark:bg-[#0b1c31]/95 sm:px-6 lg:min-h-[82px] lg:px-6"
        aria-label="Navigation principale"
      >
        <div className="mx-auto flex w-full max-w-[1740px] items-center justify-between gap-4 lg:gap-5">
          <Brand />

          <button
            type="button"
            className="z-30 grid size-10 place-items-center rounded-xl text-ucao-ink transition-colors hover:bg-ucao-soft dark:text-white dark:hover:bg-white/10 lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <span className="grid gap-1" aria-hidden="true"><span className="block h-0.5 w-5 rounded-full bg-current" /><span className="block h-0.5 w-5 rounded-full bg-current" /><span className="block h-0.5 w-5 rounded-full bg-current" /></span>}
          </button>

          <div
            id="main-navigation"
            className={cn(
              "absolute left-0 right-0 top-[72px] z-20 max-h-[calc(100dvh-72px)] flex-col items-stretch gap-1 overflow-y-auto overscroll-contain border-t border-black/5 bg-white px-4 py-4 text-[15px] font-medium shadow-[0_18px_28px_rgba(30,42,110,0.12)] dark:border-white/5 dark:bg-[#0b1c31] lg:static lg:top-auto lg:flex lg:flex-1 lg:flex-row lg:items-center lg:justify-center lg:gap-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
              open ? "menu-enter flex lg:animate-none" : "hidden lg:flex",
            )}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 w-full items-center rounded-2xl px-4 text-[#263a55] transition-colors hover:bg-ucao-soft hover:text-ucao-red lg:w-auto lg:px-3 dark:text-[#cdd7e5] dark:hover:bg-white/5 dark:hover:text-[#ff9aa0]",
                  isActive(item.href) &&
                    "bg-ucao-soft font-semibold text-ucao-red shadow-[inset_0_0_0_1px_rgba(30,42,110,0.05)] dark:bg-white/5 dark:text-[#ff9aa0]",
                )}
              >
                {item.label}
              </Link>
            ))}
            {roleLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 w-full items-center whitespace-nowrap rounded-2xl px-4 text-[#263a55] transition-colors hover:bg-ucao-soft hover:text-ucao-red lg:w-auto lg:px-3 dark:text-[#cdd7e5] dark:hover:bg-white/5 dark:hover:text-[#ff9aa0]",
                  isActive(href) && "bg-ucao-soft font-semibold text-ucao-red shadow-[inset_0_0_0_1px_rgba(30,42,110,0.05)] dark:bg-white/5 dark:text-[#ff9aa0]",
                )}
              >
                {label}
              </Link>
            ))}

            <div className="my-2 h-px w-full bg-black/5 dark:bg-white/5 lg:hidden" />

            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-left text-[#263a55] transition-colors hover:bg-ucao-soft dark:text-[#cdd7e5] dark:hover:bg-white/5 lg:hidden"
            >
              {/* Icône et texte suivent la classe "dark" en CSS : aucun clignotement au chargement. */}
              <Sun size={16} className="hidden dark:block" aria-hidden="true" />
              <Moon size={16} className="dark:hidden" aria-hidden="true" />
              <span className="dark:hidden">Mode sombre</span>
              <span className="hidden dark:inline">Mode clair</span>
            </button>

            {roleKnown && !role && (
              <Link
                href="/login"
                className="w-full rounded-2xl px-4 py-2.5 text-[#263a55] transition-colors hover:bg-ucao-soft hover:text-ucao-red lg:hidden dark:text-[#cdd7e5] dark:hover:bg-white/5 dark:hover:text-[#ff9aa0]"
              >
                Connexion
              </Link>
            )}
            {role && (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-left text-ucao-red transition-colors hover:bg-ucao-soft lg:hidden dark:hover:bg-white/5"
                onClick={handleSignOut}
              >
                <LogOut size={16} /> Déconnexion
              </button>
            )}
          </div>

          <div className="hidden shrink-0 items-center gap-1 lg:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="grid size-11 place-items-center rounded-2xl border border-ucao-line bg-white/70 text-ucao-ink transition-colors hover:border-ucao-navy-soft hover:bg-ucao-soft dark:border-[#263d5c] dark:bg-[#10233b] dark:text-white dark:hover:bg-white/10"
              aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              <Sun size={19} className="hidden dark:block" aria-hidden="true" />
              <Moon size={19} className="dark:hidden" aria-hidden="true" />
            </button>

          {roleKnown && !role && (
            <Link
              href="/login"
              className="fade-in inline-flex min-h-11 items-center rounded-2xl px-4 font-medium text-[#263a55] transition-colors hover:bg-ucao-soft hover:text-ucao-red dark:text-[#cdd7e5] dark:hover:bg-white/5 dark:hover:text-[#ff9aa0]"
            >
              Connexion
            </Link>
          )}
          {role && (
            <button
              type="button"
              className="fade-in grid size-11 place-items-center rounded-2xl border border-ucao-line bg-white/70 text-ucao-ink transition-colors hover:border-ucao-navy-soft hover:bg-ucao-soft dark:border-[#263d5c] dark:bg-[#10233b] dark:text-white dark:hover:bg-white/10"
              onClick={handleSignOut}
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <LogOut size={19} />
            </button>
          )}

            <Link className="btn btn-primary ml-1 min-h-11 whitespace-nowrap rounded-2xl px-4 shadow-[0_8px_20px_rgba(122,30,45,0.25)]" href="/devenir-vendeur">
              <CirclePlus size={18} /> Devenir vendeur
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

export function StandNavbarCta() {
  return (
    <Link className="btn btn-primary hidden lg:inline-flex" href="/devenir-vendeur">
      <Store size={18} /> Devenir vendeur
    </Link>
  );
}
