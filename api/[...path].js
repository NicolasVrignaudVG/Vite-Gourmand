export const config = { runtime: 'edge' };

const BACKEND = 'https://vite-gourmand-back-chap.onrender.com';

export default async function handler(req) {
    const url    = new URL(req.url);
    const target = BACKEND + url.pathname + url.search;

    // Copier les headers sans modifier le host
    const headers = {};
    req.headers.forEach((value, key) => {
        // Exclure les headers problématiques pour le proxy
        if (!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
            headers[key] = value;
        }
    });

    const response = await fetch(target, {
        method:  req.method,
        headers,
        body:    ['GET', 'HEAD'].includes(req.method) ? null : req.body,
        redirect: 'follow',
    });

    // Copier les headers de réponse en excluant ceux qui posent problème
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
            responseHeaders[key] = value;
        }
    });

    return new Response(response.body, {
        status:  response.status,
        headers: responseHeaders,
    });
}
