/**
 * Catalogue des clubs de l'UCAO.
 *
 * Pour ajouter un club : copier un bloc de la liste CLUBS, changer les textes et déposer son image
 * dans frontend/public/images/clubs/ (le nom du fichier est celui de "image").
 * Si l'icône du club n'existe pas encore, l'ajouter aussi dans CLUB_ICONS (components/club-card.tsx).
 *
 * Numéro du responsable : managerPhone, au format international (+22890123456).
 * Tant qu'il est vide, la carte affiche « Bientôt disponible » au lieu du bouton.
 */

export type ClubAccent = {
  /** Couleur vive : pastille de l'icône et trait décoratif. */
  main: string;
  /** Couleur claire, lisible sur le fond sombre : « Club de » et l'accroche. */
  light: string;
  /** Dégradé du bouton (assez foncé pour que le texte blanc reste lisible). */
  buttonFrom: string;
  buttonTo: string;
};

export type ClubEntry = {
  slug: string;
  prefix: string;
  name: string;
  tagline: string;
  description: string;
  sideTitle: [string, string];
  sideText: string;
  image: string;
  accent: ClubAccent;
  managerPhone: string;
};

const PHONE_PATTERN = /^\+\d{8,15}$/;

export const CLUBS: ClubEntry[] = [
  {
    slug: "basketball",
    prefix: "Club de",
    name: "Basketball",
    tagline: "Joue. Progresse. Ensemble.",
    description:
      "Le club de basketball de l'UCAO, c'est plus qu'un sport : c'est une équipe, une discipline et une passion partagée. Que tu sois débutant ou confirmé, viens vivre l'aventure sur le terrain avec nous !",
    sideTitle: ["Plus qu'un sport,", "une famille."],
    sideText:
      "Le club de basketball de l'UCAO rassemble des étudiants passionnés par le jeu, le dépassement de soi et l'esprit d'équipe.",
    image: "/images/clubs/basketball.jpg",
    accent: { main: "#1f8fff", light: "#4cc3ff", buttonFrom: "#1473e6", buttonTo: "#0b5fd6" },
    managerPhone: "",
  },
  {
    slug: "theatre",
    prefix: "Club de",
    name: "Théâtre",
    tagline: "Joue. Crée. Partage.",
    description:
      "Le club de théâtre t'invite à explorer ta créativité, à développer ta confiance en toi et à partager des émotions fortes sur scène. Que tu sois acteur, metteur en scène ou simple passionné, il y a une place pour toi !",
    sideTitle: ["Exprime-toi.", "Fais vivre des histoires."],
    sideText:
      "Sur scène comme en coulisses, le club de théâtre de l'UCAO réunit des étudiants qui aiment raconter, jouer et créer ensemble.",
    image: "/images/clubs/theatre.jpg",
    accent: { main: "#a855f7", light: "#e879f9", buttonFrom: "#9333ea", buttonTo: "#7e22ce" },
    managerPhone: "",
  },
  {
    slug: "jeux-video",
    prefix: "Club de",
    name: "Jeux vidéo",
    tagline: "Joue. Partage. Dépasse-toi.",
    description:
      "Le club de jeux vidéo, c'est l'endroit où la passion du gaming prend vie. Affronte tes amis, participe à des tournois, découvre de nouveaux jeux et partage ta passion avec une communauté motivée.",
    sideTitle: ["Une communauté.", "Des défis. Du fun."],
    sideText:
      "Le club de jeux vidéo réunit des passionnés de tous horizons autour d'une même passion : le jeu. Que tu sois joueur casual ou compétitif, tu trouveras ta place ici !",
    image: "/images/clubs/jeux-video.jpg",
    accent: { main: "#22b8ff", light: "#7dd3fc", buttonFrom: "#1d7bf2", buttonTo: "#2563eb" },
    managerPhone: "",
  },
  {
    slug: "football",
    prefix: "Club de",
    name: "Football",
    tagline: "Joue. Gagne. Ensemble.",
    description:
      "Le club de football de l'UCAO, c'est le terrain, l'esprit d'équipe et la passion du ballon rond. Que tu sois attaquant, gardien ou simple supporter, viens partager des matchs et des entraînements dans une bonne ambiance !",
    sideTitle: ["Le ballon rond,", "version campus."],
    sideText:
      "Le club de football rassemble des étudiants qui aiment bouger, se dépasser et vibrer ensemble, du premier entraînement au dernier coup de sifflet.",
    image: "/images/clubs/football.jpg",
    accent: { main: "#22c55e", light: "#86efac", buttonFrom: "#15803d", buttonTo: "#166534" },
    managerPhone: "",
  },
  {
    slug: "communication",
    prefix: "Club de",
    name: "Communication",
    tagline: "Parle. Crée. Inspire.",
    description:
      "Le club de communication de l'UCAO est l'endroit pour apprendre à captiver un public : prise de parole, réseaux sociaux et création de contenu. Viens développer ton style et donner de la voix aux projets du campus !",
    sideTitle: ["Fais entendre", "ta voix."],
    sideText:
      "Le club de communication réunit des étudiants qui aiment raconter, filmer, écrire et faire rayonner la vie du campus.",
    image: "/images/clubs/communication.jpg",
    accent: { main: "#f97316", light: "#fdba74", buttonFrom: "#c2410c", buttonTo: "#9a3412" },
    managerPhone: "",
  },
  {
    slug: "juristes",
    prefix: "Club des",
    name: "Juristes",
    tagline: "Argumente. Comprends. Défends.",
    description:
      "Le club des juristes de l'UCAO réunit des étudiants curieux du droit et de la justice. Débats, discussions et projets autour du droit : viens aiguiser ton esprit critique et ta rigueur !",
    sideTitle: ["Le droit,", "par la pratique."],
    sideText:
      "Le club des juristes est un espace pour mieux comprendre les règles qui organisent notre société, et apprendre à les défendre avec des arguments solides.",
    image: "/images/clubs/juristes.jpg",
    accent: { main: "#d4a24c", light: "#fcd34d", buttonFrom: "#b45309", buttonTo: "#92400e" },
    managerPhone: "",
  },
  {
    slug: "petanque",
    prefix: "Club de",
    name: "Pétanque",
    tagline: "Vise. Lance. Savoure.",
    description:
      "Le club de pétanque de l'UCAO, c'est la précision, la stratégie et la convivialité. Viens jouer entre amis, apprendre les bons gestes et profiter d'un moment de détente entre deux cours !",
    sideTitle: ["Un jeu simple,", "une ambiance unique."],
    sideText:
      "Le club de pétanque rassemble des étudiants qui aiment les parties conviviales, les défis amicaux et les bons moments sur le terrain.",
    image: "/images/clubs/petanque.jpg",
    accent: { main: "#f43f5e", light: "#fda4af", buttonFrom: "#e11d48", buttonTo: "#be123c" },
    managerPhone: "",
  },
  {
    slug: "volley",
    prefix: "Club de",
    name: "Volley",
    tagline: "Saute. Smashe. Ensemble.",
    description:
      "Le club de volley de l'UCAO, c'est le rythme, la cohésion et l'énergie d'une équipe qui se renvoie la balle. Que tu sois débutant ou confirmé, viens jouer, progresser et te faire de nouveaux amis !",
    sideTitle: ["Un seul filet,", "une équipe unie."],
    sideText:
      "Le club de volley réunit des étudiants qui aiment l'esprit d'équipe, la vitesse du jeu et les beaux échanges.",
    image: "/images/clubs/volley.jpg",
    accent: { main: "#14b8a6", light: "#5eead4", buttonFrom: "#0f766e", buttonTo: "#115e59" },
    managerPhone: "",
  },
  {
    slug: "chorale",
    prefix: "Club de la",
    name: "Chorale",
    tagline: "Chante. Partage. Vibre.",
    description:
      "La chorale de l'UCAO réunit des voix de tous horizons autour de la même passion : la musique. Que tu chantes depuis toujours ou que tu veuilles essayer, viens trouver ta voix dans l'harmonie du groupe !",
    sideTitle: ["Mille voix,", "une seule harmonie."],
    sideText:
      "La chorale rassemble des étudiants qui aiment chanter ensemble, partager des émotions et faire résonner le campus.",
    image: "/images/clubs/chorale.jpg",
    accent: { main: "#ec4899", light: "#f9a8d4", buttonFrom: "#db2777", buttonTo: "#be185d" },
    managerPhone: "",
  },
  {
    slug: "dance",
    prefix: "Club de",
    name: "Danse",
    tagline: "Bouge. Crée. Rayonne.",
    description:
      "Le club de danse de l'UCAO, c'est le rythme, l'énergie et la créativité en mouvement. Que tu danses depuis toujours ou que tu fasses tes premiers pas, viens apprendre, t'exprimer et partager ta passion avec le groupe !",
    sideTitle: ["Laisse parler", "ton corps."],
    sideText:
      "Le club de danse rassemble des étudiants qui aiment la musique, le mouvement et les belles chorégraphies, dans une ambiance où chacun trouve sa place.",
    image: "/images/clubs/dance.jpg",
    accent: { main: "#6366f1", light: "#a5b4fc", buttonFrom: "#4f46e5", buttonTo: "#4338ca" },
    managerPhone: "",
  },
  {
    slug: "cybersecurite",
    prefix: "Club de",
    name: "Cybersécurité",
    tagline: "Apprends. Protège. Défie.",
    description:
      "Le club de cybersécurité de l'UCAO t'invite à découvrir les bases de la sécurité informatique, à pratiquer lors d'ateliers et de défis CTF, et à adopter les bons réflexes pour te protéger en ligne. Que tu sois débutant curieux ou passionné confirmé, viens apprendre en équipe !",
    sideTitle: ["Protège tes données,", "maîtrise le numérique."],
    sideText:
      "Le club de cybersécurité de l'UCAO rassemble des étudiants curieux de comprendre comment fonctionnent les attaques et comment s'en défendre, dans un cadre éthique et collaboratif.",
    image: "/images/clubs/cyber.jpg",
    accent: { main: "#10b981", light: "#6ee7b7", buttonFrom: "#047857", buttonTo: "#065f46" },
    managerPhone: "",
  },
];

export function getClubFullName(club: ClubEntry): string {
  return club.prefix + " " + club.name;
}

/**
 * Lien WhatsApp vers le responsable du club, avec le message déjà écrit.
 * Renvoie null tant que le numéro est vide ou invalide : la carte n'affiche alors pas de bouton actif.
 */
export function getJoinLink(club: ClubEntry): string | null {
  const phone = club.managerPhone.replace(/[\s.-]/g, "");
  if (!PHONE_PATTERN.test(phone)) return null;

  const message =
    "Bonjour, je souhaite rejoindre le " +
    getClubFullName(club) +
    " de l'UCAO. J'ai découvert le club sur UCAO Marketplace. Pouvez-vous m'indiquer comment faire ?";

  return "https://wa.me/" + phone.slice(1) + "?text=" + encodeURIComponent(message);
}
