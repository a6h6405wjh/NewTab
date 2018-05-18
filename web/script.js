'use strict';

// Namespace.
var ntp = ntp ||
    {
    };

ntp.tiles = function ()
{
    // Read images from xml.
    var xmlReq = new XMLHttpRequest();

    xmlReq.onreadystatechange = function ()
    {
        if (this.readyState == 4 && this.status == 200)
        {
            var xml = xmlReq.responseXML;

            var tiles = xml.getElementsByTagName("ntp:tile");

            var container = document.getElementById("tiles");

            for (var i = 0; i < tiles.length; i++)
            {
                container.innerHTML += tiles[i].innerHTML;
            }
        }
    }

    xmlReq.open("GET", "tiles.xml", true);
    xmlReq.send();
}

ntp.bookmarks = function ()
{
    //var bkm = chrome.bookmarks.getTree(function(bkm));
}


ntp.tabs = function (active)
{
    // Fix this, used because of stupid this/inline script grr chrome security crap.
    active = active.currentTarget;

    /*
     Tab switching.
     req. data-id attribute on li that is child of tabs.
    */

    var tab, tabId;
    var tabLastId = localStorage.getItem("tab");
    var tabs = document.getElementById("tabs").children[0].children; // Li's.

    for (var i = 0; i < tabs.length; i++)
    {
        tab = tabs[i];

        tabId = tab.getAttribute("data-tab");

        if (active == null && tabId == tabLastId)
        {
                active = tabs[i]
        }

        if (tab != active)
        {
            // Hide data.
            document.getElementById(tabId).style.display = "none";

            // Inactive.
            tab.classList.remove("tab-active");
        }
        else
        {
            // Show data.
            document.getElementById(tabId).style.display = "block";

            // Active.
            tab.classList.add("tab-active");

            // Save tab.
            localStorage.setItem("tab", tabId);
        }
    }
}

ntp.init = function ()
{
    // Get tabs.
    var tabs = document.getElementById("tabs").children[0].children;

    for (var i = 0; i < tabs.length; i++)
    {
        tabs[i].addEventListener("click", ntp.tabs);
    }

    ntp.tiles();
    ntp.tabs();
    ntp.bookmarks();
}

window.onload = ntp.init;