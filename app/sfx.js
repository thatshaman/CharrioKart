// Load sound effects to object
var sfx = {
    "lap": new Howl({ src: ['sounds/lap.mp3'] }),
    "bump": new Howl({ src: ['sounds/bump.mp3'] }),
    "click": new Howl({ src: ['sounds/click.mp3'] }),
    "woosh": new Howl({ src: ['sounds/woosh.mp3'] }),
    "skidd": new Howl({ src: ['sounds/skidd.mp3'], loop: true }),
    "engine": new Howl({ src: ['sounds/engine.mp3'], loop: true, rate: 1 })
}

// Load music in a seperate object (in case we want to write an option to only mute SFX later)
var music = new Howl({ src: ['music/Pixelland.mp3'], loop: true });

var volume = 0;

// try catch is needed because safari on iOS acts like a random piece of #$@%@
try {
    if (localStorage.getItem("volume") !== null) {
        volume = parseInt(localStorage.getItem("volume")) % 3;
        if (isNaN(volume) || volume == NaN || volume === undefined || volume === null || volume === NaN) {
            volume = 0;
        }
    }
} catch (e) {
    volume = 0;
}

function toggleVolume() {
    sfx.click.play();
    volume = (volume + 1) % 3;
    setSoundVolume(volume);
}

function setSoundVolume(volume) {

    // no seriously, screw safari
    try {
        localStorage.setItem("volume", volume);
    } catch (e) {
        // could not save volume
    }

    // 0 = default, play music and unmute SFX
    // 1 = No music, stop the entire object to safe some resources
    // 2 = No sound at all, mute SFX and stop music object if it was playing

    if (volume == 0) {
        document.getElementById("volume_1").innerText = "SOUND: all";
        document.getElementById("volume_2").innerText = "SOUND: all";
        Howler.mute(false);
        if (!music.playing()) music.play();
    } else if (volume == 1) {
        document.getElementById("volume_1").innerText = "SOUND: no music";
        document.getElementById("volume_2").innerText = "SOUND: no music";
        Howler.mute(false);
        if (music.playing()) music.stop();
    } else if (volume == 2) {
        document.getElementById("volume_1").innerText = "SOUND: muted";
        document.getElementById("volume_2").innerText = "SOUND: muted";
        Howler.mute(true);
        if (music.playing()) music.stop();
    } else {

    }
}

setSoundVolume(volume);
