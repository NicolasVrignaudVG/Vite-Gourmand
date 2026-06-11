import Route from "./Route.js";

export const allRoutes = [
    new Route("/",                      "Accueil",                  "/pages/home.html"),
    new Route("/menus",                 "Menus",                    "/pages/menus.html"),
    new Route("/menu-detail",           "Détail du menu",           "/pages/menu-detail.html"),
    new Route("/commande",              "Commander",                "/pages/commande.html"),
    new Route("/connexion",             "Connexion",                "/pages/connexion.html"),
    new Route("/inscription",           "Inscription",              "/pages/inscription.html"),
    new Route("/contact",               "Contact",                  "/pages/contact.html"),
    new Route("/mot-de-passe-oublie",   "Mot de passe oublié",      "/pages/mot-de-passe-oublie.html"),
    new Route("/reinitialiser-mdp",     "Réinitialiser le mot de passe", "/pages/reinitialiser-mdp.html"),
    new Route("/mentions-legales",      "Mentions légales",         "/pages/mentions-legales.html"),
    new Route("/cgv",                   "CGV",                      "/pages/cgv.html"),
    new Route("/espace-utilisateur",    "Mon espace",               "/pages/espace-utilisateur.html"),
    new Route("/espace-employe",        "Espace Employé",           "/pages/espace-employe.html"),
    new Route("/espace-admin",          "Administration",           "/pages/espace-admin.html"),
    new Route("/404",                   "Page introuvable",         "/pages/404.html"),
];

export const websiteName = "Vite&Gourmand";
