// Router/router.js
import { allRoutes, websiteName } from "./allRoutes.js";

document.addEventListener('DOMContentLoaded', () => {
    const mainPage = document.getElementById('main-page');

    // ── Résolution hash → nom de page ────────────────────────
    const pageMap = {
        '':                     'home',
        'home':                 'home',
        'menus':                'menus',
        'menu-detail':          'menu-detail',
        'commande':             'commande',
        'connexion':            'connexion',
        'inscription':          'inscription',
        'contact':              'contact',
        'mot-de-passe-oublie':  'mot-de-passe-oublie',
        'reinitialiser-mdp':    'reinitialiser-mdp',
        'mentions-legales':     'mentions-legales',
        'cgv':                  'cgv',
        'espace-utilisateur':   'espace-utilisateur',
        'espace-employe':       'espace-employe',
        'espace-admin':         'espace-admin',
    };

    const resolveRoute = hash => {
        // Extrait le nom de page (ignore les query params éventuels)
        const pageName = hash.split('?')[0];
        return pageMap[pageName] ?? null;
    };

    // ── Chargement d'une page ────────────────────────────────
    const loadPage = async (pageName) => {
        if (!pageName) pageName = 'home';

        updateActiveNav(pageName);

        try {
            const response = await fetch(`pages/${pageName}.html`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            mainPage.innerHTML = html;

            // Remonter en haut de page à chaque changement de page (comportement SPA attendu)
            window.scrollTo(0, 0);

            // Titre du document
            const route = allRoutes.find(r => r.pathHtml.includes(`${pageName}.html`));
            document.title = route ? `${route.title} – ${websiteName}` : websiteName;

            initPageFeatures(pageName);

        } catch (error) {
            console.error(`Erreur chargement "${pageName}" :`, error);
            mainPage.innerHTML = `
                <div style="text-align:center;padding:4rem 2rem;">
                    <h2>Oups !</h2>
                    <p>La page "<strong>${pageName}</strong>" n'a pas pu être chargée.</p>
                    <p style="font-size:.85rem;color:#888;">${error.message}</p>
                    <button onclick="window.location.hash='home'" class="button" style="margin-top:1rem;">
                        Retour à l'accueil
                    </button>
                </div>`;
        }
    };

    // ── Appel des fonctions de script.js selon la page ───────
    function initPageFeatures(pageName) {
        switch (pageName) {
            case 'menus':                initMenuDetails();          break;
            case 'menu-detail':          initMenuDetail();           break;
            case 'commande':             initCommande();             break;
            case 'home':                 initHomeFeatures();         break;
            case 'connexion':            initConnexionFeatures();    break;
            case 'inscription':          initInscriptionFeatures();  break;
            case 'contact':              initContactFeatures();      break;
            case 'mot-de-passe-oublie':  initForgotPassword();       break;
            case 'reinitialiser-mdp':    initResetPassword();        break;
            case 'espace-utilisateur':   initEspaceUtilisateur();    break;
            case 'espace-employe':       initEspaceEmploye();        break;
            case 'espace-admin':         initEspaceAdmin();          break;
        }
        initScrollAnimations();
    }

    // ── Lien actif dans la nav ───────────────────────────────
    const updateActiveNav = (pageName) => {
        document.querySelectorAll('.navbar-item a, .mobile-nav-list a').forEach(link => {
            link.removeAttribute('aria-current');
            const hash = link.getAttribute('href')?.replace('#', '') || '';
            if (hash === pageName) link.setAttribute('aria-current', 'page');
        });
    };

    // ── Délégation de navigation (liens #hash) ───────────────
    document.body.addEventListener('click', e => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const fullHash = link.getAttribute('href').substring(1);
        const page     = resolveRoute(fullHash) ?? fullHash.split('?')[0];

        if (page) {
            e.preventDefault();
            history.pushState(null, '', `#${fullHash}`);
            loadPage(page);
        }
    });

    // ── Démarrage ────────────────────────────────────────────
    const initialHash = window.location.hash.substring(1);
    const initialPage = initialHash === ''
        ? 'home'
        : (resolveRoute(initialHash) ?? '404');
    loadPage(initialPage);

    // ── Boutons Précédent / Suivant ──────────────────────────
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substring(1);
        const page = hash === '' ? 'home' : (resolveRoute(hash) ?? '404');
        loadPage(page);
    });
});
