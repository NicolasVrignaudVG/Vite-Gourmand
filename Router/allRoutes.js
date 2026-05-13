import Route from "./Route.js";

// Définitions des routes
export const allRoutes = [
    new Route("/",            "Accueil",         "/pages/home.html"),
    new Route("/menus",       "Menus",            "/pages/menus.html"),
    new Route("/menu-detail", "Détail du menu",   "/pages/menu-detail.html"),
    new Route("/connexion",   "Connexion",        "/pages/connexion.html"),
    new Route("/inscription", "Inscription",      "/pages/inscription.html"),
    new Route("/contact",     "Contact",          "/pages/contact.html"),
];

// Le titre s'affiche comme ceci : Route.titre – websiteName
export const websiteName = "Vite&Gourmand";
