'use strict';

// Namespace.
var ntp = ntp ||
    {
        path: [0, 0],
        head: null
    };


ntp.clickCrumb = function (e)
{
    if (e.currentTarget["data-id"] == ntp.head) return;


    ntp.head = e.currentTarget["data-id"];

    var crumbs = document.getElementById("bookmarks-crumbs");
    var crumb;

    // Remove crumbs starting from end.
    for (var x = crumbs.children.length - 1; x > 0; x--)
    {
        crumb = crumbs.children[x];

        // Removed all invalid crumbs?
        if (!crumb.hasOwnProperty("data-id") | crumb["data-id"] != ntp.head)
        {
            crumbs.removeChild(crumb);
            if (crumb.hasOwnProperty("data-id")) ntp.path.pop();
        }
        else
        {
            break;
        }
    }

    ntp.bookmarks();
}

ntp.addCrumb = function (book)
{
    var crumbs = document.getElementById("bookmarks-crumbs");
    var link = document.createElement("span");

    if (crumbs.children.length != 0)
    {
        var separator = document.createElement("span");
        separator.appendChild(document.createTextNode(" | "));
        separator.classList.add("separator");
        crumbs.appendChild(separator);
        link.appendChild(document.createTextNode(book.title));
    }
    else
    {
        link.appendChild(document.createTextNode("Bookmarks"));
    }
    
    
    link["data-id"] = book.id;
    link.classList.add("fade");
    crumbs.appendChild(link);
    link.addEventListener("click", ntp.clickCrumb);

    ntp.head = book.id;
}


ntp.bookmarks = function(e, altPath, altDiv)
{
    var path = altPath ? altPath : ntp.path;
    var divID = altDiv ? altDiv : "bookmarks-bar";

    /*
         Parses bookmarks. 
         Path is array of indexes to current folder.
    */

    var outDiv = document.getElementById(divID);

    // On click.
    if (e)
    {
        // Add index to path.
        if (e.currentTarget.hasOwnProperty("data-index"))
        {
            ntp.path.push(e.currentTarget["data-index"]);
        }
    }

    // Remove contents from previous folder.
    if(!altPath) while (outDiv.firstChild) outDiv.removeChild(outDiv.firstChild);

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

            // Increase folder depth path, to index of book.
            div['data-index'] = book.index;
            title = book.title;
            img.src = "img/folder.svg";

            div.addEventListener("click", ntp.bookmarks);
            div.oncontextmenu = function () { return false; };
        }
        else
        {
            title = book.title;
            img.src = "chrome://favicon/size/48/" + book.url;
            anchor.href = book.url;
        }

        div.classList.add("fade");
        label.appendChild(document.createTextNode(title));
        anchor.appendChild(img);
        anchor.appendChild(label);
        div.appendChild(anchor);
        outDiv.appendChild(div);       
    }

    var book = chrome.bookmarks.getTree
        (
            function (book)
            {
                console.log(book);

                var parent;

                // Traverse the folders/path.
                for (var n = 0; n < path.length; n++)
                {
                    parent = book[path[n]];
                    book = parent.children;
                }

                if (!altDiv & parent.id != ntp.head) ntp.addCrumb(parent);
               
                // Process bookmarks.
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
    //console.log(tabs);
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
        // Set active/inactive tabs.
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
    ntp.bookmarks(undefined, [0, 0, 9], "bookmarks-pinned");

    //document.getElementById("bookmarks").oncontextmenu = function ()
    //{
    //    alert("implement menu: open bookmark manager");
    //    return false;
    //}
}

window.onload = ntp.init;