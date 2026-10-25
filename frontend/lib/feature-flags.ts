// Réglages d'activation des fonctions en cours de déploiement.
//
// VIP_REQUESTS_SOON : true  -> la ligne « Voir les demandes des étudiants » du palier VIP
//                             affiche le badge « Bientôt » (la page n'est pas encore ouverte).
//                     false -> le badge disparaît (la fonction est disponible).
//
// Pour retirer le badge : définir NEXT_PUBLIC_VIP_REQUESTS_SOON=false dans .env.local
// et dans les variables d'environnement Vercel, puis redémarrer / redéployer.
export const VIP_REQUESTS_SOON = process.env.NEXT_PUBLIC_VIP_REQUESTS_SOON !== "false";
