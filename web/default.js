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
        savePosition: false
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

        element.addEventListener("click", ntp.parseBooks);

        // Context menu for folders.
        element.oncontextmenu = function (ev) {
            var cmenu = document.getElementById("cmenu");
            cmenu.style.display = "block";

            var win = document.body.getBoundingClientRect();

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
ntp.parseBooks = function (e, pinned, id, up) {

    id = e ? e.currentTarget.id : id ? id : "1";

    if (pinned !== true)
    {
        if (ntp.savePosition === true) chrome.storage.sync.set({ folderId: id }, null);
    }

    // Get bookmarks.
    chrome.bookmarks.getSubTree(id, (root) => {

        var books = root[0].children;

        ntp.parentId = root[0].parentId;
        ntp.id = root[0].id;

        var output; // Parent to output books into.

        if (pinned) {
            output = document.getElementById("pinned");

            while (output.children.length > 0) {
                output.children[0].remove();
            }
        }
        else {
            // Bookmark browsing div.
            var browser = document.getElementById("bookBrowser");

            if (browser.children.length > 0) {
                browser.children[0].remove();
            }

            output = document.createElement("div");
            browser.appendChild(output);

            output.classList += up ? "up" : "down  ";

            //Insert empty folder notification.
            if (books.length === 0) {

                var fake = ntp.bookToElement({ id: root[0].id, title: 'Empty', children: [null] });

                fake.classList.add("emptyFolder");

                // Create a fake node.
                output.appendChild(fake);
            }
        }

        // Append each book to output div.
        for (var i = 0; i < books.length; i++) {
            if (books[i].id !== ntp.pinned | !ntp.hidePinned) {
                // Convert the book first.
                output.appendChild(ntp.bookToElement(books[i]));
            }
        }
    });
};


// Move up heirarchy - triggered by mouse wheel.
ntp.upHierarchy = function (e) {

    // Clamp repeats.
    setTimeout(function () { ntp.ignoreWheel = false; }, 500);

    if (ntp.ignoreWheel === false & ntp.id !== ntp.parentId & e.wheelDelta > 0 & ntp.parentId > 0 & document.getElementsByTagName('html')[0].scrollTop === 0) {
        ntp.ignoreWheel = true;
        ntp.parseBooks(undefined, false, ntp.parentId, true);
    }
};



ntp.dragStart = function () {
    //console.log('dragstart');
};



ntp.dragStop = function () {
    //console.log('dragstop');
};


// Main initialization function - entry point.
ntp.initialize = function () {

    var links = document.getElementById('mid');

    // Links.
    links.querySelector('#downloads-link').addEventListener('click', () => { chrome.tabs.create({ url: 'chrome://downloads' });});
    links.querySelector('#history-link').addEventListener('click', () => { chrome.tabs.create({ url: 'chrome://history' }); });
    links.querySelector('#bookmarks-link').addEventListener('click', () => { chrome.tabs.create({ url: 'chrome://bookmarks' }); });
    links.querySelector('#incognito-link').addEventListener('click', () => {
        chrome.windows.create({ incognito: true, state: "maximized" });
    });

    // Settings link.
    links.querySelector('#settings-link').addEventListener('click', () => {

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

    ntp.parseSettings(true, true); // Parse any setting values.

    document.getElementById("bookBrowser").addEventListener("wheel", ntp.upHierarchy, false);

    ntp.openSubPage("img/icons.svg", "icons");

    document.body.addEventListener('click', () => {
        document.body.querySelector('#cmenu').style.display = 'none';
        document.getElementById('popout').classList.remove('out');
    });
};


// Apply settings - parse - boolean, optionally reload books.
ntp.parseSettings = function (reloadBooks, initializing) {

    //Get stored settings.
    chrome.storage.sync.get(null, (items) => {

        // Get pinned.
        ntp.pinned = items.pinned;

        // No pinned folder.
        if (ntp.pinned === "0") {
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

        try {

            // Set whatever is required from the settings recieved.
            root.style.setProperty("--background", items.background);

            root.style.setProperty("--hover", ntp.hexToRGBA(items.hover, items.hoverAlpha));

            root.style.setProperty("--control", ntp.hexToRGBA(items.control, items.controlAlpha));

            root.style.setProperty("--foreground", ntp.hexToRGBA(items.foreground, items.foregroundAlpha));

            root.style.setProperty("--folder", ntp.hexToRGBA(items.folder, items.folderAlpha));

            root.style.setProperty("--iconSize", items.iconSize + 'px');

            root.style.setProperty("--viewWidth", items.viewWidth + 'vw');

            ntp.hidePinned = items.hidePinned;

            ntp.savePosition = items.savePosition;
        }
        catch (e) { console.log(e); }

        if (reloadBooks) {

            // Parse the initial book set, depending on positionRecall.
            ntp.savePosition === true ? ntp.parseBooks(undefined, false, items.folderId) : ntp.parseBooks();
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