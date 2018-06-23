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


ntp.bookmarks = function (e)
{
    /*
     Parses bookmarks. 
     Path is array of indexes to current folder.
    */

    var tab = document.getElementById("bookmarks");

    // Set local path.
    var path = e ? JSON.parse(e.currentTarget["data-path"]) : [0, 0];

    // Empty the div.
    if (e)
    {
        while (tab.firstChild) tab.removeChild(tab.firstChild);

        // Not origin.
        if (path.length > 2)
        {
            appendBook(undefined, true);
        }

        //document.getElementById("tabs").children[0].children[0].innerHTML += e.currentTarget.children[0].children[1].innerHTML;
    }

    // Create and append a bookmark/folder.
    function appendBook(book, folder)
    {
        var div = document.createElement("div");
        var anchor = document.createElement("a");
        var label = document.createElement("span");
        var img = document.createElement("img");

        div.classList += "book";

        if (folder)
        {
            var title, spath;

            if (!book)
            {
                // Decrease folder depth path, to parent.
                div['data-path'] = "[" + path.slice(0, path.length - 1) + "]";
                title = "Back";
                img.src = "img/folder-back.svg";
            }
            else
            {
                // Increase folder depth path, to index of book.
                div['data-path'] = "[" + path + "," + book.index + "]";
                title = book.title;
                img.src = "img/folder.svg";
            }

            div.addEventListener("click", ntp.bookmarks);
            div.oncontextmenu = function () { return false; };
        }
        else
        {
            title = book.title;
            img.src = "chrome://favicon/size/48/" + book.url;
            anchor.href = book.url;
        }

        label.appendChild(document.createTextNode(title));
        anchor.appendChild(img);
        anchor.appendChild(label);
        div.appendChild(anchor);
        tab.appendChild(div);       
    }

    var book = chrome.bookmarks.getTree
        (
        function (book)
            {
                // Traverse the collection.
                for (var n = 0; n < path.length; n++) book = book[path[n]].children;

                // Bookmarks.
                for (var i = 0; i < book.length; i++)
                {
                    appendBook(book[i], book[i].hasOwnProperty("children"));
                }
            }
        );
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
        tabs[lastId + 1].style.display = "flex";
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
                tabs[i + 1].style.display = "flex";
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

    document.getElementById("bookmarks-link").addEventListener("click", ntp.bookmarks);
}

window.onload = ntp.init;