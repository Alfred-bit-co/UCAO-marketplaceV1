window.UCAO_CONFIG = {
  apiBaseUrl: "http://127.0.0.1:5000/api",
  currency: "FCFA",
  categories: [
    { value: "tous", label: "Tous" },
    { value: "nourriture", label: "Nourriture" },
    { value: "vetements", label: "Vêtements" },
    { value: "numerique", label: "Numérique" },
    { value: "livres", label: "Livres" },
    { value: "services", label: "Services" }
  ],
  demoProducts: [
    {
      id: 1,
      nom: "Pack fournitures étudiant",
      categorie: "livres",
      prix: 8500,
      description: "Un kit complet pour la rentrée : cahiers, stylos, classeur, fiches et accessoires essentiels.",
      image_url: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=85",
      vendeur: { nom: "Librairie Campus", role: "VIP", phone: "+221 77 000 00 01" },
      role_vendeur: "VIP"
    },
    {
      id: 2,
      nom: "Service de design CV",
      categorie: "services",
      prix: 5000,
      description: "Création d’un CV professionnel et moderne, adapté aux stages, jobs étudiants et candidatures académiques.",
      image_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85",
      vendeur: { nom: "Studio Étudiant Pro", role: "PREMIUM", phone: "+221 77 000 00 02" },
      role_vendeur: "PREMIUM"
    },
    {
      id: 3,
      nom: "T-shirt UCAO UUT",
      categorie: "vetements",
      prix: 7000,
      description: "T-shirt confortable aux couleurs de l’université, disponible en plusieurs tailles.",
      image_url: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=900&q=85",
      vendeur: { nom: "Club Entrepreneuriat", role: "SIMPLE", phone: "+221 77 000 00 03" },
      role_vendeur: "SIMPLE"
    },
    {
      id: 4,
      nom: "Pack déjeuner campus",
      categorie: "nourriture",
      prix: 2500,
      description: "Repas rapide, boisson et dessert pour les pauses entre deux cours.",
      image_url: "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=900&q=85",
      vendeur: { nom: "UCAO Food", role: "VIP", phone: "+221 77 000 00 04" },
      role_vendeur: "VIP"
    },
    {
      id: 5,
      nom: "Réparation ordinateur",
      categorie: "numerique",
      prix: 10000,
      description: "Diagnostic, nettoyage logiciel et petites réparations pour ordinateurs étudiants.",
      image_url: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=85",
      vendeur: { nom: "Club Informatique", role: "PREMIUM", phone: "+221 77 000 00 05" },
      role_vendeur: "PREMIUM"
    },
    {
      id: 6,
      nom: "Livre économie générale",
      categorie: "livres",
      prix: 6000,
      description: "Livre en bon état pour les cours d’économie générale et de gestion.",
      image_url: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=85",
      vendeur: { nom: "Occasion Étudiante", role: "SIMPLE", phone: "+221 77 000 00 06" },
      role_vendeur: "SIMPLE"
    }
  ],
  demoStands: [
    {
      id: 1,
      nom: "Librairie Campus",
      banniere_url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=85",
      description: "Fournitures, livres, impressions et kits de rentrée pour les étudiants UCAO UUT.",
      vendeur: { nom: "Association des étudiants", role: "VIP" },
      role_vendeur: "VIP",
      produits: []
    },
    {
      id: 2,
      nom: "UCAO Food",
      banniere_url: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=85",
      description: "Collations, repas rapides et boissons pour les pauses entre les cours.",
      vendeur: { nom: "Coopérative étudiante", role: "PREMIUM" },
      role_vendeur: "PREMIUM",
      produits: []
    },
    {
      id: 3,
      nom: "Studio Digital",
      banniere_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85",
      description: "Création graphique, mini-sites, CV et supports de présentation.",
      vendeur: { nom: "Club informatique", role: "VIP" },
      role_vendeur: "VIP",
      produits: []
    }
  ]
};

window.formatPrice = (value) => `${Number(value || 0).toLocaleString("fr-FR")} ${window.UCAO_CONFIG.currency}`;

window.safeText = (value) => String(value ?? "").replace(/[<>&"']/g, (char) => ({
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#039;"
}[char]));

window.getToken = () => localStorage.getItem("ucao_token") || "";

window.apiFetch = async (path, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = window.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${window.UCAO_CONFIG.apiBaseUrl}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Erreur API.");
  return data;
};

window.roleBadge = (role = "SIMPLE") => {
  const normalized = String(role).toUpperCase();
  if (normalized === "VIP") return `<span class="role-badge role-badge--vip"><i data-lucide="medal"></i> VIP</span>`;
  if (normalized === "PREMIUM") return `<span class="role-badge role-badge--premium"><i data-lucide="gem"></i> Premium</span>`;
  return `<span class="role-badge"><i data-lucide="user"></i> Simple</span>`;
};
