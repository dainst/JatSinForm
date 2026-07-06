// scriptLibrary:
const scriptLibrary = {
    "generatePagedView": {
        "type": "text/javascript",
        "src-remote": "src/js/generatePagedView.js",
        "src-local": "src/js/generatePagedView.js"
    },
    "generateWebView": {
        "type": "text/javascript",
        "src-remote": "src/js/generateWebView.js",
        "src-local": "src/js/generateWebView.js"
    },
    "webViewController": {
        "type": "text/javascript",
        "src-remote": "src/js/webViewController.js",
        "src-local": "src/js/webViewController.js"
    },
    "figConstellationSetup": {
        "type": "text/javascript",
        "src-remote": "src/js/setupFigConstellations.js",
        "src-local": "src/js/setupFigConstellations.js"
    },
    "pagedJs": {
        "type": "text/javascript",
        "src-remote": "https://unpkg.com/pagedjs/dist/paged.polyfill.js",
        "src-local": "lib/pagedJs/pagedJs_0.4.3.js"
    },
    "highlightJs": {
        "type": "text/javascript",
        "src-remote": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js",
        "src-local": "lib/highlightJs/highlightJs_11.10.0.js",
    },
    "highlightJsCss": {
        "type": "text/css",
        "src-remote": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/default.min.css",
        "src-local": "lib/highlightJs/highlightJsCss_11.10.0.css",
    },
   "leaflet": {
        "type": "text/javascript",
        "src-remote": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
        "src-local": "lib/leaflet/leaflet_1.9.4.js" 
    },
    "leafletCss": {
        "type": "text/css",
        "src-remote": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        "src-local": "lib/leaflet/leafletCss_1.9.4.css"
    },
    "fontAwesome": {
        "type": "text/css",
        "src-remote": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
        "src-local": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
    },
    "interactJs": {
        "type": "text/javascript",
        "src-remote": "https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js",
        "src-local": "https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"
    },
    "NotoSans": {
        "type": "text/css",
        "src-remote": "https://fonts.bunny.net/css?family=noto-sans:300",
        "src-local": "https://fonts.bunny.net/css?family=noto-sans:300"
    }
} 
// app base url:
const appBaseUrl = "http://localhost:3000/";

// path to xml directory in base-domain
const xmlFolder = "xml-documents";

// load editor-xml from localStorage
const xmlFromEditor = true;

// favicon:
const faviconLink = document.createElement("link");
faviconLink.type = 'image/png';
faviconLink.rel = 'icon';
faviconLink.href = "src/css/assets/graphics/greif.png";

// systemnotice (jatsinform)
const systemNotice = {
    "html": "This HTML format was created with <em>JatSinForm</em>.",
    "pdf": "This PDF was created with </em>JatSinForm</em."
}

