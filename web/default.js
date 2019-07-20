'use strict';


// Namespace.
var ntp = ntp ||
    {
        ignoreWheel: false,
        parentId: "1",
        id: "1",
        pinned: 0,
        settingsLoaded: false,
        folder: '#folderA',
        hidePinned: true,
        savePosition: false,
        cfgAnimate: true
    };


// Transform a bookmark node into html element.
ntp.bookToElement = function (book) {

    var element = document.createElement("a");
    var label = document.createElement("span");
    var title;

    element.classList += "book";
    title = book.title;
    element.id = book.id;
    element.setAttribute('title', book.title);

    // Process folder.
    if (book.hasOwnProperty("children")) {

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');

        use.setAttribute("href", ntp.folder);
        svg.appendChild(use);
        element.appendChild(svg);
        element.classList.add('folder');

        element.addEventListener("click", (event) => ntp.parseBooks(event, undefined, undefined, false));

        // Context menu for folders.
        element.oncontextmenu = function (ev) {

            // Close any context menus.
            document.body.querySelectorAll('.cmenu').forEach((cmenu) => cmenu.style.display = 'none');

            var cmenu = document.getElementById("fldrMenu");
            cmenu.style.display = "block";

            cmenu.style.top = this.getBoundingClientRect().top + this.offsetHeight / 2 + 'px';
            cmenu.style.left = this.getBoundingClientRect().left + this.offsetWidth / 2 + 'px';

            var id = this.id;

            cmenu.children[0].addEventListener("click", function () {
                chrome.storage.sync.set({ "pinned": id }, null);

                cmenu.style.display = "none";
                ntp.parseBooks(undefined, true, id);
            });

            return false;
        };
    }
    // Bookmark - not folder.
    else {
        var img = document.createElement("img");
        img.src = "chrome://favicon/size/48/" + book.url;
        element.href = book.url;
        element.appendChild(img);
    }

    label.appendChild(document.createTextNode(title));
    
    element.appendChild(label);
    element.setAttribute("draggable", "true");
    element.addEventListener("dragstart", ntp.dragStart);
    element.addEventListener("dragover", () => { event.preventDefault();});
    element.addEventListener("drop", ntp.dragStop);

    return element;
};


// Get bookmarks from chrome api.
// pinned, boolean.
// id, id of folder to parse.
// up, direction for animation class.
ntp.parseBooks = function (e, pinned, id, up, search) {

    id = e ? e.currentTarget.id : id ? id : "1";

    if (pinned !== true && !search)
    {
        if (ntp.savePosition === true) chrome.storage.sync.set({ folderId: id }, null);
    }


    // Get bookmark tree via id, or from root.
    if (!search) chrome.bookmarks.getSubTree(id, (root) => { parseTree(id, root); });

    if (search) chrome.bookmarks.search(search, (root) => { parseTree(id, root); });

    function parseTree(id, root) {

        // Parent to output books into.
        var output = document.getElementById(pinned ? "pinned" : "bookBrowser");

        empty(output);

        // Search found nothing tip.
        if (root.length === 0) {

            showTip(output, "No results found");
            return;
        }

        var books = search? root : root[0].children;

        ntp.parentId = search ? '1' : root[0].parentId;

        ntp.id = root[0].id;

        if (!pinned) {

            // Both must be removed to reapply animation.
            output.classList.remove("down");
            output.classList.remove("up");

            void output.offsetWidth;

            if (ntp.cfgAnimate) output.classList.add(up ? "up" : "down"); 

            // Empty folder tip.
            if (books.length === 0) showTip(output, "Empty folder");
        }

        // Append each book to output div.
        for (var i = 0; i < books.length; i++) {
            if (books[i].id !== ntp.pinned | !ntp.hidePinned) {
                // Convert the book first.
                output.appendChild(ntp.bookToElement(books[i]));
            }
        }
    }

    // Empty a div.
    function empty(div) {
        while (div.children.length > 0) {
            div.children[0].remove();
        }
    }

    // Display a tip.
    function showTip(div, text) {
        div.classList.remove("up");
        div.classList.remove("down");
        div.classList.remove("fade");
        void div.offsetWidth;
        div.classList.add("fade");

        var info = document.createElement("div");
        info.classList.add("info");
        info.innerText = text;
        div.appendChild(info);
    }
};




// Move up heirarchy - triggered by mouse wheel.
ntp.upHierarchy = function (e) {

    ntp.layout = ntp.layout ? ntp.layout : document.getElementById('layout');

    resetIgnore(250);

    if (ntp.ignoreWheel === false) {

        ntp.ignoreWheel = true;
        ntp.overflowScroll = ntp.layout.scrollTop > 0 ? true : false;

        if (ntp.id !== ntp.parentId & ntp.parentId > 0 & e.wheelDelta > 0 & ntp.layout.scrollTop === 0) {
            ntp.parseBooks(undefined, false, ntp.parentId, true);
            document.getElementById('bookFilter').value = '';
            document.getElementById('clearBookFilter').style.display = "none";
        }
    }

    function resetIgnore(time) {

        if (ntp.ignoreWheel === false | ntp.overflowScroll === true) {

            if (ntp.timeout) clearTimeout(ntp.timeout);

            // Scrolled once, ignore further scrolls for 1 second.
            ntp.timeout = setTimeout(() => {
                ntp.ignoreWheel = false;
                ntp.overflowScroll = false;
            }, time);
        }
    }

};



ntp.dragStart = function () {
    //console.log('dragstart');
};



ntp.dragStop = function () {
    //console.log('dragstop');
};


ntp.ctxMenu = function (e, menuId) {

    // Close any context menus.
    document.body.querySelectorAll('.cmenu').forEach((cmenu) => cmenu.style.display = 'none');

    var cmenu = document.getElementById(menuId);

    cmenu.style.top = e.clientY + 'px';
    cmenu.style.left = e.clientX + 'px';

    cmenu.style.display = "block";
};


// Main initialization function - entry point.
ntp.initialize = function () {


    var links = document.getElementById('shortcuts');

    // Links.
    links.querySelector('#downloads-link').addEventListener('click', () => {
        chrome.tabs.create({url: 'chrome://downloads'});
    });
    links.querySelector('#history-link').addEventListener('click', () => {
        chrome.tabs.create({url: 'chrome://history'});
    });
    links.querySelector('#bookmarks-link').addEventListener('click', () => {
        chrome.tabs.create({url: 'chrome://bookmarks'});
    });
    links.querySelector('#incognito-link').addEventListener('click', () => {
        chrome.windows.create({incognito: true, state: "maximized"});
    });

    // Settings link.
    document.getElementById('cfgMenu').children[0].addEventListener('click', () => {

        if (ntp.settingsLoaded === false) {
            ntp.openSubPage('settings.html', 'popout', () => {

                ntp.loadSettings();
                document.getElementById("popout").classList.toggle("out");
            }
            );
        }
        else {
            document.getElementById("popout").classList.toggle("out");
        }
    });

    ntp.parseSettings(true); // Parse any setting values.

    document.getElementById("bookBrowser").addEventListener("wheel", ntp.upHierarchy, false);

    ntp.openSubPage("img/icons.svg", "icons");

    // Close settings click handler.
    document.body.addEventListener('click', () => {

        // Close any context menus.
        document.body.querySelectorAll('.cmenu').forEach((cmenu) => cmenu.style.display = 'none');

        if (event.target.id === "layout" | event.target.parentElement.id === 'layout') document.getElementById('popout').classList.remove('out');
    }, false);

    var clearBtn = document.getElementById('clearBookFilter');
    var bookFilter = document.getElementById("bookFilter");

    // Listener for filter input.
    bookFilter.addEventListener('input', () => {

        event.currentTarget.style.width = 'unset';
        event.currentTarget.style.width = event.currentTarget.scrollWidth + 'px';

        if (event.currentTarget.value.length > 1) {
            ntp.parseBooks(undefined, false, undefined, undefined, event.currentTarget.value);
            ntp.parentId = '1';
        }
        else if (ntp.id !== '1') {
            ntp.parseBooks(undefined, false);
        }

        if (event.currentTarget.value.length > 0) clearBtn.style.display = 'unset';
        else { clearBtn.style.display = 'none';}
    });

    // Clear filter button.
    clearBtn.addEventListener('click', () => {
        bookFilter.value = '';
        ntp.parseBooks(undefined, false);
        clearBtn.style.display = 'none';
    });

    // General context menu.
    document.getElementById("layout").oncontextmenu = (e) => {
        if (e.target.id === 'layout' | e.target.parentElement.id === 'layout') {
            ntp.ctxMenu(event, "cfgMenu");
            return false;
        }
    };
};


// Apply settings - parse - boolean, optionally reload books.
ntp.parseSettings = function (reloadBooks) {

    //Get stored settings.
    chrome.storage.sync.get(null, (items) => {

        // Get pinned.
        ntp.pinned = items.pinned;

        // No pinned folder.
        if (ntp.pinned === "0" | !ntp.pinned) {
            document.getElementById("initialTip").style.display = "block";
        }
        else {
            if (reloadBooks) ntp.parseBooks(undefined, true, ntp.pinned);
        }


        var root = document.documentElement;

        //Requires initialization with defaults.
        if (!items.background) {
            ntp.openSubPage('settings.html', 'popout', () => { ntp.loadSettings(true); });
        }
        else {
            try {

                // Set whatever is required from the settings recieved.
                root.style.setProperty("--background", items.background);

                root.style.setProperty("--hover", ntp.hexToRGBA(items.hover, items.hoverAlpha));

                root.style.setProperty("--control", ntp.hexToRGBA(items.control, items.controlAlpha));

                root.style.setProperty("--foreground", ntp.hexToRGBA(items.foreground, items.foregroundAlpha));

                root.style.setProperty("--folder", ntp.hexToRGBA(items.folder, items.folderAlpha));


                root.style.setProperty("--viewWidth", items.viewWidth + 'vw');

                ntp.hidePinned = items.hidePinned === undefined ? false : items.hidePinned;

                ntp.savePosition = items.savePosition === undefined ? false : items.savePosition;

                document.title = items.cfgTitle;

                ntp.cfgAnimate = items.cfgAnimate === undefined ? false : items.cfgAnimate;
            }
            catch (e) { console.log(e); }
        }


        if (reloadBooks) {

            // Parse the initial book set, depending on savePosition.
            ntp.savePosition === true ? ntp.parseBooks(undefined, false, items.folderId) : ntp.parseBooks();
        }
    });

    // Get images - need to be stored locally.
    chrome.storage.local.get(null, (items) => {

        if (items.cfgBgImage) {
            document.documentElement.style.setProperty("--backgroundImage", "url('" + items.cfgBgImage + "')");
        }
        else {
            document.documentElement.style.setProperty("--backgroundImage", 'none');
        }

    });
};


//Convert Hex to RGBA
ntp.hexToRGBA = function (hex, a) {

    var rgba =
    {
        r: parseInt(hex.substring(1, 3), 16),
        g: parseInt(hex.substring(3, 5), 16),
        b: parseInt(hex.substring(5, 7), 16),
        a: a / 100
    };

    return 'rgba(' + rgba.r + ',' + rgba.g + ',' + rgba.b + ',' + rgba.a + ')';
};



// Load page within page.
ntp.openSubPage = function (page, targetId, callback) {

    var xmlReq = new XMLHttpRequest();

    xmlReq.onreadystatechange = function () {

        if (this.readyState === 4 && this.status === 200) {

            var xml = xmlReq.responseText;

            var target = document.getElementById(targetId);

            target.innerHTML = xml;

            xmlReq = undefined;

            if (callback) callback();
        }
    };

    xmlReq.open("GET", page, true);
    xmlReq.send();
};



document.addEventListener('DOMContentLoaded', ntp.initialize);