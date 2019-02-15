'use strict';

// Namespace.
var ntp = ntp ||
    {
       
    };



ntp.initSettings = function () {

    //Get stored settings.
    chrome.storage.sync.get(null, (items) =>
    {
        var root = document.documentElement;

        var inputs = document.getElementsByTagName("input");

        function initInput(key)
        {
            var inp = inputs.namedItem(key);

            if (items[key]) inp.value = items[key];

            inp.addEventListener("change", () => {
                chrome.storage.sync.set({ [key]: inp.value }, null);
            });
        }

        initInput("background");
        initInput("foreground");
        initInput("foregroundAlpha");
    });
};

document.addEventListener('DOMContentLoaded', ntp.initSettings);