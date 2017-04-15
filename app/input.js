var input = {
    left: false,
    right: false,
    up: false,
    down: false,
    A: false,
    B: false,
    start: false
};

// Arrow keys configuration
var keyCodes = {
    left: 37,
    right: 39,
    up: 38,
    down: 40,
    A: 90,
    B: 88,
    start: 27
};

// WASD configuration
var keyCodesAlt = {
    left: 65,
    right: 68,
    up: 87,
    down: 83,
    A: 81,
    B: 69,
    start: 13
};

var touchpad = undefined;
var gamepadInterval = undefined;
var gamepad = undefined;
var usegamepad = false;

// Press button do stuff
document.onkeydown = function (event) {

    usegamepad = false;

    if (event.which == keyCodes.left || event.which == keyCodesAlt.left) {
        input.left = true;
        event.preventDefault();
    }

    if (event.which == keyCodes.up || event.which == keyCodesAlt.up) {
        input.up = true;
        event.preventDefault();
    }

    if (event.which == keyCodes.right || event.which == keyCodesAlt.right) {
        input.right = true;
        event.preventDefault();
    }

    if (event.which == keyCodes.down || event.which == keyCodesAlt.down) {
        input.down = true;
        event.preventDefault();
    }

    if (event.which == keyCodes.A || event.which == keyCodesAlt.A) {
        input.A = true;
        event.preventDefault();
    }

    if (event.which == keyCodes.B || event.which == keyCodesAlt.B) {
        input.down = true;
        event.preventDefault();
    }

    if (event.which == keyCodes.start || event.which == keyCodesAlt.start) {
        input.start = true;
        event.preventDefault();
    }
};

// Release button do less stuff
document.onkeyup = function (event) {

    usegamepad = false;

    if (event.which == keyCodes.left || event.which == keyCodesAlt.left) {
        input.left = false;
        event.preventDefault();
    }

    if (event.which == keyCodes.up || event.which == keyCodesAlt.up) {
        input.up = false;
        event.preventDefault();
    }

    if (event.which == keyCodes.right || event.which == keyCodesAlt.right) {
        input.right = false;
        event.preventDefault();
    }

    if (event.which == keyCodes.down || event.which == keyCodesAlt.down) {
        input.down = false;
        event.preventDefault();
    }

    if (event.which == keyCodes.A || event.which == keyCodesAlt.A) {
        input.A = false;
        event.preventDefault();
    }

    if (event.which == keyCodes.B || event.which == keyCodesAlt.B) {
        input.B = false;
        event.preventDefault();
    }

    if (event.which == keyCodes.start || event.which == keyCodesAlt.start) {
        input.start = false;
        event.preventDefault();
    }
};


function updateGamePad() {

    gamepad = navigator.getGamepads()[0];

    if (gamepad !== undefined) {

        // Toggle between gamepad and keyboard (otherwise buttons will get stuck)
        if (gamepad.axes[0] > 0.5 || (gamepad.axes[0] < -0.5) || gamepad.axes[1] < -0.5 || gamepad.axes[1] > 0.5 || gamepad.buttons[0].pressed || gamepad.buttons[1].pressed) {
            usegamepad = true;
        }

        if (usegamepad) {

            // reset button state
            input.left = false;
            input.up = false;
            input.down = false;
            input.right = false;
            input.A = false;
            input.B = false;
            input.start = false;

            if (gamepad.axes[0] < -0.5) input.left = true;
            if (gamepad.axes[0] > 0.5) input.right = true;
            if (gamepad.buttons.length >= 15) {
                if (gamepad.buttons[14].pressed) {
                    input.left = true;
                } else if (gamepad.buttons[15].pressed) {
                    input.right = true;
                }
            }

            if (!input.left && !input.right) {
                if (gamepad.axes[1] < -0.5) input.up = true;
                if (gamepad.axes[1] > 0.5) input.down = true;
                if (gamepad.buttons.length >= 15) {
                    if (gamepad.buttons[12].pressed) {
                        input.up = true;
                    } else if (gamepad.buttons[13].pressed) {
                        input.down = true;
                    }
                }
            }

            if (gamepad.buttons[0].pressed) input.A = true;
            if (gamepad.buttons[1].pressed) input.B = true;
            if (gamepad.buttons[9].pressed || gamepad.buttons[8].pressed) input.start = true;
        }
    }
}

// Connect to gamepad on Chrome, Edge or Firefox
document.addEventListener("DOMContentLoaded", function () {
    if ("getGamepads" in navigator) {
        window.addEventListener("gamepadconnected", function (e) {
            gamepadInterval = window.setInterval(updateGamePad, 20);
        });

        window.addEventListener("gamepaddisconnected", function (e) {
            gamepad = undefined;
            window.clearInterval(gamepadInterval);
        });

        // chrome/edge make sure the gamepad (re)connects when the page is already loaded
        if (navigator.getGamepads()[0] && gamepad === undefined) {
            window.clearInterval(gamepadInterval);
            window.dispatchEvent(new Event('gamepadconnected'));
        }
    }

});