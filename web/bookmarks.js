'use strict';

// Namespace.
var ntp = ntp ||
    {
    };

ntp.nodeToHtml = function(node)
{
    var div = document.createElement("div");
    var anchor = document.createElement("a");
    var label = document.createElement("span");
    var img = document.createElement("img");
    var title;

    div.classList += "book fade";
    title = node.title;
    div.id = node.id;

    // Process folder.
    if (node.hasOwnProperty("children"))
    {
        img.src = "img/folder.svg";
        div.addEventListener("click", ntp.getNodes);
    }
    else
    {
        img.src = "chrome://favicon/size/48/" + node.url;
        anchor.href = node.url;
    }

    label.appendChild(document.createTextNode(title));
    anchor.appendChild(img);
    anchor.appendChild(label);
    div.appendChild(anchor);
    return div;
}

ntp.getNodes = function(e, pinned)
{
    var id = e ? e.currentTarget.id : "1";

    if (pinned) id = "282";

    var node = chrome.bookmarks.getSubTree(id,
        function (node)
        {
            var nodes = node[0].children;

            var nodeset;

            if (pinned)
            {
                nodeset = document.getElementById("bookmarks-pinned");
            }
            else
            {
                nodeset = document.createElement("div");
                document.getElementById("bookmarks-bar").appendChild(nodeset);
            }

            for (var i = 0; i < nodes.length; i++)
            {
                nodeset.appendChild(ntp.nodeToHtml(nodes[i]));
            }
        }
    );
}

ntp.initialize = function ()
{
    ntp.getNodes(undefined, true);
    ntp.getNodes();
}

window.onload = ntp.initialize;