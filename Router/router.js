// Router/router.js
import { allRoutes, websiteName } from "./allRoutes.js";

document.addEventListener('DOMContentLoaded', () => {
    const mainPage = document.getElementById('main-page');

    // ── Résolution hash → nom de page ────────────────────────
    const pageMap = {
        '':             'home',
        'home':         'home',
        'menus':        'menus',
        'menu-detail':  'menu-detail',
        'connexion':    'connexion',
        'inscription':  'inscription',
        'contact':      'contact',
    };

    const resolveRoute = hash => pageMap[hash] ?? null;

    // ── Chargement d'une page ────────────────────────────────
    const loadPage = async (pageName) => {
        if (!pageName) pageName = 'home';

        updateActiveNav(pageName);

        try {
            const response = await fetch(`pages/${pageName}.html`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            mainPage.innerHTML = html;

            // Titre du document
            const route = allRoutes.find(r => r.pathHtml.includes(`${pageName}.html`));
            document.title = route ? `${route.title} – ${websiteName}` : websiteName;

            // Initialisation des fonctionnalités de la page
            // Les fonctions sont définies dans js/script.js
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
            case 'menus':
                initMenuDetails();
                initMenuFilters();
                break;
            case 'menu-detail':
                initMenuDetail();
                break;
            case 'home':
                initHomeFeatures();
                break;
            case 'connexion':
                initConnexionFeatures();
                break;
            case 'inscription':
                initInscriptionFeatures();
                break;
            case 'contact':
                initContactFeatures();
                break;
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

        const hash = link.getAttribute('href').substring(1);
        const page = resolveRoute(hash) ?? hash;

        if (page) {
            e.preventDefault();
            history.pushState(null, '', `#${page}`);
            loadPage(page);
        }
    });

    // ── Démarrage ────────────────────────────────────────────
    const initialPage = resolveRoute(window.location.hash.substring(1)) ?? 'home';
    loadPage(initialPage);

    // ── Boutons Précédent / Suivant ──────────────────────────
    window.addEventListener('popstate', () => {
        const page = resolveRoute(window.location.hash.substring(1)) ?? 'home';
        loadPage(page);
    });
});
