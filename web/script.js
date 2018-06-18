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


ntp.tabs = function (e)
{
    
    /*  Tab switching. */

    var tab, id;

    var lastId = parseInt(localStorage.getItem("tabLastId"));
    var tabs = document.getElementById("tabs").children;

    // Not fired from onclick.
    if (e == null)
    {
        // No last tab.
        if (isNaN(lastId)) lastId = 0;

        tabs[0].children[lastId].classList.add("tab-active");
        tabs[lastId + 1].style.display = "block";
    }
    else
    {
        // Loop li's.
        for (var i = 0; i < tabs[0].children.length; i++)
        {
            tab = tabs[0].children[i];

            // Active tab.
            if (tab == e.target)
            {
                tab.classList.add("tab-active");
                tabs[i + 1].style.display = "block";
                localStorage.setItem("tabLastId", i);
            }
            // Inactive tab.
            else
            {
                tab.classList.remove("tab-active");
                tabs[i + 1].style.display = "none";
            }
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
    ntp.tabs(null);
    ntp.bookmarks();
}

window.onload = ntp.init;