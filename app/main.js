// three.js instance
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Selected track and racer
var track = null;
var racer = "kartB";

var mainMenu = document.getElementById("mainMenu");

// Load a new track and hide the main menu
function loadMap(map) {
    unloadTrack();
    document.getElementById("mainMenu").style.display = "none";
    track = new Track(map);
}

// Dispose track and return to menu
function unloadTrack() {
    sfx.click.play();
    document.getElementById("gameMenu").style.display = "none";
    document.getElementById("mainMenu").style.display = "block";
    if (track !== null) {
        track.dispose();
        track = null;
    }
}

// Pause game from menu or button
function pause() {
    sfx.click.play();
    track.state = "paused";
    document.getElementById("gameMenu").style.display = "flex";
}

// Resume game from menu or button
function unpause() {
    sfx.click.play();
    track.state = "running";
    document.getElementById("gameMenu").style.display = "none";
}

// Background colors for each menu
var backgroundColors = {
    "title": "#000000",
    "main": "#a02700",
    "racer": "#006900",
    "track": "#00516b",
    "about": "#111111",
    "settings": "#111111"
};

// Switch between menus
function showMenu(section) {

    // Set new background color (animated via CSS)
    mainMenu.style.backgroundColor = backgroundColors[section];

    var menus = document.getElementsByClassName("popup");
    for (i = 0; i < menus.length; i++) {
        menus[i].style.display = "none";
    }

    sfx.click.play();
    document.getElementById("menu_" + section).style.display = "block";
}

// Set selected racer
function setRacer(newRacer) {
    racer = newRacer;
    showMenu('track');
}

// Bind touch events to onscreen controls
document.getElementById("left").addEventListener('touchstart', function (e) { input.left = true; }, false);
document.getElementById("left").addEventListener('touchend', function (e) { input.left = false; }, false);

document.getElementById("right").addEventListener('touchstart', function (e) { input.right = true; }, false);
document.getElementById("right").addEventListener('touchend', function (e) { input.right = false; }, false);

document.getElementById("aButton").addEventListener('touchstart', function (e) { input.A = true; input.up = true; }, false);
document.getElementById("aButton").addEventListener('touchend', function (e) { input.A = false; input.up = false; }, false);

document.getElementById("bButton").addEventListener('touchstart', function (e) { input.B = true; input.down = true; }, false);
document.getElementById("bButton").addEventListener('touchend', function (e) { input.B = false; input.down = false; }, false);

// Only show the touch controls on touch devices
window.addEventListener('touchstart', function () {
    document.getElementById("touch").style.display = "block";
});

// Disable context menu on touch elements
window.oncontextmenu = function (event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};

// Long press bug fix for iOS safari
document.ontouchmove = function (event) {
    event.preventDefault();
}

// fullscreen support for all browsers except (drumroll please) Safari
function toggleFullscreen() {
    sfx.click.play();
    var elem = document.documentElement;
    if (!document.fullscreenElement && !document.mozFullScreenElement &&
      !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

// Show hidden track and racer
function meow() {
    var cats = document.getElementsByClassName("secret");
    for (i = 0; i < cats.length; i++) cats[i].style.display = "block";
    sfx.lap.play();
}

var version = "1.4";

// debug stuff
//showMenu("track");
//setRacer("kartB");
//loadMap("ascalon");