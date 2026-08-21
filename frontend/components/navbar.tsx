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
  Menu,
  Moon,
  Phone,
  MessageCircle,
  Store,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCurrentUserRole, signOut } from "@/lib/users";
import { useTheme } from "./theme-provider";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/products", label: "Produits" },
  { href: "/stands", label: "Stands" },
];

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 text-[20px] font-extrabold tracking-tight",
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

export function Topbar() {
  return (
    <div className="hidden min-h-[38px] items-center justify-between gap-4 bg-[linear-gradient(90deg,#1E2A6E,#2C3A7A_45%,#4C2F4F_72%,#7A1E2D)] px-[max(16px,calc((100vw-1160px)/2))] py-1.5 text-[13px] font-medium text-white/95 lg:flex">
      <div className="flex items-center gap-2.5" aria-label="Réseaux UCAO UUT">
        <span>Suivez UCAO UUT</span>
        <a className="grid size-6 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25" href="https://ucao-uut.tg" target="_blank" rel="noopener noreferrer" aria-label="Site UCAO UUT">
          <Globe2 size={14} />
        </a>
        <a className="grid size-6 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25" href="https://www.instagram.com/ucaomarketplace?igsi=MTFuZnQ5Y3JyM2FhcA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram UCAO Marketplace">
          <Instagram size={14} />
        </a>
        <a className="grid size-6 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25" href="https://wa.me/22892982926" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp UCAO Marketplace">
          <MessageCircle size={14} />
        </a>
      </div>
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-2">
          <MapPin size={14} /> Campus UCAO UUT
        </span>
        <span className="flex items-center gap-2">
          <Mail size={14} /> ucaomarketplace2026@gmail.com
        </span>
        <span className="flex items-center gap-2">
          <Phone size={14} /> +228 92 98 29 26
        </span>
      </div>
    </div>
  );
}

export function Navbar({ showTopbar = false }: { showTopbar?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let active = true;
    const refreshRole = () =>
      getCurrentUserRole().then((currentRole) => {
        if (active) setRole(currentRole);
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

  async function handleSignOut() {
    await signOut();
    setRole(null);
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
    return links;
  }, [role]);

  return (
    <header className="relative z-20">
      {showTopbar && <Topbar />}
      <nav
        className="sticky top-0 flex min-h-[76px] items-center justify-between gap-6 border-b border-black/5 bg-white/95 px-[max(16px,calc((100vw-1160px)/2))] shadow-[0_4px_20px_rgba(30,42,110,0.06)] backdrop-blur-sm dark:border-white/5 dark:bg-[#0b1c31]/95 lg:min-h-[82px]"
        aria-label="Navigation principale"
      >
        <Brand />

        <button
          type="button"
          className="z-30 grid size-10 place-items-center rounded-xl text-ucao-ink transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10 lg:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>

        <div
          className={cn(
            "absolute left-0 right-0 top-[76px] z-20 flex-col items-start gap-1 border-t border-black/5 bg-white px-4 py-4 text-[15px] font-semibold shadow-lg dark:border-white/5 dark:bg-[#0b1c31] lg:static lg:top-auto lg:flex lg:flex-1 lg:flex-row lg:items-center lg:justify-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
            open ? "flex" : "hidden lg:flex",
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full rounded-xl px-4 py-2.5 text-[#263a55] transition-colors hover:bg-ucao-soft hover:text-ucao-red lg:w-auto dark:text-[#cdd7e5] dark:hover:bg-white/5 dark:hover:text-[#ff9aa0]",
                (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) &&
                  "bg-ucao-soft text-ucao-red dark:bg-white/5 dark:text-[#ff9aa0]",
              )}
            >
              {item.label}
            </Link>
          ))}
          {roleLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "w-full rounded-xl px-4 py-2.5 text-[#263a55] transition-colors hover:bg-ucao-soft hover:text-ucao-red lg:w-auto dark:text-[#cdd7e5] dark:hover:bg-white/5 dark:hover:text-[#ff9aa0]",
                pathname.startsWith(href) && "bg-ucao-soft text-ucao-red dark:bg-white/5 dark:text-[#ff9aa0]",
              )}
            >
              {label}
            </Link>
          ))}

          <div className="my-2 h-px w-full bg-black/5 dark:bg-white/5 lg:hidden" />

          {!role && (
            <Link
              href="/login"
              className="w-full rounded-xl px-4 py-2.5 text-[#263a55] transition-colors hover:bg-ucao-soft hover:text-ucao-red lg:hidden dark:text-[#cdd7e5] dark:hover:bg-white/5 dark:hover:text-[#ff9aa0]"
            >
              Connexion
            </Link>
          )}
          {role && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-ucao-red transition-colors hover:bg-ucao-soft lg:hidden dark:hover:bg-white/5"
              onClick={handleSignOut}
            >
              <LogOut size={16} /> Déconnexion
            </button>
          )}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid size-11 place-items-center rounded-xl text-ucao-ink transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
            aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {!role && (
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 font-bold text-[#263a55] transition-colors hover:bg-ucao-soft hover:text-ucao-red dark:text-[#cdd7e5] dark:hover:bg-white/5 dark:hover:text-[#ff9aa0]"
            >
              Connexion
            </Link>
          )}
          {role && (
            <button
              type="button"
              className="grid size-11 place-items-center rounded-xl text-ucao-ink transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
              onClick={handleSignOut}
              aria-label="Déconnexion"
              title="Déconnexion"
            >
              <LogOut size={19} />
            </button>
          )}

          <Link className="btn btn-primary ml-1 shadow-[0_8px_20px_rgba(122,30,45,0.25)]" href="/devenir-vendeur">
            <CirclePlus size={18} /> Devenir vendeur
          </Link>
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