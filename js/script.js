// ═══════════════════════════════════════════════════════════
// script.js — Vite & Gourmand
// Ce fichier est chargé une fois par router.js après injection
// du HTML de chaque page via initPageFeatures(pageName)
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────
// PAGE MENUS — Boutons Détails → vue détaillée
// ─────────────────────────────────────────
function initMenuDetails() {
    const detailButtons = document.querySelectorAll('.btn-details');
    if (!detailButtons.length) return;

    detailButtons.forEach(button => {
        button.addEventListener('click', function () {
            const menuId = this.getAttribute('data-menu');
            sessionStorage.setItem('selectedMenu', menuId);
            window.location.hash = 'menu-detail';
        });
    });
}

// ─────────────────────────────────────────
// PAGE MENUS — Filtres dynamiques
// ─────────────────────────────────────────
function initMenuFilters() {
    const cards        = document.querySelectorAll('.menu-card');
    const noResults    = document.getElementById('no-results');
    const countLabel   = document.getElementById('filters-count');
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

        let visible = 0;

        cards.forEach(card => {
            const prix      = parseFloat(card.dataset.prix);
            const cardTheme = card.dataset.theme.toLowerCase();
            const cardReg   = card.dataset.regime.toLowerCase();
            const pers      = parseInt(card.dataset.personnes);

            const ok =
                prix <= maxSlider &&
                prix >= minPrice  &&
                prix <= maxPrice  &&
                (theme  === '' || cardTheme === theme)  &&
                (regime === '' || cardReg   === regime) &&
                (minPers === 0  || pers     <= minPers);

            card.style.display = ok ? '' : 'none';
            if (ok) visible++;
        });

        countLabel.textContent = visible + ' menu' + (visible > 1 ? 's' : '') + ' affiché' + (visible > 1 ? 's' : '');
        if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
    }

    function resetFilters() {
        sliderMax.value      = 100;
        labelMax.textContent = '100€';
        inputMin.value       = '';
        inputMax2.value      = '';
        selectTheme.value    = '';
        selectRegime.value   = '';
        inputPers.value      = '';
        applyFilters();
    }

    sliderMax.addEventListener('input', () => {
        labelMax.textContent = sliderMax.value + '€';
        applyFilters();
    });

    [inputMin, inputMax2, selectTheme, selectRegime, inputPers].forEach(el => {
        el.addEventListener('input', applyFilters);
    });

    if (btnReset)  btnReset.addEventListener('click',  resetFilters);
    if (btnReset2) btnReset2.addEventListener('click', resetFilters);

    applyFilters(); // état initial
}

// ─────────────────────────────────────────
// PAGE ACCUEIL — Modal avis
// ─────────────────────────────────────────
function initHomeFeatures() {
    const modal     = document.getElementById('reviewModal');
    const openBtn   = document.getElementById('openReviewModalBtn');
    const closeBtn  = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const submitBtn = document.getElementById('submitReviewBtn');
    const toast     = document.getElementById('toastMessage');

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

            if (!nom || !avis) {
                showToast(toast, '❌ Merci de remplir votre nom et votre avis.');
                return;
            }

            closeModal();
            showToast(toast, `✨ Merci ${nom}, votre avis a été ajouté !`);

            const container = document.querySelector('.avis-cards');
            if (container) {
                const card = document.createElement('div');
                card.className = 'avis-card';
                card.innerHTML = `
                    <div class="stars">★★★★★</div>
                    <p>${avis.substring(0, 120)}${avis.length > 120 ? '…' : ''}</p>
                    <p class="author">${nom}</p>
                `;
                container.appendChild(card);
            }
        });
    }
}

// ─────────────────────────────────────────
// PAGE CONNEXION
// ─────────────────────────────────────────
function initConnexionFeatures() {
    const form = document.getElementById('loginForm');
    const msg  = document.getElementById('formMsg');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const email    = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showMsg(msg, 'Veuillez entrer une adresse e-mail valide.', 'error'); return;
        }
        if (!password || password.length < 8) {
            showMsg(msg, 'Le mot de passe doit contenir au moins 8 caractères.', 'error'); return;
        }

        showMsg(msg, 'Connexion réussie ! Redirection…', 'success');
        setTimeout(() => { window.location.hash = 'home'; }, 1500);
    });

    initPasswordToggle('.password-toggle', 'password');
}

// ─────────────────────────────────────────
// PAGE INSCRIPTION
// ─────────────────────────────────────────
function initInscriptionFeatures() {
    const form = document.getElementById('registerForm');
    const msg  = document.getElementById('formMsg');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const nom             = document.getElementById('NomInput')?.value.trim();
        const prenom          = document.getElementById('PrenomInput')?.value.trim();
        const email           = document.getElementById('email')?.value.trim();
        const password        = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        if (!nom || !prenom || !email || !password || !confirmPassword) {
            showMsg(msg, 'Veuillez remplir tous les champs.', 'error'); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showMsg(msg, 'Adresse e-mail invalide.', 'error'); return;
        }
        if (password.length < 8) {
            showMsg(msg, 'Le mot de passe doit contenir au moins 8 caractères.', 'error'); return;
        }
        if (password !== confirmPassword) {
            showMsg(msg, 'Les mots de passe ne correspondent pas.', 'error'); return;
        }

        showMsg(msg, 'Inscription réussie ! Redirection vers la connexion…', 'success');
        setTimeout(() => { window.location.hash = 'connexion'; }, 1500);
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

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const title       = document.getElementById('title')?.value.trim();
        const description = document.getElementById('description')?.value.trim();
        const email       = document.getElementById('email')?.value.trim();

        if (!title || !description || !email) {
            showMsg(msg, 'Veuillez remplir tous les champs.', 'error'); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showMsg(msg, 'Adresse e-mail invalide.', 'error'); return;
        }

        showMsg(msg, 'Votre message a été envoyé avec succès !', 'success');
        form.reset();
        setTimeout(() => { if (msg) msg.style.display = 'none'; }, 3000);
    });
}

// ─────────────────────────────────────────
// ANIMATIONS AU SCROLL
// ─────────────────────────────────────────
function initScrollAnimations() {
    const els = document.querySelectorAll('.menu-card, .feature-card, .avis-card');
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
        el.style.opacity   = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s, transform 0.5s';
        observer.observe(el);
    });
}

// ─────────────────────────────────────────
// DONNÉES MENUS (source de vérité front)
// À remplacer par un appel API quand le back sera prêt
// ─────────────────────────────────────────
const MENUS_DATA = {
    decouverte: {
        id:          'decouverte',
        titre:       'Menu Découverte',
        image:       'images/kifotofotografia-food-8151625.jpg',
        description: 'Une expérience gourmande autour des grands classiques recettes, mettant en valeur des produits de saison et des associations équilibrées.',
        theme:       'Classique',
        regime:      'Classique',
        personnesMin: 2,
        prix:        35,
        stock:       8,
        conditions:  'Ce menu doit être commandé au minimum 48h avant la prestation. Conserver les produits frais entre 2°C et 4°C.',
        plats: {
            entree:  'Velouté de potimarron aux châtaignes ou Carpaccio de Saint-Jacques à l\'huile de truffe',
            plat:    'Filet de bar rôti, écrasé de pommes de terre à la truffe noire ou Suprême de volaille fermière, sauce morilles',
            dessert: 'Moelleux au chocolat, cœur coulant caramel beurre salé ou Tarte fine aux pommes, glace vanille',
        },
        allergenes: ['Gluten', 'Lactose', 'Fruits de mer', 'Œufs'],
    },
    gastronomique: {
        id:          'gastronomique',
        titre:       'Menu Gastronomique',
        image:       'images/joannawielgosz-pasta-7209002-1.png',
        description: 'Un menu raffiné signé par le chef, alliant techniques gastronomiques, produits d\'exception et dressages élégants pour une expérience unique.',
        theme:       'Événement',
        regime:      'Classique',
        personnesMin: 2,
        prix:        55,
        stock:       5,
        conditions:  'Ce menu doit être commandé au minimum 72h avant la prestation. Certains produits (homard, foie gras) nécessitent une confirmation de disponibilité.',
        plats: {
            entree:  'Huitres spéciales Gillardeau n°2 ou Foie gras poêlé, chutney de figues et pain d\'épices',
            plat:    'Homard bleu rôti, beurre coral line ou Carré d\'agneau de lait, purée de céleri-rave à la truffe',
            dessert: 'Soufflé chaud au Grand Marnier ou Dôme au chocolat Guanaja, croustillant praliné',
        },
        allergenes: ['Gluten', 'Lactose', 'Crustacés', 'Alcool', 'Fruits à coque'],
    },
    rapide: {
        id:          'rapide',
        titre:       'Menu Rapide',
        image:       'images/joannawielgosz-pasta-7209002-1-2.png',
        description: 'Une formule efficace et savoureuse pour la pause déjeuner, avec des plats généreux préparés rapidement à base de produits frais.',
        theme:       'Classique',
        regime:      'Classique',
        personnesMin: 1,
        prix:        15,
        stock:       20,
        conditions:  'Commande possible jusqu\'à 2h avant la livraison. Menu disponible uniquement le midi (11h–14h).',
        plats: {
            entree:  'Soupe du jour ou Salade composée (au choix)',
            plat:    'Burger maison, frites maison ou Quiche lorraine, salade verte',
            dessert: 'Crème brûlée ou Tarte du jour ou Café gourmand',
        },
        allergenes: ['Gluten', 'Lactose', 'Œufs', 'Moutarde'],
    },
};

// ─────────────────────────────────────────
// PAGE VUE DÉTAILLÉE D'UN MENU
// ─────────────────────────────────────────
function initMenuDetail() {
    const container = document.getElementById('menu-detail-content');
    if (!container) return;

    // Récupère l'id du menu depuis le sessionStorage (posé par initMenuDetails)
    const menuId = sessionStorage.getItem('selectedMenu');
    const menu   = MENUS_DATA[menuId];

    if (!menu) {
        container.innerHTML = `
            <div style="text-align:center;padding:4rem 2rem;">
                <p>Menu introuvable.</p>
                <button class="button" onclick="window.location.hash='menus'">← Retour aux menus</button>
            </div>`;
        return;
    }

    // Calcul réduction 10% si commande pour min+5 personnes
    const prixReduit = (menu.prix * 0.9).toFixed(2);
    const seuilReduc = menu.personnesMin + 5;

    container.innerHTML = `
        <div class="detail-hero">
            <img src="${menu.image}" alt="${menu.titre}">
            <div class="detail-hero-overlay">
                <span class="tag tag-theme">${menu.theme}</span>
                <span class="tag tag-regime">${menu.regime}</span>
                <h1>${menu.titre}</h1>
                <p class="detail-hero-desc">${menu.description}</p>
            </div>
        </div>

        <div class="detail-body">

            <!-- Colonne principale -->
            <div class="detail-main">

                <!-- Composition -->
                <section class="detail-section">
                    <h2 class="detail-section-title">🍽️ Composition du menu</h2>
                    <div class="detail-plats">
                        <div class="detail-plat">
                            <span class="plat-label">Entrée</span>
                            <p>${menu.plats.entree}</p>
                        </div>
                        <div class="detail-plat">
                            <span class="plat-label">Plat</span>
                            <p>${menu.plats.plat}</p>
                        </div>
                        <div class="detail-plat">
                            <span class="plat-label">Dessert</span>
                            <p>${menu.plats.dessert}</p>
                        </div>
                    </div>
                </section>

                <!-- Allergènes -->
                <section class="detail-section">
                    <h2 class="detail-section-title">⚠️ Allergènes</h2>
                    <div class="detail-allergenes">
                        ${menu.allergenes.map(a => `<span class="tag-allergene">${a}</span>`).join('')}
                    </div>
                </section>

                <!-- Conditions — mis en évidence comme demandé dans le CDC -->
                <section class="detail-section detail-conditions">
                    <h2 class="detail-section-title">📋 Conditions importantes</h2>
                    <p>${menu.conditions}</p>
                </section>

            </div>

            <!-- Colonne latérale -->
            <aside class="detail-aside">

                <div class="detail-card-prix">
                    <div class="detail-prix-ligne">
                        <span>Prix de base</span>
                        <strong>${menu.prix}€ / pers.</strong>
                    </div>
                    <div class="detail-prix-ligne highlight">
                        <span>−10% dès ${seuilReduc} personnes</span>
                        <strong>${prixReduc}€ / pers.</strong>
                    </div>
                    <div class="detail-prix-ligne">
                        <span>Minimum</span>
                        <strong>${menu.personnesMin} personne${menu.personnesMin > 1 ? 's' : ''}</strong>
                    </div>
                    <div class="detail-stock ${menu.stock <= 3 ? 'stock-low' : ''}">
                        ${menu.stock <= 3
                            ? `⚠️ Plus que ${menu.stock} commande${menu.stock > 1 ? 's' : ''} disponible${menu.stock > 1 ? 's' : ''} !`
                            : `✅ ${menu.stock} commandes disponibles`}
                    </div>
                </div>

                <button class="btn-commander" id="btn-commander">
                    Commander ce menu
                </button>

                <button class="btn-retour" onclick="history.back()">
                    ← Retour aux menus
                </button>

            </aside>
        </div>
    `;

    // Bouton commander
    document.getElementById('btn-commander').addEventListener('click', () => {
        sessionStorage.setItem('commandeMenu', menuId);
        window.location.hash = 'commande';
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
        input.type       = isPassword ? 'text' : 'password';
        btn.textContent  = isPassword ? '🙈' : '👁️';
    });
}
