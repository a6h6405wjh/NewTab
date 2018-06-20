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
    var book = chrome.bookmarks.getTree
        (
        function (book)
            {
                console.log(book);

                var tab = document.getElementById("bookmarks");

                // Bookmarks bar.
                book = book[0].children[0].children;

                // Bookmarks.
                for (var i = 0; i < book.length; i++)
                {
                    // Outer div.
                    var div = document.createElement("div");
                    var anchor = document.createElement("a");

                    anchor.href = "";
                    div.appendChild(anchor);

                    var label = document.createElement("span");
                    var img = document.createElement("img");

                    // Link.
                    if (!book[i].hasOwnProperty("children"))
                    {
                        
                        img.src = "chrome://favicon/size/48/" + book[i].url;
                        
                        div.classList += "book-link";
                    }
                    // Folder.
                    else
                    {
                        img.src = "img/folder.svg";
                        div.classList += "book-folder";
                    }

                    anchor.appendChild(img);

                    // Title.
                    label.appendChild(document.createTextNode(book[i].title));
                    anchor.appendChild(label);
                    tab.appendChild(div);       
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