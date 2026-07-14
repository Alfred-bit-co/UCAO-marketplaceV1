"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  GraduationCap,
  Globe2,
  Mail,
  MapPin,
  Menu,
  Moon,
  Network,
  Phone,
  Sparkles,
  Store,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/products", label: "Produits" },
  { href: "/stands", label: "Stands" },
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/admin", label: "Administration" },
  { href: "/login", label: "Connexion" },
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
      <span className="grid size-[42px] place-items-center rounded-full bg-ucao-gold-soft text-ucao-green">
        <GraduationCap size={25} strokeWidth={2.6} aria-hidden />
      </span>
      <span>
        <strong className="text-ucao-green">UCAO</strong> Market
      </span>
    </Link>
  );
}

export function Topbar() {
  return (
    <div className="hidden min-h-[38px] items-center justify-between gap-4 bg-[linear-gradient(90deg,#f5a623,#ffc34f_27%,#007a63_27%)] px-[max(16px,calc((100vw-1160px)/2))] py-1.5 text-[13px] text-white lg:flex">
      <div className="flex items-center gap-2.5" aria-label="Réseaux UCAO UUT">
        <span>Suivez UCAO UUT</span>
        <a className="grid size-6 place-items-center rounded-full bg-white/20" href="#" aria-label="Site UCAO UUT">
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
          <Mail size={15} /> marketplace@ucao-uut.edu
        </span>
        <span className="flex items-center gap-2.5">
          <Phone size={15} /> +221 77 000 00 00
        </span>
      </div>
    </div>
  );
}

export function Navbar({ showTopbar = false }: { showTopbar?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="relative z-20">
      {showTopbar && <Topbar />}
      <nav
        className="sticky top-0 flex min-h-[70px] items-center justify-between gap-6 bg-white px-[max(16px,calc((100vw-1160px)/2))] shadow-[0_8px_24px_rgba(16,36,63,0.08)] dark:bg-[#0f1d32] lg:min-h-[78px]"
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
            "absolute left-0 right-0 top-[70px] hidden flex-col items-start gap-5 bg-white px-4 py-5 text-sm font-bold shadow-ucao dark:bg-[#0f1d32] lg:static lg:flex lg:flex-row lg:items-center lg:bg-transparent lg:p-0 lg:shadow-none lg:dark:bg-transparent",
            open && "flex",
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[#263a55] hover:text-ucao-green dark:text-[#cdd7e5] dark:hover:text-ucao-gold",
                (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) &&
                  "text-ucao-green dark:text-ucao-gold",
              )}
            >
              {item.label}
            </Link>
          ))}
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
        <Link className="btn btn-primary hidden lg:inline-flex" href="/register">
          <Sparkles size={18} /> Créer un stand
        </Link>
      </nav>
    </header>
  );
}

export function StandNavbarCta() {
  return (
    <Link className="btn btn-primary hidden lg:inline-flex" href="/register">
      <Store size={18} /> Créer un stand
    </Link>
  );
}
