'use strict';

// Namespace.
var ntp = ntp ||
    {
        ignore: false,
        parentId: "1",
        id: "1",
        pinned: 0,
        settingsLoaded: false,
        folder: '#folderA',
        hidePinned: true,
        positionRecall: 0
    };



ntp.nodeToHtml = function (node) {
    var a = document.createElement("a");
    var label = document.createElement("span");
    var title;

    a.classList += "book";
    title = node.title;
    a.id = node.id;
    a.setAttribute('title', node.title);

    // Process folder.
    if (node.hasOwnProperty("children")) {

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');

        use.setAttribute("href", ntp.folder);
        a.classList.add('folder');
        
        a.addEventListener("click", ntp.parseNodes);
        svg.appendChild(use);
        a.appendChild(svg);

        a.oncontextmenu = function (ev) {
            var cmenu = document.getElementById("cmenu");
            cmenu.style.display = "block";

            var win = document.body.getBoundingClientRect();

            cmenu.style.top = this.getBoundingClientRect().top + this.offsetHeight / 2 + 'px';
            cmenu.style.left = this.getBoundingClientRect().left + this.offsetWidth / 2 + 'px';

            var id = this.id;

            cmenu.children[0].addEventListener("click", function () {
                chrome.storage.sync.set({ "pinned": id }, null);

                cmenu.style.display = "none";
                ntp.parseNodes(undefined, true, id);
            });

            return false;
        };
    }
    else {
        var img = document.createElement("img");
        img.src = "chrome://favicon/size/48/" + node.url;
        a.href = node.url;
        a.appendChild(img);
    }

    label.appendChild(document.createTextNode(title));
    
    a.appendChild(label);
    a.setAttribute("draggable", "true");
    a.addEventListener("dragstart", ntp.dragStart);
    a.addEventListener("dragover", () => { event.preventDefault();});
    a.addEventListener("drop", ntp.dragStop);

    return a;
};



ntp.parseNodes = function (e, pinned, id, up) {
    id = e ? e.currentTarget.id : id ? id : "1";

    if (ntp.positionRecall === 2) chrome.storage.sync.set({ folderId: id }, null);
    if (ntp.positionRecall === 1) sessionStorage.setItem("folderId", id);

    var node = chrome.bookmarks.getSubTree(id,
        function (node) {
            var nodes = node[0].children;

            ntp.parentId = node[0].parentId;
            ntp.id = node[0].id;

            var nodeset;

            if (pinned) {
                nodeset = document.getElementById("pinned");

                while (nodeset.children.length > 0) {
                    nodeset.children[0].remove();
                }
            }
            else {
                var nav = document.getElementById("navigator");

                if (nav.children.length > 0) {
                    nav.children[0].remove();
                }

                nodeset = document.createElement("div");
                nav.appendChild(nodeset);

                nodeset.classList += up ? "up" : "down  ";

                //Insert empty folder notification.
                if (nodes.length === 0) {

                    var fake = ntp.nodeToHtml({ id: node[0].id, title: 'Empty', children: [null] });

                    fake.classList.add("emptyFolder");

                    // Create a fake node.
                    nodeset.appendChild(fake);
                }
            }

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].id !== ntp.pinned | !ntp.hidePinned) {
                    nodeset.appendChild(ntp.nodeToHtml(nodes[i]));
                }
            }
        }
    );
};



ntp.upHierarchy = function (e) {
    setTimeout(function () { ntp.ignore = false; }, 500);

    if (ntp.ignore === false & ntp.id !== ntp.parentId & e.wheelDelta > 0 & ntp.parentId > 0 & document.getElementsByTagName('html')[0].scrollTop === 0) {
        ntp.ignore = true;
        ntp.parseNodes(undefined, false, ntp.parentId, true);
    }
};



ntp.dragStart = function () {
    //console.log('dragstart');
};



ntp.dragStop = function () {
    //console.log('dragstop');
};



ntp.initialize = function () {
    var link = document.getElementById('mid');

    link.querySelector('#downloads-link').addEventListener('click', () => { chrome.tabs.create({ url: 'chrome://downloads' });});
    link.querySelector('#history-link').addEventListener('click', () => { chrome.tabs.create({ url: 'chrome://history' }); });
    link.querySelector('#bookmarks-link').addEventListener('click', () => { chrome.tabs.create({ url: 'chrome://bookmarks' }); });
    link.querySelector('#incognito-link').addEventListener('click', () => {
        chrome.windows.create({ incognito: true, state: "maximized" });
    });

    // Load settings popout.
    link.querySelector('#settings-link').addEventListener('click', () => {

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

    ntp.applySettings(true);

    document.getElementById("navigator").addEventListener("wheel", ntp.upHierarchy, false);

    ntp.openSubPage("img/icons.svg", "icons");
};


// Apply settings - parse - boolean, optionally parse nodes.
ntp.applySettings = function (parse) {

    //Get stored settings.
    chrome.storage.sync.get(null, (items) => {

        // Get pinned.
        ntp.pinned = items.pinned;

        // No pinned folder.
        if (ntp.pinned === "0") {
            document.getElementById("initialTip").style.display = "block";
        }
        else {
            if (parse) ntp.parseNodes(undefined, true, ntp.pinned);
        }


        var root = document.documentElement;

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

            ntp.positionRecall = items.positionRecall;
        }
        catch (e) { console.log(e); }

        if (parse) {

            var recallId;

            // Parse the initial book set, depending on positionRecall.
            switch (ntp.positionRecall) {
                case 0:
                    {
                        ntp.parseNodes();
                        break;
                    }
                case 1:
                    {
                        recallId = sessionStorage.getItem("folderId");
                        ntp.parseNodes(undefined, false, recallId);
                        break;
                    }
                case 2:
                    {
                        recallId = items.folderId;
                        ntp.parseNodes(undefined, false, recallId);
                        //ntp.parseNodes();
                        break;
                    }
            }
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


ntp.loadSettings = function () {

    //Get stored settings.
    chrome.storage.sync.get(null, (items) => {
        var root = document.documentElement;

        var inputs = document.querySelectorAll("#settings input, #settings select");

        function initInput(key) {

            var inp;

            //Match key in nodelist.
            for (let x = 0; x < inputs.length; x++) {
                if (inputs[x].id === key) {
                    inp = inputs[x];
                    break;
                }
            }


            try {
                if (items[key]) inp.value = items[key];

                // Special case for checked.
                if (inp.type === "checkbox") inp.checked = items[key];
            }
            catch (e) { console.log(e); }


            // Store the control value.
            if (inp) inp.addEventListener("input", () => {
                var val = inp.type === 'checkbox' ? inp.checked : inp.value;
                chrome.storage.sync.set({ [key]: val}, null);
                ntp.applySettings();
            });
        }

        initInput("background");
        initInput("hover");
        initInput("hoverAlpha");
        initInput("control");
        initInput("control1Alpha");
        initInput("foreground");
        initInput("foregroundAlpha");
        initInput("folder");
        initInput("folderAlpha");
        initInput("iconSize");
        initInput("viewWidth");
        initInput("hidePinned");
        initInput("positionRecall");

        document.getElementById("closeSettings").addEventListener('click', () => { document.getElementById('popout').classList.remove('out'); });
    });
};


document.addEventListener('DOMContentLoaded', ntp.initialize);