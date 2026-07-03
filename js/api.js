// ═══════════════════════════════════════════════════════════
// api.js — Vite & Gourmand
// Centralise tous les appels vers l'API Symfony
// ═══════════════════════════════════════════════════════════

const API_URL = window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8000'
    : 'https://vite-gourmand-back-chap.onrender.com';

// ─────────────────────────────────────────
// UTILITAIRE — fetch avec JWT automatique
// ─────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    // JWT expiré → tenter un refresh automatique (sauf pour /refresh lui-même)
    if (response.status === 401 && !options._retried && endpoint !== '/api/auth/refresh') {
        const refreshed = await Auth.tryRefresh();
        if (refreshed) {
            return apiFetch(endpoint, { ...options, _retried: true });
        }
        localStorage.removeItem('user');
        window.location.hash = 'connexion';
        throw new Error('Session expirée, veuillez vous reconnecter.');
    }

    if (response.status === 401) {
        localStorage.removeItem('user');
        window.location.hash = 'connexion';
        throw new Error('Session expirée, veuillez vous reconnecter.');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(error.error || `Erreur ${response.status}`);
    }

    // 204 No Content
    if (response.status === 204) return null;

    return response.json();
}

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
const Auth = {
    async login(email, password) {
        const data = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        // Le cookie HttpOnly est posé automatiquement par le serveur
        const user = data.user;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    },

    async register(nom, prenom, email, telephone, adresse, password, pseudonyme = null) {
        return apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ nom, prenom, email, telephone, adresse, password, pseudonyme }),
        });
    },

    async me() {
        return apiFetch('/api/auth/me');
    },

    async updateMe(data) {
        return apiFetch('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) });
    },

    async deleteMe() {
        return apiFetch('/api/auth/me', { method: 'DELETE' });
    },


    async forgotPassword(email) {
        return apiFetch('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    async resetPassword(token, password) {
        return apiFetch('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    },

    async tryRefresh() {
        try {
            const resp = await fetch(`${API_URL}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!resp.ok) return false;
            const json = await resp.json();
            if (json.user) {
                localStorage.setItem('user', JSON.stringify(json.user));
                return true;
            }
            return false;
        } catch(e) {
            return false;
        }
    },

    async logout() {
        try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch(e) {}
        localStorage.removeItem('user');
        window.location.hash = 'home';
    },

    isLoggedIn() {
        return !!localStorage.getItem('user');
    },

    getUser() {
        try {
            const u = localStorage.getItem('user');
            if (!u || u === 'undefined' || u === 'null') return null;
            return JSON.parse(u);
        } catch(e) {
            localStorage.removeItem('user');
            return null;
        }
    },

    hasRole(role) {
        const user = Auth.getUser();
        return user?.roles?.includes(role) ?? false;
    },
};

// ─────────────────────────────────────────
// MENUS
// ─────────────────────────────────────────
const Menus = {
    async getAll(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return apiFetch(`/api/menus${params ? '?' + params : ''}`);
    },

    async getById(id) {
        return apiFetch(`/api/menus/${id}`);
    },

    async getPrix(id, nbPersonnes) {
        return apiFetch(`/api/menus/${id}/prix?nb_personnes=${nbPersonnes}`);
    },

    async create(data) {
        return apiFetch('/api/menus', { method: 'POST', body: JSON.stringify(data) });
    },

    async update(id, data) {
        return apiFetch(`/api/menus/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    async delete(id) {
        return apiFetch(`/api/menus/${id}`, { method: 'DELETE' });
    },
};

// ─────────────────────────────────────────
// COMMANDES
// ─────────────────────────────────────────
const Commandes = {

    async getToutes() {
        return apiFetch('/api/commandes/toutes');
    },

    async getMes() {
        return apiFetch('/api/commandes');
    },

    async create(data) {
        return apiFetch('/api/commandes', { method: 'POST', body: JSON.stringify(data) });
    },

    async update(id, data) {
        return apiFetch(`/api/commandes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    async annuler(id) {
        return apiFetch(`/api/commandes/${id}`, { method: 'DELETE' });
    },

    async updateStatut(id, statut, commentaire = null, motif = null, modeContact = null) {
        return apiFetch(`/api/commandes/${id}/statut`, {
            method: 'PATCH',
            body: JSON.stringify({ statut, commentaire, motif, mode_contact: modeContact }),
        });
    },
};

// ─────────────────────────────────────────
// AVIS
// ─────────────────────────────────────────
const Avis = {
    async getValides() {
        return apiFetch('/api/avis');
    },

    async getPending() {
        return apiFetch('/api/avis/pending');
    },

    async create(commandeId, note, description) {
        return apiFetch('/api/avis', {
            method: 'POST',
            body: JSON.stringify({ commande_id: commandeId, note, description }),
        });
    },

    async valider(id) {
        return apiFetch(`/api/avis/${id}/valider`, { method: 'PATCH' });
    },

    async refuser(id) {
        return apiFetch(`/api/avis/${id}/refuser`, { method: 'PATCH' });
    },

    async getAll() {
        return apiFetch('/api/avis/all');
    },

    async delete(id) {
        return apiFetch(`/api/avis/${id}`, { method: 'DELETE' });
    },

    async update(id, data) {
        return apiFetch(`/api/avis/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
};

// ─────────────────────────────────────────
// CONTACT
// ─────────────────────────────────────────
const Contact = {
    async send(email, titre, description) {
        return apiFetch('/api/contact', {
            method: 'POST',
            body: JSON.stringify({ email, titre, description }),
        });
    },
};

// ─────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────
const Admin = {
    async getEmployes() {
        return apiFetch('/api/admin/employes');
    },

    async createEmploye(email, password, nom, prenom) {
        return apiFetch('/api/admin/employes', {
            method: 'POST',
            body: JSON.stringify({ email, password, nom, prenom }),
        });
    },

    async toggleEmploye(id) {
        return apiFetch(`/api/admin/employes/${id}/toggle`, { method: 'PATCH' });
    },

    async getStats(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return apiFetch(`/api/admin/stats${params ? '?' + params : ''}`);
    },
};

// ─────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────
const Upload = {
    async image(file) {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(`${API_URL}/api/upload/image`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Erreur upload' }));
            throw new Error(err.error || `Erreur ${response.status}`);
        }
        return response.json();
    }
};
