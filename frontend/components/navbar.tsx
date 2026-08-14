"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Camera,
  CirclePlus,
  Globe2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Moon,
  Network,
  Phone,
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
        "inline-flex items-center gap-2.5 text-[22px] font-extrabold",
        footer && "text-white",
      )}
    >
      <span className="grid size-10 place-items-center overflow-hidden rounded-ucao bg-white shadow-[0_8px_18px_rgba(30,42,110,0.12)]">
        <Image src="/logo-ucao.png" alt="Logo UCAO Marketplace" width={40} height={40} className="h-10 w-10 object-contain" />
      </span>
      <span>
        <strong className="text-ucao-red">UCAO</strong> Marketplace
      </span>
    </Link>
  );
}

export function Topbar() {
  return (
    <div className="hidden min-h-[38px] items-center justify-between gap-4 bg-[linear-gradient(90deg,#1E2A6E,#1E2A6E_72%,#7A1E2D_72%)] px-[max(16px,calc((100vw-1160px)/2))] py-1.5 text-[13px] text-white lg:flex">
      <div className="flex items-center gap-2.5" aria-label="Réseaux UCAO UUT">
        <span>Suivez UCAO UUT</span>
        <a className="grid size-6 place-items-center rounded-full bg-white/20" href="https://ucao-uut.tg" target="_blank" rel="noopener noreferrer" aria-label="Site UCAO UUT">
          <Globe2 size={15} />
        </a>
        <a className="grid size-6 place-items-center rounded-full bg-white/20" href="#" aria-label="Galerie du campus">
          <Camera size={15} />
        </a>
        <a className="grid size-6 place-items-center rounded-full bg-white/20" href="#" aria-label="Réseau professionnel">
          <Network size={15} />
        </a>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="flex items-center gap-2.5">
          <MapPin size={15} /> Campus UCAO UUT
        </span>
        <span className="flex items-center gap-2.5">
          <Mail size={15} /> ucaomarketplace@gmail.com
        </span>
        <span className="flex items-center gap-2.5">
          <Phone size={15} /> +228 92 98 29 26
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

  async function handleSignOut() {
    await signOut();
    setRole(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const visibleNavItems = useMemo(() => {
    const canAccessDashboard = role === "VENDEUR" || role === "ADMIN";
    const canAccessAdmin = role === "ADMIN";
    return [
      ...navItems,
      ...(canAccessDashboard ? [{ href: "/dashboard", label: "Tableau de bord" }] : []),
      ...(canAccessAdmin ? [{ href: "/admin", label: "Administration" }] : []),
    ];
  }, [role]);

  return (
    <header className="relative z-20">
      {showTopbar && <Topbar />}
      <nav
        className="sticky top-0 flex min-h-[70px] items-center justify-between gap-6 bg-white px-[max(16px,calc((100vw-1160px)/2))] shadow-[0_8px_24px_rgba(30,42,110,0.08)] dark:bg-[#0b1c31] lg:min-h-[78px]"
        aria-label="Navigation principale"
      >
        <Brand />
        <button
          type="button"
          className="grid size-10 place-items-center text-ucao-ink dark:text-white lg:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <div
          className={cn(
            "absolute left-0 right-0 top-[70px] hidden flex-col items-start gap-5 bg-white px-4 py-5 text-sm font-bold shadow-ucao dark:bg-[#0b1c31] lg:static lg:flex lg:flex-row lg:items-center lg:bg-transparent lg:p-0 lg:shadow-none lg:dark:bg-transparent",
            open && "flex",
          )}
        >
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[#263a55] hover:text-ucao-red dark:text-[#cdd7e5] dark:hover:text-[#ff9aa0]",
                (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) &&
                  "text-ucao-red dark:text-[#ff9aa0]",
              )}
            >
              {item.label}
            </Link>
          ))}
          {!role && (
            <Link
              href="/login"
              className={cn(
                "text-[#263a55] hover:text-ucao-red dark:text-[#cdd7e5] dark:hover:text-[#ff9aa0]",
                pathname === "/login" && "text-ucao-red dark:text-[#ff9aa0]",
              )}
            >
              Connexion
            </Link>
          )}
          {role && (
            <button type="button" className="btn btn-ghost min-h-10 px-3" onClick={handleSignOut}>
              <LogOut size={18} /> Déconnexion
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost min-h-10 px-3"
            aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          {role && (
            <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
              <LogOut size={18} /> Déconnexion
            </button>
          )}
          <Link className="btn btn-primary" href="/devenir-vendeur">
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