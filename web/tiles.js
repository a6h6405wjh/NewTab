'use strict';

// Namespace.
var ntp = ntp ||
    {
    };

ntp.onload = function ()
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

window.onload = ntp.onload;