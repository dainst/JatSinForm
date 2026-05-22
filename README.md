# jatsinform-view

**jatsinform-view** is a light-weight js-application used for a browser-based pdf-production of scholarly articles, formatted in [(NISO)-JATS-XML](https://jats.nlm.nih.gov/) standard. 

The rendering in paged layouts (PDF) **jatsinform-view** is primarily based on [pagedJs](https://github.com/pagedjs/pagedjs), developed and maintained by [Coko Foundation](https://coko.foundation/). pagedJs displays paginated content in the browser and generate print books (and articles) using web technologies (JS and CSS Paged Media Module).

**jatsinform-view** converts each jats-xml, given as source document, to html and transforms it into the desired document model (e.g. with cover-page, abstract-sections, imprint). The figures, referenced in the source xml via figure references ("fig-ref") are typeset automatically by default-sets. **jatsinform-view** also offers several editing functions usable during the pagedJs-preview for customizing the layout of each image (scaling, switching typesetting classes, resizing) by keyboard-shortcuts.

Currently **jatsinform-view** is tailored (article-design, css-styles, typesetting classes, assets) to the highly standardized journals published by the German Archaeological Institute. But, it might be - at least partly - adaptable to other journal (or book) designs.

The JATS-XML documents (of the German Archaeological Institute) are created by independant tool chains (e.g. [TagToolWizard](https://github.com/pBxr/TagTool_WiZArd), InDesign/XSLT-workflows or jatsinform-edit (under development)).

## Prerequisites
- You need a browser (tested with Chrome and Firefox only)
- You need an IDE (e.g. Visual Studio Code) or other server-solutions to run the js-application scripts (cors-policy-friendly) locally in your web-browser.

## Getting Started
- **/xml-documents**: deposit xml-files and its related images in this folder (analogue to "example.xml")

- **index.html**: 
    - reference xml-file in meta-tag: 
        - `<meta name="--xml-file" content="example.xml">`
    - reference main.js in document head: 
        - `<script src="src/js/app.js" type="application/javascript"></script>` 
    - open/serve/preview index.html in your prefered browser 
        - using your IDE as local webserver 
        - installing "Live Preview"-Extension recommended

## Controls

### Application Keyboard Shortcuts

See configs/controlKeyList.json

```
{
  "application": {
    "showPagedView": 
      ["p", "show paged view"],
    "showHTMLView": 
      ["v", "show web view"],
    "showEditorView": 
      ["e", "show editor view, not implemented"],
    "setupFigConstellations": 
      ["ß", "create figConstellation.json"],
    "reload": 
      ["r", "reload page"],
    "hardReset": 
      ["q", "reload page (with style refresh)"],
    "highlightFigReferences": 
      ["f", "highlight all fig references"],
    "highlightContextInfo": 
      ["h", "highlight context information"],
    "displayOverflows": 
      ["o", "display overflows in paged view"],
    "downloadDocumentFiles": 
      ["d", "download document configs or HTML Document"],
    "setAllFigsToTiny": 
      ["a", "tiny", "set size class of all figures to tiny"],
    "setAllFigsToSmall": 
      ["s", "small", "set size class of all figures to small"],
    "setAllFigsToMedium": 
      ["m", "medium", "set size class of all figures to medium"],
    "setAllFigsToLarge": 
      ["l", "large", "set size class of all figures to large"]
  },
  "figure": {
    "toTop":
      ["t", false, "place figure on top of page"],
    "switchCaption":
      ["c", {
        "regular": "regular-bottom",
        "regular-bottom": "regular",
        "overmargin": "overmargin-bottom",
        "overmargin-bottom": "overmargin"
      }, "switch position of fig-caption"],
    "toOvermargin":
      ["1", "overmargin-bottom", "set figure class to overmargin"],
    "toRegular":
      ["2", "regular-bottom", "set figure class to regular"],
    "toInset":
      ["3", "inset", "set figure class to inset"],
    "toFloatWCol6":
      ["4", "float-w-col-6", "set figure class to float-w-col-6"],
    "toFloatWCol4":
      ["5", "float-w-col-4", "set figure class to float-w-col-4"],
    "toFloatWCol2":
      ["6", "float-w-col-2", "set figure class to float-w-col-2"]
  }
}
```











