"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "ucao-theme";

/**
 * Script exécuté dans le <head> AVANT l'affichage : il pose la classe "dark" tout de suite,
 * ce qui évite le flash blanc au chargement d'une page en mode sombre.
 * Chaîne fixe (aucune donnée utilisateur) : sans risque d'injection.
 */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem("${STORAGE_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

function currentDomTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Le provider est remonté à chaque page : on repart de la classe déjà posée sur <html>,
  // pas de "light" par défaut, pour que l'icône du bouton ne clignote pas.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(currentDomTheme());
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        const next: Theme = currentDomTheme() === "dark" ? "light" : "dark";
        const root = document.documentElement;
        // Transition douce des couleurs pendant le changement de thème uniquement.
        root.classList.add("theme-transition");
        root.classList.toggle("dark", next === "dark");
        window.setTimeout(() => root.classList.remove("theme-transition"), 350);
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // stockage indisponible (navigation privée) : le thème vaut pour cette visite
        }
        setTheme(next);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
