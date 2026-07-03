export const config = { runtime: 'edge' };

const BACKEND = 'https://vite-gourmand-back-chap.onrender.com';

export default async function handler(req) {
    const url    = new URL(req.url);
    const target = BACKEND + url.pathname + url.search;

    // Construire les headers en retirant le host pour éviter les conflits
    const headers = new Headers(req.headers);
    headers.set('host', new URL(BACKEND).host);

    const response = await fetch(target, {
        method:   req.method,
        headers,
        body:     ['GET', 'HEAD'].includes(req.method) ? null : req.body,
        redirect: 'follow',
    });

    // Retransmettre la réponse avec TOUS les headers (Set-Cookie inclus)
    const responseHeaders = new Headers(response.headers);

    return new Response(response.body, {
        status:  response.status,
        headers: responseHeaders,
    });
}
