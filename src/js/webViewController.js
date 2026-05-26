/** -------------------------------------
 * html view script libraries 
 * @type {Constants}
---------------------------------------*/
const domain = "http://localhost:3000/jatsinform/"
const htmlViewScriptLibrary = {
    "highlightJs": {
        "type": "text/javascript",
        "src-remote": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js",
        "src-local": domain + "lib/highlightJs/highlightJs_11.10.0.js",
    },
    "highlightJsCss": {
        "type": "text/css",
        "src-remote": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/default.min.css",
        "src-local": domain + "lib/highlightJs/highlightJsCss_11.10.0.css",
    },
    "leaflet": {
        "type": "text/javascript",
        "src-remote": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
        "src-local": domain + "lib/leaflet/leaflet_1.9.4.js" 
    },
    "leafletCss": {
        "type": "text/css",
        "src-remote": "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        "src-local": domain + "lib/leaflet/leafletCss_1.9.4.css"
    },
    "fontAwesome": {
        "type": "text/css",
        "src-remote": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
        "src-local": domain + "lib/fontAwesome/fontAwesome_6.0.0_all.css"
    }
} 

/** ---------------------------------
 * document state event listener:
 * @type {EventListenerObject}
 ------------------------------------*/
 document.addEventListener("readystatechange", (event) => {

    if (event.target.readyState === "interactive") {
        
        // document is single HTML downloaded or generated on the fly
        let isSingleHTMLFile;
        if(document.querySelector('meta[name="--from-xml"]') === null) {
            isSingleHTMLFile = true;
        } else isSingleHTMLFile = false;

        // add third-party libraries and stylesheets:
        if(isSingleHTMLFile) {
            addScriptToDocumentHead("highlightJs");
            addScriptToDocumentHead("highlightJsCss");
            addScriptToDocumentHead("leaflet");
            addScriptToDocumentHead("leafletCss");
            addScriptToDocumentHead("fontAwesome");
        }
     
        // remove fallback-styles:
        let fallbackStyles = document.querySelector("#fallback-styles");
        if(fallbackStyles !== null) {fallbackStyles.remove();}
    }

    if (event.target.readyState === "complete") {

        // remove progress-bar:
        if(document.querySelector("#progress-bar") !== null) {
            document.querySelector("#progress-bar").style.display = "none";
        }

        // event listener:
        focusTocTargetsOnHoverSection();
        handleAnchorHashFeatures();
        window.addEventListener("hashchange", handleAnchorHashFeatures);

        // sync initial panel hash (#panel-cover by default):
        if (!window.location.hash) {window.location.hash = "#panel-cover"}
        // re-apply initial hash after dynamic panel DOM has been created
        setTimeout(() => {
            let hash = window.location.hash;
            if (!hash) return;
            history.replaceState(null, "", "#");
            window.location.hash = hash;
        }, 1000);
    }
});

/** ------------
 FUNCTIONS
 --------------*/

 /**
 * add <script>- or <link>-element to document head
 * @param {String} scriptName: name of the script, 
 * defined in htmlViewScriptLibrary (constant)
 * @returns {void} appends script or link to document head
 */
function addScriptToDocumentHead(scriptName) {

    let type;
    if(htmlViewScriptLibrary[scriptName] !== undefined) {
        type = htmlViewScriptLibrary[scriptName]["type"];
    } else type = false;
    
    if(type === "text/javascript") {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = htmlViewScriptLibrary[scriptName]["src-local"];
        if(scriptName === "webViewController") {
            script.defer = true;
        }
        document.head.appendChild(script);
    }
    else if(type === "text/css") {
        let cssLink = document.createElement('link');
        cssLink.type = 'text/css';
        cssLink.rel = 'stylesheet';
        cssLink.href = htmlViewScriptLibrary[scriptName]["src-local"];
        document.head.appendChild(cssLink);
    }
    else {
        console.warn("ScriptName [" + scriptName + "] not defined in scriptLibary")
    }
}

 /**
 * handle hash-driven side effects while panel visibility is controlled by CSS.
 * @returns {void} initializes map panel when required and keeps scroll correction behavior.
 */
function handleAnchorHashFeatures() {

    // get current hash from url:
    let currentHash = window.location.hash;
    if(!currentHash) {return;}

    // remove leading "#" because getElementById expects a plain id
    let hashTargetId = decodeURIComponent(currentHash.slice(1));
    let target = document.getElementById(hashTargetId);

    // init maps when a target inside gazetteer is addressed directly
    if(target !== null && target.closest("#gazetteer") !== null) {
        setTimeout(() => {initMaps(".map");}, 500);
    }

    // init maps when the panel-state hash directly targets gazetteer panel
    if(hashTargetId === "panel-gazetteer") {
        setTimeout(() => {initMaps(".map");}, 500);
    }

    // keep existing overjump correction behavior for non-panel hash jumps
    if(!hashTargetId.startsWith("panel-")) {
        setTimeout(() => {
            window.scrollBy(0, -500);
        }, 1000);
    }

    // highlight/scroll mechanics for internal cross-reference anchors:
    let anchors = document.querySelectorAll(
        "a.fig-ref,a.bib-ref,a.fn-ref,a.box-ref,a.index-ref"
        + ",a.ext-ref:not([data-specific-use='weblink'])"); // exclude weblinks
    highlightAnchorTargets(anchors);
}

 /**
 * restore highlight/scroll behavior for internal anchor targets.
 * @param {NodeList} anchors: nodeList of internal anchors
 * @returns {void} updates hash, scrolls target into view and applies temporary highlight.
 */
function highlightAnchorTargets(anchors) {

    if(anchors !== undefined && anchors.length) {
        anchors.forEach((anchor) => {
            anchor.addEventListener("click", event => {
                  console.log(anchor);
                let targetRef = anchor.getAttribute("href");
                if(targetRef === null || !targetRef.startsWith("#") || targetRef.includes(' ')) {
                    return;
                }

                // avoid default jump to ensure deterministic panel + centered scrolling.
                event.preventDefault();
                window.location.hash = targetRef;

                let target = document.querySelector(targetRef);
                if(target !== null) {
                    // keep slight delay so CSS-driven panel switching is applied before scrolling
                    setTimeout(() => {
                        target.classList.add("highlight");
                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });
                    }, 500);

                    // keep legacy overjump correction behavior
                    setTimeout(() => {
                        window.scrollBy(0, -500);
                    }, 1000);

                    // reset highlight after short delay
                    setTimeout(() => {
                        target.classList.remove("highlight");
                    }, 3000);
                }
            });
        });
    }
}

 /**
 * focus toc-targets when hover over section
 * @returns {void} classes of targeted toc elements will be changed
 * if the element comes into viewport (detected by intersection observer)
 */
function focusTocTargetsOnHoverSection() {

    const options = {threshold: 1,};
    const observer = new IntersectionObserver(sections => {
        sections.forEach(section => {

            // get target reference by section headline:
            let headline = section.target.firstElementChild;
            let targetRefId;
            if(headline != null) {
                targetRefId = headline.getAttribute("href");
            } else (targetRefId = null);
    
            // query target:
            let target;
            if(targetRefId !== null && !targetRefId.includes(' ')) {
                targetRefId = targetRefId.slice(1); // remove #
                target = document.getElementById(targetRefId);
            } else target = null;

            // reference comes into viewport (at bottom)
            if (section.isIntersecting) { 
                // handle target:
                if(target !== null) {
                    target.classList.add('active');
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                    target.ariaCurrent = "true";
                }
            } 
            // element leaves the viewport (at top)
            else {
                if(target !== null) {
                    target.classList.remove('active');
                    target.ariaCurrent = "false";
                }
            }
        }, options);
    });

    // track all section elements:
    document.querySelectorAll("section")
        .forEach((element) => {observer.observe(element);
    });
}

 /**
 * init(ialize) map containers for leaflet
 * @param {String} selector css-selector of map container(s)
 * @returns {void} handles over mapId and coords to createMap()
 */
function initMaps(selector) {

    let maps = document.querySelectorAll(selector);
    maps.forEach(map => {
        let coords = [];
        let longitude = parseFloat(map.getAttribute("longitude"));
        let latitude = parseFloat(map.getAttribute("latitude"));
        // check if value is parseable finite number (!== null)
        if(Number.isFinite(longitude) && Number.isFinite(latitude)) {
            coords.push(longitude);
            coords.push(latitude);
        // no coordinates available:
        } else {
            coords = false;
        }
        createMap(map.id, coords);
    });
}

 /**
 * create leaflet maps
 * @param {String} mapId: ids of map elements (divs with class 'map')
 * @param {Array} coordinates: array wit long and lat values
 * @returns {void} instantiates leaflet maps (e.g. mapLayers and marker)
 */
function createMap(mapId, coordinates) {

    // set tile layers:
    let mapLayer = L.tileLayer.wms("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
        tiled: true,
        format: "image/jpeg",
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // define map parameter:
    let location = (coordinates) ? {lat: coordinates[1], lng: coordinates[0]} : [0,0];
    let zoom = (coordinates) ? 8 : 1;

    // instantiate map:
    if(!document.querySelector("#" + mapId + " > .leaflet-pane")) {
        let map = L.map(document.querySelector("#" + mapId), {
            zoom: zoom,
            doubleClickZoom: false,
            dragging: false,
            zoomSnap: false,
            trackResize: false,
            touchZoom: false,
            scrollWheelZoom: false,
            center: location,
        });
        mapLayer.addTo(map);             // show mapLayer by default
        L.control.scale().addTo(map);    // show dynamic scale (Maßstab)
      
        // add location marker:
        let marker = L.marker(location).addTo(map);
        if(!coordinates) {
            marker.bindPopup("No coordinates available.").openPopup();
        }
    }
}
