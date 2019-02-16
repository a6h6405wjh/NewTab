'use strict';

// Namespace.
var ntp = ntp ||
    {
       
    };



ntp.loadSettings = function () {

    //Get stored settings.
    chrome.storage.sync.get(null, (items) =>
    {
        var root = document.documentElement;

        var inputs = document.getElementsByTagName("input");

        function initInput(key)
        {
            var inp = inputs.namedItem(key);

            try {
                if (items[key]) inp.value = items[key];
            }
            catch (e) { console.log(e); }
           

            inp.addEventListener("change", () => {
                chrome.storage.sync.set({ [key]: inp.value }, null);
                ntp.applySettings();
            });
        }

        initInput("background");
        initInput("foreground");
        initInput("foregroundAlpha");
        initInput("backgroundImage");

        document.getElementById("bgImageUrl").innerText = items.backgroundImage.replace("C:\\fakepath\\", "");

        document.getElementById("backgroundImage").addEventListener("change", previewFile);
        previewFile(items.backgroundImage);
    });
};


function previewFile(img)
{
    var preview = document.querySelector('#pvImg');
    var file = document.querySelector('input[type=file]').files[0];
    var reader = new FileReader();

    reader.addEventListener("load", function () {
        preview.src = reader.result;
    }, false);

    if (img) {
        reader.readAsDataURL(img);
    }
}

document.addEventListener('DOMContentLoaded', ntp.loadSettings);
