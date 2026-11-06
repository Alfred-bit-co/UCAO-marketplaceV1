// Pose le thème sombre AVANT le premier affichage (pas de flash blanc).
// Fichier servi par le site lui-même : compatible avec une CSP « script-src 'self' »,
// sans hash ni nonce. La clé doit rester identique à STORAGE_KEY (components/theme-provider.tsx).
try {
  if (localStorage.getItem("ucao-theme") === "dark") document.documentElement.classList.add("dark");
} catch (e) {}
