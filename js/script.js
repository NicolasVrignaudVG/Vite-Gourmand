// ═══════════════════════════════════════════════════════════
// GESTIONNAIRES D'ERREURS GLOBAUX
// ═══════════════════════════════════════════════════════════

// Erreurs JS non catchées
window.onerror = function(message, source, lineno, colno, error) {
    console.error('[Erreur globale]', { message, source, lineno, colno, error });
    return true; // Empêche l'affichage de l'erreur dans la console navigateur
};

// Promesses rejetées non catchées
window.addEventListener('unhandledrejection', function(event) {
    console.error('[Promesse rejetée]', event.reason);
    // Si c'est une erreur 401, rediriger vers la connexion
    if (event.reason?.message?.includes('Session expirée') || event.reason?.status === 401) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        window.location.hash = 'connexion';
    }
    event.preventDefault();
});

// ═══════════════════════════════════════════════════════════
// script.js — Vite & Gourmand
// Connecté à l'API Symfony via api.js
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────
// SÉCURITÉ — Protection XSS
// ─────────────────────────────────────────
/**
 * Échappe les caractères HTML dangereux pour prévenir les failles XSS.
 * Utilise un élément div temporaire : textContent traite la valeur
 * comme du texte brut, puis innerHTML récupère la version échappée.
 */
function sanitize(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ─────────────────────────────────────────
// HORAIRES — constantes globales
// ─────────────────────────────────────────
const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const HORAIRES_DEFAULT = [
    { midi: '12:00-14:00', soir: '19:00-22:00' },
    { midi: '12:00-14:00', soir: '19:00-22:00' },
    { midi: '12:00-14:00', soir: '19:00-22:00' },
    { midi: '12:00-14:00', soir: '19:00-22:00' },
    { midi: '12:00-14:00', soir: '19:00-22:00' },
    { midi: '12:00-23:30', soir: '' },
    { midi: '12:00-23:30', soir: '' },
];

// ─────────────────────────────────────────
// PAGE MENUS — Chargement depuis l'API
// ─────────────────────────────────────────
async function initMenuDetails() {
    const grid       = document.getElementById('menus-grid');
    const noResults  = document.getElementById('no-results');
    const countLabel = document.getElementById('filters-count');
    if (!grid) return;

    grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--color-text-muted)">Chargement des menus…</p>';

    try {
        const menus = await Menus.getAll();
        renderMenuCards(menus, grid, countLabel, noResults);
        initMenuFiltersLive(menus, grid, countLabel, noResults);
    } catch (err) {
        grid.innerHTML = `<p style="text-align:center;color:var(--color-error)">Erreur : ${err.message}</p>`;
    }
}

function renderMenuCards(menus, grid, countLabel, noResults) {
    if (!menus.length) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
        if (countLabel) countLabel.textContent = '0 menu affiché';
        return;
    }

    if (noResults) noResults.style.display = 'none';
    if (countLabel) countLabel.textContent = `${menus.length} menu${menus.length > 1 ? 's' : ''} affiché${menus.length > 1 ? 's' : ''}`;

    grid.innerHTML = menus.map(menu => `
        <div class="menu-card"
             data-id="${menu.id}"
             data-prix="${menu.prix_par_personne}"
             data-theme="${(menu.theme || '').toLowerCase()}"
             data-regime="${(menu.regime || '').toLowerCase()}"
             data-personnes="${menu.nombre_personne_minimum}">
            <div class="menu-image">
                <img src="${menu.image_principale || 'images/default.jpg'}" alt="${sanitize(menu.titre)}">
            </div>
            <div class="menu-content">
                <div class="menu-tags">
                    <span class="tag tag-theme">${menu.theme || ''}</span>
                    <span class="tag tag-regime">${menu.regime || ''}</span>
                </div>
                <h2 class="menu-title">${sanitize(menu.titre)}</h2>
                <p class="menu-description">${menu.description || ''}</p>
                <div class="menu-infos">
                    <div class="menu-min">Min ${menu.nombre_personne_minimum} personne${menu.nombre_personne_minimum > 1 ? 's' : ''}</div>
                    <div class="menu-price">${menu.prix_par_personne}€</div>
                </div>
                <button class="btn-details" data-menu-id="${menu.id}">Détails</button>
            </div>
        </div>
    `).join('');

    grid.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', () => {
            sessionStorage.setItem('selectedMenuId', btn.dataset.menuId);
            window.location.hash = 'menu-detail';
        });
    });
}

// ─────────────────────────────────────────
// PAGE MENUS — Filtres (côté client)
// ─────────────────────────────────────────
function initMenuFiltersLive(allMenus, grid, countLabel, noResults) {
    const sliderMax    = document.getElementById('filter-prix-max');
    const labelMax     = document.getElementById('prix-max-label');
    const inputMin     = document.getElementById('filter-prix-min');
    const inputMax2    = document.getElementById('filter-prix-max2');
    const selectTheme  = document.getElementById('filter-theme');
    const selectRegime = document.getElementById('filter-regime');
    const inputPers    = document.getElementById('filter-personnes');
    const btnReset     = document.getElementById('btn-reset-filters');
    const btnReset2    = document.getElementById('btn-reset-filters2');
    if (!sliderMax) return;

    function applyFilters() {
        const maxSlider = parseInt(sliderMax.value);
        const minPrice  = inputMin.value  !== '' ? parseFloat(inputMin.value)  : 0;
        const maxPrice  = inputMax2.value !== '' ? parseFloat(inputMax2.value) : Infinity;
        const theme     = selectTheme.value.toLowerCase();
        const regime    = selectRegime.value.toLowerCase();
        const minPers   = inputPers.value !== '' ? parseInt(inputPers.value) : 0;

        const filtered = allMenus.filter(m => {
            const prix    = m.prix_par_personne;
            const mTheme  = (m.theme || '').toLowerCase();
            const mRegime = (m.regime || '').toLowerCase();
            const pers    = m.nombre_personne_minimum;
            return prix <= maxSlider && prix >= minPrice && prix <= maxPrice &&
                   (!theme  || mTheme  === theme)  &&
                   (!regime || mRegime === regime) &&
                   (!minPers || pers   <= minPers);
        });

        renderMenuCards(filtered, grid, countLabel, noResults);
    }

    sliderMax.addEventListener('input', () => {
        labelMax.textContent = sliderMax.value + '€';
        applyFilters();
    });
    [inputMin, inputMax2, selectTheme, selectRegime, inputPers].forEach(el => {
        el?.addEventListener('input', applyFilters);
    });

    function resetFilters() {
        sliderMax.value = 100; labelMax.textContent = '100€';
        inputMin.value = ''; inputMax2.value = '';
        selectTheme.value = ''; selectRegime.value = '';
        inputPers.value = '';
        renderMenuCards(allMenus, grid, countLabel, noResults);
    }
    btnReset?.addEventListener('click',  resetFilters);
    btnReset2?.addEventListener('click', resetFilters);
}

// ─────────────────────────────────────────
// PAGE VUE DÉTAILLÉE D'UN MENU
// ─────────────────────────────────────────
async function initMenuDetail() {
    const container = document.getElementById('menu-detail-content');
    if (!container) return;

    const menuId = sessionStorage.getItem('selectedMenuId');
    if (!menuId) { container.innerHTML = '<p>Menu introuvable.</p>'; return; }

    container.innerHTML = '<p style="text-align:center;padding:3rem">Chargement…</p>';

    try {
        const menu = await Menus.getById(menuId);
        const seuilReduc = menu.nombre_personne_minimum + 5;
        const prixReduit = (menu.prix_par_personne * 0.9).toFixed(2);

        const platsParType = { entree: [], plat: [], dessert: [] };
        (menu.plats || []).forEach(p => { if (platsParType[p.type]) platsParType[p.type].push(p); });

        container.innerHTML = `
            <div class="detail-hero">
                <img src="${menu.image_principale || (menu.images?.[0]?.url) || ''}" alt="${sanitize(menu.titre)}">
                <div class="detail-hero-overlay">
                    <div class="menu-tags">
                        <span class="tag tag-theme">${menu.theme || ''}</span>
                        <span class="tag tag-regime">${menu.regime || ''}</span>
                    </div>
                    <h1>${sanitize(menu.titre)}</h1>
                    <p class="detail-hero-desc">${menu.description || ''}</p>
                </div>
            </div>
            <div class="detail-body">
                <div class="detail-main">
                    <section class="detail-section">
                        <h2 class="detail-section-title">🍽️ Composition du menu</h2>
                        <div class="detail-plats">
                            ${['entree','plat','dessert'].map(type => `
                                <div class="detail-plat">
                                    <span class="plat-label">${type === 'entree' ? 'Entrée' : type === 'plat' ? 'Plat' : 'Dessert'}</span>
                                    <p>${platsParType[type].map(p => p.nom).join(' ou ')}</p>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                    <section class="detail-section">
                        <h2 class="detail-section-title">⚠️ Allergènes</h2>
                        <div class="detail-allergenes">
                            ${[...new Set((menu.plats || []).flatMap(p => p.allergenes || []))].map(a => `<span class="tag-allergene">${a}</span>`).join('')}
                        </div>
                    </section>
                    <section class="detail-section detail-conditions">
                        <h2 class="detail-section-title">📋 Conditions importantes</h2>
                        <p>${menu.conditions || ''}</p>
                    </section>
                </div>
                <aside class="detail-aside">
                    <div class="detail-card-prix">
                        <div class="detail-prix-ligne"><span>Prix de base</span><strong>${menu.prix_par_personne}€ / pers.</strong></div>
                        <div class="detail-prix-ligne highlight"><span>−10% dès ${seuilReduc} personnes</span><strong>${prixReduit}€ / pers.</strong></div>
                        <div class="detail-prix-ligne"><span>Minimum</span><strong>${menu.nombre_personne_minimum} personne${menu.nombre_personne_minimum > 1 ? 's' : ''}</strong></div>
                        <div class="detail-stock ${menu.quantite_restante <= 3 ? 'stock-low' : ''}">
                            ${menu.quantite_restante <= 3 ? `⚠️ Plus que ${menu.quantite_restante} commande${menu.quantite_restante > 1 ? 's' : ''} !` : `✅ ${menu.quantite_restante} commandes disponibles`}
                        </div>
                    </div>
                    <button class="btn-commander" id="btn-commander">Commander ce menu</button>
                    <button class="btn-retour" onclick="history.back()">← Retour aux menus</button>
                </aside>
            </div>
        `;

        document.getElementById('btn-commander')?.addEventListener('click', () => {
            if (!Auth.isLoggedIn()) {
                sessionStorage.setItem('commandeMenu', menuId);
                window.location.hash = 'connexion';
                return;
            }
            sessionStorage.setItem('commandeMenu', menuId);
            window.location.hash = 'commande';
        });

    } catch (err) {
        container.innerHTML = `<p style="text-align:center;color:var(--color-error)">Erreur : ${err.message}</p>`;
    }
}

// ─────────────────────────────────────────
// PAGE CONNEXION
// ─────────────────────────────────────────
function initConnexionFeatures() {
    const form = document.getElementById('loginForm');
    const msg  = document.getElementById('formMsg');
    if (!form) return;

    if (Auth.isLoggedIn()) {
        redirectAfterLogin(Auth.getUser());
        return;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email    = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;

        if (!email || !password) {
            showMsg(msg, 'Veuillez remplir tous les champs.', 'error'); return;
        }

        showMsg(msg, 'Connexion en cours…', 'success');

        try {
            const user = await Auth.login(email, password);
            showMsg(msg, `Bienvenue ${user.prenom} ! Redirection…`, 'success');
            setTimeout(() => redirectAfterLogin(user), 1000);
        } catch (err) {
            showMsg(msg, err.message || 'Email ou mot de passe incorrect.', 'error');
        }
    });

    initPasswordToggle('.password-toggle', 'password');
}

function redirectAfterLogin(user) {
    if (!user) { window.location.hash = 'connexion'; return; }
    if (user.roles?.includes('ROLE_ADMIN'))   { window.location.hash = 'espace-admin';   return; }
    if (user.roles?.includes('ROLE_EMPLOYE')) { window.location.hash = 'espace-employe'; return; }
    window.location.hash = 'espace-utilisateur';
}

// ─────────────────────────────────────────
// PAGE INSCRIPTION
// ─────────────────────────────────────────
function initInscriptionFeatures() {
    const form = document.getElementById('registerForm');
    const msg  = document.getElementById('formMsg');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const nom             = document.getElementById('NomInput')?.value.trim();
        const prenom          = document.getElementById('PrenomInput')?.value.trim();
        const email           = document.getElementById('email')?.value.trim();
        const password        = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        if (!nom || !prenom || !email || !password || !confirmPassword) {
            showMsg(msg, 'Veuillez remplir tous les champs.', 'error'); return;
        }
        if (password !== confirmPassword) {
            showMsg(msg, 'Les mots de passe ne correspondent pas.', 'error'); return;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{10,}$/.test(password)) {
            showMsg(msg, 'Le mot de passe doit contenir 10 caractères min, une majuscule, une minuscule, un chiffre et un caractère spécial.', 'error'); return;
        }

        showMsg(msg, 'Inscription en cours…', 'success');

        try {
            await Auth.register(nom, prenom, email, null, null, password);
            showMsg(msg, 'Compte créé ! Un e-mail de bienvenue vous a été envoyé. Redirection…', 'success');
            setTimeout(() => { window.location.hash = 'connexion'; }, 2000);
        } catch (err) {
            showMsg(msg, err.message || 'Erreur lors de l\'inscription.', 'error');
        }
    });

    initPasswordToggle('.password-toggle',  'password');
    initPasswordToggle('.password-toggle2', 'confirmPassword');
}

// ─────────────────────────────────────────
// PAGE CONTACT
// ─────────────────────────────────────────
function initContactFeatures() {
    const form = document.getElementById('contactForm');
    const msg  = document.getElementById('formMsg');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const titre       = document.getElementById('title')?.value.trim();
        const description = document.getElementById('description')?.value.trim();
        const email       = document.getElementById('email')?.value.trim();

        if (!titre || !description || !email) {
            showMsg(msg, 'Veuillez remplir tous les champs.', 'error'); return;
        }

        showMsg(msg, 'Envoi en cours…', 'success');

        try {
            await Contact.send(email, titre, description);
            showMsg(msg, 'Message envoyé ! Nous vous répondrons sous 48h.', 'success');
            form.reset();
        } catch (err) {
            showMsg(msg, err.message || 'Erreur lors de l\'envoi.', 'error');
        }
    });
}

// ─────────────────────────────────────────
// PAGE COMMANDE
// ─────────────────────────────────────────
async function initCommande() {
    if (!Auth.isLoggedIn()) {
        window.location.hash = 'connexion';
        return;
    }

    const user = Auth.getUser();
    const savedMenuId = sessionStorage.getItem('commandeMenu') || null;
    const state = {
        etape: 1,
        menuId: savedMenuId,
        menusSelectionnes: savedMenuId ? [{ menuId: savedMenuId, menuData: null, nbPersonnes: 1, platsChoisis: [] }] : [],
        menuPlatsIndex: 0,     // index du menu en cours de sélection de plats
        nbPersonnes: 1,
        nom: user?.nom || '', prenom: user?.prenom || '',
        email: user?.email || '', gsm: user?.telephone || '',
        adresse: '', ville: '', cp: '', date: '', heure: '',
    };

    setTimeout(() => {
        const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        set('cmd-nom', state.nom);
        set('cmd-prenom', state.prenom);
        set('cmd-email', state.email);
        set('cmd-gsm', state.gsm);
    }, 100);

    function goToStep(n) {
        document.querySelectorAll('.commande-step').forEach(s => s.classList.add('hidden'));
        const target = n === 'confirm' ? 'step-confirm' : n === 'plats' ? 'step-plats' : `step-${n}`;
        document.getElementById(target)?.classList.remove('hidden');
        document.querySelectorAll('.step[data-step]').forEach(s => {
            const sn = parseInt(s.dataset.step);
            s.classList.toggle('active',    sn === n);
            s.classList.toggle('completed', sn < n);
        });
        state.etape = n;
    }

    document.getElementById('btn-step1-next')?.addEventListener('click', () => {
        const msg     = document.getElementById('step1-msg');
        const nom     = document.getElementById('cmd-nom')?.value.trim();
        const prenom  = document.getElementById('cmd-prenom')?.value.trim();
        const email   = document.getElementById('cmd-email')?.value.trim();
        const gsm     = document.getElementById('cmd-gsm')?.value.trim();
        const adresse = document.getElementById('cmd-adresse')?.value.trim();
        const ville   = document.getElementById('cmd-ville')?.value.trim();
        const cp      = document.getElementById('cmd-cp')?.value.trim();
        const date    = document.getElementById('cmd-date')?.value;
        const heure   = document.getElementById('cmd-heure')?.value;

        if (!nom || !prenom || !email || !gsm || !adresse || !ville || !cp || !date || !heure) {
            showMsg(msg, 'Veuillez remplir tous les champs.', 'error'); return;
        }
        if (new Date(date) < new Date()) {
            showMsg(msg, 'La date doit être dans le futur.', 'error'); return;
        }

        Object.assign(state, { nom, prenom, email, gsm, adresse, ville, cp, date, heure });
        buildStep2();
        goToStep(2);
    });

    async function buildStep2() {
        const container = document.getElementById('menus-choix');
        if (!container) return;
        container.innerHTML = '<p style="text-align:center;padding:2rem">Chargement…</p>';
        try {
            const menus = await Menus.getAll();
            container.innerHTML = menus.map(menu => `
                <div class="menu-choix-card ${state.menusSelectionnes.find(m => m.menuId == menu.id) ? 'selected' : ''}" data-menu-id="${menu.id}" data-min="${menu.nombre_personne_minimum}">
                    <img src="${menu.image_principale || ''}" alt="${sanitize(menu.titre)}">
                    <div class="menu-choix-info">
                        <div class="menu-tags"><span class="tag tag-theme">${menu.theme || ''}</span></div>
                        <h3>${sanitize(menu.titre)}</h3>
                        <p>${menu.description?.substring(0, 80) || ''}…</p>
                        <div class="menu-choix-meta"><span>Min ${menu.nombre_personne_minimum} pers.</span><strong>${menu.prix_par_personne}€ / pers.</strong></div>
                    </div>
                    <div class="menu-choix-check">✓</div>
                </div>
            `).join('');
            container.querySelectorAll('.menu-choix-card').forEach(card => {
                card.addEventListener('click', () => {
                    card.classList.toggle('selected');
                    const menuId = card.dataset.menuId;
                    if (card.classList.contains('selected')) {
                        if (!state.menusSelectionnes.find(m => m.menuId == menuId)) {
                            state.menusSelectionnes.push({ menuId, menuData: null, nbPersonnes: parseInt(card.dataset.min), platsChoisis: [] });
                        }
                    } else {
                        state.menusSelectionnes = state.menusSelectionnes.filter(m => m.menuId != menuId);
                    }
                    // Rétrocompat
                    state.menuId = state.menusSelectionnes[0]?.menuId || null;
                });
            });
        } catch (err) {
            container.innerHTML = `<p style="color:var(--color-error)">${err.message}</p>`;
        }
    }

    document.getElementById('btn-step2-prev')?.addEventListener('click', () => goToStep(1));
    document.getElementById('btn-step2-next')?.addEventListener('click', async () => {
        const msg = document.getElementById('step2-msg');
        if (!state.menusSelectionnes.length) { showMsg(msg, 'Veuillez sélectionner au moins un menu.', 'error'); return; }
        try {
            // Charger les données de tous les menus sélectionnés
            for (let ms of state.menusSelectionnes) {
                if (!ms.menuData) {
                    ms.menuData = await Menus.getById(ms.menuId);
                    ms.nbPersonnes = ms.menuData.nombre_personne_minimum;
                }
            }
            // Commencer la sélection de plats pour le premier menu
            state.menuPlatsIndex = 0;
            await buildStepPlats(state.menusSelectionnes[0].menuData, 0);
            goToStep('plats');
        } catch (err) {
            showMsg(msg, err.message, 'error');
        }
    });


    async function buildStepPlats(menu, index) {
        const container = document.getElementById('plats-selection');
        if (!container) return;
        const total    = state.menusSelectionnes.length;
        const plats    = menu.plats || [];
        const entrees  = plats.filter(p => (p.typePlat || p.type) === 'entree');
        const platsArr = plats.filter(p => (p.typePlat || p.type) === 'plat');
        const desserts = plats.filter(p => (p.typePlat || p.type) === 'dessert');

        const renderCategorie = (titre, liste, type) => `
            <div class="plats-categorie">
                <h4>${titre}</h4>
                <div class="plats-grid">
                    ${liste.map(p => `
                        <label class="plat-choix-card">
                            <input type="radio" name="plat-${type}" value="${p.id}" required>
                            <div class="plat-choix-info">
                                <strong>${sanitize(p.nom)}</strong>
                                <span>${sanitize(p.description || '')}</span>
                                ${p.allergenes?.length ? `<small>⚠️ ${p.allergenes.map(a => sanitize(a.libelle || a)).join(', ')}</small>` : ''}
                            </div>
                            <div class="plat-choix-check">✓</div>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        const currentMs = state.menusSelectionnes[index];
        container.innerHTML = `
            ${total > 1 ? `<div style="background:var(--color-primary,#c07a3a);color:#fff;padding:.4rem .8rem;border-radius:20px;display:inline-block;font-size:.85rem;margin-bottom:.75rem">Menu ${index + 1} / ${total}</div>` : ''}
            <h3 style="margin-bottom:.5rem">Menu : <em>${sanitize(menu.titre)}</em></h3>
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;background:#fef9f5;padding:.6rem 1rem;border-radius:8px;border:1px solid var(--color-border,#e5e7eb)">
                <span style="color:var(--color-text-muted)">Nombre de personnes :</span>
                <button class="btn-pers" id="btn-plats-pers-moins" style="width:28px;height:28px;font-size:1rem">−</button>
                <span id="plats-nb-personnes" style="font-weight:600;min-width:1.5rem;text-align:center">${currentMs?.nbPersonnes || menu.nombre_personne_minimum}</span>
                <button class="btn-pers" id="btn-plats-pers-plus" style="width:28px;height:28px;font-size:1rem">+</button>
                <span style="font-size:.8rem;color:var(--color-text-muted)">(min. ${menu.nombre_personne_minimum})</span>
            </div>
            <p style="color:var(--color-text-muted);margin-bottom:1.5rem">Choisissez un plat par catégorie</p>
            ${entrees.length  ? renderCategorie('🥗 Entrée',  entrees,  'entree')  : ''}
            ${platsArr.length ? renderCategorie('🍽️ Plat',    platsArr, 'plat')    : ''}
            ${desserts.length ? renderCategorie('🍮 Dessert', desserts, 'dessert') : ''}
        `;
    }

    // Délégation d'événements pour les boutons +/- de personnes dans step-plats
    document.getElementById('plats-selection')?.addEventListener('click', (e) => {
        const ms = state.menusSelectionnes[state.menuPlatsIndex];
        if (!ms) return;
        const menu = ms.menuData;
        const display = document.getElementById('plats-nb-personnes');
        if (e.target.id === 'btn-plats-pers-moins') {
            if (ms.nbPersonnes > menu.nombre_personne_minimum) {
                ms.nbPersonnes--;
                if (display) display.textContent = ms.nbPersonnes;
            }
        }
        if (e.target.id === 'btn-plats-pers-plus') {
            ms.nbPersonnes++;
            if (display) display.textContent = ms.nbPersonnes;
        }
    });

    document.getElementById('btn-plats-prev')?.addEventListener('click', () => goToStep(2));
    document.getElementById('btn-plats-next')?.addEventListener('click', async () => {
        const msg       = document.getElementById('plats-msg');
        const entreeId  = document.querySelector('input[name="plat-entree"]:checked')?.value;
        const platId    = document.querySelector('input[name="plat-plat"]:checked')?.value;
        const dessertId = document.querySelector('input[name="plat-dessert"]:checked')?.value;

        const currentMenu = state.menusSelectionnes[state.menuPlatsIndex];
        if (currentMenu) {
            const plats = [];
            if (entreeId)  plats.push(parseInt(entreeId));
            if (platId)    plats.push(parseInt(platId));
            if (dessertId) plats.push(parseInt(dessertId));
            currentMenu.platsChoisis = plats;
        }

        // Passer au menu suivant ou aller au récapitulatif
        const nextIndex = state.menuPlatsIndex + 1;
        if (nextIndex < state.menusSelectionnes.length) {
            state.menuPlatsIndex = nextIndex;
            await buildStepPlats(state.menusSelectionnes[nextIndex].menuData, nextIndex);
        } else {
            // Rétrocompat
            state.platsChoisis = state.menusSelectionnes[0]?.platsChoisis || [];
            state.menuData     = state.menusSelectionnes[0]?.menuData || null;
            state.nbPersonnes  = state.menusSelectionnes[0]?.nbPersonnes || 1;
            buildStep3();
            goToStep(3);
        }
    });

    async function buildStep3() {
        const menu    = state.menuData;
        const display = document.getElementById('nb-personnes-display');
        const minInfo = document.getElementById('pers-min-info');
        if (minInfo) minInfo.textContent = `(minimum ${menu.nombre_personne_minimum})`;

        async function updatePrix() {
            const nb         = state.nbPersonnes;
            // Calcul prix pour multi-menus
            const totalMenus = state.menusSelectionnes.length;
            let prixMenu = 0;
            if (totalMenus > 1) {
                prixMenu = state.menusSelectionnes.reduce((sum, ms) => {
                    const m = ms.menuData;
                    if (!m) return sum;
                    const seuil = m.nombre_personne_minimum + 5;
                    const reduc = ms.nbPersonnes >= seuil ? 0.9 : 1;
                    return sum + m.prix_par_personne * reduc * ms.nbPersonnes;
                }, 0);
            }
            const seuilReduc = menu.nombre_personne_minimum + 5;
            const hasReduc   = nb >= seuilReduc;
            const prixUnit   = hasReduc ? menu.prix_par_personne * 0.9 : menu.prix_par_personne;
            if (totalMenus <= 1) prixMenu = prixUnit * nb;
            const horsCity   = state.ville.toLowerCase().trim() !== 'bordeaux';
            let fraisLivr = 0, distanceKm = 0;
            if (horsCity) {
                try {
                    const token = localStorage.getItem('jwt_token');
                    const resp  = await fetch(
                        `${API_URL}/api/commandes/livraison?adresse=${encodeURIComponent(state.adresse)}&ville=${encodeURIComponent(state.ville)}&cp=${encodeURIComponent(state.cp)}`,
                        { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
                    );
                    if (resp.ok) { const d = await resp.json(); fraisLivr = d.frais ?? 5; distanceKm = d.distance ?? 0; }
                    else { fraisLivr = 5; }
                } catch(e) { fraisLivr = 5; }
            }
            const total = prixMenu + fraisLivr;

            if (display) display.textContent = nb;

            const remiseDiv = document.getElementById('remise-info');
            if (remiseDiv) remiseDiv.innerHTML = hasReduc
                ? `<span class="remise-badge">🎉 −10% appliqué (${nb} pers. ≥ ${seuilReduc})</span>`
                : `<span class="remise-hint">Commandez pour ${seuilReduc} personnes ou plus pour −10%</span>`;

            const recapPrix = document.getElementById('recap-prix');
            if (recapPrix) recapPrix.innerHTML = `
                <div class="recap-prix-title">Détail du prix</div>
                <div class="recap-prix-line"><span>${nb} × ${prixUnit.toFixed(2)}€${hasReduc ? ' <em>(−10%)</em>' : ''}</span><span>${prixMenu.toFixed(2)}€</span></div>
                <div class="recap-prix-line"><span>Livraison</span><span>${horsCity ? fraisLivr.toFixed(2) + '€' + (distanceKm ? ' (' + distanceKm + ' km)' : '') : 'Gratuite'}</span></div>
                ${horsCity && distanceKm ? '<div class="recap-note">5€ forfait + ' + distanceKm + ' km × 0,59€</div>' : ''}
                <div class="recap-prix-total"><span>Total estimé</span><strong>${total.toFixed(2)}€${horsCity ? '+' : ''}</strong></div>
            `;

            const recapPrest = document.getElementById('recap-prestation');
            if (recapPrest) recapPrest.innerHTML = `
                <div class="recap-line"><span>Client</span><span>${state.prenom} ${state.nom}</span></div>
                <div class="recap-line"><span>E-mail</span><span>${state.email}</span></div>
                <div class="recap-line"><span>Adresse</span><span>${state.adresse}, ${state.cp} ${state.ville}</span></div>
                <div class="recap-line"><span>Date</span><span>${new Date(state.date).toLocaleDateString('fr-FR')} à ${state.heure}</span></div>
            `;

            const recapMenu = document.getElementById('recap-menu');
            if (recapMenu) {
                const total_menus = state.menusSelectionnes.length;
                if (total_menus > 1) {
                    recapMenu.innerHTML = state.menusSelectionnes.map(ms => `
                        <div class="recap-line"><span>Menu</span><strong>${sanitize(ms.menuData?.titre || '–')}</strong></div>
                        <div class="recap-line"><span>Personnes</span><span>${ms.nbPersonnes}</span></div>
                        <div class="recap-line"><span>Prix</span><span>${((ms.menuData?.prix_par_personne || 0) * ms.nbPersonnes).toFixed(2)}€</span></div>
                        <hr style="border:none;border-top:1px solid var(--color-border,#e5e7eb);margin:.5rem 0">
                    `).join('');
                } else {
                    recapMenu.innerHTML = `
                        <div class="recap-line"><span>Menu</span><strong>${sanitize(menu.titre)}</strong></div>
                        <div class="recap-line"><span>Prix/pers.</span><span>${prixUnit.toFixed(2)}€</span></div>
                    `;
                }
            }

            const recapCond = document.getElementById('recap-conditions');
            if (recapCond) recapCond.innerHTML = `<h3 class="detail-section-title">📋 Conditions</h3><p>${menu.conditions || ''}</p>`;
        }

        await updatePrix();
        document.getElementById('btn-pers-moins')?.addEventListener('click', async () => {
            if (state.nbPersonnes > menu.nombre_personne_minimum) { state.nbPersonnes--; await updatePrix(); }
        });
        document.getElementById('btn-pers-plus')?.addEventListener('click', async () => {
            state.nbPersonnes++; await updatePrix();
        });
    }

    document.getElementById('btn-step3-prev')?.addEventListener('click', async () => {
        const lastIndex = state.menusSelectionnes.length - 1;
        state.menuPlatsIndex = lastIndex;
        await buildStepPlats(state.menusSelectionnes[lastIndex].menuData, lastIndex);
        goToStep('plats');
    });
    document.getElementById('btn-valider-commande')?.addEventListener('click', async () => {
        const msg = document.getElementById('step3-msg');
        showMsg(msg, 'Validation en cours…', 'success');
        try {
            const menusCommandes = state.menusSelectionnes.map(ms => ({
                menu_id:          parseInt(ms.menuId),
                nombre_personnes: ms.nbPersonnes,
                plats_choisis:    ms.platsChoisis || [],
            }));
            const result = await Commandes.create({
                menus_commandes:   menusCommandes,
                menu_id:           parseInt(state.menuId), // rétrocompat
                nombre_personnes:  state.nbPersonnes,
                date_prestation:   `${state.date} ${state.heure}:00`,
                adresse_livraison: state.adresse,
                ville_livraison:   state.ville,
                cp_livraison:      state.cp,
            });
            document.getElementById('confirm-ref').textContent = `Référence : ${result.numeroCommande || result.numero_commande || result.id}`;
            sessionStorage.removeItem('commandeMenu');
            sessionStorage.removeItem('selectedMenuId');
            goToStep('confirm');
        } catch (err) {
            showMsg(msg, err.message || 'Erreur lors de la commande.', 'error');
        }
    });

    if (state.menuId) buildStep2();
    goToStep(1);
}

// ─────────────────────────────────────────
// PAGE ACCUEIL — Avis depuis l'API
// ─────────────────────────────────────────
async function initHomeFeatures() {
    const modal     = document.getElementById('reviewModal');
    const openBtn   = document.getElementById('openReviewModalBtn');
    const closeBtn  = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const submitBtn = document.getElementById('submitReviewBtn');
    const toast     = document.getElementById('toastMessage');

    try {
        const avis = await Avis.getValides();
        const container = document.querySelector('.avis-cards');
        if (container && avis.length) {
            container.innerHTML = avis.slice(0, 3).map(a => `
                <div class="avis-card">
                    <div class="stars">${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</div>
                    <p>${a.description || ''}</p>
                    <p class="author">${sanitize(a.auteur)}</p>
                </div>
            `).join('');
        }
    } catch (err) {
        console.log('Avis non chargés :', err.message);
    }

    if (!modal || !openBtn) return;

    const closeModal = () => {
        modal.style.display = 'none';
        const name = document.getElementById('reviewerName');
        const msg  = document.getElementById('reviewMessage');
        if (name) name.value = '';
        if (msg)  msg.value  = '';
    };

    openBtn.addEventListener('click',   () => { modal.style.display = 'flex'; });
    if (closeBtn)  closeBtn.addEventListener('click',  closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const nom  = document.getElementById('reviewerName')?.value.trim();
            const avis = document.getElementById('reviewMessage')?.value.trim();
            if (!nom || !avis) { showToast(toast, '❌ Merci de remplir votre nom et votre avis.'); return; }
            closeModal();
            showToast(toast, `✨ Merci ${nom} ! Votre avis sera visible après validation.`);
        });
    }
}

// ─────────────────────────────────────────
// ESPACES — Navigation panels commune
// ─────────────────────────────────────────
function initEspaceNav() {
    document.querySelectorAll('.espace-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.espace-nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.espace-panel').forEach(p => p.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(`panel-${btn.dataset.panel}`)?.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
    document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());
}

// ─────────────────────────────────────────
// ESPACE UTILISATEUR
// ─────────────────────────────────────────
async function initEspaceUtilisateur() {
    if (!Auth.isLoggedIn()) { window.location.hash = 'connexion'; return; }
    initEspaceNav();

    const user = Auth.getUser();
    const nomEl = document.getElementById('user-nom');
    if (nomEl) nomEl.textContent = `${sanitize(user?.prenom)} ${sanitize(user?.nom)}`;

    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('profil-nom',     user?.nom);
    set('profil-prenom',  user?.prenom);
    set('profil-email',   user?.email);
    set('profil-gsm',     user?.telephone);
    set('profil-adresse', user?.adresse);

    try {
        const commandes = await Commandes.getMes();
        const list = document.getElementById('user-commandes-list');
        if (list && commandes.length) {
            list.innerHTML = commandes.map(c => `
                <div class="commande-item" data-statut="${sanitize(c.statut)}" data-id="${c.id}">
                    <div class="commande-item-header">
                        <div>
                            <span class="commande-ref">${sanitize(c.numeroCommande || c.numero_commande || '–')}</span>
                            <span class="statut-badge statut-${sanitize(c.statut||'')}">${(c.statut||'–').replace(/_/g, ' ')}</span>
                        </div>
                        <span class="commande-date">${c.datePrestation||c.date_prestation ? new Date(c.datePrestation||c.date_prestation).toLocaleDateString('fr-FR') : '–'}</span>
                    </div>
                    <div class="commande-item-body">
                        <div class="commande-info-line"><span>Menu</span><strong>${c.menu?.titre || '–'}</strong></div>
                        <div class="commande-info-line"><span>Personnes</span><strong>${sanitize(c.nombrePersonnes || c.nombre_personnes || '–')}</strong></div>
                        <div class="commande-info-line"><span>Total</span><strong>${sanitize(c.prixTotal || c.prix_total || '–')}€</strong></div>
                    </div>
                    ${c.statut === 'en_attente' ? `
                        <div class="commande-item-actions">
                            <button class="btn-modifier-commande">✏️ Modifier</button>
                            <button class="btn-annuler-commande" data-id="${c.id}">✕ Annuler</button>
                        </div>` : ''}
                    ${['accepte','en_preparation','en_livraison','livre'].includes(c.statut) ? `
                        <button class="btn-toggle-suivi" data-suivi="${c.id}">📍 Voir le suivi</button>
                        <div class="suivi-timeline hidden" id="suivi-${c.id}">
                            ${(c.suivis || []).map(s => `
                                <div class="suivi-step completed">
                                    <div class="suivi-dot"></div>
                                    <div class="suivi-info">
                                        <strong>${s.statut}</strong>
                                        <span>${new Date(s.created_at).toLocaleString('fr-FR')}</span>
                                    </div>
                                </div>`).join('')}
                        </div>` : ''}
                    ${c.statut === 'terminee' ? `
                        <div class="avis-form-inline">
                            <p class="avis-invite">⭐ Donnez votre avis sur cette commande</p>
                            <div class="stars-input" data-commande-id="${c.id}">
                                <span class="star" data-val="1">★</span>
                                <span class="star" data-val="2">★</span>
                                <span class="star" data-val="3">★</span>
                                <span class="star" data-val="4">★</span>
                                <span class="star" data-val="5">★</span>
                            </div>
                            <textarea class="avis-textarea" placeholder="Votre commentaire..." rows="3"></textarea>
                            <button class="btn-submit-avis" data-id="${c.id}">Envoyer l'avis</button>
                        </div>` : ''}
                </div>
            `).join('');

            // Suivi toggle
            list.querySelectorAll('.btn-toggle-suivi').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.suivi;
                    const tl = document.getElementById(`suivi-${id}`);
                    if (!tl) return;
                    tl.classList.toggle('hidden');
                    btn.textContent = tl.classList.contains('hidden') ? '📍 Voir le suivi' : '📍 Masquer le suivi';
                });
            });

            // Modification commande
            list.querySelectorAll('.btn-modifier-commande').forEach(btn => {
                btn.addEventListener('click', () => {
                    const item     = btn.closest('.commande-item');
                    const id       = item.dataset.id;
                    const commande = commandes.find(c => c.id == id);
                    if (!commande) return;

                    // Pré-remplir le modal
                    const modal = document.getElementById('modal-modifier-commande');
                    if (!modal) { alert('Modal de modification non trouvé.'); return; }
                    document.getElementById('modif-commande-id').value    = id;
                    document.getElementById('modif-date').value           = commande.datePrestation ? commande.datePrestation.substring(0,10) : '';
                    document.getElementById('modif-heure').value          = commande.datePrestation ? commande.datePrestation.substring(11,16) : '';
                    document.getElementById('modif-adresse').value        = commande.adresseLivraison || '';
                    document.getElementById('modif-ville').value          = commande.villeLivraison || '';
                    document.getElementById('modif-cp').value             = commande.cpLivraison || '';
                    document.getElementById('modif-personnes').value      = commande.nombrePersonnes || 1;
                    modal.style.display = 'flex';
                });
            });

            // Annulation
            list.querySelectorAll('.btn-annuler-commande').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Confirmer l\'annulation ?')) return;
                    try {
                        await Commandes.annuler(btn.dataset.id);
                        btn.closest('.commande-item').querySelector('.statut-badge').textContent = 'Annulée';
                        btn.closest('.commande-item-actions').remove();
                    } catch (err) { alert(err.message); }
                });
            });

            // Étoiles avis
            list.querySelectorAll('.stars-input').forEach(starsEl => {
                let note = 0;
                starsEl.querySelectorAll('.star').forEach(star => {
                    star.addEventListener('click', () => {
                        note = parseInt(star.dataset.val);
                        starsEl.querySelectorAll('.star').forEach((s, i) => {
                            s.style.color = i < note ? 'var(--color-gold, #f59e0b)' : '';
                        });
                        starsEl.dataset.note = note;
                    });
                });
            });

            // Envoi avis
            list.querySelectorAll('.btn-submit-avis').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item         = btn.closest('.commande-item');
                    const starsEl      = item.querySelector('.stars-input');
                    const note         = parseInt(starsEl?.dataset.note || 0);
                    const description  = item.querySelector('.avis-textarea')?.value.trim();
                    const commandeId   = btn.dataset.id;
                    if (!note) { alert('Veuillez sélectionner une note.'); return; }
                    try {
                        await Avis.create(commandeId, note, description);
                        item.querySelector('.avis-form-inline').innerHTML = '<p style="color:var(--color-success)">✅ Avis envoyé, merci !</p>';
                    } catch (err) { alert(err.message); }
                });
            });
        }
    } catch (err) {
        console.log('Commandes non chargées :', err.message);
    }

    // Modal modification commande
    document.getElementById('close-modifier-commande')?.addEventListener('click', () => {
        document.getElementById('modal-modifier-commande').style.display = 'none';
    });
    document.getElementById('btn-save-modifier-commande')?.addEventListener('click', async () => {
        const id       = document.getElementById('modif-commande-id')?.value;
        const date     = document.getElementById('modif-date')?.value;
        const heure    = document.getElementById('modif-heure')?.value;
        const adresse  = document.getElementById('modif-adresse')?.value.trim();
        const ville    = document.getElementById('modif-ville')?.value.trim();
        const cp       = document.getElementById('modif-cp')?.value.trim();
        const nb       = parseInt(document.getElementById('modif-personnes')?.value);
        const msg      = document.getElementById('modif-msg');

        if (!date || !heure || !adresse || !ville || !cp || !nb) {
            showMsg(msg, 'Tous les champs sont obligatoires.', 'error'); return;
        }
        try {
            await Commandes.update(id, {
                date_prestation:   `${date}T${heure}:00`,
                adresse_livraison: adresse,
                ville_livraison:   ville,
                cp_livraison:      cp,
                nombre_personnes:  nb,
            });
            showMsg(msg, 'Commande modifiée avec succès.', 'success');
            setTimeout(() => {
                document.getElementById('modal-modifier-commande').style.display = 'none';
                chargerCommandesUtilisateur();
            }, 1000);
        } catch (err) { showMsg(msg, err.message, 'error'); }
    });

    document.getElementById('btn-save-profil')?.addEventListener('click', async () => {
        const msg     = document.getElementById('profil-msg');
        const nom     = document.getElementById('profil-nom')?.value.trim();
        const prenom  = document.getElementById('profil-prenom')?.value.trim();
        const tel     = document.getElementById('profil-gsm')?.value.trim();
        const adresse = document.getElementById('profil-adresse')?.value.trim();
        const mdp     = document.getElementById('profil-mdp')?.value;

        const data = {};
        if (nom)     data.nom       = nom;
        if (prenom)  data.prenom    = prenom;
        if (tel)     data.telephone = tel;
        if (adresse) data.adresse   = adresse;
        if (mdp)     data.password  = mdp;

        try {
            const result = await Auth.updateMe(data);
            const stored = Auth.getUser();
            if (stored) {
                stored.nom       = result.nom;
                stored.prenom    = result.prenom;
                stored.telephone = result.telephone;
                stored.adresse   = result.adresse;
                localStorage.setItem('user', JSON.stringify(stored));
            }
            showMsg(msg, 'Profil mis à jour avec succès !', 'success');
        } catch (err) {
            showMsg(msg, err.message, 'error');
        }
    });
    initPasswordToggle('.password-toggle', 'profil-mdp');
}

// ─────────────────────────────────────────
// ESPACE EMPLOYÉ
// ─────────────────────────────────────────
async function initEspaceEmploye() {
    if (!Auth.isLoggedIn() || !Auth.hasRole('ROLE_EMPLOYE')) {
        window.location.hash = 'connexion'; return;
    }
    initEspaceNav();

    async function chargerCommandesEmploye() {
        try {
            const commandes = await Commandes.getToutes();
            const list = document.getElementById('emp-commandes-list');
            if (!list) return;

            if (!commandes.length) {
                list.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--color-text-muted)">Aucune commande.</p>';
                return;
            }

            list.innerHTML = commandes.map(c => `
                <div class="commande-item" data-statut="${sanitize(c.statut)}" data-id="${c.id}" data-client="${c.utilisateur?.nom || ''} ${c.utilisateur?.prenom || ''}">
                    <div class="commande-item-header">
                        <div>
                            <span class="commande-ref">${sanitize(c.numero_commande)}</span>
                            <span class="statut-badge statut-${sanitize(c.statut||'')}">${(c.statut||'-').replace(/_/g, ' ')}</span>
                        </div>
                        <span class="commande-date">${new Date(c.date_prestation).toLocaleDateString('fr-FR')} — ${new Date(c.date_prestation).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <div class="commande-item-body">
                        <div class="commande-info-line"><span>Client</span><strong>${c.utilisateur?.prenom || ''} ${c.utilisateur?.nom || ''} — ${c.utilisateur?.telephone || ''}</strong></div>
                        <div class="commande-info-line"><span>Menu</span><strong>${c.menu?.titre || ''} × ${sanitize(c.nombre_personnes)} pers.</strong></div>
                        <div class="commande-info-line"><span>Adresse</span><strong>${c.adresse_livraison || ''}, ${c.cp_livraison || ''} ${c.ville_livraison || ''}</strong></div>
                        <div class="commande-info-line"><span>Total</span><strong>${sanitize(c.prix_total)}€</strong></div>
                    </div>
                    <div class="statut-update-form">
                        <select class="select-statut">
                            <option value="en_attente" ${c.statut==='en_attente'?'selected':''}>En attente</option>
                            <option value="accepte" ${c.statut==='accepte'?'selected':''}>Acceptée</option>
                            <option value="en_preparation" ${c.statut==='en_preparation'?'selected':''}>En préparation</option>
                            <option value="en_livraison" ${c.statut==='en_livraison'?'selected':''}>En cours de livraison</option>
                            <option value="livre" ${c.statut==='livre'?'selected':''}>Livré</option>
                            <option value="retour_materiel" ${c.statut==='retour_materiel'?'selected':''}>En attente retour matériel</option>
                            <option value="terminee" ${c.statut==='terminee'?'selected':''}>Terminée</option>
                        </select>
                        <button class="btn-update-statut btn-step-next">Mettre à jour</button>
                        <button class="btn-annuler-emp">✕ Annuler (contact requis)</button>
                    </div>
                </div>
            `).join('');

            list.querySelectorAll('.btn-update-statut').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item   = btn.closest('.commande-item');
                    const select = item.querySelector('.select-statut');
                    try {
                        await Commandes.updateStatut(item.dataset.id, select.value);
                        const badge = item.querySelector('.statut-badge');
                        badge.className   = `statut-badge statut-${select.value}`;
                        badge.textContent = select.options[select.selectedIndex].text;
                        item.dataset.statut = select.value;
                    } catch (err) { alert(err.message); }
                });
            });

            const modal   = document.getElementById('modal-annulation');
            let currentId = null;
            list.querySelectorAll('.btn-annuler-emp').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentId = btn.closest('.commande-item').dataset.id;
                    if (modal) modal.style.display = 'flex';
                });
            });
            document.getElementById('btn-confirm-annulation')?.addEventListener('click', async () => {
                const motif       = document.getElementById('motif-annulation')?.value.trim();
                const modeContact = document.getElementById('mode-contact')?.value;
                if (!motif) { alert('Veuillez saisir un motif.'); return; }
                try {
                    await Commandes.updateStatut(currentId, 'annulee', null, motif, modeContact);
                    if (modal) modal.style.display = 'none';
                    chargerCommandesEmploye();
                } catch (err) { alert(err.message); }
            });
            document.getElementById('btn-cancel-annulation')?.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
            document.getElementById('close-annulation')?.addEventListener('click',      () => { if (modal) modal.style.display = 'none'; });

            const filterStatut = document.getElementById('filter-statut-emp');
            const filterClient = document.getElementById('filter-client-emp');
            function filtrer() {
                const statut = filterStatut?.value || '';
                const client = filterClient?.value.toLowerCase() || '';
                list.querySelectorAll('.commande-item').forEach(item => {
                    const matchS = !statut || item.dataset.statut === statut;
                    const matchC = !client || (item.dataset.client || '').toLowerCase().includes(client);
                    item.style.display = matchS && matchC ? '' : 'none';
                });
            }
            filterStatut?.addEventListener('change', filtrer);
            filterClient?.addEventListener('input',  filtrer);

        } catch (err) {
            console.error('Erreur commandes employé:', err.message);
        }
    }

    async function chargerAvisEmploye() {
        try {
            const avis = await Avis.getPending();
            const list = document.getElementById('emp-avis-list');
            if (!list) return;

            if (!avis.length) {
                list.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--color-text-muted)">Aucun avis en attente.</p>';
                return;
            }

            list.innerHTML = avis.map(a => `
                <div class="avis-item" data-id="${a.id}">
                    <div class="avis-item-header">
                        <strong>${sanitize(a.auteur)}</strong>
                        <span class="stars-display">${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</span>
                        <span class="avis-date">${a.date}</span>
                    </div>
                    <p class="avis-text">${a.description || ''}</p>
                    <div class="avis-actions">
                        <button class="btn-valider-avis">✅ Valider</button>
                        <button class="btn-refuser-avis">✕ Refuser</button>
                    </div>
                </div>
            `).join('');

            list.querySelectorAll('.btn-valider-avis').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.avis-item');
                    try { await Avis.valider(item.dataset.id); item.innerHTML = '<p style="color:var(--color-success);padding:.5rem">✅ Avis validé.</p>'; }
                    catch (err) { alert(err.message); }
                });
            });
            list.querySelectorAll('.btn-refuser-avis').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.avis-item');
                    try { await Avis.refuser(item.dataset.id); item.innerHTML = '<p style="color:var(--color-error);padding:.5rem">✕ Avis refusé.</p>'; }
                    catch (err) { alert(err.message); }
                });
            });
        } catch (err) {
            console.error('Erreur avis:', err.message);
        }
    }

    async function chargerMenusEmploye() {
        try {
            const menus = await Menus.getAll();
            const list  = document.getElementById('emp-menus-list');
            if (!list) return;

            list.innerHTML = menus.map(m => `
                <div class="menu-gestion-item" data-id="${m.id}">
                    <img src="${m.image_principale || 'images/default.jpg'}" alt="${sanitize(m.titre)}">
                    <div class="menu-gestion-info">
                        <h3>${sanitize(m.titre)}</h3>
                        <p>${m.prix_par_personne}€ / pers. — Min ${m.nombre_personne_minimum} pers. — Stock : ${m.quantite_restante}</p>
                        <div class="menu-tags">
                            <span class="tag tag-theme">${m.theme || ''}</span>
                            <span class="tag tag-regime">${m.regime || ''}</span>
                        </div>
                    </div>
                    <div class="menu-gestion-actions">
                        <button class="btn-edit-menu btn-step-next">✏️ Modifier</button>
                        <button class="btn-delete-menu">🗑️ Désactiver</button>
                    </div>
                </div>
            `).join('');

            list.querySelectorAll('.btn-edit-menu').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.menu-gestion-item');
                    const menu = await Menus.getById(item.dataset.id);
                    ouvrirModalMenu(menu);
                });
            });

            list.querySelectorAll('.btn-delete-menu').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.menu-gestion-item');
                    if (!confirm('Désactiver ce menu ?')) return;
                    try {
                        await Menus.delete(item.dataset.id);
                        item.style.opacity = '0.4';
                        btn.disabled = true;
                        btn.textContent = 'Désactivé';
                    } catch (err) { alert(err.message); }
                });
            });
        } catch (err) {
            console.error('Erreur menus:', err.message);
        }
    }

    chargerCommandesEmploye();
    chargerAvisEmploye();
    chargerMenusEmploye();
    initHorairesForm();
    initFormulaireMenu(() => chargerMenusEmploye());
    document.querySelector('[data-panel="plats-emp"]')?.addEventListener('click', () => { initGestionPlats('emp'); });
}

// ─────────────────────────────────────────
// ESPACE ADMIN
// ─────────────────────────────────────────
async function initEspaceAdmin() {
    if (!Auth.isLoggedIn() || !Auth.hasRole('ROLE_ADMIN')) {
        window.location.hash = 'connexion'; return;
    }
    initEspaceNav();

    async function chargerStats(filters = {}) {
        try {
            const stats   = await Admin.getStats(filters);
            const parMenu = stats.par_menu ?? [];

            document.getElementById('kpi-total').textContent = stats.total_commandes ?? 0;
            document.getElementById('kpi-ca').textContent    = (stats.chiffre_affaires ?? 0).toFixed(2) + '€';
            document.getElementById('kpi-top').textContent   = parMenu[0]?.menu_titre ?? '–';

            const maxNb    = Math.max(...parMenu.map(m => m.nb_commandes), 1);
            const barChart = document.getElementById('chart-commandes');
            if (barChart) {
                barChart.innerHTML = `<div class="bar-chart">
                    ${parMenu.map(m => `
                        <div class="bar-group">
                            <div class="bar" style="height:${Math.round((m.nb_commandes / maxNb) * 100)}%" data-val="${m.nb_commandes}"></div>
                            <span class="bar-label">${m.menu_titre}</span>
                        </div>
                    `).join('')}
                </div>`;
            }

            const maxCa  = Math.max(...parMenu.map(m => m.chiffre_affaires), 1);
            const caBars = document.getElementById('ca-bars');
            if (caBars) {
                caBars.innerHTML = parMenu.map(m => `
                    <div class="ca-bar-item">
                        <span>${m.menu_titre}</span>
                        <div class="ca-bar-track">
                            <div class="ca-bar-fill" style="width:${Math.round((m.chiffre_affaires / maxCa) * 100)}%">
                                ${m.chiffre_affaires.toFixed(2)}€
                            </div>
                        </div>
                        <strong>${m.chiffre_affaires.toFixed(2)}€</strong>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('Erreur stats:', err.message);
        }
    }

    async function chargerEmployes() {
        try {
            const employes = await Admin.getEmployes();
            const list = document.getElementById('adm-employes-list');
            if (!list) return;

            if (!employes.length) {
                list.innerHTML = '<p style="text-align:center;padding:1rem;color:var(--color-text-muted)">Aucun employé.</p>';
                return;
            }

            list.innerHTML = employes.map(e => `
                <div class="employe-item ${e.actif ? 'actif' : 'inactif'}" data-id="${e.id}">
                    <div class="employe-info">
                        <strong>${sanitize(e.prenom)} ${sanitize(e.nom)}</strong>
                        <span>${sanitize(e.email)}</span>
                        <span class="employe-statut ${e.actif ? 'actif' : 'inactif'}">● ${e.actif ? 'Actif' : 'Inactif'}</span>
                    </div>
                    <button class="btn-toggle-employe" data-actif="${e.actif}" data-id="${e.id}">
                        ${e.actif ? 'Désactiver' : 'Réactiver'}
                    </button>
                </div>
            `).join('');

            list.querySelectorAll('.btn-toggle-employe').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.employe-item');
                    try {
                        await Admin.toggleEmploye(item.dataset.id);
                        const actif = btn.dataset.actif === 'true';
                        btn.dataset.actif = actif ? 'false' : 'true';
                        btn.textContent   = actif ? 'Réactiver' : 'Désactiver';
                        item.classList.toggle('actif',   !actif);
                        item.classList.toggle('inactif',  actif);
                        const statut = item.querySelector('.employe-statut');
                        statut.textContent = actif ? '● Inactif' : '● Actif';
                        statut.className   = `employe-statut ${actif ? 'inactif' : 'actif'}`;
                    } catch (err) { alert(err.message); }
                });
            });
        } catch (err) {
            console.error('Erreur employés:', err.message);
        }
    }


    async function chargerCommandesAdmin() {
        try {
            const commandes = await Commandes.getToutes();
            const list = document.getElementById('adm-commandes-list');
            if (!list) return;
            if (!Array.isArray(commandes) || !commandes.length) {
                list.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--color-text-muted)">Aucune commande.</p>';
                return;
            }
            list.innerHTML = commandes.map(c => {
                const statut = c.statut || '–';
                const ref = c.numeroCommande || c.numero_commande || '–';
                const date = c.datePrestation || c.date_prestation;
                const nb = c.nombrePersonnes || c.nombre_personnes || '–';
                const total = c.prixTotal || c.prix_total || '–';
                const titre = c.menu?.titre || '–';
                const prenom = c.utilisateur?.prenom || '';
                const nom = c.utilisateur?.nom || '';
                const tel = c.utilisateur?.telephone || '';
                const statutLabel = statut.replace ? statut.replace(/_/g, ' ') : statut;
                return `<div class="commande-item" data-statut="${sanitize(statut)}" data-id="${c.id}" data-client="${nom} ${prenom}">
                    <div class="commande-item-header">
                        <div><span class="commande-ref">${sanitize(ref)}</span>
                        <span class="statut-badge statut-${sanitize(statut)}">${statutLabel}</span></div>
                        <span class="commande-date">${date ? new Date(date).toLocaleDateString('fr-FR') : '–'}</span>
                    </div>
                    <div class="commande-item-body">
                        <div class="commande-info-line"><span>Client</span><strong>${prenom} ${nom} — ${tel}</strong></div>
                        <div class="commande-info-line"><span>Menu</span><strong>${sanitize(titre)} × ${sanitize(nb)} pers.</strong></div>
                        <div class="commande-info-line"><span>Total</span><strong>${sanitize(total)}€</strong></div>
                    </div>
                </div>`;
            }).join('');
            const fs = document.getElementById('filter-statut-adm');
            const fc = document.getElementById('filter-client-adm');
            function filtrer() {
                const s = fs?.value || '', cl = fc?.value.toLowerCase() || '';
                list.querySelectorAll('.commande-item').forEach(item => {
                    item.style.display = (!s||item.dataset.statut===s) && (!cl||(item.dataset.client||'').toLowerCase().includes(cl)) ? '' : 'none';
                });
            }
            fs?.addEventListener('change', filtrer);
            fc?.addEventListener('input', filtrer);
        } catch (err) { console.error('Erreur commandes admin:', err.message); }
    }

    async function chargerAvisAdmin() {
        try {
            const avis = await Avis.getPending();
            const list = document.getElementById('adm-avis-list');
            if (!list) return;
            if (!avis.length) { list.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--color-text-muted)">Aucun avis.</p>'; return; }
            list.innerHTML = avis.map(a => `
                <div class="avis-item" data-id="${a.id}">
                    <div class="avis-item-header"><strong>${sanitize(a.auteur)}</strong>
                    <span>${'★'.repeat(a.note)}${'☆'.repeat(5-a.note)}</span></div>
                    <p>${sanitize(a.description||'')}</p>
                    <div class="avis-actions">
                        <button class="btn-valider-avis">✅ Valider</button>
                        <button class="btn-refuser-avis">✕ Refuser</button>
                    </div>
                </div>`).join('');
            list.querySelectorAll('.btn-valider-avis').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.avis-item');
                    try { await Avis.valider(item.dataset.id); item.innerHTML = '<p style="color:var(--color-success)">✅ Validé.</p>'; }
                    catch (err) { alert(err.message); }
                });
            });
            list.querySelectorAll('.btn-refuser-avis').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.avis-item');
                    try { await Avis.refuser(item.dataset.id); item.innerHTML = '<p style="color:var(--color-error)">✕ Refusé.</p>'; }
                    catch (err) { alert(err.message); }
                });
            });
        } catch (err) { console.error('Erreur avis admin:', err.message); }
    }

    async function chargerMenusAdmin() {
        try {
            const menus = await Menus.getAll();
            const list = document.getElementById('adm-menus-list');
            if (!list) return;
            if (!menus.length) { list.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--color-text-muted)">Aucun menu.</p>'; return; }
            list.innerHTML = menus.map(m => `
                <div class="menu-gestion-item" data-id="${m.id}">
                    <img src="${m.image_principale||'images/saumon.jpg'}" alt="${sanitize(m.titre)}">
                    <div class="menu-gestion-info">
                        <h3>${sanitize(m.titre)}</h3>
                        <p>${m.prix_par_personne}€ / pers. — Min ${m.nombre_personne_minimum} pers. — Stock : ${m.quantite_restante}</p>
                    </div>
                    <div class="menu-gestion-actions">
                        <button class="btn-edit-menu btn-step-next">✏️ Modifier</button>
                        <button class="btn-delete-menu">🗑️ Désactiver</button>
                    </div>
                </div>`).join('');
            list.querySelectorAll('.btn-edit-menu').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.menu-gestion-item');
                    const menu = await Menus.getById(item.dataset.id);
                    ouvrirModalMenu(menu);
                });
            });
            list.querySelectorAll('.btn-delete-menu').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.menu-gestion-item');
                    if (!confirm('Désactiver ce menu ?')) return;
                    try { await Menus.delete(item.dataset.id); item.style.opacity='0.4'; btn.disabled=true; btn.textContent='Désactivé'; }
                    catch(err) { alert(err.message); }
                });
            });
        } catch (err) { console.error('Erreur menus admin:', err.message); }
    }

    // Chargements initiaux
    chargerCommandesAdmin();
    chargerAvisAdmin();
    chargerMenusAdmin();
    chargerStats();
    chargerEmployes();
    initFormulaireMenu(() => chargerMenusAdmin());

    document.getElementById('btn-apply-stats')?.addEventListener('click', () => {
        const filters = {};
        const menuFilter = document.getElementById('stats-menu-filter')?.value;
        const dateDebut  = document.getElementById('stats-date-debut')?.value;
        const dateFin    = document.getElementById('stats-date-fin')?.value;
        if (menuFilter) filters.menu_id    = menuFilter;
        if (dateDebut)  filters.date_debut = dateDebut;
        if (dateFin)    filters.date_fin   = dateFin;
        chargerStats(filters);
    });

    const modalEmp = document.getElementById('modal-nouvel-employe');
    document.getElementById('btn-nouvel-employe')?.addEventListener('click', () => { if (modalEmp) modalEmp.style.display = 'flex'; });
    document.getElementById('close-nouvel-employe')?.addEventListener('click', () => { if (modalEmp) modalEmp.style.display = 'none'; });
    document.getElementById('btn-cancel-employe')?.addEventListener('click',  () => { if (modalEmp) modalEmp.style.display = 'none'; });
    document.getElementById('btn-confirm-employe')?.addEventListener('click', async () => {
        const email = document.getElementById('emp-email-new')?.value.trim();
        const mdp   = document.getElementById('emp-mdp-new')?.value;
        if (!email || !mdp) { alert('Remplissez tous les champs.'); return; }
        try {
            await Admin.createEmploye(email, mdp, '', '');
            if (modalEmp) modalEmp.style.display = 'none';
            alert(`Compte employé créé pour ${email}.`);
            chargerEmployes();
        } catch (err) { alert(err.message); }
    });

    initPasswordToggle('.password-toggle', 'emp-mdp-new');
    initHorairesForm();
    document.querySelector('[data-panel="plats-adm"]')?.addEventListener('click', () => { initGestionPlats('adm'); });
}



// ─────────────────────────────────────────
// FORMULAIRE CRÉATION / MODIFICATION MENU
// ─────────────────────────────────────────
function initFormulaireMenu(onSaved) {
    const modal     = document.getElementById('modal-menu-form');
    const btnNew    = document.getElementById('btn-nouveau-menu');
    const btnNewAdm = document.getElementById('btn-nouveau-menu-adm');
    const msg       = document.getElementById('menu-form-msg');
    if (!modal) return;

    async function ouvrirModal(menu) {
        document.getElementById('menu-form-id').value          = menu?.id || '';
        document.getElementById('menu-form-titre').value       = menu?.titre || '';
        document.getElementById('menu-form-description').value = menu?.description || '';
        document.getElementById('menu-form-conditions').value  = menu?.conditions || '';
        document.getElementById('menu-form-prix').value        = menu?.prix_par_personne || '';
        document.getElementById('menu-form-min').value         = menu?.nombre_personne_minimum || '';
        document.getElementById('menu-form-stock').value       = menu?.quantite_restante || '';
        document.getElementById('menu-form-image').value       = menu?.image_principale || '';
        if (document.getElementById('menu-form-theme'))  document.getElementById('menu-form-theme').value  = menu?.theme  || '';
        if (document.getElementById('menu-form-regime')) document.getElementById('menu-form-regime').value = menu?.regime || '';

        // Charger les plats disponibles
        const platsContainer = document.getElementById('menu-form-plats');
        if (platsContainer) {
            try {
                const tousPlats = await apiFetch('/api/plats');
                const platsMenu = menu?.plats?.map(p => p.id) || [];
                const categories = { entree: 'Entrées', plat: 'Plats', dessert: 'Desserts' };
                let html = '';
                ['entree', 'plat', 'dessert'].forEach(type => {
                    const liste = tousPlats.filter(p => (p.type || p.typePlat) === type);
                    if (!liste.length) return;
                    html += `<div class="plats-categorie"><strong>${categories[type]}</strong><div>`;
                    liste.forEach(p => {
                        const checked = platsMenu.includes(p.id) ? 'checked' : '';
                        html += `<label><input type="checkbox" name="menu-plat" value="${p.id}" ${checked}> ${sanitize(p.nom)}</label>`;
                    });
                    html += '</div></div>';
                });
                platsContainer.innerHTML = html;
            } catch(e) { platsContainer.innerHTML = '<p>Erreur chargement plats</p>'; }
        }
        const preview = document.getElementById('menu-form-preview');
        if (preview) { preview.src = menu?.image_principale || ''; preview.style.display = menu?.image_principale ? 'block' : 'none'; }
        const fileInput = document.getElementById('menu-form-image-file');
        if (fileInput) fileInput.value = '';
        document.getElementById('menu-form-title-label').textContent = menu?.id ? 'Modifier le menu' : 'Nouveau menu';
        modal.style.display = 'flex';
    }

    btnNew?.addEventListener('click',    () => ouvrirModal(null));
    btnNewAdm?.addEventListener('click', () => ouvrirModal(null));

    document.getElementById('menu-form-image-file')?.addEventListener('change', function() {
        const file = this.files[0];
        const preview = document.getElementById('menu-form-preview');
        if (!file || !preview) return;
        const reader = new FileReader();
        reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
        reader.readAsDataURL(file);
    });

    document.getElementById('close-menu-form')?.addEventListener('click',      () => { modal.style.display = 'none'; });
    document.getElementById('btn-cancel-menu-form')?.addEventListener('click', () => { modal.style.display = 'none'; });

    document.getElementById('btn-save-menu-form')?.addEventListener('click', async () => {
        const id          = document.getElementById('menu-form-id')?.value;
        const titre       = document.getElementById('menu-form-titre')?.value.trim();
        const description = document.getElementById('menu-form-description')?.value.trim();
        const conditions  = document.getElementById('menu-form-conditions')?.value.trim();
        const prix        = parseFloat(document.getElementById('menu-form-prix')?.value);
        const min         = parseInt(document.getElementById('menu-form-min')?.value);
        const stock       = parseInt(document.getElementById('menu-form-stock')?.value) || 10;
        const fileInput   = document.getElementById('menu-form-image-file');
        let   imagePath   = document.getElementById('menu-form-image')?.value || '';

        if (!titre || !prix || !min) { showMsg(msg, 'Titre, prix et nombre minimum sont obligatoires.', 'error'); return; }

        showMsg(msg, 'Enregistrement en cours…', 'success');

        if (fileInput?.files[0]) {
            try {
                const uploaded = await Upload.image(fileInput.files[0]);
                imagePath = `${API_URL}/${uploaded.url}`;
            } catch (err) { showMsg(msg, 'Erreur upload : ' + err.message, 'error'); return; }
        }

        const theme  = document.getElementById('menu-form-theme')?.value.trim()  || '';
        const regime = document.getElementById('menu-form-regime')?.value.trim() || '';
        const body = { titre, description, conditions, prix_par_personne: prix, nombre_personne_minimum: min, quantite_restante: stock, theme, regime };
        if (imagePath) body.image = imagePath;

        try {
            let menuId = id;
            if (id) { await Menus.update(id, body); showMsg(msg, 'Menu modifié.', 'success'); }
            else    { const res = await Menus.create(body); menuId = res.id; showMsg(msg, 'Menu créé.', 'success'); }

            // Associer les plats sélectionnés
            const platIds = Array.from(document.querySelectorAll('input[name="menu-plat"]:checked')).map(el => parseInt(el.value));
            if (menuId && platIds.length >= 0) {
                await apiFetch(`/api/menus/${menuId}/plats`, { method: 'POST', body: JSON.stringify({ plat_ids: platIds }) });
            }

            setTimeout(() => { modal.style.display = 'none'; if (onSaved) onSaved(); }, 1000);
        } catch (err) { showMsg(msg, err.message, 'error'); }
    });

    // Exposer ouvrirModal globalement pour les boutons modifier
    window.ouvrirModalMenu = ouvrirModal;
    return ouvrirModal;
}

// ─────────────────────────────────────────
// GESTION DES PLATS (employé / admin)
// ─────────────────────────────────────────
async function initGestionPlats(prefixe) {
    prefixe = prefixe || 'emp';
    const listId = prefixe === 'adm' ? 'adm-plats-list' : 'emp-plats-list';
    const list   = document.getElementById(listId);
    const form   = document.getElementById('plat-form');
    const msg    = document.getElementById('plat-msg');
    if (!list) return;

    async function chargerPlats() {
        try {
            const plats = await apiFetch('/api/plats');
            if (!plats || !plats.length) {
                list.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--color-text-muted)">Aucun plat.</p>';
                return;
            }
            list.innerHTML = plats.map(p => `
                <div class="plat-item" data-id="${p.id}">
                    <div class="plat-item-info">
                        <span class="tag tag-theme">${p.typePlat==='entree'?'Entrée':p.typePlat==='plat'?'Plat':'Dessert'}</span>
                        <strong>${sanitize(p.nom)}</strong>
                        <span class="plat-desc">${sanitize(p.description||'')}</span>
                        ${p.allergenes?.length ? `<span class="plat-allergenes">⚠️ ${p.allergenes.map(a=>sanitize(a.libelle||a)).join(', ')}</span>` : ''}
                    </div>
                    <div class="plat-item-actions">
                        <button class="btn-edit-plat btn-step-next">✏️ Modifier</button>
                        <button class="btn-delete-plat" style="background:#ef4444;color:#fff;border:none;padding:.4rem .8rem;border-radius:4px;cursor:pointer;">🗑️ Supprimer</button>
                    </div>
                </div>
            `).join('');
            list.querySelectorAll('.btn-edit-plat').forEach(btn => {
                btn.addEventListener('click', () => {
                    const item = btn.closest('.plat-item');
                    const plat = plats.find(p => p.id == item.dataset.id);
                    if (!plat) return;
                    document.getElementById('plat-id').value = plat.id;
                    document.getElementById('plat-nom').value = plat.nom;
                    document.getElementById('plat-type').value = plat.typePlat;
                    document.getElementById('plat-description').value = plat.description||'';
                    document.getElementById('plat-allergenes').value = (plat.allergenes||[]).map(a=>a.libelle||a).join(', ');
                    document.getElementById('plat-form-title').textContent = 'Modifier le plat';
                    if (form) { form.style.display='block'; form.scrollIntoView({behavior:'smooth'}); }
                });
            });
            list.querySelectorAll('.btn-delete-plat').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = btn.closest('.plat-item');
                    if (!confirm('Supprimer ce plat ?')) return;
                    try { await apiFetch(`/api/plats/${item.dataset.id}`, {method:'DELETE'}); item.remove(); }
                    catch(err) { alert(err.message); }
                });
            });
        } catch(err) { list.innerHTML = `<p style="color:var(--color-error)">Erreur : ${err.message}</p>`; }
    }

    chargerPlats();

    document.getElementById('btn-nouveau-plat')?.addEventListener('click', () => {
        ['plat-id','plat-nom','plat-description','plat-allergenes'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
        const t=document.getElementById('plat-type'); if(t) t.value='entree';
        const ft=document.getElementById('plat-form-title'); if(ft) ft.textContent='Nouveau plat';
        if (form) { form.style.display='block'; form.scrollIntoView({behavior:'smooth'}); }
    });
    document.getElementById('btn-cancel-plat')?.addEventListener('click', () => { if(form) form.style.display='none'; });
    document.getElementById('btn-save-plat')?.addEventListener('click', async () => {
        const id=document.getElementById('plat-id')?.value;
        const nom=document.getElementById('plat-nom')?.value.trim();
        const type=document.getElementById('plat-type')?.value;
        const description=document.getElementById('plat-description')?.value.trim();
        const allergenes=(document.getElementById('plat-allergenes')?.value||'').split(',').map(a=>a.trim()).filter(Boolean);
        if (!nom) { showMsg(msg,'Le nom est obligatoire.','error'); return; }
        try {
            if (id) { await apiFetch(`/api/plats/${id}`,{method:'PUT',body:JSON.stringify({nom,type,description,allergenes})}); showMsg(msg,'Plat modifié.','success'); }
            else    { await apiFetch('/api/plats',{method:'POST',body:JSON.stringify({nom,type,description,allergenes})}); showMsg(msg,'Plat créé.','success'); }
            setTimeout(()=>{ if(form) form.style.display='none'; chargerPlats(); }, 1000);
        } catch(err) { showMsg(msg,err.message,'error'); }
    });
}

// ─────────────────────────────────────────
// HORAIRES — formulaire partagé
// ─────────────────────────────────────────
async function initHorairesForm() {
    const container = document.getElementById('horaires-list');
    if (!container) return;

    // Charger les horaires depuis l'API
    let horairesData = [];
    try {
        horairesData = await apiFetch('/api/horaires');
    } catch(e) {
        container.innerHTML = '<p>Erreur de chargement des horaires.</p>';
        return;
    }

    // Grouper par jour
    const parJour = {};
    horairesData.forEach(h => {
        if (!parJour[h.jour]) parJour[h.jour] = [];
        parJour[h.jour].push(h);
    });

    container.innerHTML = JOURS.map((jour, i) => {
        const jourNum = i + 1;
        const services = parJour[jourNum] || [];
        const midi    = services.find(s => s.service === 'midi');
        const soir    = services.find(s => s.service === 'soir');
        const jour1   = services.find(s => s.service === 'jour');
        const h1      = midi || jour1 || services[0];
        const h2      = soir || services[1];

        return `
        <div class="horaire-row" data-jour="${jourNum}">
            <span class="horaire-jour">${jour}</span>
            ${h1 ? `<div class="input-group">
                <label>${h1.service === 'midi' ? 'Midi' : 'Journée'}</label>
                <div class="input-wrapper">
                    <input type="text" class="horaire-ouverture" data-id="${h1.id}"
                        value="${h1.ferme ? '' : (h1.heureOuverture || '') + '-' + (h1.heureFermeture || '')}"
                        placeholder="HH:MM-HH:MM ou vide si fermé">
                </div>
            </div>` : ''}
            ${h2 ? `<div class="input-group">
                <label>Soir</label>
                <div class="input-wrapper">
                    <input type="text" class="horaire-ouverture" data-id="${h2.id}"
                        value="${h2.ferme ? '' : (h2.heureOuverture || '') + '-' + (h2.heureFermeture || '')}"
                        placeholder="HH:MM-HH:MM ou vide si fermé">
                </div>
            </div>` : ''}
        </div>`;
    }).join('');

    document.getElementById('btn-save-horaires')?.addEventListener('click', async () => {
        const inputs = container.querySelectorAll('.horaire-ouverture');
        const updates = [];

        inputs.forEach(input => {
            const id  = parseInt(input.dataset.id);
            const val = input.value.trim();
            if (val) {
                const parts = val.split('-');
                updates.push({ id, heureOuverture: parts[0] || null, heureFermeture: parts[1] || null, ferme: false });
            } else {
                updates.push({ id, heureOuverture: null, heureFermeture: null, ferme: true });
            }
        });

        try {
            await apiFetch('/api/horaires', { method: 'PUT', body: JSON.stringify(updates) });
            // Mettre à jour le footer
            chargerHorairesFooter();
            alert('Horaires enregistrés avec succès !');
        } catch(err) {
            alert('Erreur : ' + err.message);
        }
    });
}


// ─────────────────────────────────────────
// PAGE MOT DE PASSE OUBLIÉ
// ─────────────────────────────────────────
function initForgotPassword() {
    const form = document.getElementById('forgotForm');
    const msg  = document.getElementById('formMsg');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('email')?.value.trim();

        if (!email) {
            showMsg(msg, 'Veuillez saisir votre adresse e-mail.', 'error');
            return;
        }

        showMsg(msg, 'Envoi en cours…', 'success');

        try {
            const result = await Auth.forgotPassword(email);
            showMsg(msg, result.message || 'Si cet e-mail existe, un lien vous a été envoyé.', 'success');
            form.reset();
        } catch (err) {
            showMsg(msg, err.message || 'Erreur lors de la demande.', 'error');
        }
    });
}

// ─────────────────────────────────────────
// PAGE RÉINITIALISATION DU MOT DE PASSE
// ─────────────────────────────────────────
function initResetPassword() {
    const form = document.getElementById('resetForm');
    const msg  = document.getElementById('formMsg');
    if (!form) return;

    // Récupère le token depuis l'URL : #reinitialiser-mdp?token=xxx
    const hash  = window.location.hash;
    const match = hash.match(/[?&]token=([^&]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;

    if (!token) {
        showMsg(msg, 'Lien invalide : token manquant. Veuillez refaire une demande de réinitialisation.', 'error');
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        return;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const password        = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        if (!password || !confirmPassword) {
            showMsg(msg, 'Veuillez remplir les deux champs.', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showMsg(msg, 'Les mots de passe ne correspondent pas.', 'error');
            return;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{10,}$/.test(password)) {
            showMsg(msg, 'Le mot de passe doit contenir 10 caractères min, une majuscule, une minuscule, un chiffre et un caractère spécial.', 'error');
            return;
        }

        showMsg(msg, 'Réinitialisation en cours…', 'success');

        try {
            await Auth.resetPassword(token, password);
            showMsg(msg, 'Mot de passe réinitialisé ! Redirection vers la connexion…', 'success');
            setTimeout(() => { window.location.hash = 'connexion'; }, 2000);
        } catch (err) {
            showMsg(msg, err.message || 'Erreur lors de la réinitialisation.', 'error');
        }
    });

    initPasswordToggle('.password-toggle',  'password');
    initPasswordToggle('.password-toggle2', 'confirmPassword');
}

// ─────────────────────────────────────────
// ANIMATIONS AU SCROLL
// ─────────────────────────────────────────
function initScrollAnimations() {
    const els = document.querySelectorAll('.feature-card, .avis-card');
    if (!els.length) return;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity   = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    els.forEach(el => {
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s, transform 0.5s';
        observer.observe(el);
    });
}

// ─────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────
function showMsg(el, text, type) {
    if (!el) return;
    el.textContent   = text;
    el.className     = 'form-msg ' + type;
    el.style.display = 'block';
}

function showToast(el, text) {
    if (!el) return;
    el.textContent   = text;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function initPasswordToggle(selector, inputId) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.addEventListener('click', () => {
        const input = document.getElementById(inputId);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type      = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁️';
    });
}

// ─────────────────────────────────────────
// HORAIRES FOOTER — chargement dynamique
// ─────────────────────────────────────────
async function chargerHorairesFooter() {
    const container = document.querySelector('.footer-horaires');
    if (!container) return;
    try {
        const horaires = await fetch(`${API_URL}/api/horaires`).then(r => r.ok ? r.json() : null);
        if (!horaires || !horaires.length) return;

        const jours = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

        // Grouper par jour
        const parJour = {};
        horaires.forEach(h => {
            if (!parJour[h.jour]) parJour[h.jour] = [];
            parJour[h.jour].push(h);
        });

        let html = '<h3>HORAIRES D\'OUVERTURE</h3>';
        Object.keys(parJour).sort().forEach(jour => {
            const services = parJour[jour];
            const ouverts = services.filter(s => !s.ferme);
            if (!ouverts.length) {
                html += `<p>${jours[jour] || 'Jour ' + jour} : Fermé</p>`;
            } else {
                const plages = ouverts.map(s => `${s.heureOuverture || s.heure_ouverture}-${s.heureFermeture || s.heure_fermeture}`).join(' / ');
                html += `<p>${jours[jour] || 'Jour ' + jour} : ${plages}</p>`;
            }
        });

        container.innerHTML = html;
    } catch (e) {
        // Garder les horaires statiques en cas d'erreur
    }
}

// Charger les horaires footer — appel direct + retry après chargement routeur
document.addEventListener('DOMContentLoaded', () => {
    chargerHorairesFooter();
    // Retry après 1s pour attendre le routeur
    setTimeout(chargerHorairesFooter, 1000);
    setTimeout(chargerHorairesFooter, 2500);
});
