'use strict';

// Namespace.
var ntp = ntp ||
    {
        ignore: false,
        parentId: "1",
        id: "1",
        pinned: 0
    };

ntp.nodeToHtml = function (node) {
    var a = document.createElement("a");
    var label = document.createElement("span");
    var img = document.createElement("img");
    var title;

    a.classList += "book";
    title = node.title;
    a.id = node.id;
    a.setAttribute('title', node.title);

    // Process folder.
    if (node.hasOwnProperty("children")) {
        img.src = "img/folder.svg";
        a.addEventListener("click", ntp.parseNodes);

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
        img.src = "chrome://favicon/size/48/" + node.url;
        a.href = node.url;
    }

    label.appendChild(document.createTextNode(title));
    a.appendChild(img);
    a.appendChild(label);
    a.setAttribute("draggable", "true");
    a.addEventListener("dragstart", ntp.dragStart);
    a.addEventListener("dragover", () => { event.preventDefault();});
    a.addEventListener("drop", ntp.dragStop);

    return a;
};

ntp.parseNodes = function (e, pinned, id, up) {
    id = e ? e.currentTarget.id : id ? id : "1";

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
            }

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].id !== ntp.pinned) {
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

    //Get stored settings.
    chrome.storage.sync.get(null, (items) => {

        // Get pinned.
        ntp.pinned = items.pinned;

        // No pinned folder.
        if (ntp.pinned === "0") {
            document.getElementById("initialTip").style.display = "block";
        }
        else {
            ntp.parseNodes(undefined, true, ntp.pinned);
        }

        var root = document.documentElement;

        root.style.setProperty("--background", items.background);
        root.style.setProperty("--foreground", items.foreground);
        root.style.setProperty("--foregroundAlpha", items.foregroundAlpha / 100);
    });


    ntp.parseNodes();
    document.getElementById("navigator").addEventListener("wheel", ntp.upHierarchy, false);
};

document.addEventListener('DOMContentLoaded', ntp.initialize);