'use strict';

// Namespace.
var ntp = ntp ||
    {
        captured: false,
        pick: null
    };

// Encode background image and save to local storage.
ntp.encodeBgImage = function (e) {
    var file = e.currentTarget.files[0];
    var reader = new FileReader();
    reader.onloadend = function () {
    
        chrome.storage.local.set({ [e.target.id]: reader.result }, () => {

            if (chrome.runtime.lastError) {
                alert("Error: File too large, max 5mb");
            }
            else {
                ntp.parseSettings();
            }
        });
    };
    reader.readAsDataURL(file);
};


ntp.parseGradient = function () {

    var defGradient = {
        deg: 90,
        color: ['#808080', '#000000'],
        position: [0, 100]
    };

    //Get stored settings.
    chrome.storage.sync.get('jsonGradient', (gradient) => {

        gradient = gradient['jsonGradient'] ? JSON.parse(gradient) : defGradient;

        var gAngle = document.getElementById('gAngle');

        gAngle.value = gradient.deg;

        for (let x = 0; x < gradient.color.length; x++) {

            createPick(x);
        }

        function createPick(x) {

            var pick = document.createElement('div');

            pick.classList.add('gPick');

            var pickContainer = document.getElementById('gPickContainer');

            pickContainer.appendChild(pick);

            pick.pos = gradient.position[x];
            pick.color = gradient.color[x];

            pick.style.left = pickContainer.clientWidth / 100 * pick.pos + 'px';
        }

        ntp.initGradientPicker();
    });
};


// Initialize gradient picker.
ntp.initGradientPicker = function () {

    var picks = document.getElementsByClassName('gPick');

    var pos = document.getElementById('gPickPosition');

    var pickColor = document.getElementById('gPickColor');

    var gbar = document.getElementsByClassName('gBar')[0];

    var gAngle = document.getElementById('gAngle');

    pickColor.addEventListener('change', (e)=>{
        ntp.pick.color = e.currentTarget.value;
    });

    // Moving a pick/slider.
    document.body.addEventListener('mousemove', (e) => {

        if (ntp.captured) {

            var move = e.clientX - gbar.getBoundingClientRect().x;

            move = move > gbar.clientWidth - ntp.pick.clientWidth ? move = gbar.clientWidth - ntp.pick.clientWidth : move;

            move = move < 0 ? 0 : move;

            ntp.pick.style.left = move + 'px';

            pos.value = Math.round(100 / (gbar.clientWidth - ntp.pick.clientWidth) * move);

            ntp.pick.pos = pos.value;
        }
    });


    for (let x = 0; x < picks.length; x++) {

        // Begin capturing movement for a pick.
        picks[x].addEventListener('mousedown', (e) => {
            ntp.pick = e.target;
            ntp.captured = true;
            pickColor.value = ntp.pick.color ? ntp.pick.color : '#FFFFFF';
            pos.value = ntp.pick.pos;
        });
    }

    // Release pick.
    document.addEventListener('mouseup', (e) =>
    {
        if (ntp.captured) {
            ntp.captured = false;

            var components = '';

            for (let x = 0; x < picks.length; x++) {

                components += (x === 0 ? '' : ',') + picks[x].color + ' ' + picks[x].pos + '%';
            }

            document.documentElement.style.setProperty('--background', 'linear-gradient(' + gAngle.value + 'deg,' + components + ')');

            gbar.style.background = 'linear-gradient(' + gAngle.value + 'deg,' + components + ')';
        }
    });
};

ntp.loadSettings = function() {


    var bgOpt = document.querySelectorAll("#settings input[name=cfgBgOpt]");


    for (let x = 0; x < bgOpt.length; x++) {

        bgOpt[x].addEventListener('change', (e) => {
            changeBgOpt();
        });
    }


    changeBgOpt();

    function changeBgOpt() {
        for (let y = 0; y < bgOpt.length; y++) {

            var el = document.getElementById(bgOpt[y].value);

            bgOpt[y].checked ? el.classList.remove('noDisplay') : el.classList.add('noDisplay');
        }
    }

    ntp.parseGradient();

    document.getElementById('resetDefault').addEventListener('click', () => { chrome.storage.sync.clear();});

    //Get stored settings.
    chrome.storage.sync.get(null, (items) => {

        var root = document.documentElement;

        // Process all inputs with a class of .save
        var inputs = document.querySelectorAll("#settings .save");

        function initInput(inp) {

            try {

                if (inp.id === 'clearBgImage') {
                    inp.addEventListener('click', () => {
                        chrome.storage.local.remove("cfgBgImage");
                        ntp.parseSettings();
                    });

                    return;
                }

                // Get image button.
                if (inp.type === 'file') {

                    inp.addEventListener('change', (e) => ntp.encodeBgImage(e));
                    return;
                }

                if (inp.type === 'range') return;

                // Set the control to the stored value.
                if (items[inp.id]) inp.value = items[inp.id];

                // Special case for checked.
                if (inp.type === "checkbox") inp.checked = items[inp.id];
            }
            catch (e) { console.log(e, 'key: ' + inp.id ); }


            // Set the stored value.
            function storeControlValues() {

                // Special case for select background option.
                if (inp.id === 'cfgBgOpt') {

                    for (let x = 0; x < inp.children.length; x++) {
                        if (inp.value !== inp.children[x].value) {
                            document.getElementById(inp.children[x].value).style.display = 'none';
                        }
                        else document.getElementById(inp.children[x].value).style.display = 'flex';
                    }
                }

                var val = inp.type === 'checkbox' ? inp.checked : inp.value;
                chrome.storage.sync.set({ [inp.id]: val }, null);
                ntp.parseSettings();

            }

            if (inp) {

                // Listener for control value changed.
                inp.addEventListener("input", storeControlValues);

                // Store values if default setup.
                if (!items.background) storeControlValues(true);
            }
        }

        // Loop input controls.
        for (let x = 0; x < inputs.length; x++)
        {
            //initInput(inputs[x]);
        }

        document.getElementById("closeSettings").addEventListener('click', () => { document.getElementById('popout').classList.remove('out'); });
    });
};