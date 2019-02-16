'use strict';

// Namespace.
var ntp = ntp ||
    {
       
    };


ntp.loadSettings = function (setDefaults) {

    //Get stored settings.
    chrome.storage.sync.get(null, (items) => {
        var root = document.documentElement;

        var inputs = document.querySelectorAll("#settings input, #settings select");

        function initInput(key) {

            var inp;

            //Match key in nodelist.
            for (let x = 0; x < inputs.length; x++) {
                if (inputs[x].id === key) {
                    inp = inputs[x];
                    break;
                }
            }


            try {
                if (items[key]) inp.value = items[key];

                // Special case for checked.
                if (inp.type === "checkbox") inp.checked = items[key];
            }
            catch (e) { console.log(e, 'key: ' + key ); }


            // Store control values.
            function storeControlValues() {
                var val = inp.type === 'checkbox' ? inp.checked : inp.value;
                chrome.storage.sync.set({ [key]: val }, null);
                ntp.parseSettings();
            }

            if (inp) {

                // Store on control changed.
                inp.addEventListener("input", storeControlValues);

                // Store values if default setup.
                if (setDefaults) storeControlValues();
            }
        }

        initInput("background");
        initInput("hover");
        initInput("hoverAlpha");
        initInput("control");
        initInput("controlAlpha");
        initInput("foreground");
        initInput("foregroundAlpha");
        initInput("folder");
        initInput("folderAlpha");
        initInput("iconSize");
        initInput("viewWidth");
        initInput("hidePinned");
        initInput("savePosition");

        document.getElementById("closeSettings").addEventListener('click', () => { document.getElementById('popout').classList.remove('out'); });
    });
};