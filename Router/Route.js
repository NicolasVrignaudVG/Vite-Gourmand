// Route — remplacé par une fonction factory (plus de classe avec seulement un constructeur)
export default function Route(url, title, pathHtml, pathJS = "") {
    return { url, title, pathHtml, pathJS };
}
