'use strict';

// Namespace.
var ntp = ntp ||
    {
    };


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


// Tab switching event.
ntp.tabs = function (e)
{
    var tabs = document.getElementById("tabs").children;
    console.log(tabs);
    var li = tabs[0].children;
    var div = tabs[1].children;

    function setActive(i)
    {
        li[i].classList.add("tab-active");
        div[i].style.display = "flex";
        localStorage.setItem("lastTabId", i);
    }

    function setInactive(i)
    {
        li[i].classList.remove("tab-active");
        div[i].style.display = "none";
    }

    if (!e)
    {
        // Initialize.
        var lastTabId = parseInt(localStorage.getItem("lastTabId"));

        // No last tab defined.
        if (isNaN(lastTabId)) lastTabId = 0;

        setActive(lastTabId);

        for (var i = 0; i < li.length; i++)
        {
            li[i].addEventListener("click", ntp.tabs);
        }
    }
    else
    {
        for (var i = 0; i < li.length; i++)
        {
            if (li[i] == e.currentTarget)
            {
                setActive(i)
            }
            else
            {
                setInactive(i);
            }
        }
    }
}


ntp.init = function ()
{
    ntp.tabs();
    ntp.bookmarks();

    document.getElementById("bookmarks-link").children[0].addEventListener("click", ntp.bookmarks);

    document.getElementById("bookmarks").oncontextmenu = function ()
    {
        alert("implement menu: open bookmark manager");
        return false;
    }
}

window.onload = ntp.init;