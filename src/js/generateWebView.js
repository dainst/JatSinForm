/** -----------------------------------
* Create main DOM-elements as constants
----------------------------------------*/
// initialize navigationPanels array:
const navigationPanelsDocument = [];

// navigation element to switch between each panel
const mainHeader = document.createElement("header");
mainHeader.id = "main-header";

// general wrapper:
const main = document.createElement("main");
main.id = "main-wrapper";

// article wrapper:
const article = document.createElement("article");

// wrapper containing the text-content (main-text)
const textContentWrapper = document.createElement("div");
textContentWrapper.id = "text-content-wrapper";
textContentWrapper.classList.add("column");
textContentWrapper.ariaLabel = "Main text panel";
textContentWrapper.role = "region";

// pseudo top element for back-to-top-anchor
const topElement = document.createElement("span");
topElement.id = "top";

// back-to-top-element:
const backToTop = document.createElement("a");
backToTop.id = "back-to-top";
backToTop.href = "#top";
backToTop.ariaLabel = "Back to top";

// wrapper containing side-content (figures, referenceList)
const panelWrapper = document.createElement("div");
panelWrapper.id = "panel-wrapper";
panelWrapper.classList.add("column");
panelWrapper.ariaLabel = "Supplementary panel";
panelWrapper.role = "region";

/** --------------------------------------
 * window document state event listener:
 * @type {document}
 * @type {EventListenerObject}
 --------------------------------------*/
 document.addEventListener("readystatechange", (event) => {

    if (event.target.readyState === "complete") {

        // get html-wrapper:
        let htmlWrapper = document.querySelector("#html-wrapper");

        // create content panel (ToC):
        let lang = document.documentElement.lang;
        let contentsTitle = defaultTitles["contents"][lang];
        const panelContents = createPanel("contents", contentsTitle, false);
        navigationPanelsDocument.push("contents");

        // create cover area: 
        let coverArea = createCoverArea(htmlWrapper);
        let abstractSection = getAbstractSection(htmlWrapper);
        coverArea.appendChild(abstractSection);
    
        // append coverArea to articleHeader:
        let articleHeader = document.createElement("header");
        articleHeader.id = "article-header";
        articleHeader.appendChild(coverArea);
      
        // extract supplement links from anchors:
        let anchors = document.querySelectorAll( // exclude weblinks and zenon-links
            "a.ext-ref:not([data-specific-use='weblink']):not([data-specific-use='zenon']");
        let supplementsLinks = extractSupplementsLinks(anchors);

        // filter and count supplementLinks:
        supplementsLinks = filterSupplementLinks(supplementsLinks);
        let numSupplements = countSupplementLinks(supplementsLinks);

        // create content and supplementary panels:
        createContentPanels(htmlWrapper);
        createSupplementPanels(numSupplements);
        // fetch supplementary data from external sources:
        fetchExternalData(supplementsLinks);

        // create meta-panel:
        let panelMeta = createPanel("metadata", "Metadata", false);
        panelWrapper.appendChild(panelMeta);
        navigationPanelsDocument.push("metadata");
       
        // create meta section:
        let front = document.querySelector(".front");
        let metaSection;
        if(front !== null) {
            metaSection = createMetaSection(front);
            panelMeta.appendChild(metaSection);
        }

        // get main-text:
        let textBody = htmlWrapper.querySelector(".text-body");

        // create ToC-list and add to panel contents:
        let tocList = createToCByHeadlines(textBody);

        // add text-body to textContentWrapper
        textContentWrapper.append(textBody);
        textContentWrapper.insertAdjacentElement("afterbegin", topElement)
        textContentWrapper.insertAdjacentElement("beforeend", backToTop);

        panelContents.appendChild(tocList);
        panelWrapper.appendChild(panelContents);

        // add content wrappers to article:
        article.append(articleHeader);
        article.appendChild(textContentWrapper);
        article.appendChild(panelWrapper);
    
        // add main header and article to main:
        main.appendChild(mainHeader);
        main.appendChild(article);

        // add mainHeader and main to body:
        document.body.appendChild(mainHeader);
        document.body.appendChild(main);
        createPanelNavigation(navigationPanelsDocument);

        // add stats section:
        if(addStatsSection) {
            let statsSection = createDocumentStats(numSupplements);
            let panelContents = document.querySelector("#contents");
            panelContents.appendChild(statsSection);
        }

        // remove <front> and <back> and htmlWrapper (empty)
        if(htmlWrapper.querySelector(".front") !== null) {htmlWrapper.querySelector(".front").remove();}
        if(htmlWrapper.querySelector(".back") !== null) {htmlWrapper.querySelector(".back").remove();}
        if(htmlWrapper !== undefined) htmlWrapper.remove();

        // define image scaling:
        document.querySelectorAll('img:not(.logo-img)').forEach(function(img) {
            img.onerror = function(){this.style.display='none';};
            img.setAttribute("loading", "lazy");
            img.title = "Right-click or press on image for image-specific features";
            scaleImage(img);
        });

        // init additional js-functions:
        checkQualityOfUrls();
        showSelectedPanel("contents");
        createIndexOfInternalReferences("figure:not(.journal-logo)", "fig-ref");
        createIndexOfInternalReferences(".reference", "bib-ref");
        addTitleAttributesAsAccessablityHelper();

        // fade-in:
        document.body.classList.add("fade-in");
    }
});

/**
 * create imprint section to display journal information related to imprint
 * @param {DocumentFragment} front html-element with xml-front elements
 * @returns {HTMLElement} imprintSection: enhanced with imprint information  
 */
function createImprintSection(front) {

    // prepare imprint elements:
    let imprintSection = document.createElement("section");
    imprintSection.classList.add("imprint-section");

    // journal title:
    let journalTitle;
    let journalDOI;
    let journalDOILink;
    if(front.querySelector(".journal-title") !== null) {
        journalTitle = front.querySelector(".journal-title");
        // add journal DOI:
        if(front.querySelector(".journal-id[journal-id-type='doi']") !== null) {
            journalDOI = front.querySelector(".journal-id[journal-id-type='doi']");
            journalDOILink = document.createElement("a");
            journalDOILink.id = "journal-doi-link";
            journalDOILink.href = journalDOI.innerText;
            journalDOILink.textContent = journalTitle.textContent;
            journalTitle.innerHTML = journalDOILink.outerHTML;
        } else {
            journalTitle.innerHTML = journalTitle.innerText;
        }
        imprintSection.appendChild(journalTitle);
    }

    // publisher:
    let publisher;
    if(front.querySelector(".publisher") !== null) {
        publisher = front.querySelector(".publisher");
        imprintSection.appendChild(publisher);
    }

    // parse customMetaGroup:
    let customMetas;
    let customMetaSection = document.createElement("div");
    customMetaSection.classList.add("custom-meta-section")
    if(front.querySelector(".custom-meta-group") !== null) {
        customMetas = front.querySelectorAll(".custom-meta");
        for (let i = 0; i < customMetas.length; i++) {
            let metaName = customMetas[i].querySelector(".meta-name");
            if(/label/.test(metaName.textContent)) {
                customMetas[i].style.display = "none";
            }
            if(/url/.test(metaName.textContent)) {
                customMetas[i].style.display = "none";
            }
            if(/publishing-history/.test(metaName.textContent)) {
                customMetas[i].style.display = "none";
            }
            customMetaSection.appendChild(customMetas[i]);
        }
        imprintSection.appendChild(customMetaSection);
    }

    return (imprintSection);
}

/**
 * create meta section to display article-meta and journal-meta
 * @param {DocumentFragment} front html-element with xml-front elements
 * @returns {HTMLElement} metaSection enhanced with meta information  
 */
function createMetaSection(front) {

    // create meta section and title:
    let metaSection = document.createElement("section");
    metaSection.id = "meta-section";
    let metaSectionTitle = document.createElement("h2");
    metaSectionTitle.classList.add("title", "panel-title", "main-section-title")
    metaSectionTitle.textContent = "Metadata";
    metaSection.appendChild(metaSectionTitle);

    // prepare article meta:
    let articleMetaSection = createArticleMetaSection(front);

    // journal-meta
    let journalMetaSection = document.createElement("section");
    journalMetaSection.id = "journal-meta-section";

    let journalMetaTitle = document.createElement("h3");
    journalMetaTitle.classList.add("title", "panel-subsection-title");
    journalMetaTitle.textContent = "About Journal";
    journalMetaSection.appendChild(journalMetaTitle);
   
    let imprintSection = createImprintSection(front);
    journalMetaSection.appendChild(imprintSection);

    let journalContributorsDetails = createContributorsDetails(front, false);
    journalContributorsDetails.classList.add("journal-contributors");
    journalMetaSection.appendChild(journalContributorsDetails);

    // format-meta:
    let formatMetaSection = document.createElement("section");
    formatMetaSection.id = "format-meta-section";

    let formatMetaTitle = document.createElement("h3");
    formatMetaTitle.classList.add("title", "panel-subsection-title");
    formatMetaTitle.textContent = "About Format";
    formatMetaSection.appendChild(formatMetaTitle);

    let notice = document.createElement("p");
    notice.classList.add("system-notice");
    notice.innerHTML = systemNotice["html"];
    formatMetaSection.appendChild(notice);

    metaSection.appendChild(articleMetaSection);
    metaSection.appendChild(journalMetaSection);
    metaSection.appendChild(formatMetaSection);

    return(metaSection);
}

function createArticleMetaSection(front) {

    // prepare elements:
    let articleMetaSection = document.createElement("section");
    articleMetaSection.id = "article-meta-section";
    let articleMetaTitle = document.createElement("h3");
    articleMetaTitle.classList.add("title", "panel-subsection-title")
    articleMetaTitle.textContent = "About Article";
    articleMetaSection.appendChild(articleMetaTitle);

    // add contributors:
    let articleContributorsDetails = createContributorsDetails(front, true);
    articleMetaSection.appendChild(articleContributorsDetails);

    // add basic meta:
    if(front.querySelector(".article-id") !== null) {
        articleMetaSection.appendChild(front.querySelector(".article-id"));
    }
    if(front.querySelector(".article-title") !== null) {
        articleMetaSection.appendChild(front.querySelector(".article-title"));
    }
    if(front.querySelector(".article-subtitle") !== null) {
        articleMetaSection.appendChild(front.querySelector(".article-subtitle"));
    }
    if(front.querySelector(".pub-date") !== null) {
        articleMetaSection.appendChild(front.querySelector(".pub-date"));
    }
     if(front.querySelector(".copyright-statement:not([content-type='print'])")) {
        articleMetaSection.appendChild(front.querySelector(".copyright-statement:not([content-type='print'])"));
    }
    if(front.querySelector(".license[license-type='text']")) {
        articleMetaSection.appendChild(front.querySelector(".license[license-type='text']"));
    }
    if(front.querySelectorAll(".license-p").length > 0) {
        front.querySelectorAll(".license-p").forEach(element => {
            articleMetaSection.appendChild(element);
        });
    }
    return(articleMetaSection);
}

/**
 * create contributors details for all participants (article and journal)
 * @param {DocumentFragment} content document-fragment made from original DOM
 * @param {boolean} isArticle if true, contributors data will be taken from 
   <article-meta> and display as contributors of article or rather authorDetails
 * @returns {HTMLElement} contributorsDetails
 */
function createContributorsDetails(content, isArticle) {

    let authors;
    let coAuthors;
    let editors;
    let coEditors;
    let advisoryBoardMember;
    // get article authors and contributors
    if(isArticle) {
        authors = content.querySelectorAll(".contrib[contrib-type='author']");
        coAuthors = content.querySelectorAll(".contrib[contrib-type='co-author']");
    }
     // get journals editors, co-editors and advisory board member
    else {
        editors = content.querySelectorAll(".contrib[contrib-type='Editor']");
        coEditors = content.querySelectorAll(".contrib[contrib-type='Co-Editor']");
        advisoryBoardMember = content.querySelectorAll(".contrib[contrib-type='Advisory Board Member']");
    }

    // create contributors details:
    let contributorsDetails = document.createElement("section");
    contributorsDetails.classList.add("contributors-section");

    // create contributors-list and add to contributorsDetails:
    addContributorsToContributorsDetails(authors, contributorsDetails);
    addContributorsToContributorsDetails(coAuthors, contributorsDetails);
    addContributorsToContributorsDetails(editors, contributorsDetails);
    addContributorsToContributorsDetails(coEditors, contributorsDetails);
    addContributorsToContributorsDetails(advisoryBoardMember, contributorsDetails);
    return(contributorsDetails);
}

/**
 * create contributor-list and add to contributorDetails:
 * @param {HTMLElement} contributor given data for each kind of contributor
 * @param {HTMLElement} contributorsDetails contributors section:
 * @returns {void} contributorsList is added to contributorsDetails (DOM)
 */
function addContributorsToContributorsDetails(contributors, contributorsDetails) {
    
    if(contributors && contributors.length) {
        let contributorsList = document.createElement("ul");
        contributorsList.classList.add("contributors-list");

        // add role title to contributorsDetails (section):
        let contribGroup = contributors[0].parentElement;
        let role;
        if(contribGroup.querySelector(".role") !== null) {
            role = contribGroup.querySelector(".role");
            role.classList.add("meta-details-title");
            contributorsDetails.appendChild(role);
        }
        else {
            role = document.createElement("p")
            role.classList.add("role", "meta-details-title");
            role.textContent = "[No-contributor-group-role]";
            contributorsDetails.appendChild(role);
        }

        // add each contributor:
        for (let i = 0; i < contributors.length; i++) {
            let contributorsCard = createContributorsCard(contributors[i]);
            contributorsList.appendChild(contributorsCard);
        }
        contributorsDetails.appendChild(contributorsList);
    }
}

/**
 * create contributors card for each participant (e.g author)
 * @param {HTMLElement} contributor given data for each contributor
 * @returns {HTMLElement} contributorsCard, common information of each author
   including contributors-ids, institution affiliation and contact email
 */
function createContributorsCard(contributor) {

    // prepare section elements:
    let contributorsCard = document.createElement("li");
    contributorsCard.classList.add("contributors-card");

    // prepae sub-elements of contributors card:
    let name = document.createElement("p");
    let institution = document.createElement("p");
    let contribIdLink = document.createElement("a");
    let institutionIdLink = document.createElement("a");
    let email = document.createElement("address");

    // parse and reorder names and contrib-ids (e.g. orcid):
    if(contributor.querySelector(".given-names") !== null && contributor.querySelector(".surname") !== null) {
        let givenName = contributor.querySelector(".given-names").textContent;
        let surName = contributor.querySelector(".surname").textContent;
        if(contributor.querySelector(".contrib-id") !== null) {
            let contribId = contributor.querySelector(".contrib-id").textContent;
            contribIdLink.classList.add("contributor-link");
            contribIdLink.target = "_blank";
            contribIdLink.rel= "noopener noreferrer";
            contribIdLink.href = contribId;
            contribIdLink.innerHTML = givenName + " " + surName;
            name.append(contribIdLink);
        } else { name.innerHTML = givenName + " " + surName;}
        contributorsCard.append(name);
    };

     // parse and reorder affiliation information: 
    if(contributor.querySelector(".institution") !== null) {
        if(contributor.querySelector(".institution-id") !== null) {
            let institutionId = contributor.querySelector(".institution-id").textContent;
            institutionIdLink.classList.add("institution-link");
            institutionIdLink.target = "_blank";
            institutionIdLink.href = institutionId
            institutionIdLink.innerHTML = contributor.querySelector(".institution").textContent;
            institution.append(institutionIdLink);
        } else { institution.innerHTML = contributor.querySelector(".institution").textContent;}
        contributorsCard.append(institution);
    };

     // parse and append email information:
    if(contributor.querySelector(".email") !== null) {
        email.innerHTML = contributor.querySelector(".email").textContent;
        contributorsCard.append(email);
    }
    return(contributorsCard);
}

/** -----------------------------
* Generate HTML view of document
--------------------------------*/
/**
 * create article header
 * @param {HTMLElement} htmlWrapper: entire html-document converted from xml
 * @returns {HTMLElement} articleHeader with title, subtitle and author information
 */
function createCoverArea(htmlWrapper) {

    // create inner div for fully collapsing the coverArea:
    let coverArea = document.createElement("div");
    coverArea.id = "cover-area";
 
    // get cover page elements:
    let doiElement = createDoiElement();
    let title = htmlWrapper.querySelector(".article-title");
    let subtitle = htmlWrapper.querySelector(".article-subtitle");
    let authors = htmlWrapper.querySelectorAll(".contrib[contrib-type='author']");
    let contributors = htmlWrapper.querySelectorAll(".contrib[contrib-type='co-author']");

    // transform author information to String:
    let authorsCollection = [];
    let givenName;
    let surName;
    for (let i = 0; i < authors.length; i++) {
        if(authors[i].querySelector(".given-names") !== null) {
            givenName = authors[i].querySelector(".given-names").textContent;
        }
        if(authors[i].querySelector(".surname") !== null) {
            surName = authors[i].querySelector(".surname").textContent;
        }
        authorsCollection.push(givenName + " " + surName);
    }

    // transform contributors information to String:
    let contributorsCollection = [];
    let givenNameContributor;
    let surNameContributor;
    for (let i = 0; i < contributors.length; i++) {
        if(contributors[i].querySelector(".given-names") !== null) {
            givenNameContributor = contributors[i].querySelector(".given-names").textContent;
        }
        if(contributors[i].querySelector(".surname") !== null) {
            surNameContributor = contributors[i].querySelector(".surname").textContent;
        }
        contributorsCollection.push(givenNameContributor + " " + surNameContributor);
    }

    // create articleHeader elements:
    let titleElement = document.createElement("h1");
    titleElement.className = "article-title";
    let subtitleElement = document.createElement("p");
    subtitleElement.className = "article-subtitle";
    let authorsElement = document.createElement("p");
    authorsElement.className = "article-authors";
    let contributorsElement = document.createElement("p");
    contributorsElement.className = "article-contributors";

    // fill articleHeader elements with content:
    let lang = document.documentElement.lang;
    titleElement.innerHTML = (title) ? title.textContent : "[Kein Titel]";
    subtitleElement.innerHTML = (subtitle) ? subtitle.textContent : "";
    authorsElement.innerHTML = (authorsCollection.length) ? authorsCollection.join(", ") : "[Keine Autoren]";
    if(contributorsCollection.length && lang !== undefined) {
        contributorsElement.innerHTML = contributorsPrepositions[lang] + " " + contributorsCollection.join(", ");
    }

    // get poster-image:
    let posterImage;
    if(htmlWrapper.querySelector("#poster-image") !== null) {
        posterImage = htmlWrapper.querySelector("#poster-image");
        if(posterImage.querySelector(".attribution") !== null) {
            let posterImageAttrib = posterImage.querySelector(".attribution");
            posterImageAttrib.classList.add("poster-image-attribution");
        }
    } else {
        posterImage = document.createElement("p");
        posterImage.id = "poster-image-missing"
        posterImage.textContent = "[no-poster-image]";
    }

    // create journal logo:
    let logo = document.createElement("figure");
    logo.classList.add("journal-logo");
    if(localStorage.getItem("journal-config") !== null) {
        let journalConfig = JSON.parse(localStorage.getItem("journal-config"));
        let logoPath = journalConfig["logoPath"];
        let logoImg = document.createElement("img");
        logoImg.classList.add("logo-img");
        logoImg.src = logoPath;
        logoImg.alt = "Logo of the journal"
        logo.appendChild(logoImg);
    }

    // append elements to coverArea:
    coverArea.appendChild(logo);
    coverArea.append(posterImage);
    coverArea.append(doiElement);
    coverArea.append(titleElement);
    coverArea.append(subtitleElement);
    coverArea.append(authorsElement);
    coverArea.append(contributorsElement);
  
    return (coverArea);
}

/**
 * create DOI element, added as first element on top of page
 * @returns {HTMLElement} doiElement: div with anchor as child and doi as href
 * and textContent
 */
function createDoiElement() {

    // get documentId (= DOI), saved in localStorage 
    let documentId = getDocumentStateProperty("documentId");
    let doi = (documentId) ? documentId : "no-doi-assigned";

    // create anchor element:
    let doiAnchor = document.createElement("a");
    doiAnchor.id = "doi-anchor";
    doiAnchor.target = "_blank";
    doiAnchor.rel = "noopener noreferrer";
    doiAnchor.ariaLabel = "DOI (opens in new tab)";
    doiAnchor.href = doi;
    doiAnchor.textContent = doi;

    return (doiAnchor);
}

/**
 * create abstract section (for abstract and trans-abstract in each language)
 * @param {HTMLElement} htmlWrapper: entire html-document converted from xml
 * @returns {HTMLElement} abstractSection: section with abstract texts and keywords
 */
function getAbstractSection(htmlWrapper) {

    // create abstract-section:
    let abstractSection = document.createElement("section");
    abstractSection.id = "abstract-section";

    // query abstract content
    let abstracts = htmlWrapper.querySelectorAll(".abstract, .trans-abstract");
    if(abstracts.length) {
        abstracts.forEach(function(abstract) {
            // get abstract lang and abstract title:
            let abstractLang = abstract.getAttribute("lang");
            let abstractTitle;
            if(abstract.querySelector(".title") !== null) {
                abstractTitle = abstract.querySelector(".title").textContent.trim();
            } 
            else {
                abstractTitle = "Abstract (" + abstractLang + ")";
            }

            // get abstract text:
            let abstractTextElement;
            if(abstract.querySelector(".abstract-text") !== null) {
                abstractTextElement = abstract.querySelector(".abstract-text");
            } 
            else if(abstract.querySelector("p") !== null) {
                abstractTextElement = abstract.querySelector("p");
                abstractTextElement.classList.add("abstract-text");
            }
            else {
                abstractTextElement = document.createElement("p");
                abstractTextElement.classList.add("abstract-text");
            }
          
            // create abstract elements view:
            if(abstractTextElement !== null) {
                if(abstractLang !== null) {
                    // add lang:attribute to abstract text element:
                    abstractTextElement.setAttribute("lang", abstractLang);
            
                    // create abstract tab box:
                    let abstractDetails = document.createElement("details");
                    abstractDetails.classList.add("abstract-details")
                    abstractDetails.id = abstractTitle;

                    // create abstract nav buttons:
                    let abstractSummary = document.createElement("summary");
                    abstractSummary.classList.add("abstract-summary");
                    abstractSummary.textContent = abstractTitle;

                    // append all together:
                    abstractDetails.appendChild(abstractSummary);
                    abstractDetails.appendChild(abstractTextElement);
                    abstractSection.appendChild(abstractDetails);
                }
            }
        });
    }
    return(abstractSection);
}

/**
 * create content panels (figures, footnotes, references)
 * @param {HTMLElement} htmlWrapper: entire html-document converted from xml
 * @returns {void} panels will appended to panelWrapper (constant)
 */
function createContentPanels(htmlWrapper) {

    // create panel figures:
    let figureSection = htmlWrapper.querySelector(".figure-section");
    if (figureSection !== null && figureSection.querySelectorAll("figure").length) {
        figureSection = reorderFigureElements(figureSection);
        let panel = createPanel("figures", false, figureSection);
        panelWrapper.appendChild(panel);
        navigationPanelsDocument.push("figures");
    }

    // create panel footnotes:
    let footnoteSection = htmlWrapper.querySelectorAll(".footnotes-section")[0];
    if(footnoteSection) {
        let fnList = document.createElement("ol");
        fnList.classList.add("fn-list");

        let footnotes = footnoteSection.querySelectorAll(".footnote");
        footnotes.forEach(footnote => {
            footnote.setAttribute("tabIndex", "-1"); // add for better keyboard focus
            // enhance footnote:
            addBackLinkAnchorToFootnote(footnote);
            let bibRefs = footnote.querySelectorAll("a.bib-ref");
            titleOfResourcesAsToolTip(bibRefs);
            // append fn to fn-list
            fnList.appendChild(footnote)
        });
        footnoteSection.appendChild(fnList);
        
        // create panel:
        let panel = createPanel("notes", "Footnotes", footnoteSection);
        panelWrapper.appendChild(panel);
        navigationPanelsDocument.push("notes");
    }

    // create panel references:
    let referenceSection = htmlWrapper.querySelectorAll(".reference-section")[0];
    if(referenceSection) {
        let refList = document.createElement("ul");
        refList.classList.add("ref-list");
        let references = referenceSection.querySelectorAll(".reference");
        references.forEach(reference => {
            // extract zenon-Links out of reference:
            let zenonReference;
            let zenonLink;
            let citation = reference.querySelector(".mixed-citation");
            if(citation !== null) {
                zenonReference = citation.querySelector("a[data-specific-use='zenon']");
                zenonLink = createZenonLink(zenonReference);
                // urlify url-strings in references:
                citation.innerHTML = URLifyString(citation.innerText);
                // re-append zenon-links at the end of reference
                if(zenonLink) {citation.appendChild(zenonLink);}
            }
            refList.appendChild(reference);
        });
        // add references to ol:
        referenceSection.appendChild(refList);

        // create panel:
        let panel = createPanel("references", "References", referenceSection);
        panelWrapper.appendChild(panel);
        navigationPanelsDocument.push("references");
    }
}

/**
 * create zenon link (if available) as separate anchor element 
 * @param {HTMLElement} zenonReference: zenon-anchor extracted from reference
 * @returns {HTMLElement} zenonLink: new anchor element
 */
function createZenonLink(zenonReference) {
    
    let zenonLink;
    if(zenonReference !== null) {
        zenonLink = document.createElement("a");
        zenonLink.classList.add("zenon-link");
        zenonLink.target = "_blank";
        zenonLink.href = zenonReference.href;
        zenonLink.textContent = "iDAI.bibligraphy/Zenon";
    }
    else {zenonLink = false;}
    return(zenonLink);
}

/**
 * create supplement panels (iDAI.world-panels and information panel)
 * @param {object} numSupplements: amout of references to objects of 
 * supported iDAI.world systems 
 * @returns {void} panels will appended to panelWrapper (constant)
 */
function createSupplementPanels(numSupplements) {

    // create panel for gazetteer locations:
    if(numSupplements["gazetteer"]) {
        let panel = createPanel("gazetteer", "Locations", false);
        appendFetchStateBarToPanel(panel, "gazetteer");

        // prepare list element
        let externalObjectList = document.createElement("ul");
        externalObjectList.id = "gazetteer-list";
        panel.appendChild(externalObjectList);

        panelWrapper.appendChild(panel);
        navigationPanelsDocument.push("gazetteer");
    }

    // create panel for field objects:  
    if(numSupplements["field"]) {
        let panel = createPanel("field", "Objects from iDAI.field", false);
        appendFetchStateBarToPanel(panel, "field");

        // prepare list element
        let externalObjectList = document.createElement("ul");
        externalObjectList.id = "field-list";
        panel.appendChild(externalObjectList);

        panelWrapper.appendChild(panel);
        navigationPanelsDocument.push("field");
    } 

    // create panel for arachne objects:       
    if(numSupplements["arachne"]) {
        let panel = createPanel("arachne", "Objects from iDAI.objects/arachne", false);
        appendFetchStateBarToPanel(panel, "arachne");

        // prepare list element
        let externalObjectList = document.createElement("ul");
        externalObjectList.id = "arachne-list";
        panel.appendChild(externalObjectList);

        panelWrapper.appendChild(panel);
        navigationPanelsDocument.push("arachne");
    }
}

/**
 * create panel element
 * @param {String} panelName: name of panel (e.g. "references")
 * @param {String} defaultTitle: default title of panel, if not given by xml
 * @param {HTMLElement} content: content of each section
 * @returns {HTMLElement}: panel div with panel title and content
 */
function createPanel(panelName, defaultTitle = false, content = false) {

    // create panel element:
    let panel = document.createElement("aside");
    panel.classList.add("panel", "resource-view", "hidden");
    panel.id = panelName;
  
    // add panel content
    if(content) {panel.appendChild(content);}

    // add panel title:
    if(panelName !== "metadata") {
        let title = document.createElement("h3");
        title.classList.add("title", "panel-title", "section-title");
        let givenTitle = panel.querySelector(".title");
        if(givenTitle !== null) {
            title.textContent = givenTitle.textContent;
            givenTitle.remove();
        } else {
            title.textContent = (defaultTitle) ? defaultTitle : "[No title]";
        }
       panel.insertAdjacentElement("afterbegin", title);
    }
    return(panel);
}

/**
 * count elements and display stats tables
 * @param {object} numSupplements: amout of references to objects of 
 * supported iDAI.world systems 
 * @returns {HTMLElement} statsSection enhanced with document statistics
 */
function createDocumentStats(numSupplements) {

    // create section elements
    let statsSection  = document.createElement("section");
    statsSection .id = "stats-section";

    let statsSectionTitle = document.createElement("h3");
    statsSectionTitle.classList.add("title", "panel-subsection-title");
    statsSectionTitle.textContent = "Document Statistics";
    statsSection.appendChild(statsSectionTitle);

    // get elements to be counted:
    let paragraphs = document.querySelectorAll(".content-paragraph");
    let sections = document.querySelectorAll(".text-body > section");
    let figures = document.querySelectorAll("figure");
    let notes = document.querySelectorAll(".footnote");
    let references = document.querySelectorAll(".reference");

    // count chars of all paragraphs (without whitespace)
    let paragraphAllChars = 0;
    paragraphs.forEach(function(paragraph) {
        paragraphAllChars += paragraph.innerText.trim().length;
    });

    // count chars of all footnotes (without whitespace)
    let footnoteAllChars = 0;
    notes.forEach(function(note) {
        footnoteAllChars += note.innerText.trim().length;
    });

    // count weblinks (exluding links in ref-list and supplementary References)
    let otherWebReferences = document.querySelectorAll("a.ext-ref[data-specific-use='weblink']");

    // add result as table data to infos panel: 
    let statsTable = document.createElement("table");
    statsTable.classList.add("stats-table");

    let tableData =
        "<tr><td>Sections:</td><td class='value'>" + sections.length + "</td></tr>" +
        "<tr><td>Paragraphs:</td><td class='value'>" + paragraphs.length + "</td></tr>" +
        "<tr><td>- Characters (with whitespace)</td><td class='value'>" + paragraphAllChars + "</td></tr>" +
        "<tr><td>Foot-/Endnotes:</td><td class='value'>" + notes.length + "</td></tr>" +
        "<tr><td>- Characters (with whitespace)</td><td class='value'>" + footnoteAllChars + "</td></tr>" +
        "<tr><td>Figures:</td><td class='value'>" + figures.length + "</td></tr>" +
        "<tr><td>Bibliographical References:</td><td class='value'>" + references.length + "</td></tr>" +
        "<tr><td>Supplementary References:</td><td class='value'></td></tr>" +
        "<tr><td>- iDAI.gazetteer (Locations):</td><td class='value'>" + numSupplements["gazetteer"] + "</td></tr>" +
        "<tr><td>- iDAI.objects/arachne:</td><td class='value'>" + numSupplements["arachne"] + "</td></tr>" +
        "<tr><td>- iDAI.field:</td><td class='value'>" + numSupplements["field"] + "</td></tr>" +
        "<tr><td>Other Web References:</td><td class='value'>" + otherWebReferences.length + "</td></tr>"
    statsTable.innerHTML = tableData;

    // append table to statsSection:
    statsSection.appendChild(statsTable);

    return(statsSection);
}

/**
 * create index of internal references, e.g. bib-refs, fig-refs
 * @param {String} elementSelector: css selector of target element listed in panel area
 *  (e.g. ".reference")
 * @param {String} referenceSelector: css selector of referencing anchors in text area
 *  (e.g. ".bib-ref")
 * @returns {void} results will appended to each target element as internalIndexAnchor and
 * internalIndexBox
 */

function createIndexOfInternalReferences(elementSelector, referenceSelector) {
       
    // get element and referenceIndex by given selectors
    let elements = document.querySelectorAll(elementSelector);
    let elementsRefIndex = getReferenceIndex(elements, referenceSelector);

    // process each target element:
    elements.forEach(function(element) {
        if(element.id !== null && element.id !== "poster-image") {
            let refIndex = elementsRefIndex[element.id];
        
            // create details element for displaying results:
            let internalIndexBox = document.createElement("details");
            internalIndexBox.classList.add("internal-index-box");
           
            // create summary as button title:
            let internalIndexSummary = document.createElement("summary");
            internalIndexSummary.classList.add("internal-index-summary");
            internalIndexSummary.textContent = "Found in text (" + refIndex.totalNumber + ")";  
            internalIndexBox.appendChild(internalIndexSummary);        
     
            // parse and list positive results in form of quotes:
            if(refIndex.totalNumber !== 0) {
                if(refIndex.refLinks.length) {
                    let list = document.createElement("ul");
                    refIndex.quotes.forEach(entry => {
                        let listElement = document.createElement("li");
                        let labelAnchor = document.createElement("a");
                        labelAnchor.classList.add("index-ref");
                        labelAnchor.href = "#" + entry.id;

                        let visibleSpan = document.createElement("span");
                        visibleSpan.title = "Jump to " + entry.id + " in main-text";
                        visibleSpan.ariaHidden = true;
                        visibleSpan.innerHTML = "<i>&#9741;</i>";
                        labelAnchor.appendChild(visibleSpan);

                        let hiddenSpan = document.createElement("span");
                        hiddenSpan.classList.add("screenreader-only");
                        hiddenSpan.textContent = "Jump to " + entry.id + " in main-text";
                        labelAnchor.appendChild(hiddenSpan);
                        
                        // add clipped text passage from entry:
                        let textQuote = document.createElement("span");
                        textQuote.classList.add("text-quote");
                        textQuote.innerHTML = entry.textContent;
                        listElement.appendChild(labelAnchor);
                        listElement.appendChild(textQuote);
                        list.appendChild(listElement);
                    });
                    internalIndexBox.appendChild(list);

                }
            // highlight negative results (to be avoided by editorial policy)
            } else {
                internalIndexSummary.classList.add("warning-box");
            } 
            element.appendChild(internalIndexBox);
        }
    });   
}

/**
 * get reference index for given target elements (e.g. .references, figures)
 * @param {HTMLCollection} elements: target element listed in panel area
 *  (e.g. ".reference")
 * @param {String} referenceSelector: css selector of referencing anchors in text area
 *  (e.g. ".bib-ref")
 * @returns {JSON} referenceIndex with totalNumber, refLinks and quotes
 */
function getReferenceIndex(elements, referenceSelector) {

    let referenceIndex = {};
    
    elements.forEach(function(element) {
        // exclude elements with missing ids and poster-image
        if(element.id !== null && element.id !== "poster-image") {
            let refLinks = [];
            let quotes = [];

            // define selector for reference anchor for given type, e.g. fig-ref:
            let refSelector = "a." + referenceSelector + "[href='#" + element.id + "']";
            
            // query referenceElements:
            let referenceElements = document.querySelectorAll(refSelector);

            // filter out elements in text-quote-span (containing copies of the original elements):
            referenceElements = Array.from(referenceElements)
                .filter(el => !el.parentElement.classList.contains("text-quote"))

            // process referenceElements:
            if(referenceElements.length) {
                // get links and quotes from closest parent:
                referenceElements.forEach(refElement => {
                    let closestParentIds = [];
                    let closestParentElement = refElement.closest("*[id]");
                    if(closestParentElement !== null) {
                        closestParentIds.push(closestParentElement.id);
                    }
                    refLinks.push(closestParentIds);
                    quotes.push(refElement.parentElement);
                });
            }
            // collect all values as reference stats:
            let referenceStats = {
                "totalNumber": referenceElements.length,
                "refLinks": refLinks,
                "quotes": quotes,
            };
            // add reference stats of each element:
            referenceIndex[element.id] = referenceStats;
        }
    });
    return(referenceIndex);
}

/**
 * create table of Contents (ToC) by headlines
 * @param {HTMLElement} htmlWrapper: entire html-document converted from xml
 * @returns {HTMLElement} tocList: <ul> with tocListItems (li) and anchors
 */
function createToCByHeadlines(htmlWrapper) {

    let lang = document.documentElement.lang;
    let nav = document.createElement("nav");
    nav.ariaLabel = defaultTitles["contents"][lang];
    let tocList = document.createElement("ul");
    tocList.id = "toc-list";

    let headlines = htmlWrapper.querySelectorAll(".title");
    if (headlines !== null && headlines.length > 0) {
        for (let i = 0; i < headlines.length; ++i) {
            // get level in hierarchy:
            let level = headlines[i].getAttribute("level");
            let levelClass = "level-" + level; 

            // create tocList items and anchors:
            let tocListItem = document.createElement("li");
            tocListItem.classList.add("heading-ref", levelClass);
            let tocEntry = document.createElement("a");
            tocEntry.classList.add("heading-ref-a");
            tocEntry.ariaCurrent = "false";

            // define ids and inline hrefs:
            let titleId = "title-" + i;
            let tocId = "toc-" + i;
            headlines[i].id = titleId;
            tocEntry.id = tocId;
            headlines[i].setAttribute("href", "#" + tocId);
            tocEntry.setAttribute("href", "#" + titleId);
            
            // append content and children
            tocEntry.innerHTML = headlines[i].innerHTML;
            tocListItem.appendChild(tocEntry);
            tocList.appendChild(tocListItem);    
        }
        // add tocList to generic nav element:
        nav.appendChild(tocList);
    }
    return(nav);
}

/**
 * create panelNavigation (nav) for given panel-names
 * @param {Array} navigationPanelsDocument: given panel-names
 * @returns {void} panelNavigation will appended to mainHeader
 */

function createPanelNavigation(navigationPanelsDocument) {

    // create panelNavigation and panelNavigationList
    let panelNavigation = document.createElement("nav");
    panelNavigation.classList.add("panel-navigation");
    let panelNavigationList = document.createElement("ul");

    // create elements for each panel name:
    if(navigationPanelsDocument.length > 0) {
        navigationPanelsDocument.forEach((panelName) => { 
            // list elements:
            let li = document.createElement("li");
            li.classList.add("nav-" + panelName);

            // buttons:
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("panel-buttons");
            button.id = "b-" + panelName;
            button.innerHTML = navIcons[panelName];
            button.ariaLabel = "Show " +  panelName;
            button.setAttribute("onclick", "showSelectedPanel('" + panelName + "')");

            // append elements:
            li.appendChild(button);
            panelNavigationList.appendChild(li);
        });
    }
    // append panelNavigation to navHeader
    panelNavigation.appendChild(panelNavigationList);
    mainHeader.appendChild(panelNavigation);
}

/**
 * reorder elements within <figure>-container, e.g. altText, label and attribution
 * @param {HTMLElement} figureSection: div with figures
 * @returns {HTMLElement} figureSection with reordered figure elements
 */

function reorderFigureElements(figureSection) {

    let figures = figureSection.querySelectorAll("figure");
    if(figures.length) {
        let figureList = document.createElement("ol");
        figureList.classList.add("figure-list");
        figures.forEach(figure => {
            let label = figure.querySelector(".label");
            let figCaption = figure.querySelector("figcaption");
            let attribution = figure.querySelector(".attribution");
            let license = figure.querySelector(".license");
            let licensePara = figure.querySelector(".license-p");
            let img = figure.querySelector("img");
            
            if(figCaption !== null) {
                if(img !== null && figCaption.querySelector("p[id]") !== null) {
                    /* use figCaption due to the absence of dedicated alternative texts,
                    that are helpfully describing the image (=> "Barrierefreiheit") */
                    let altText = figCaption.querySelector("p[id]").textContent;
                    img.alt = altText;
                }
                if(label !== null) {
                    figCaption.insertAdjacentElement("afterbegin", label);
                }
                if(attribution !== null) {
                    figCaption.insertAdjacentElement("beforeend", attribution);
                } 
                if(licensePara !== null) {
                    figCaption.insertAdjacentElement("beforeend", licensePara);
                    license.remove();
                }  
            }
            // use list elements to structure figure listing:
            let figListElement = document.createElement("li");
            figListElement.classList.add("figure-list-element");
            figListElement.appendChild(figure);
            figureList.appendChild(figListElement);
        });
        figureSection.appendChild(figureList)
    }
    return(figureSection);
}

/** ---------------------------------
* supplementary data related function
--------------------------------------*/
/**
 * append fetch-state-bar to panel
 * @param {HTMLElement} panel div with panel title and content
 * @param {String} dataSourceId name of dataSource, e.g. "arachne",
 * used as id-part for each fetchStateBar (div)
 * @returns {void} fetchStateBar will appended to panel
 */

function appendFetchStateBarToPanel(panel, dataSourceId) {
    let fetchStateBar = document.createElement("div");
    fetchStateBar.id = "fetch-state-" + dataSourceId;
    fetchStateBar.classList.add("warning-box", "fetch-state");
    panel.appendChild(fetchStateBar); 
}

/**
 * extract supplement links (inlcuding location data)
 * @param {NodeList} anchors specified as supplement links
 * @returns {array} supplementsLinks: array enriched with urlProperties
 */
function extractSupplementsLinks(anchors) {

    let selfHost= window.location.host;
    let supplementsLinks = [];
    let uniques = [];
        
    // parse anchors:
    let targetPrefix; 
    for (let i = 0; i < anchors.length; ++i) {
        // exclude empty and internal links
        if(anchors[i].href !== "" && anchors[i].host !== selfHost) {
            
            // define id of referencing anchor
            let refAnchorId = "data-ref-" + i + 1;
            anchors[i].id = refAnchorId;

            // parse url:
            let url = new URL(anchors[i].href);
            let apiRefUrl = getApiRefUrl(url);
            
            if(apiRefUrl.apiUrl) {

                // define target-prefix by apiSource: 
                if(/gazetteer/.test(apiRefUrl.apiSource)) {
                    targetPrefix = "gazetteer";
                }
                if(/arachne/.test(apiRefUrl.apiSource)) {
                    targetPrefix = "arachne";
                }
                if(/field/.test(apiRefUrl.apiSource)) {
                    targetPrefix = "field";
                }

                // find duplicates:
                let isUnique;
                if(!uniques.includes(apiRefUrl.apiUrl)) {
                    isUnique = true;
                    uniques.push(apiRefUrl.apiUrl);
                } else {
                    isUnique = false;
                }

                // define url properties:
                let urlProperties = {
                    'url': url,
                    'apiUrl': apiRefUrl.apiUrl,
                    'apiSource': apiRefUrl.apiSource,
                    'refAnchorId': refAnchorId,
                    "refText": anchors[i].textContent,
                    "targetPrefix": targetPrefix,
                    "isUnique": isUnique,
                    "anchor": anchors[i]
                };
                supplementsLinks.push(urlProperties);
            }
            
            // set #target-prefix-id as href-attribute to anchor: 
            //anchors[i].href = "#target-" + targetPrefix + "-" + refAnchorId;
        }
    }
    return(supplementsLinks);
}

/**
 * count supplement links (for document index)
 * @param {array} supplementsLinks: array enriched with urlProperties
 * @returns {array} numSupplements: array with amount of links, sorted
 * by source system (e.g. gazetter, arachne)
 */
function countSupplementLinks(supplementsLinks) {

    // init object:
    let numSupplements = {
        "arachne": 0,
        "gazetteer": 0,
        "field": 0,
    }
    // count each supplement link:
    supplementsLinks.forEach(supplementLink => {
        if(/gazetteer/.test(supplementLink.apiSource)) {
            numSupplements["gazetteer"] = numSupplements["gazetteer"] + 1;
        }
        if(/arachne/.test(supplementLink.apiSource)) {
            numSupplements["arachne"] = numSupplements["arachne"] + 1;
        }
        if(/field/.test(supplementLink.apiSource)) {
            numSupplements["field"] = numSupplements["field"] + 1;
        }
    });

    return(numSupplements);
}

/**
 * filter supplement links (to handle multiple references to one object)
 * @param {array} supplementsLinks: array enriched with urlProperties
 * @returns {array} supplementsLinks: filtered by isUnique and adapted
 * href of non-unique anchors pointing to "externalObjectElement" as target
 */
function filterSupplementLinks(supplementLinks) {

    // iterate through supplementLinks:
    supplementLinks.forEach(supplementLink => {     
        let anchor = supplementLink["anchor"];
        let refAnchorId = supplementLink["refAnchorId"];
        let targetPrefix = supplementLink["targetPrefix"];
        let isUnique = supplementLink["isUnique"]; 
        if(!isUnique) {
            let apiUrl = supplementLink["apiUrl"];
            // find proxy anchor-id as #target:
            for (const [key, value] of Object.entries(supplementLinks)) {
                if (value.isUnique == true && value.apiUrl === apiUrl) {
                    refAnchorId = value.refAnchorId;
                }
            };
        };
        // set #target as href-attribute to anchor:
        anchor.href = "#target-" + targetPrefix + "-" + refAnchorId;
    });

    // exclude duplicates:
    let supplementLinksFiltered = supplementLinks
        .filter(supplementLink => supplementLink.isUnique == true);
    return(supplementLinksFiltered);
}

/**
 * get url of supplement link referencing to data api
 * @param {object} url-interface object from given anchor-href
 * @returns {json} apiRefUrl: json with url properties
 */
function getApiRefUrl(url) {

    let apiRefUrl = {};
    if(url.protocol !== "https") {url.protocol = "https";}

    let objectId;
    switch (true) {
        case (/arachne.dainst.org/.test(url.hostname)):
            apiRefUrl.apiUrl = url.origin + "/data" + url.pathname;
            apiRefUrl.apiSource = "arachne";
            break;
        case (/gazetteer.dainst.org/.test(url.hostname)):
            objectId = url.pathname.split("/")[2];
            if(objectId !== undefined) {
                apiRefUrl.apiUrl = "https://gazetteer.dainst.org/doc/" + objectId; https://gazetteer.dainst.org/doc/search?limit=1types:"archaeological-site"
                apiRefUrl.apiSource = "gazetteer";
            }
            break;
        case (/field.idai.world/.test(url.hostname)):
            objectId = url.pathname.split("/")[3];;
            if(objectId !== undefined) {
                apiRefUrl.apiUrl = "https://field.idai.world/api/documents/" + objectId;
                apiRefUrl.apiSource = "field";
            }
            break;
        default:
            apiRefUrl.apiUrl = false;
            apiRefUrl.apiSource = false;
            break;
    }
    return(apiRefUrl);
}

/**
 * (async) fetch external (supplement) data
 * @param {array} supplementsLinks: array enriched with urlProperties
 * @returns {void} stores the fetched results in supplementLinks and 
 * handles it over to renderExternalData()
 */
async function fetchExternalData(supplementsLinks) {

    let handleError = function() {
        return new Response(JSON.stringify({
            code: 400,
            message: "fetch-error"
        }));
    };

    // fetch external data:
    for (let i = 0; i < supplementsLinks.length; ++i) {
        let apiRefUrl = supplementsLinks[i]["apiUrl"];
        let response = await fetch(apiRefUrl, {
            headers:{
                accept: 'application/json'
            }
        }).catch(handleError);

        let result;
        if(response.status === 200) {
            result = await response.json();
            // check results:
            if(result["code"] === 400 || result["code"] === 300) {
                supplementsLinks[i]["result"] = false;
            }
            else {
                supplementsLinks[i]["result"] = result;
            }
            // display fetch progress state in fetch-state-bar:
            let querySelector = "#fetch-state-" + supplementsLinks[i]["apiSource"];
            let fetchState = "Fetching data from: " + apiRefUrl;
            document.querySelector(querySelector).innerText = fetchState;
        }
        else {supplementsLinks[i]["result"] = false;}
    }

    // render external data:
    renderExternalData(supplementsLinks);
}

/**
 * render fetched results of external (supplement) data
 * @param {array} supplementsLinks: array enriched with urlProperties and 
 * fetched results
 * @returns {void} the results are handled over to function for parsing
 * and display
 */
function renderExternalData(supplementsLinks) {

    let result;
    let values = {};

    // process each supplement link:
    for (let i = 0; i < supplementsLinks.length; ++i) {
        values["refText"] = supplementsLinks[i]["refText"].trim();
        values["refAnchorId"] = supplementsLinks[i]["refAnchorId"];
        values["apiUrl"] = supplementsLinks[i]["apiUrl"];
        values["url"] = supplementsLinks[i]["url"];
 
        // check result:
        result = supplementsLinks[i]["result"];
        values["hasResult"] = (result) ? true : false;

        // parse results:
        switch (true) {
            case (/gazetteer/.test(supplementsLinks[i]["apiSource"])):
                values["parsed"] = parseGazetteerData(result);
                displayGazetteerData(values);
                break;
            case (/arachne/.test(supplementsLinks[i]["apiSource"])):
                values["parsed"] = parseArachneData(result);
                displayArachneData(values);
                break;
            case (/field/.test(supplementsLinks[i]["apiSource"])):
                values["parsed"] = parseFieldData(result);
                displayFieldData(values);
                break;
        }
    }
}

/**
 * parse data from iDAI.gazetteer (location data)
 * @param {array} data: results fetched from apiSource
 * @returns {json} json storing the parsed result (e.g. prefName,
 * location data)
 */
function parseGazetteerData(data) {

    return {
        "provenance": (data.provenance !== undefined) ? data.provenance: false,
        "location": (data.prefLocation !== undefined) ? data.prefLocation: false,
        "prefName": (data.prefName !== undefined) ? data.prefName: false,
        "gazId":  (data.gazId !== undefined) ? data.gazId: false,
        "url": (data["@id"] !== undefined) ? data["@id"] : false
    };
}

/**
 * parse supplementary data from iDAI.objects (arachne)
 * @param {array} data: results fetched from apiSource
 * @returns {json} json storing the parsed result (e.g. title,
 * images)
 */
function parseArachneData(data) {

    return {
        "type": (data.type !== undefined) ? data.type : false,
        "title": (data.title !== undefined) ? data.title : false,
        "subtitle": (data.subtitle !== undefined) ? data.subtitle : false,
        "images": ( data.images !== undefined) ? data.images : false,
        "url": (data["@id"] !== undefined) ? data["@id"] : false
    };
}

/**
 * parse supplementary data from iDAI.field
 * @param {array} data: results fetched from apiSource
 * @returns {json} json storing the parsed result (e.g. description,
 * imageSource)
 */
function parseFieldData(data) {

    // parse descriptionObject (has language key)
    let shortDescription = (data.resource.shortDescription !== undefined) ? data.resource.shortDescription : false;
    if(shortDescription[Object.keys(shortDescription)[0]] !== undefined) {
        shortDescription = shortDescription[Object.keys(shortDescription)[0]];
    }
    let group = data.resource.groups.find(group => group.fields.map(field => field.name).includes('isDepictedIn'));
    let targets = group ? group.fields.find(field => field.name === 'isDepictedIn').targets : false;

    let imageSource = false;
    if(targets) {
        // extract first image of resource
        let categoryName = targets[0].resource.category.name;
        if(categoryName == "Photo" || categoryName == "Drawing") {
            let primaryImageId = targets[0].resource.id;
            let imageApiUrl = "https://field.idai.world/api/images/" + data.project + "/" + primaryImageId + ".jp2";
            let imageSpecs = "/x/full/!500,500/0/default.jpg"; // watch out: https://iiif.io/api/image/2.0/
            imageSource = imageApiUrl + imageSpecs;
        }
    }

    return {
        "project": data.project,
        "shortDescription": shortDescription,
        "imageSource": imageSource
    };
}

/**
 * display of parsed location data from iDAI.gazetteer
 * @param {array} values: parsed (gazetteer) data
 * @returns {void} elements containing data are added
 * to the document as externalObject (html elements)
 */
function displayGazetteerData(values) {

    let externalObject = createExternalObjectElement("gazetteer");
    let objectName = externalObject.querySelector(".object-name");
    let objectData = externalObject.querySelector(".object-data");
    let objectVisualization = externalObject.querySelector(".object-visualization");
    let dataSourceLink = externalObject.querySelector(".data-source-link"); 

    // enrich elements with parsed data values:
    if(values["hasResult"]) {
        let data = values["parsed"];

        if(values.refText) {
            objectName.innerText = values.refText;
        }
        if(data.prefName.title !== undefined) {
            objectData.innerText = data.prefName.title;
        }
        if(data.url) {
            dataSourceLink.innerText = data.url;
            dataSourceLink.href = data.url;
        }
        if(values["refAnchorId"]) {
            objectVisualization.id = "target-gazetteer-" + values["refAnchorId"];
        }

        // create map:
        let map = document.createElement("div");
        map.id = "map-" + values["refAnchorId"];
        map.classList.add("map");

        // create coordinates element:
        let coordinates = document.createElement("p");
        coordinates.classList.add("coordinates");

        // assign coordinates:
        if(values["parsed"].location) {
            if(values["parsed"].location.coordinates) {
                coords = values["parsed"].location.coordinates;
                map.setAttribute("longitude" , coords[0]);
                map.setAttribute("latitude" , coords[1]);
                coordinates.textContent = "Long: " + coords[0] + ", Lat: " + coords[1];
                objectVisualization.appendChild(map);
                objectVisualization.appendChild(coordinates);
            }
            else {
                console.warn("Notice for editors: " + 
                "place has shape-coordinates only", values["parsed"])
            }
        }
    }
    else {
        objectName.classList.add("warning-text");
        objectData.classList.add("warning-box");
        objectName.innerText = "'" + values.refText + "' could not be fetched!";
        objectData.innerText = "Checkout url of xlink:href: " + values["apiUrl"];
    }

    // append elements to #gazetteer-list
    document.querySelector('#gazetteer-list').appendChild(externalObject);
}

/**
 * display of parsed supplementary data from iDAI.objects (arachne)
 * @param {array} values: parsed (arachne) data
 * @returns {void} elements containing data are added
 * to the document as externalObject (html elements)
 */
function displayArachneData(values) {

    let externalObject = createExternalObjectElement("arachne");
    let objectName = externalObject.querySelector(".object-name");
    let objectData = externalObject.querySelector(".object-data");
    let objectVisualization = externalObject.querySelector(".object-visualization");
    let dataSourceLink = externalObject.querySelector(".data-source-link");

    if(values["hasResult"]) {
        let data = values["parsed"];
        if(values.refText) {
            objectName.innerText = values.refText;
        }
        if(data.title) {
            objectData.innerText = data.title;
            if(data.subtitle) {
                objectData.innerText += ", " + data.subtitle;
            }
            if(data.type) {
                objectData.innerText += ", [" + data.type + "]";
            }
        }
        if(data.url) {
            dataSourceLink.innerText = data.url;
            dataSourceLink.href = data.url;
        }

        if(values["refAnchorId"]) {
            objectVisualization.id = "target-arachne-" + values["refAnchorId"];
        }
        // create object-image
        if (data.images && data.images.length) {
            let url = "https://arachne.dainst.org/data/image/" + data.images[0].imageId;
            createExternalObjectImage(url, objectVisualization, "arachne");
        }
        // link to arachne for displaying 3D models:
        else if(data.type === "3D-Modelle") {
            objectVisualization.innerText = "[Follow the link to arachne.dainst.org to view the 3D-model]";
        }
        // no visualizations available
        else {
            objectVisualization.innerText = "[No images available]";
        }
    }
    else {
        objectName.classList.add("warning-text", "warning-box");
        objectName.innerText = "'" + values.refText + "' could not be fetched!";
        objectData.innerText = "Checkout url of xlink:href: " + values["apiUrl"];
    }

    // append elements to #arachne-list:
    document.querySelector('#arachne-list').append(externalObject);
}

/**
 * display of parsed supplementary data from iDAI.field
 * @param {array} values: parsed (field) data
 * @returns {void} elements containing data are added
 * to the document as externalObject (html elements)
 */
function displayFieldData(values) {

    let externalObject = createExternalObjectElement("field");
    let objectName = externalObject.querySelector(".object-name");
    let objectData = externalObject.querySelector(".object-data");
    let objectVisualization = externalObject.querySelector(".object-visualization");
    let dataSourceLink = externalObject.querySelector(".data-source-link");

    if(values["hasResult"]) {
        let data = values["parsed"];
        if(values.refText) {
            objectName.innerText = values.refText;
        }
        if(data.shortDescription) {
            objectData.innerText = data.shortDescription;
        }
        if(values["url"]) {
            dataSourceLink.innerText = values["url"];
            dataSourceLink.href = values["url"];
        }
        if(values["refAnchorId"]) {
            objectVisualization.id = "target-field-" + values["refAnchorId"];
        }
        // create object-image
        let url;
        if (data.imageSource) {
            url = data.imageSource;
            createExternalObjectImage(url, objectVisualization, "field");
        }
        else {
            objectVisualization.innerText = "[No images available]";
        }
    }
    else {
        objectName.classList.add("warning-text");
        objectData.classList.add("warning-box");
        objectName.innerText = "'" + values.refText + "' could not be fetched!";
        objectData.innerText = "Checkout url of xlink:href: " + values["apiUrl"];
    }

    // append elements to #objects:
    document.querySelector('#field-list').append(externalObject);
}

/**
 * create elements for external data (supplements)
 * @param {String} source: short name of the source system, 
 * e.g. field, arachne, used as className for each externalObject
 * @returns {HTMLElement} externalObject, <details>-element with
 * multiple childs (e.g. object-visualization)
 */
function createExternalObjectElement(source) {

    // details-element for html-native open/close option
    let externalObject = document.createElement("li");
    externalObject.classList.add("external-object");
    externalObject.classList.add(source);

    // details-element for html-native open/close option
    let objectDetails = document.createElement("details");
    objectDetails.classList.add("object-details");

    // summary to display the (data) object name
    let objectName = document.createElement("summary");
    objectName.classList.add("object-name");

    // wrapper div to add specific object data
    let objectData = document.createElement("div");
    objectData.classList.add("object-data");
    
    // wrapper div to add images and other other visualizations
    let objectVisualization = document.createElement("div");
    objectVisualization.classList.add("object-visualization");
    
    // wrapper div to add data source url
    let dataSourceInfo = document.createElement("div");
    dataSourceInfo.classList.add("data-source-info");
    let sourceLink = document.createElement("a");
    sourceLink.classList.add("data-source-link");
    sourceLink.target = "_blank";
    sourceLink.ariaLabel = source + " entry (opens in new tab)";
    dataSourceInfo.appendChild(sourceLink);

    // add screenReader notice for better accessability:
    let screenReaderSpan = document.createElement("span");
    screenReaderSpan.classList.add("screenreader-only");
    screenReaderSpan.textContent = "(opens in new tab)";
    dataSourceInfo.appendChild(screenReaderSpan);

    // add all childs
    objectDetails.appendChild(objectName);
    objectDetails.appendChild(objectData);
    objectDetails.appendChild(dataSourceInfo);
    objectDetails.appendChild(objectVisualization);
    externalObject.appendChild(objectDetails)

    // hide fetchStateBar:
    document.querySelector("#fetch-state-" + source).style.display = "none";

    return(externalObject);
}

/**
 * async: read external image data and create img-element
 * @param {String} url: image url of the source system
 * @param {HTMLElement} objectVisualization: div as child of
 * externalObjectElement
 * @returns {void} reads image data as dataUrl (base64-format) 
 * and appends it to the objectVisualization container
 */
async function createExternalObjectImage(url, objectVisualization, fetchBar) {

    let objectImage = document.createElement("img");
    objectImage.classList.add("object-image");
    objectImage.loading = "lazy";
    objectImage.setAttribute("onerror", 
        "this.onerror=null;this.parentElement.innerText='[Could not load image!]'");
    
    let base64data;
    fetch(url, {method: 'GET'})
    .then((response) => response.blob())
    .then((blob) => {
        let reader = new FileReader();
        reader.readAsDataURL(blob); 
        reader.onloadstart = function() {
            let fetchState = "[...Fetching data from: " + url + "]...";
            objectVisualization.innerText = fetchState;
        }
        reader.onloadend = function() {
            base64data = reader.result;                
            objectImage.src = base64data;
            objectImage.onload = function () {
                scaleImage(objectImage);
            };
            objectVisualization.innerText = "";
            objectVisualization.appendChild(objectImage);
        }
    });
}

/** -----------------------------------------
*  ui and web-accessability related functions
--------------------------------------------*/

/**
 * add title of resources (references) as tool-tip of bib-refs
 * @param {NodeList} bibRefs: anchor, short reference
 * @returns {void} bibliographic titles will added directly
 */
function titleOfResourcesAsToolTip(bibRefs) {
  
    bibRefs.forEach(function(bibRef) {
        let refTarget; // href to bibliographic reference (id)
        let target; // bibliographic reference (element)

        if(bibRef.href !== null && bibRef.href) {
            refTarget = bibRef.getAttribute("href");
            // exclude ids with whitespace separator:
            if(!refTarget.includes(' ')) {
                target = document.querySelector(refTarget);
                let bibTitle; // bib reference as full citation
                if(target !== null) {
                    bibTitle = target.querySelector("p");
                    // trim valid bibTitles
                    if(bibTitle !== null && bibTitle.textContent) {
                        bibTitle = bibTitle.textContent.trim();
                        bibTitle = bibTitle.replace(/[\n\r]+|[\s]{2,}/g, ' ');
                        bibTitle = "Jump to: " + bibTitle;
                    } else ( bibTitle = "Jump to: No title found");
                    // add bibTitle as tooltip (title-attribute)
                    bibRef.title = bibTitle;
                }
            }
            else {console.warn("'" + refTarget + "' is not a valid selector");}
        }
    });
}

/**
 * add anchor linking between fn-label and footnote-link in main text
 * @param {HTMLCollection} footnote: footnote-element from footnote-section
 * @returns {void} nToTextAnchor will appended to fn-label
 */

function addBackLinkAnchorToFootnote(footnote) {

    if(footnote.id !== undefined) {
        let label = footnote.querySelector(".label");
        label.id = footnote.id + "-label";
        footnote.setAttribute("aria-labelledby", label.id);

        let hrefSelector = "[href='#" + footnote.id + "']"; 
        let textToFnAnchor = document.querySelector(".fn-ref" + hrefSelector);

        if(textToFnAnchor !== null) {
            let backAnchor = document.createElement("a");
            backAnchor.classList.add("index-ref");
            backAnchor.href = "#ref-" + footnote.id;

            let visibleSpan = document.createElement("span");
            visibleSpan.title = "Jump back to former position";
            visibleSpan.ariaHidden = true;
            visibleSpan.innerHTML = "<i>&#9741;</i>";
            backAnchor.appendChild(visibleSpan);
            
            footnote.insertAdjacentElement("afterbegin", backAnchor);
        }
    }
}

/**
 * add title-attribute to elements as accessability helper:
 * @returns {void} title attributes are appended to elements in DOM
 */
 function addTitleAttributesAsAccessablityHelper() {

    // paragraph counters:
    let paraCounters = document.querySelectorAll(".paragraph-counter");
    if(paraCounters.length > 0) {
        paraCounters.forEach(element => {
            element.title = "Paragraph " + element.textContent;
        });
    }

    // fn-refs
    let fnRefs = document.querySelectorAll(".fn-ref");
    if(fnRefs.length > 0) {
        fnRefs.forEach(element => {
            titleAttr = element.textContent;
            element.title = "Jump to Footnote: " + titleAttr;
        });
    }
    // fig-refs
    let figRefs = document.querySelectorAll(".fig-ref");
    if(figRefs.length > 0) {
        figRefs.forEach(element => {
            titleAttr = element.textContent;
            element.title = "Jump to Figure: " + titleAttr;
        });
    }
 }


function scaleImage(img) {

    let natWidth = img.naturalWidth;
    let natHeight = img.naturalHeight;
    let targetHeight = document.documentElement.clientHeight * 0.9;
    let targetWidth = document.documentElement.clientWidth * 0.5;

    if(natHeight > targetHeight) {
        img.style = "max-width:max-content;max-height:" + targetHeight + "px;";
    }
    else if(natWidth < targetWidth) {
        img.style = "max-height:max-content;max-width:" + natWidth + "px;";
    }
}







