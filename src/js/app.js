/** -------------------------------------
 * Application script constants:
 * @type {Constants}
---------------------------------------*/
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
        "src-local": "lib/fontAwesome/fontAwesome_6.0.0_all.css"
    },
    "interactJs": {
        "type": "text/javascript",
        "src-remote": "https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js",
        "src-local": "https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"
    }
} 
const defaultJournal = "AA";
const urlRegex = /doi|handle|urn|ark:|orcid|ror|dainst|idai.world|wikipedia/g;
const specificUseRegex = "zenon|extrafeatures|supplements";

const progressBar = document.createElement("div");
progressBar.id = "progress-bar";

const errorConsole = document.createElement("div");
errorConsole.innerHTML = "<h3>Critical error found:</h3>";
errorConsole.id = "error";

const faviconLink = document.createElement("link");
faviconLink.type = 'image/png';
faviconLink.rel = 'icon';
faviconLink.href = "/src/css/assets/graphics/greif.png";

const systemNotice = {
    "html": "This HTML format was created with " + 
        "<a id='jatsinform-link' href='https://github.com/dainst/JatSinForm' target='_blank' rel='noopener noreferrer'> JatSinForm</a>.",
    "pdf": "This PDF was created with " + 
        "<a id='jatsinform-link' href='https://github.com/dainst/JatSinForm' target='_blank'> JatSinForm</a>."
 }

/** -------------------
 * -------------------
 * Document state event listener:
 * @type {document}
 * @type {EventListenerObject}
 --------------------------------------*/
document.addEventListener("readystatechange", (event) => {

    if (event.target.readyState === "interactive") {

        // add favicon link
        document.head.appendChild(faviconLink);

        // get control-keys config
        requestSourceFile("configs/controlKeyList.json", "control-key-list");
 
        // request configs and stylesheets:
        requestSourceFile("configs/tagConversionMap.json", "tag-conversion-map");
        requestSourceFile("configs/journals.json", "journals-config");
        requestSourceFile("configs/figConstellations.json", "fig-constellations");
        requestSourceFile("src/css/viewer-styles.css", "viewer-styles");
        requestSourceFile("src/css/viewer-fallback-styles.css", "viewer-fallback-styles");

        // request xml-string from file or local-storage:
        let xmlString = requestXml();

        // create XML-document from xml string:
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // process xml-document with pre-validation:
        updateStorageEventListener("Process XML document...");
        processXmlDocument(xmlDoc);  // awaiting preflightXmlRequest();
        updateStorageEventListener("Ready");

        // get journalId from xml-doc:
        let journalId = xmlDoc.querySelector("journal-id").textContent;
        let articleTitle = xmlDoc.querySelector("article-title").textContent;
        let metaTitle = document.createElement("title");
        metaTitle.textContent = journalId + ": " + articleTitle;

       // switch between pdf and viewer-format:
       if (localStorage.getItem("renderAs") === "PDF") {
            // prevent auto start of pagedJs previewer:
            window.PagedConfig = { auto: false};

            // get view (and journal) specific styles:
            let styleSheetLink = getStyleSheetLink(journalId, "pagedView");
            document.head.appendChild(styleSheetLink);
            document.head.appendChild(metaTitle);

            // add helper scripts:
            addScriptToDocumentHead("highlightJs");
            addScriptToDocumentHead("highlightJsCss");
            addScriptToDocumentHead("interactJs");

            // add render scripts:
            addScriptToDocumentHead("generatePagedView");
            addScriptToDocumentHead("pagedJs");
        }
        else if(localStorage.getItem("renderAs") === "Viewer") {
            let documentRoot = document.querySelector(':root');
            localStorage.setItem("documentRoot", documentRoot);
            localStorage.setItem("documentBody", document.body.outerHTML);

            // get view (and journal) specific styles:
            let styleSheetLink = getStyleSheetLink(journalId, "htmlView");
            document.head.appendChild(styleSheetLink);
            document.head.appendChild(metaTitle);

            // add json-LD:
            let jsonLD = localStorage.getItem('json-LD');
            if (jsonLD !== null) { jsonLD = JSON.parse(jsonLD); }
            let script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(jsonLD);
            document.head.appendChild(script);

            // add helper scripts:
            addScriptToDocumentHead("highlightJs");
            addScriptToDocumentHead("highlightJsCss");
            addScriptToDocumentHead("leaflet");
            addScriptToDocumentHead("leafletCss");
            addScriptToDocumentHead("fontAwesome");

            // add render scripts:
            addScriptToDocumentHead("generateWebView");
            addScriptToDocumentHead("webViewController");
        }
        else {
            addScriptToDocumentHead("figConstellationSetup");
        }
    }

    if (event.target.readyState === "complete") {
        // pagedJs preview
        if (localStorage.getItem("renderAs") === "PDF") {
            document.body.classList.add("fade-in");
            controlPagedJsHandler();
            window.PagedPolyfill.preview();
            scrollToLastPosition();
            hljs.highlightAll();
            interactJsController();
        }
        // html view
        else if(localStorage.getItem("renderAs") === "Viewer") {
            hljs.highlightAll();
        }
        // figure constellation setup
        else {
            document.body.innerHTML = "Setup mode...(see console)!<br><br>" +
            "Press p for rendering jats-xml as pdf-preview.<br>" + 
            "Press v for rendering jats-xml as html-view.<br>";
        }
    }
});

/** -------------------------------------
 * Handle processStage by storage listener:
 * @type {window}
 * @type {EventListenerObject}
 --------------------------------------*/
 window.addEventListener("storage", () => {
    document.body.prepend(progressBar);
    let processStage = localStorage.getItem("processStage");
    initProgressBar(processStage);
});

// reload viewer when stored editor-xml changed
window.addEventListener('storage', (e) => {
  if (e.key === 'editor-xml') {
      window.location.reload();
    }
});

function initProgressBar(processStage) {

    progressBar.style.cssText = 
        "position:fixed;right:1rem;bottom:1rem;padding:.5rem 1rem;" + 
        "background:#0008;color:#fff;border-radius:.5rem;font:14px/1.4 system-ui;" + 
        "z-index:1000;";

    if(/Error/.test(processStage)) {
         // force viewer rendering for displaying error
         localStorage.setItem("renderAs", "Viewer");
    }
    else if (processStage === "Ready") {
        progressBar.innerHTML = processStage + "!";
        setTimeout(hideProgressBar, 2000);
    } else {
        progressBar.innerHTML = processStage;
    }

    function hideProgressBar() {
        progressBar.style.display = "none";
        document.body.className = "";
    }
}

function updateStorageEventListener(processStage) {

    localStorage.setItem("processStage", processStage);
    window.dispatchEvent(new Event('storage'));
}

/** -------------------------------------
 * Document keyboard event listener:
 * @type {document}
 * @type {EventListenerObject}
 --------------------------------------*/
document.addEventListener('keyup', function (e) {

    // get control key list configuration:
    let controlKeyList = JSON.parse(localStorage.getItem("control-key-list"));
    let controlKeysApp = controlKeyList["application"];
    let controlKeysFigure = controlKeyList["figure"];

    // press p to set "renderAs" to "PDF-Preview"
    if (e.key === controlKeysApp["showPagedView"][0]) {
        localStorage.setItem("renderAs", "PDF");
        window.location.reload();
    }
    // press v to set "renderAs" to "HTML-View"
    if (e.key === controlKeysApp["showHTMLView"][0]) {
        localStorage.setItem("renderAs", "Viewer");
        window.location.reload();
    }
    // press * to set "renderAs" to "Setup"
    if (e.key === controlKeysApp["setupFigConstellations"][0]) {
        localStorage.setItem("renderAs", "Setup");
        window.location.reload();
    }
    // press r for reload
    if (e.key === controlKeysApp["reload"][0]) {
        window.location.reload();
    }
    // press q for hard reset (refresh maps)
    if (e.key === controlKeysApp["hardReset"][0]) {
        localStorage.removeItem('figure-map');
        localStorage.removeItem('text-content-map');
        localStorage.removeItem('documentState');
        window.location.reload();
    }
    // press e to switch to editorjs:
    if (e.key === controlKeysApp["showEditorView"][0]) {
        let editorLocation = "/xml-generation/editorjs/editor.html"
        window.location = location.origin + editorLocation;
    }
    // press d to download documentConfigs or HTMLDocument
    if (e.key === controlKeysApp["downloadDocumentFiles"][0]) {
        if(localStorage.getItem("renderAs") === "PDF") {
            downloadDocumentConfig();
        }
        if(localStorage.getItem("renderAs") === "Viewer") {
            downloadHTMLDocument();
        }
    }
    // press f to highlight figRefs:
    if (e.key === controlKeysApp["highlightFigReferences"][0]) {
        let highlightElements = document.querySelectorAll("a.fig-ref");
        for (let i = 0; i < highlightElements.length; i++) {
            highlightElements[i].style.background = "rgb(250 250 172)";
        }
    }
    // press h to highlight context information of elements:
    if (e.key === controlKeysApp["highlightContextInfo"][0]) {
        let highlightElements = document.querySelectorAll(".text-content,FIGURE");
        for (let i = 0; i < highlightElements.length; i++) {
            highlightElements[i].classList.add("display-data-attributes");
        }
    }
    // press o to see overflowing elements of pagedjs-page-content:
    if (e.key === controlKeysApp["displayOverflows"][0]) {
        let pageContents = document.querySelectorAll(".pagedjs_page_content");
        for (let i = 0; i < pageContents.length; i++) {
            pageContents[i].style.display = "flex";
        }
    }
    // press s to change sizeClassGlobal to small
    if (e.key === controlKeysApp["setAllFigsToTiny"][0]) {
        let sizeClassSetGlobal = controlKeysApp["setAllFigsToTiny"][1]
        localStorage.setItem("sizeClassSetGlobal", sizeClassSetGlobal);
        setTimeout(function () {window.location.reload();}, 2000);
    }
    if (e.key === controlKeysApp["setAllFigsToSmall"][0]) {
        let sizeClassSetGlobal = controlKeysApp["setAllFigsToSmall"][1]
        localStorage.setItem("sizeClassSetGlobal", sizeClassSetGlobal);
        setTimeout(function () {window.location.reload();}, 2000);
    }
    // press m to change sizeClassGlobal to medium
    if (e.key === controlKeysApp["setAllFigsToMedium"][0]) {
        let sizeClassSetGlobal = controlKeysApp["setAllFigsToMedium"][1]
        localStorage.setItem("sizeClassSetGlobal", sizeClassSetGlobal);
        setTimeout(function () {window.location.reload();}, 2000);
    }
    // press l to change sizeClassGlobal to large
    if (e.key === controlKeysApp["setAllFigsToLarge"][0]) {
        let sizeClassSetGlobal = controlKeysApp["setAllFigsToLarge"][1]
        localStorage.setItem("sizeClassSetGlobal", sizeClassSetGlobal);
        setTimeout(function () {window.location.reload();}, 2000);
    }

    // figure related:
    if(document.querySelector(".active") !== null) {
        let figureMap = JSON.parse(localStorage.getItem("figure-map"));
        let journalConfig = JSON.parse(localStorage.getItem("journal-config"));
        let figureModelSpecs = journalConfig["figureModelSpecs"];

        let figure = document.querySelector(".active").parentElement;
        let typesettingClass = figure.classList[2];
        let newClass;

        if(e.key === controlKeysFigure["toOvermargin"][0]) {
            newClass = controlKeysFigure["toOvermargin"][1];
        }
        if(e.key === controlKeysFigure["toRegular"][0]) {
            newClass = controlKeysFigure["toRegular"][1];
        }
        if(e.key === controlKeysFigure["toInset"][0]) {
            newClass = controlKeysFigure["toInset"][1];
        }
        if(e.key === controlKeysFigure["toFloatWCol6"][0]) {
            newClass = controlKeysFigure["toFloatWCol6"][1];
        }
        if(e.key === controlKeysFigure["toFloatWCol4"][0]) {
            newClass = controlKeysFigure["toFloatWCol4"][1];
        }
        if(e.key === controlKeysFigure["toFloatWCol2"][0]) {
            newClass = controlKeysFigure["toFloatWCol2"][1];
        }
        if (e.key === controlKeysFigure["toTop"][0]) {
            newClass = figure.classList[2];
            figureMap[figure.id]["positionClass"] = "onTopOfPage";
        }
        if(e.key === controlKeysFigure["switchCaption"][0]) {
            let toggleFigCaptionConfig = controlKeysFigure["switchCaption"][1]
            if(/overmargin/.test(typesettingClass) || /regular/.test(typesettingClass)) {
                newClass = toggleFigCaptionConfig[typesettingClass];
            }
        }
        // set layout specs and save changes in figure-map
        if(newClass !== undefined && figureModelSpecs[newClass] !== undefined) {
            setLayoutSpecsOfFigure(figure, newClass);
            figureMap[figure.id]["typesettingClass"] = newClass;
            figureMap[figure.id]["style"] = false;
            localStorage.setItem("figure-map", JSON.stringify(figureMap));
            setTimeout(function () {window.location.reload();}, 2000);
        }
    }
});

/** -------------------------------------
 * Process XML document and xml preflight-
 * checks asynchronously
 * @type {Script}
  --------------------------------------*/

async function processXmlDocument(xmlDoc) {

    // preflight xml:
    updateStorageEventListener("Preflight xml-request...");
    let xmlErrorResult = await preflightXmlRequest(xmlDoc);
    if(xmlErrorResult) {
        document.body.append(errorConsole);
        updateStorageEventListener("Error!");
        throw new Error("XML-Parsing-Error");
    }

    // prepare document properties:
    let articleId;
    let documentId = getDocumentStateProperty("documentId");
    if(xmlDoc.querySelector("article-id[pub-id-type='doi']") !== null) {
        articleId = xmlDoc.querySelector("article-id[pub-id-type='doi']").textContent;
    }
    else {articleId = "document-without-id"};

    // checkout reload of previous document
    let documentState = {};
    if (!documentId || documentId !== articleId) {
        documentState["documentId"] = articleId;    // commonly a doi-url
        documentState["scrollPosition"] = [0, 0];   // x- and y-coordinates
        localStorage.setItem("documentState", JSON.stringify(documentState));
    };

    // get and add language code to html (short form):
    let lang = xmlDoc.querySelector("article").getAttribute("xml:lang");
    lang = (lang) ? lang.slice(0, 2) : "de";
    localStorage.setItem("documentLang", lang);
    
    // define journal related properties:
    let journalId = xmlDoc.querySelector("journal-id").textContent;
    let journalConfigs = JSON.parse(localStorage.getItem("journals-config"))[0];
    let journalKey = (journalConfigs[journalId] !== undefined) ? journalId : defaultJournal;
    let journalColor = journalConfigs[journalKey]["journalMainColor"];
    let journalColorHighContrast = journalConfigs[journalKey]["journalMainColorHighContrast"];
    localStorage.setItem("journal-config", JSON.stringify(journalConfigs[journalKey]));

    // save xml-front (metadata) in localStorage:
    const serializer = new XMLSerializer();
    let xmlFront = xmlDoc.getElementsByTagName("front")[0];
    let xmlFrontString = serializer.serializeToString(xmlFront);
    localStorage.setItem("xml-front", xmlFrontString);
    let jsonLD = mapJATSFrontToScholarlyArticle(xmlFrontString, json = {});
    localStorage.setItem("json-LD", JSON.stringify(jsonLD));

    // convert xml to html:
    updateStorageEventListener("Convert XML to HTML...");
    let htmlWrapper = convertXmlToHtml(xmlDoc);

    // populate DOM <body>:
    document.body.innerHTML = htmlWrapper.outerHTML;

    // remove xml-namespaces:
    document.querySelectorAll('[xmlns]').forEach(el => {
        el.removeAttribute('xmlns');
    });

    // add documentLang as lang:attribute:
    if(localStorage.getItem("documentLang") !== null) {
        document.documentElement.lang = localStorage.getItem("documentLang");
    }

    // process image (files):
    updateStorageEventListener("Process image files...");
    processImageFiles();

    // validate image to paragraph ratio:
    let paragraphs = document.querySelectorAll(".content-paragraph");
    let figures = document.querySelectorAll("figure");
    let ratio = (figures.length) ? paragraphs.length / figures.length : 0;
    if(ratio && ratio < 1) {
        console.warn("Notice for editors:\n" + 
            "This article has more figures than paragraphs [" + 
            figures.length + " to " + paragraphs.length + "].\n" +
            "A figure-to-paragraph ratio of at least 1:2 is recommended!")
    }

    // add style related properties to documentRoot:
    let documentRoot = document.querySelector(':root');
    documentRoot.style.setProperty('--pages-flex-direction', pagesFlexDirection);
    documentRoot.style.setProperty('--journal-color', journalColor);
    documentRoot.style.setProperty('--journal-color-high-contrast', journalColorHighContrast);
    documentRoot.style.setProperty('--background-url', getCoverImageBackgroundUrl(coverImageId));;
    documentRoot.style.setProperty('--background-position', backgroundPosition);
    documentRoot.style.setProperty('--background-blend-mode', backgroundBlendMode);
    documentRoot.style.setProperty('--background-blend-color', backgroundBlendColor);
}

async function preflightXmlRequest(xmlDoc) {

    updateStorageEventListener("Preflight XML document...");
    let tagConversionMap = JSON.parse(localStorage.getItem("tag-conversion-map"))[0];

    // catch xml parsing errors:
    let errorText;
    let parseErrorNode = xmlDoc.querySelector('parsererror');
    if (parseErrorNode) {
        errorText = parseErrorNode.querySelector("div");
        errorConsole.append(errorText);
        return(errorConsole);
    }

    // collect elements which are obligatory:
    let isObligatory = [];
    Object.keys(tagConversionMap).forEach(function(key){
        let element = tagConversionMap[key];
        if(element.hasOwnProperty("obligatory")) {
            if(element.obligatory) {
                isObligatory.push(key);
            }
        }
    });
 
    // check availability of critical xml elements:
    for (let i = 0; i < isObligatory.length; i++) {
        let element = xmlDoc.querySelector(isObligatory[i]);
        // is not available
        if(element === null) {
            errorText = "<" + isObligatory[i] + ">-element missing";
            console.log(errorText);
            errorConsole.append(errorText);
            return(errorConsole);
        }
        if(!element.hasChildNodes()) {
            if(element.tagName !== "back") {
                errorText = "<" + isObligatory[i] + ">-element is empty";
                errorConsole.append(errorText);
                return(errorConsole);
            };
        }
    }
    // check graphics:
    let graphics = xmlDoc.querySelectorAll("graphic:not([specific-use='placeholder-image']),inline-graphic");
    for (let i = 0; i < graphics.length; i++) {
        if (graphics !== null && graphics.length > 0) {
            let href = graphics[i].getAttribute("xlink:href");
            // check image paths:
            if(/[(){}<>?~;,]/.test(href)) {
                errorText = "Path to: '" + href + "' has invalid characters like [(){}<>?~;,";
                errorConsole.append(errorText);
                return(errorConsole);
            }
            // check image extensions:
            if(/.tif/.test(href) || /.tiff/.test(href)) {
                errorText = "image: '" + href + "' has invalid format (jpeg or png expected)";
                errorConsole.append(errorText);
                return(errorConsole);
            }
        }
    }
    /* valid (x)ref (r)ids for valid ids (e.g. without whitespace)
    const idPattern = /^[A-Za-z][A-Za-z0-9._:-]*$/; 
    let xrefs = xmlDoc.querySelectorAll("xref[rid]");
    xrefs.forEach(xref => {
        if (xref.getAttribute("rid") !== null) {
            // must start with a letter, then letters/digits/
            if (!idPattern.test(xref.getAttribute("rid"))) {
                console.log("invalid",xref.getAttribute("rid") )
                errorText = "Invalid rid: " + xref.getAttribute("rid") + 
                    ": No whitespace allowed. Must always start with letter!";
                errorConsole.append(errorText);
                return(errorConsole);
            }
        }
    });
    */
    
    return(false);
}


function convertXmlToHtml(xmlDoc) {

    let tagConversionMap = JSON.parse(localStorage.getItem("tag-conversion-map"))[0];
    let xmlArticle = xmlDoc.getElementsByTagName("article")[0];

    // remove empty elements except of (inline-)graphic:
    removeEmptyElements(xmlArticle);

    // convert xml elements to html elements:
    convertElementsByTagConversionMap(xmlArticle, tagConversionMap);

    // enhance code wit <pre> and language-class:
    let codeItems = xmlDoc.querySelectorAll("code:not(.language-xml)");
    for (let i = 0; i < codeItems.length; i++) {
        let language = codeItems[i].getAttribute("language");
        let pre = document.createElement('pre');
        let code = document.createElement('code');
        if (language) { code.classList.add(language); }
        code.innerHTML = codeItems[i].innerHTML;
        pre.appendChild(code)
        codeItems[i].replaceWith(pre);
    }

    // set metaName as element-attribute of custom-meta:
    let customMetaElements =  xmlDoc.querySelectorAll(".custom-meta");
    for (let i = 0; i < customMetaElements.length; i++) {
        let metaName = customMetaElements[i].querySelector(".meta-name");
        if(metaName) {
            customMetaElements[i].classList.add(metaName.innerText);
        }
    }

    // create generic ids for text-elements:
    let textContentElements = xmlArticle.querySelectorAll("p,ul,ol,li,table,pre,code,.title");
    generateGenericElementIdsIfMissing(textContentElements);

    // classify title-level by section
    createHeadlinesBySectionHierarchy(xmlArticle, "text-body");

    // wrap xmlArticle content into htmlWrapper
    let htmlWrapper = document.createElement('div');
    htmlWrapper.id = "html-wrapper";
    htmlWrapper.innerHTML = xmlArticle.innerHTML;
    console.log(htmlWrapper);
    return(htmlWrapper);
}


function transformSelfClosingTags(xml) {
    let split = xml.split("/>");
    let newXml = "";
    for (let i = 0; i < split.length - 1;i++) {
        let edsplit = split[i].split("<");
        let elementName = edsplit[edsplit.length - 1].split(" ")[0];
        console.log("Notice for editors:\n" +
            "self-closing-tags transformed: ", elementName);
        newXml += split[i] + "></" + elementName + ">";
    }
    return newXml + split[split.length-1];
}

function removeEmptyElements(container) {

    // get empty elements:
    let emptyTags = container.querySelectorAll("*:empty:not(graphic,inline-graphic)");

    // remove empty elements:
    for (let i = 0; i < emptyTags.length; i++) {
        console.warn("Notice for editors:\n" +
            "Empty elements has been removed!: ", emptyTags[i]);
        emptyTags[i].remove();
    }
}

function convertElementsByTagConversionMap(xmlBody, tagConversionMap) {

    // convert selectors as defined in tagConversionMap:
    let elementsNotFound = [];
    for (let selector in tagConversionMap) {
        const selectorForQuery = selector.replace(/:/g, "\\:");
        let mapTagName = tagConversionMap[selector]["tagName"];
        let mapClassName = tagConversionMap[selector]["className"];
        let metaTitle = tagConversionMap[selector]["metaTitle"];

        // process each selector
        if (xmlBody.querySelectorAll(selectorForQuery).length !== 0) {
            let xmlElements = xmlBody.querySelectorAll(selectorForQuery);

            for (let i = 0; i < xmlElements.length; ++i) {
                let newElement = document.createElement(mapTagName);
                
                // transfer ids and classnames of xml-elements:
                if (xmlElements[i].className) {newElement.classList.add(xmlElements[i].className);}
                if (xmlElements[i].id) {newElement.id = xmlElements[i].id;}

                // transfer metaTitles as data-attribute:
                if (metaTitle) {newElement.setAttribute("data-meta-title", metaTitle)};
        
                // add new defined classnames in tagConversionMap
                if (mapClassName) {newElement.classList.add(mapClassName);}

                // set ref-links:
                if (tagConversionMap[selector].hasOwnProperty("refAttribute")) {
                    let refAttribute = tagConversionMap[selector]["refAttribute"];
                    let refValue = xmlElements[i].getAttribute(refAttribute);

                    // image source-links:
                    if (selector === "graphic" || selector == "inline-graphic") {
                        // exclude placeholder-graphics:
                        if(refValue.startsWith('data:')) {
                            newElement.src = (refValue) ? refValue : "";
                        } 
                        else {
                            newElement.src = (refValue) ? xmlFolder + "/" + refValue : "";
                        }
                    }
                    // get license-url:
                    else if(selector === "license") {
                        let licenseUrl = document.createElement("a");
                        licenseUrl.classList.add("license-url");
                        licenseUrl.href = (refValue) ? (refValue).trim() : "";
                        licenseUrl.textContent = (refValue) ? (refValue).trim() : "";
                        xmlElements[i].appendChild(licenseUrl);
                    }
                    // external url-links:
                    else if (selector === "ext-link") {
                        // handle over specific-use attributes of ext-link
                        if(xmlElements[i].getAttribute("specific-use")) {
                            let specificUseValue = xmlElements[i].getAttribute("specific-use");
                            newElement.setAttribute("data-specific-use", specificUseValue);
                            // ext-link as external:
                            if(specificUseValue == "weblink")  {
                                newElement.target = "_blank";
                                newElement.rel="noopener noreferrer";
                            }
                        } else {
                            newElement.target = "_blank";
                            newElement.rel="noopener noreferrer";
                        }
                        // add href:
                        newElement.href = (refValue) ? (refValue).trim() : "";

                    // internal id-links:
                    } else {
                        newElement.href = (refValue) ? "#" + (refValue).trim() : "";
                        newElement.id = "xref-" + generateRandomString(4) + "_" + refValue;
                        newElement.setAttribute("data-target-section", defineTargetSectionByClassname(mapClassName));
                    }
                }
                // set defined attribute to newElement
                if (tagConversionMap[selector].hasOwnProperty("setAttribute")) {
                    let attributeKey = tagConversionMap[selector]["setAttribute"];
                    let attributeValue = xmlElements[i].getAttribute(attributeKey);

                    // transform xml:lang-attribute to lang (html)
                    attributeKey = (attributeKey === "xml:lang") ? "lang" : attributeKey;
                    if(selector === "contrib-group" && attributeValue == null) {
                        // check firstChild of contrib-group:
                        let firstChild = xmlElements[i].firstElementChild;
                        if(firstChild && firstChild.getAttribute("contrib-type") === "author") {
                            attributeValue = "article-contributors";
                        }
                    }
                    // add translate="no" to defined elements:
                    if(attributeKey === "translate") {attributeValue = "no";}
               
                    // set attribute to new element:
                    newElement.setAttribute(attributeKey, attributeValue);
                }
    
                if(selector === "xref[ref-type='fig']"
                && xmlElements[i].getAttribute("specific-use")) {
                    let specificUseValue = xmlElements[i].getAttribute("specific-use");
                    newElement.setAttribute("data-specific-use", specificUseValue);
                }
                // transfer content
                newElement.innerHTML = xmlElements[i].innerHTML;

                // replace xml-element:
                xmlElements[i].replaceWith(newElement);
            }
        }
        else {
            elementsNotFound.push(selector);
        }
    }
    if(elementsNotFound.length) {
        console.log("Notice for editors: Tag/Element not found in XML:\n" 
         + elementsNotFound.join(","));
    }
}

function generateGenericElementIdsIfMissing(textContentElements) {

    let genId;
    for (let i = 0; i < textContentElements.length; i++) {
        if(!textContentElements[i].id) {
            let tagName = textContentElements[i].tagName;
            // use tagName abbreviation and loop index to genId
            if(/title/.test(textContentElements[i].className)) {
                genId = "genId-t" + i;
            }
            else if(tagName !== undefined) {
                genId = "genId-" + tagName.substring(0, 2) + i;
            } 
            else {
                genId = "genId-" + i;
            }
            let parent = textContentElements[i].parentElement;
            if(parent !== undefined) {
                if(/footnote/.test(parent.className)) {
                    genId = "fn-genId" + i;
                }
            }
            textContentElements[i].id = genId;
        }
    }
}

function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * define panel name based on ids of href-targets
 * @param {String} className className of inline anchors
 * @returns {String} section: name of target section, default: "contents"
 */
function defineTargetSectionByClassname(className) {

    let panelName;
    switch (true) {
        case (/fig-ref/.test(className)):
            panelName = "figures";
            break;
        case (/fn-ref/.test(className)):
            panelName = "notes";
            break;
        case (/bib-ref/.test(className)):
            panelName = "references";
            break;
        default:
            panelName = "contents";
            break;
    }
    return(panelName);
}

/** 
 * classify headline hierarchy: add headline classes by hierarchy of section-elements
 * @param {HTMLElement} content document-fragment made from original DOM
 * @param {selector} parentClass css-class of parent-element, e.g. "text-body"
 * @returns {void} headline elements are created within the DOM
 */
function createHeadlinesBySectionHierarchy(content, parentClass) {

    // select parent:
    let textBody = content.getElementsByClassName(parentClass)[0];

    // check position in section hierarchy
    let headlines = textBody.querySelectorAll(".title");
    for (let i = 0; i < headlines.length; i++) {
        let parent = headlines[i].parentElement;
        let level = 1; // start with 1 (= article-title)
        do {
            parent = parent.parentElement;
            level++; // at least 2 for normal headlines (loop always run once)
        }
        while (parent !== null && parent.className !== parentClass);

        // add level as attribute to sections:
        if(/section/.test(headlines[i].parentElement.tagName)) {
            headlines[i].parentElement.setAttribute("level", level);
        }

        // create html headline elements based on headlineProperties:
        let headlineProperties = defineHeadlinePropertiesByHierarchyLevel(level);
        let headline = document.createElement(headlineProperties.elementName);
        headline.id = headlines[i].id;
        headline.classList.add(headlineProperties.className);
        headline.setAttribute("level", level);
        headline.classList.add("title");
        headline.innerHTML = headlines[i].innerHTML;
        headlines[i].replaceWith(headline);
    }
}

/** 
 * define headline properties by hierarchy level
 * @param {int} level hierarchy level of title elements, e.g. 1
 * @returns {json} headlineProperties (elementName, className)
 */
function defineHeadlinePropertiesByHierarchyLevel(level) {

    let headlineProperties = {};
    switch (true) {
        case (level === 1):
            headlineProperties.elementName = "h1";
            headlineProperties.className = "article-title";
            break;
        case (level === 2):
            headlineProperties.elementName = "h2";
            headlineProperties.className = "main-section-title";
            break;
        case (level === 3):
            headlineProperties.elementName = "h3";
            headlineProperties.className = "subsection-title";
            break;
        case (level > 3):
            headlineProperties.elementName = "h4";
            headlineProperties.className = "subsection-title";
            break;
        default:
            headlineProperties.elementName = "h2";
            headlineProperties.className = "main-section-title";
    }
    return(headlineProperties)
}

/* --------------------------------
Funtions related to image files
----------------------------------*/
 /**
 * process images files
 * @returns {void} validates and classifies img in DOM
 */
function processImageFiles() {

    // query srcImages from document:
    let srcImages = document.querySelectorAll("img"); 

    // process images
    srcImages.forEach((srcImage) => {
        let newImg = new Image();
        newImg.onload = function () {
        
            // feedback process state:
            updateStorageEventListener("Image preloading... "
                + srcImage.parentElement.id);

            // classify each image
            classifyImage(newImg);

            // transfer classes and attributes to figure element:
            let figure = srcImage.parentElement;
            srcImage.classList = newImg.classList;
            figure.classList = newImg.classList;
            figure.setAttribute("data-img-width", newImg.naturalWidth);
            figure.setAttribute("data-img-height", newImg.naturalHeight);
        };
        newImg.onerror = function () {
            srcImage.alt = "Could not convert image: " + newImg.src;
            newImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        };
        newImg.src = srcImage.src;
    });
}

function classifyImage(image) {

    let width = image.naturalWidth;
    let height = image.naturalHeight;
    let ratio = width / height;

    let sizeClassSetGlobal;
    if(localStorage.getItem("sizeClassSetGlobal") !== null) {
        sizeClassSetGlobal = localStorage.getItem("sizeClassSetGlobal");
    } else {
        sizeClassSetGlobal = "medium";
    }
    image.classList.add(sizeClassSetGlobal);

    let ratioClass = (ratio) ? defineClassByImageRatio(ratio) : false;
    image.classList.add(ratioClass);
}

function defineClassByImageRatio(ratio) {

    let ratioClass;

    switch (true) {
        case (ratio > 1.20):
            ratioClass = "landscape";
            break;
        case (ratio <= 1.20 && ratio >= 0.8):
            ratioClass = "square";
            break;
        case (ratio < 0.8):
            ratioClass = "portrait";
            break;
        default:
            ratioClass = false;
            break;
    }
    return (ratioClass);
}

function getCoverImageBackgroundUrl(coverImageId) {

    let backgroundUrl = false;
    let coverImage = document.querySelector("#" + coverImageId + " > img");
    if(coverImage !== null) {
        if(coverImage.src) {
            backgroundUrl = "url(" + coverImage.src + ")";
        }
    }
    if (!backgroundUrl) {
        backgroundUrl = "url()";
    }
    return(backgroundUrl);
}

/* -----------------------------------
Content feature related functions
--------------------------------------*/
 /**
 * check maximum length of innerText of given element:
 * @param {HTMLElement} textElement given, e.g. abstract, footnote.
 * @returns {void} textElement in DOM, eventually enriched with 
 * warning class and notices
 */
 function checkMaxLengthOfInnerText(textElement, maxChars) {
    if(textElement.innerText.length >= maxChars) {
        textElement.classList.add("warning-box");
        textElement.classList.add("display-data-attributes");
        textElement.setAttribute('data-after', "!Max-Length: " 
            + maxChars + " characters!");
    }
}

function checkQualityOfUrls() {

    if(checkUrlPersistence) {
        // get all anchors with external reference
        let anchors = document.querySelectorAll(
            "a:not(.fig-ref,.fn-ref,.bib-ref,.footnote,.heading-ref-a)");
        anchors.forEach(function (anchor) {
            let specificUse = anchor.getAttribute("data-specific-use");
            let href = anchor.href;
             // check anchors without specific usage only: 
            if(specificUse == null || (specificUse !== null 
                && specificUse.search(specificUseRegex) == -1)) {
                if(href.search(urlRegex) === -1) {
                    anchor.classList.add("warning-text");
                    anchor.title = "URL might not be persistent!";
                }
            }
        });
    }
}

/**
 * Convert URL-like substrings in plain text into external anchor tags.
 * Handles http(s) and www.-prefixed URLs, keeps trailing punctuation
 * (., ;) outside the link, and avoids prefix-collision replacement bugs.
 * @param {!string} string
 * @returns {!string}
 */
function URLifyString(string) {
    if (typeof string !== "string" || string.length === 0) return string;

    const urlRegex = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi;

    return string.replace(urlRegex, (rawUrl) => {
        let url = rawUrl;
        let trailing = "";

        while (/[.,;]$/.test(url)) {
            trailing = url.slice(-1) + trailing;
            url = url.slice(0, -1);
        }

        const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;

        return `<a class="ext-ref" target="_blank" rel="noopener noreferrer" href="${encodeURI(href)}">${url}</a>${trailing}`;
    });
}

/* ----------------------
Download related function:
-----------------------*/

/**
 * Main export function to download the current document as a self-contained HTML file.
 * Waits for all images in #main-wrapper to be converted to base64 WebP before building the HTML.
 * @async
 * @returns {Promise<void>} triggers a file download when complete
 */
async function downloadHTMLDocument() {

    const confirmDownload = confirm('Download this document as HTML-file?');
    if (!confirmDownload) return;

    // show progress-bar:
    progressBar.style.display = "block";

    // convert images *before* cloning/exporting
    if(base64ImgConversion) {
        const body = document.querySelector('body');
        await convertAllImagesToWebPBase64(body, {
            // exclude supplement images (already base64encoded)
            selector: 'img:not(.object-image)',  
            quality: imgQuality ?? 0.8,
            concurrency: 4,
            onProgress: (done, total) => {
                progressBar.textContent = `Converting images… ${done}/${total}`;
            }
        }).catch(err => {
            console.warn('Image conversion completed with warnings:', err);
        });
    }
    progressBar.textContent = 'Packing HTML…';
  
    // get document elements and properties:
    const documentRoot = document.querySelector(':root');
    const documentId = getDocumentStateProperty('documentId');
    const lang = localStorage.getItem('documentLang');
    const htmlDoc = document.implementation.createHTMLDocument('documentId');
    htmlDoc.documentElement.lang = lang;

    // get styles:
    const styles = getComputedStyle(documentRoot);
    const journalColor = styles.getPropertyValue('--journal-color');
    const journalColorHighContrast = styles.getPropertyValue('--journal-color-high-contrast');

    // add root-styles:
    htmlDoc.documentElement.style.setProperty('--journal-color', journalColor);
    htmlDoc.documentElement.style.setProperty('--journal-color-high-contrast', journalColorHighContrast);

    // define fallback script:
    const fallbackScript = function fallback(noJs) {
      document.addEventListener('readystatechange', (event) => {
        if (event.target.readyState === 'interactive') {
          if (noJs) {
            const errorConsole = document.createElement('div');
            errorConsole.id = 'error-message';
            errorConsole.innerHTML = "<span>&#9432;</span> There was a problem loading external scripts from the internet." + 
            " The document is entirely readable but might have reduced functionalities. Please visit the source address by following the DOI link!";
            window.document.body.prepend(errorConsole);
            if (document.querySelector('link') !== null) {
              document.querySelector('link').remove();
            }
            const pageHeader = document.querySelector('#page-header');
            const tocList = document.querySelector('#toc-list');
            if (pageHeader && tocList) pageHeader.appendChild(tocList);
          }
        }
      });
    };
  
    // get fallback styles
    let fallbackStyles = false;
    if (localStorage.getItem('viewer-fallback-styles') !== null) {
      fallbackStyles = document.createElement('style');
      fallbackStyles.id = 'fallback-styles';
      fallbackStyles.textContent = localStorage.getItem('viewer-fallback-styles');
    }
  
    // set script and css-links
    const viewControllerPath = appBaseUrl + 'jatsinform/src/js/webViewController.js';
    const viewerCssPath = appBaseUrl + 'jatsinform/src/css/viewer-styles.css';
  
    // get json-LD
    let jsonLD = localStorage.getItem('json-LD');
    if (jsonLD !== null) { jsonLD = JSON.parse(jsonLD); }

    // define <head>
    htmlDoc.head.innerHTML =
      "  <title>" + jsonLD.headline + "</title>" +
      "  <meta charset='UTF-8'>" +
      '  <script>' + fallbackScript + '</script>' +
      "  <script type='text/javascript' onerror='this.onerror=null;fallback(true);' src='" + viewControllerPath + "'></script>" +
      "  <link type='text/css' rel='stylesheet' onerror='this.onerror=null;fallback(false)' href='" + viewerCssPath + "'>" +
      "  <script type='application/ld+json'>" + JSON.stringify(jsonLD) + '</script>';
    if (fallbackStyles) htmlDoc.head.appendChild(fallbackStyles);
  
    // remove fetch state markers
    const bodyClone = document.querySelector("body").cloneNode(true);
    bodyClone.querySelectorAll('.fetch-state').forEach(el => el.remove());
    bodyClone.querySelector("#progress-bar").remove();
  
    // insert content
    htmlDoc.body.innerHTML = bodyClone.outerHTML;
    htmlDoc.body.classList.add('fade-in');
  
    // kick off the download
    const filename = (documentId || 'document') + '.html';
    download("<!doctype html>\n" + htmlDoc.documentElement.outerHTML, 'text/html', filename);
}

function download(content, type, filename) {

    // create blob and download link:
    const blob = new Blob([content], { type: type });
    const link = document.createElement("a");
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = [type, link.download, link.href].join(":");

    // proceed download by adding click event:
    const evt = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove();
}

/* ----------------
Download Helpers
------------------*/

/**
 * Create a canvas and draw the given image on it.
 * @param {HTMLImageElement} img fully loaded image element
 * @returns {HTMLCanvasElement|OffscreenCanvas} canvas with image drawn
 */

function canvasFromImage(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const c = ('OffscreenCanvas' in window)
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement('canvas'), { width: w, height: h });
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return c;
  }

/**
 * Asynchronously converts a canvas into a base64 data URL using toBlob/convertToBlob.
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas source canvas
 * @param {string} [type='image/webp'] MIME type for output format (e.g., 'image/webp')
 * @param {number} [quality=0.8] quality factor between 0 and 1
 * @returns {Promise<string>} resolves to a base64 data URL string
 */

async function canvasToDataURLAsync(canvas, type = 'image/webp', quality = 0.8) {
    // OffscreenCanvas only has convertToBlob; HTMLCanvas has toBlob
    const toBlobPromise = canvas.convertToBlob
        ? canvas.convertToBlob({ type, quality })
        : new Promise(resolve => canvas.toBlob(resolve, type, quality));

    return toBlobPromise.then(blob => new Promise((resolve, reject) => {
        if (!blob) return reject(new Error('Canvas toBlob returned null (likely unsupported type)'));
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result); // data URL
        fr.onerror = reject;
        fr.readAsDataURL(blob);
    }));
}
  
/**
 * Converts a single <img> element to a WebP base64 data URL and replaces its src.
 * Waits until the image is loaded before processing.
 * @param {HTMLImageElement} imgEl the image to convert
 * @param {number} [quality=0.8] quality factor between 0 and 1 for WebP encoding
 * @returns {Promise<boolean>} resolves to true if converted, false if skipped or failed
 */

async function convertImgElToWebPDataURL(imgEl, type = "image/webp", quality = 0.8) {
    try {
        // Skip if already a WebP data URL
        const src = imgEl.getAttribute('src') || '';
        if (src.startsWith('data:image/webp;base64,')) return false;

        // If the image is cross-origin without proper CORS, drawing will taint the canvas.
        if (!imgEl.complete || imgEl.naturalWidth === 0) {
        await new Promise((res, rej) => {
            imgEl.addEventListener('load', res, { once: true });
            imgEl.addEventListener('error', () => rej(new Error('image load error')), { once: true });
        });
        }

        const canvas = canvasFromImage(imgEl);
        const dataUrl = await canvasToDataURLAsync(canvas, type, quality);
        imgEl.src = dataUrl;

        // (Optional) store intrinsic size on parent <figure>
        const fig = imgEl.closest('figure');
        if (fig) {
        fig.dataset.imgWidth = imgEl.naturalWidth;
        fig.dataset.imgHeight = imgEl.naturalHeight;
        }
        return true;
    } catch (err) {
        // Likely causes: cross-origin tainting, unsupported type, SVG filters, etc.
        console.warn('Conversion skipped for one image:', err);
        return false;
    }
}
  
/**
 * Converts all <img> elements inside a container to WebP base64 data URLs.
 * Processes images concurrently with limited parallelism to avoid blocking the UI.
 * @param {HTMLElement} container parent element containing images
 * @param {Object} [options] options object
 * @param {string} [options.selector='img'] CSS selector to find images
 * @param {number} [options.quality=0.8] quality factor for WebP encoding
 * @param {number} [options.concurrency=4] maximum number of images to process in parallel
 * @param {Function} [options.onProgress] callback(doneCount, totalCount) after each image
 * @returns {Promise<number>} resolves to number of images processed
 */

async function convertAllImagesToWebPBase64(container, {
    selector = 'img',
    quality = 0.8,
    concurrency = 4,
    onProgress = null
    } = {}) {
    const imgs = Array.from(container.querySelectorAll(selector));
    let done = 0;
  
    const queue = imgs.map(img => async () => {
      await convertImgElToWebPDataURL(img, quality);
      done++;
      if (onProgress) onProgress(done, imgs.length);
    });
  
    // Simple semaphore
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length) {
        const task = queue.shift();
        if (task) await task();
      }
    });
  
    await Promise.all(workers);
    return imgs.length;
}
  

/* -------------------------------
Application related functions:
----------------------------------*/
function requestSourceFile(path, type) {

    let response;
    let request = new XMLHttpRequest();
    request.open("GET", path);
    request.onreadystatechange = function () {
        if (this.status === 200) {
            response = request.responseText;
        }
        else {
            response = request.responseText;
            errorConsole.append(response);
            document.body.append(errorConsole);
        }
        localStorage.setItem(type, response);
    };
    request.send();
}

function requestXml() {
    // request source xml:
    let xml = false;
    let xmlFile = false;
    let xmlPath = false;

    // checkout xml-path
    if (document.querySelector('meta[name="--xml-file"]') === null) {
        errorConsole.innerHTML = "No xml-file given! " + 
        "Checkout index.html: meta[name=\"--xml-file\"]";
        document.body.append(errorConsole);
        throw new Error("File-Path-Error");
    }

    // request jats.xml:
    if(!xmlFromEditor) {
        xmlFile = document.querySelector('meta[name="--xml-file"]').content;
        xmlPath = xmlFolder + "/" + xmlFile;
        if(/.xml/.test(xmlPath)) {
            requestSourceFile(xmlPath, "local-xml-file");
            xml = localStorage.getItem("local-xml-file");
        } else {
            errorConsole.innerHTML = "Path to xml-file is invalid: ['" + 
            xmlPath + "']. Checkout index.html: meta[name=\"--xml-file\"]";
            document.body.append(errorConsole);
            throw new Error("File-Path-Error");
        }
    }
    else {
        xml = localStorage.getItem("editor-xml");
    }

    // check xml request:
    if(!xml || xml === null) {
        errorConsole.innerHTML = "ERROR: Could not load xml!";
        document.body.append(errorConsole);
        throw new Error("XML-Loading-Error");
    }

    // replace nested <sec>-elements with <section>-tag before:
    xml = xml.replaceAll("<sec", "<section")
        .replaceAll("</sec>", "</section>");

    // transform self-closing tags
    xml = transformSelfClosingTags(xml);  

    return(xml);
}
 /**
 * add <script>- or <link>-element to document head
 * @param {String} scriptName: name of the script, 
 * defined in ScriptLibrary (constant)
 * @returns {void} appends script or link to document head
 */

function addScriptToDocumentHead(scriptName) {

    let type;
    if(scriptLibrary[scriptName] !== undefined) {
        type = scriptLibrary[scriptName]["type"];
    } else type = false;
    
    if(type === "text/javascript") {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = scriptLibrary[scriptName]["src-local"];
        if(scriptName === "webViewController") {
            script.defer = true;
        }
        document.head.appendChild(script);
    }
    else if(type === "text/css") {
        let cssLink = document.createElement('link');
        cssLink.type = 'text/css';
        cssLink.rel = 'stylesheet';
        cssLink.href = scriptLibrary[scriptName]["src-local"];
        document.head.appendChild(cssLink);
    }
    else {
        console.warn("ScriptName [" + scriptName + "] not defined in scriptLibary")
    }
}

function getDocumentStateProperty(propertyKey) {

    let property;
    let documentState;
    let documentStateJSON = localStorage.getItem("documentState");
    if (documentStateJSON) {
        documentState = JSON.parse(documentStateJSON);
        property = documentState[propertyKey];
    } else {
        property = false
    }
    return (property);
}

function getStyleSheetLink(journalId, view) {

    // prepare stylesheetLink element:
    const styleSheetLink = document.createElement('link');
    styleSheetLink.type = 'text/css';
    styleSheetLink.rel = 'stylesheet';

    // define stylesheet src:
    let stylesheet;
    if(view === "pagedView") {
        stylesheet = (journalId === "e-DAI-F") ? "paged-styles-efb" : "paged-styles-journals";
    }
    if(view === "htmlView") {
        stylesheet = "viewer-styles";
    }
    // set stylesheet src
    styleSheetLink.href = 'src/css/' + stylesheet + '.css';

    return (styleSheetLink)
}

function getTextWidth(text, font) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    ctx.font = font; 
    let metrics = ctx.measureText(text);
    let textWidth =  metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
    return(textWidth);
}

/** Reload in place script: scroll to last window-position
 *  source: https://gitlab.coko.foundation/pagedjs/pagedjs-plugins/pagedjs-plugins/-/blob/main/public/plugins/reload-in-place.js
 */
function scrollToLastPosition() {

    document.body.classList.add("blur");
    let scrollPosition = getDocumentStateProperty("scrollPosition");
    let scrollLeft = scrollPosition[0]; // X-axe
    let scrollTop = scrollPosition[1];  // Y-axe

    let winHeight = window.innerHeight || (document.documentElement || document.body).clientHeight
    window.currentInterval = setInterval(function() {
        let docHeight = getDocHeight();

        if (scrollTop > 0 && scrollTop > docHeight - winHeight) {
            window.scrollTo(scrollLeft, docHeight);
        } else {
            window.scrollTo(scrollLeft, scrollTop);
            clearInterval(window.currentInterval);
            setTimeout(function() {
                window.scrollTo(scrollLeft, scrollTop);
                document.body.classList.remove("blur");
            }, 100);
        }
    }, 50);

    // slow down a bit save position pace
    let slowSave = debounce(function() {
        saveAmountScrolled();
    }, 100);

    // Scroll triggers save, but not immediately on load
    setTimeout(function() {
        window.addEventListener('scroll', slowSave);
    }, 1000);
}

function getDocHeight() {
    let doc = document;
    return Math.max(
        doc.body.scrollHeight, doc.documentElement.scrollHeight,
        doc.body.offsetHeight, doc.documentElement.offsetHeight,
        doc.body.clientHeight, doc.documentElement.clientHeight
    )
}

function saveAmountScrolled() {

    let scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;
    let scrollLeft = window.pageXOffset || (document.documentElement || document.body.parentNode || document.body).scrollLeft;

    let documentId = getDocumentStateProperty("documentId");
    let documentState = {
        "documentId": documentId,
        "scrollPosition": [scrollLeft, scrollTop]
    };
    localStorage.setItem("documentState", JSON.stringify(documentState));
}

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// interact-js controller, e.g. for making figures resizable:
function interactJsController() {

    interact('.resizable').resizable({
        edges: {top: true, left: true, bottom: true, right: true},
        listeners: {move: function (event) {
                let pagedJsArea = event.target.closest(".pagedjs_area");
                pagedJsArea.style = "border:1pt dotted violet";
                let {x, y} = event.target.dataset;
                x = (parseFloat(x) || 0) + event.deltaRect.left;
                y = (parseFloat(y) || 0) + event.deltaRect.top;

                Object.assign(event.target.style, {
                    width: `${event.rect.width}px`,
                    // height: `${event.rect.height}px`,
                    transform: `translate(${x}px, ${y}px)`
                });
                Object.assign(event.target.dataset, {x, y});

                // save styles in figure map:
                let figureMap = JSON.parse(localStorage.getItem("figure-map"));
                figureMap[event.target.id]["style"] = event.target.getAttribute('style');
                localStorage.setItem("figure-map", JSON.stringify(figureMap));

                // reload
                setTimeout(function(){
                    window.location.reload();
                }, 5000);
            }
        },
        modifiers: [
            interact.modifiers.aspectRatio({
                ratio: "preserve"
            }),
        ],
    });
}

/**
 * Namespace-agnostic JATS <front> -> Schema.org ScholarlyArticle (JSON-LD).
 * - Accepts a <front> Element or an XML string.
 * - Optionally merges into an existing JSON object (second param).
 * - Returns the resulting JSON-LD object.
 */
function mapJATSFrontToScholarlyArticle(front, json = {}) {
    // Parse to a DOM if given a string
    let frontEl;
    if (typeof front === "string") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(front, "application/xml");
      frontEl = doc.documentElement;
    } else {
      frontEl = front;
    }
    if (!frontEl) return json;
  
    // ===== XPath helpers (namespace-agnostic via local-name()) =====
    // Turn 'a/b[@attr="v"]/c' into '*[local-name()="a"]/*[local-name()="b"][@attr="v"]/*[local-name()="c"]'
    const lnPath = (p) =>
      p
        .split("/")
        .filter(Boolean)
        .map(seg => {
          // keep predicates as-is
          const m = seg.match(/^([^\[]+)(\[.+\])?$/);
          if (!m) return `*[local-name()="${seg}"]`;
          const [, tag, predicate = ""] = m;
          return `*[local-name()="${tag}"]${predicate}`;
        })
        .join("/");
  
    const xEval = (expr, ctx = frontEl, type = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) =>
      (ctx.ownerDocument || ctx).evaluate(expr, ctx, null, type, null);
  
    const getText = (path, ctx = frontEl) => {
      const r = xEval(lnPath(path), ctx, XPathResult.STRING_TYPE);
      const v = r && typeof r.stringValue === "string" ? r.stringValue.trim() : "";
      return v;
    };
    const getNode = (path, ctx = frontEl) => {
      const r = xEval(lnPath(path), ctx, XPathResult.FIRST_ORDERED_NODE_TYPE);
      return r.singleNodeValue || null;
    };
    const getNodes = (path, ctx = frontEl) => {
      const r = xEval(lnPath(path), ctx, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
      const arr = [];
      for (let i = 0; i < r.snapshotLength; i++) arr.push(r.snapshotItem(i));
      return arr;
    };
    const textOf = (el) => (el ? (el.textContent || "").trim() : "");
  
    // ===== Utilities =====
    const cleanDOI = (v) => (v || "").trim().replace(/^https?:\/\/doi\.org\//i, "");
    const toISODate = (y, m, d) => {
      if (!y) return "";
      const mm = m ? String(parseInt(m, 10)).padStart(2, "0") : "";
      const dd = d ? String(parseInt(d, 10)).padStart(2, "0") : "";
      return [y.padStart(4, "0"), mm, dd].filter(Boolean).join("-");
    };

    // Matches contribs by type and returns array of Person objects
    function getContribsByType(frontEl, types) {
        // Build XPath OR expression
        const expr = `article-meta/contrib-group/contrib[${types
        .map(t => `@contrib-type='${t}'`)
        .join(" or ")}]`;
        const nodes = getNodes(expr, frontEl);
    
        return nodes.map(c => {
        const given = getText("name/given-names", c);
        const family = getText("name/surname", c);
        const prefix = getText("name/prefix", c);
        const fullName = [prefix, given, family].filter(Boolean).join(" ").trim() || (given || family);
    
        const orcid = getText("contrib-id[@contrib-id-type='orcid']", c) || undefined;
    
        const instName = getText("aff/institution", c) || getText("aff/institution-wrap/institution", c) || undefined;
        const ror      = getText("aff/institution-wrap/institution-id[@institution-id-type='ROR']", c) || undefined;
    
        const addrLine = getText("aff/addr-line", c);
        const city     = getText("aff/city", c);
        const country  = getText("aff/country", c);
        const email    = getText("aff/email", c);
    
        const affiliation = (instName || ror || addrLine || city || country)
            ? {
                "@type": "Organization",
                name: instName || undefined,
                identifier: ror ? { "@type": "PropertyValue", propertyID: "ROR", value: ror } : undefined,
                address: (addrLine || city || country) ? {
                "@type": "PostalAddress",
                streetAddress: addrLine || undefined,
                addressLocality: city || undefined,
                addressCountry: country || undefined,
                } : undefined,
            }
            : undefined;
    
        return {
            "@type": "Person",
            name: fullName || undefined,
            honorificPrefix: prefix || undefined,
            givenName: given || undefined,
            familyName: family || undefined,
            email: email || undefined,
            identifier: orcid ? { "@type": "PropertyValue", propertyID: "ORCID", value: orcid } : undefined,
            sameAs: orcid || undefined,
            affiliation: affiliation || undefined,
        };
        });
    }
  
    // ===== Journal / Periodical =====
    const journalTitle = getText("journal-meta/journal-title-group/journal-title"); // <- FIXED (works w/ or w/o ns)
    const issnOnline = getText('journal-meta/issn[@publication-format="online"]');
    const issnPrint  = getText('journal-meta/issn[@publication-format="print"]');
    const isbnPrint  = getText('journal-meta/isbn[@publication-format="print"]');
    const journalIdDoiUrl = getText('journal-meta/journal-id[@journal-id-type="doi"]');
    const journalDoi = cleanDOI(journalIdDoiUrl) || undefined;
  
    const publisherName = getText("journal-meta/publisher/publisher-name");
    const pubAddrInst   = getText("journal-meta/publisher/publisher-loc/institution");
    const pubAddrLine   = getText("journal-meta/publisher/publisher-loc/addr-line");
    const pubCityRaw    = getText("journal-meta/publisher/publisher-loc/city");
    const pubCountry    = getText("journal-meta/publisher/publisher-loc/country");
    const pubUrl        = getText('journal-meta/publisher/publisher-loc/ext-link[@ext-link-type="uri"]');
  
    let postalCode = "";
    let addressLocality = pubCityRaw;
    const mCity = pubCityRaw.match(/^(\d{4,6})\s+(.+)$/);
    if (mCity) {
      postalCode = mCity[1];
      addressLocality = mCity[2];
    }
  
    const publisher = publisherName
      ? {
          "@type": "Organization",
          name: publisherName,
          url: pubUrl || undefined,
          department: pubAddrInst || undefined,
          address: (pubAddrLine || addressLocality || postalCode || pubCountry) ? {
            "@type": "PostalAddress",
            streetAddress: pubAddrLine || undefined,
            addressLocality: addressLocality || undefined,
            postalCode: postalCode || undefined,
            addressCountry: pubCountry || undefined,
          } : undefined,
        }
      : undefined;
  
    const periodical = (journalTitle || issnOnline || issnPrint || journalDoi || isbnPrint)
      ? {
          "@type": "Periodical",
          name: journalTitle || undefined,
          issn: [issnPrint, issnOnline].filter(Boolean).join(", ") || undefined,
          identifier: [
            journalDoi && { "@type": "PropertyValue", propertyID: "doi", value: journalDoi },
            isbnPrint && { "@type": "PropertyValue", propertyID: "isbn", value: isbnPrint },
          ].filter(Boolean),
          publisher: publisher || undefined,
        }
      : undefined;
  
    // ===== Article Core =====
    const articleTitle    = getText("article-meta/title-group/article-title");
    const articleSubtitle = getText("article-meta/title-group/subtitle");
  
    const articleDoiUrl = getText('article-meta/article-id[@pub-id-type="doi"]');
    const articleDOI    = cleanDOI(articleDoiUrl) || undefined;

    // get contributors:
    const authors = getContribsByType(frontEl, ['author']);
    const coauthors = getContribsByType(frontEl, ['co-author']);
    const editors = getContribsByType(frontEl, ['editor']);
  
    // Prefer a 'pub' or 'collection' date, otherwise the first pub-date present
    let pubDateNode =
      getNode('article-meta/pub-date[@date-type="pub"]') ||
      getNode('article-meta/pub-date[@pub-type="collection"]') ||
      getNode("article-meta/pub-date");
    const datePublished = pubDateNode
      ? toISODate(
          getText("year", pubDateNode),
          getText("month", pubDateNode),
          getText("day", pubDateNode)
        )
      : undefined;
  
    const volumeRaw = getText("article-meta/volume"); // might be "65•2024"; keep verbatim
  
    // Canonical URL: try self-uri (online-url), else DOI
    const selfUri = getText('article-meta/self-uri[@content-type="online-url"]');
    const canonicalUrl = selfUri || (articleDOI ? `https://doi.org/${articleDOI}` : undefined);
  
    // Abstract (first <abstract> text); multilingual abstracts → additional entries in 'abstract' as objects
    const abstractEl = getNode("article-meta/abstract");
    const abstractMain = abstractEl ? textOf(abstractEl).replace(/\s+/g, " ").trim() : undefined;
  
    const transAbstractEls = getNodes("article-meta/trans-abstract");
    const abstracts = [];
    if (abstractMain) abstracts.push(abstractMain);
    transAbstractEls.forEach(el => {
      const lang = el.getAttribute("xml:lang") || el.getAttributeNS("http://www.w3.org/XML/1998/namespace", "lang");
      const txt = textOf(el).replace(/\s+/g, " ").trim();
      if (txt) {
        abstracts.push({ "@value": txt, "@language": lang || undefined });
      }
    });
  
    // Keywords → DefinedTerms (preserve lang per group)
    const kwGroups = getNodes("article-meta/kwd-group");
    const aboutTerms = [];
    kwGroups.forEach(grp => {
      const inLang = grp.getAttribute("xml:lang") || grp.getAttributeNS("http://www.w3.org/XML/1998/namespace", "lang") || undefined;
      getNodes("kwd", grp).forEach(kw => {
        const name = textOf(kw);
        if (name) {
          aboutTerms.push({ "@type": "DefinedTerm", name, inLanguage: inLang || undefined });
        }
      });
    });
  
    // Permissions / License
    const licenseOnline = getText('article-meta/permissions/license[@license-type="online"]/license-p[@content-type="terms-of-use"]') ||
                          getText("article-meta/permissions/license/license-p[@content-type='terms-of-use']") ||
                          getText("article-meta/permissions/license"); // may already be a URL
    const copyrightStatement = getText("article-meta/permissions/copyright-statement");
    const copyrightHolder = getText("article-meta/permissions/copyright-holder");
    const copyrightYear   = getText("article-meta/permissions/copyright-year") ||
                            getText("article-meta/permissions/copyright-statement").match(/\b(19|20)\d{2}\b/)?.[0];

  
    // ===== Compose JSON-LD =====
    const base = {
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
  
      // Identity
      headline: articleTitle || undefined,
      name: articleTitle || undefined,
      alternateHeadline: articleSubtitle || undefined,
  
      // DOI + URL
      identifier: articleDOI
        ? { "@type": "PropertyValue", propertyID: "doi", value: articleDOI }
        : undefined,
      url: canonicalUrl || undefined,
  
      // Publication
      isPartOf: periodical || undefined,
      volumeNumber: volumeRaw || undefined,
      datePublished: datePublished || undefined,
  
      // People
      author: authors.length ? authors : undefined,
      contributor: coauthors.concat(editors).length ? coauthors.concat(editors) : undefined,

      // Publisher
      publisher: publisher || undefined,
  
      // Content
      abstract: abstracts.length === 1 ? abstracts[0] : (abstracts.length ? abstracts : undefined),
      about: aboutTerms.length ? aboutTerms : undefined,
  
      // Rights
      copyrightHolder: copyrightHolder || undefined,
      copyrightYear: copyrightYear || undefined,
      copyrightNotice : copyrightStatement || undefined,
      license: licenseOnline && /^https?:\/\//i.test(licenseOnline) ? licenseOnline : undefined,
      isAccessibleForFree: !!(licenseOnline && /^https?:\/\//i.test(licenseOnline)),
    };
  
    // Merge into incoming json without dropping user-supplied extras.
    Object.keys(base).forEach(k => {
      if (base[k] !== undefined && base[k] !== null && !(Array.isArray(base[k]) && base[k].length === 0)) {
        json[k] = base[k];
      }
    });
  
    return json;
}
  
