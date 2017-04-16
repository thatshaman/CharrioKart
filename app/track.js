var Track = function (trackName) {

    var self = this;

    // Public variables
    self.TrackName = "debug";
    self.isDisposed = false;
    self.state = "loading";

    // Scenes
    var scene = null;
    var camera = null;

    // Map data
    var map = [];

    // Lap info
    var lap = {
        started: false,
        times: [0, 0, 0],
        checkpoint: false,
        count: 0
    };

    // Top right lap timer
    var timerDisplay = document.getElementById("timeCurrent");

    // FPS and intervals
    var timer = {
        animationframe: 0,
        lastUpdate: performance.now(),
        elapsed: 0.0,
        updaterate: 0.0
    };

    // Tile info
    var target = {
        position: { x: 0, z: 0 },
        tile: { index: 0, x: 0, z: 0 }
    };

    var current = {
        tile: { index: 0 }
    };


    // Player / physics
    var player = {
        position: new THREE.Vector3(0, 0.5, 0),
        speed: 0,
        turnspeed: 0,
        angle: 0
    };

    var limits = racers[racer].limits;

    // TODO REPLACE: loading counter, hard coded for now
    var loadingstack = 8;

    // Assets
    var textures = {
        map: undefined, kart: undefined, outOfBounds: undefined, skyBox: undefined, background: []
    };

    var materials = {
        map: undefined, kart: undefined, outOfBounds: undefined, skyBox: undefined, background: []
    };

    var meshes = {
        map: undefined, kart: undefined, outOfBounds: undefined, skyBox: [], background: []
    };

    var geometry = {
        map: undefined, kart: undefined, outOfBounds: undefined, skyBox: undefined, background: undefined
    };

    //Main class
    this.Track = function () {

        try {
            ga('send', 'event', 'Race', trackName + "_" + racer);
        } catch (e) {
            // oops no tracking..
        }

        document.getElementById("loading").style.display = "flex";

        // Reset all timers
        document.getElementById("timeCurrent").innerText = "00:00";
        document.getElementById("timeBest").innerText = "00:00";
        document.getElementById("timeLast").innerText = "00:00";
        document.getElementById("currentLap").innerHTML = ("0000" + lap.count).slice(-4);

        // Load all assets and track defaults
        this.TrackName = trackName;

        setupScene();
        loadAssets();

        // Load map JSON
        xhr = new XMLHttpRequest();
        xhr.open("GET", "tracks/" + self.TrackName + "/map.json", true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var json = JSON.parse(xhr.responseText);

                // Store map data
                map = json.tiles;

                // Set start position
                player.position = new THREE.Vector3(-50 + Math.floor((json.start[0] * (100 / 128))) + 0.8, 0.5, -50 + Math.floor((json.start[1] * (100 / 128))) - 0.39);

                // Player angle
                player.angle = -json.start[2];

                // Start updating the screen
                render();
            }
        };
        xhr.send();

    };


    function update(elapsed) {

        // Make sure we don't try to update the game if the map is disposed
        if (!self.isDisposed) {

            // DEBUG: simulate higher FPS
            //elapsed /= 4;

            // DEBUG: simulate lower FPS
            //elapsed /= 0.5;

            // Calculate how fast the game is running (1.0 = 60FPS)
            timer.updaterate = ((1 / (1 / 60)) * elapsed / 1000);

            // Toggle pause menu
            if (self.state == "running" && input.start) {
                input.start = false;
                pause();
            } else if (self.state == "paused" && input.start) {
                input.start = false;
                unpause();
            }

            // Update the game if it isn't loading or paused
            if (self.state == "running") {

                // Player animation tick
                timer.animationframe = (timer.animationframe + 1) % 60;

                // Update elapsed lap time
                lap.times[0] += elapsed;

                //steering
                if (input.left) {
                    if (timer.updaterate < 1) {
                        player.turnspeed += (limits.turnSpeed);
                    } else {
                        player.turnspeed += (limits.turnSpeed * timer.updaterate);
                    }

                    // Player leaning left sprite
                    textures.kart.offset.x = 0.5;
                } else if (input.right) {
                    if (timer.updaterate < 1) {
                        player.turnspeed -= (limits.turnSpeed);
                    } else {
                        player.turnspeed -= (limits.turnSpeed * timer.updaterate);
                    }

                    // Player leaning right sprite
                    textures.kart.offset.x = 0.75;
                } else {

                    // Player is not steering, gently turn back straight
                    player.turnspeed = player.turnspeed / (1 + (limits.turnFriction * timer.updaterate));
                    if (player.speed > 0.2) {
                        if (timer.animationframe > 30) {
                            textures.kart.offset.x = 0.25;
                        } else {
                            textures.kart.offset.x = 0;
                        }
                    } else {
                        textures.kart.offset.x = 0;
                    }
                }

                // Boostpad has been hit
                if (current.tile.index == 3) player.speed = limits.maxSpeed + limits.maxBoost;

                // Make skidding noise at high speeds / angles
                if (player.speed > 0.2 && (player.turnspeed > 1.1 || player.turnspeed < -1.1)) {
                    if (!sfx.skidd.playing()) sfx.skidd.play();
                } else {
                    if (sfx.skidd.playing()) {
                        sfx.skidd.stop();
                    }
                }

                // Under / over steer
                if (player.turnspeed > -0.05 && player.turnspeed < 0.05) player.turnspeed = 0;
                if (player.turnspeed > limits.maxTurnSpeed) player.turnspeed = limits.maxTurnSpeed;
                if (player.turnspeed < -limits.maxTurnSpeed) player.turnspeed = -limits.maxTurnSpeed;

                // Turn the kart
                player.angle += (player.turnspeed * timer.updaterate);

                // Acceleration
                if (input.up || input.A) {
                    // Throttle
                    if (player.speed < 0.015) player.speed = 0.04;
                    player.speed = player.speed * (1 + (limits.acceleration * timer.updaterate));
                } else if (input.down || input.B) {
                    // Brake
                    if (player.speed > 0) player.speed = player.speed / (1 + (limits.brake * timer.updaterate));
                } else {
                    // Automatically slow down
                    player.speed = player.speed / (1 + (limits.friction * timer.updaterate));
                }

                // Cap maximum speed
                if (player.speed > limits.maxSpeed + 0.1) {
                    player.speed -= (0.03 * timer.updaterate);
                }
                else if (player.speed > limits.maxSpeed) {
                    player.speed = limits.maxSpeed;
                }

                // Make sure the player won't keep rolling forever at low speeds
                if (player.speed < 0.01 && player.speed > 0) player.speed = 0;

                // Reverse
                if (input.down && player.speed <= 0) {
                    player.speed = limits.reverseSpeed;
                } else {
                    if (player.speed < 0) player.speed += (0.01 * timer.updaterate);
                }

                // Get the next tile in our way
                target.position.x = player.position.x - ((player.speed * timer.updaterate) * Math.sin(player.angle * Math.PI / 180));
                target.position.z = player.position.z - ((player.speed * timer.updaterate) * Math.cos(player.angle * Math.PI / 180));
                target.tile.x = Math.floor(128 / 100 * (target.position.x + 50));
                target.tile.z = Math.floor(128 / 100 * (target.position.z + 50));
                target.tile.index = map[target.tile.z][target.tile.x];

                // Check if the player will hit a wall or go out of boundary
                if (target.position.x > 50 || target.position.x < -50 || target.position.z > 50 || target.position.z < -50 || target.tile.index == 1) {

                    // Bump backward if the player travels forward
                    if (player.speed >= 0) {
                        player.speed = player.speed * -1;
                        player.position.x -= (player.speed - 0.15) * Math.sin(player.angle * Math.PI / 180);
                        player.position.z -= (player.speed - 0.15) * Math.cos(player.angle * Math.PI / 180);
                        input.up = false;
                        input.down = false;
                        if (!sfx.bump.playing()) sfx.bump.play();
                    } else {
                        // Full stop if the player is reversing into a wall
                        player.speed = 0;
                        input.up = false;
                        input.down = false;
                    }
                } else {
                    // Move to the next tile
                    player.position.x = target.position.x;
                    player.position.z = target.position.z;
                }

                // Slow down in mud
                if (target.tile.index == 2 && player.speed > 0.10) player.speed = 0.10;

                // Passed a checkpoint tile
                if (target.tile.index == 5 && current.tile.index != 5) lap.checkpoint = true;

                // Player passed the finish line after hitting a checkpoint
                if (target.tile.index == 4 && current.tile.index != 4 && lap.checkpoint) {

                    // Reset lap counters
                    lap.checkpoint = false;
                    lap.times[1] = lap.times[0];
                    lap.times[0] = 0;
                    if (lap.times[1] < lap.times[2] || lap.times[2] == 0) lap.times[2] = lap.times[1];

                    //Increase lap count
                    lap.count++;

                    // Current lap count   ( fixed to 9999 max for nostalgia purpose )
                    document.getElementById("currentLap").innerText = ("0000" + lap.count).slice(-4);

                    // Update last / best time
                    document.getElementById("timeLast").innerText = (lap.times[1] / 1000).toFixed(2);
                    document.getElementById("timeBest").innerText = (lap.times[2] / 1000).toFixed(2);
                    sfx.lap.play();
                }

                // Start timer at first lap
                if (target.tile.index == 4 && current.tile.index != 4) {
                    if (!lap.started) {
                        lap.times[0] = 0;
                        lap.started = true;
                    }
                }

                //
                // SFX
                //

                // Launch pad
                if (target.tile.index == 3 && current.tile.index != 3) sfx.woosh.play();

                // Increase/decrease engine playback rate and lap timer every 10 frames (saves a lot of CPU!)
                if (Math.round(timer.animationframe % 10) == 0) {
                    sfx.engine.rate(1.3 + (player.speed * 2));
                    if (lap.started) timerDisplay.innerText = (lap.times[0] / 1000).toFixed(2);
                }

                // Store current tile for next frame
                current.tile.index = target.tile.index;

            } else if (self.state == "paused") {
                // game is paused, do nothing, grab a coffee
            } else if (self.state == "loading") {
                // wait until all assets are loaded
                if (loadingstack <= 0) {
                    document.getElementById("loading").style.display = "none";
                    sfx.engine.fade(0, 1, 500, sfx.engine.play());
                    self.state = "running";
                }
            }
        }
    }


    function render() {

        if (!self.isDisposed) {

            // Get ms between last call
            timer.elapsed = (performance.now() - timer.lastUpdate);
            timer.lastUpdate = performance.now();

            // update game logic
            update(timer.elapsed);

            // update screen (unless you're loading)
            if (self.state != "loading") {

                // set player sprite position
                meshes.kart.position.set(player.position.x, 0.4, player.position.z);

                // face towards camera
                meshes.kart.rotation.y = player.angle * (Math.PI / 180);

                // move camera behind player
                camera.position.z = Math.cos(player.angle * Math.PI / 180) * 4 + player.position.z;
                camera.position.x = Math.sin(player.angle * Math.PI / 180) * 4 + player.position.x;

                // look at player
                camera.lookAt(new THREE.Vector3(player.position.x, player.position.y + 0.3, player.position.z));

                // render everything to screen
                renderer.render(scene, camera);
            }

            requestAnimationFrame(render);
        }
    }

    function setupScene() {

        // Set up three.js scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xa0c1f7);

        // Set up camera defaults
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 1.3, 0);

        // Update camera on window resize or screen rotation
        window.addEventListener('resize', onWindowResize, false);
        onWindowResize();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function loadAssets() {

        // Make sure the engine sound is loaded
        sfx.engine.load();

        //
        // Race track
        //
        geometry.map = new THREE.PlaneGeometry(100, 100);
        geometry.map.rotateX(-(Math.PI / 2));
        textures.map = new THREE.TextureLoader().load("tracks/" + self.TrackName + "/map.png", function () { loadingstack -= 1; });
        textures.map.generateMipmaps = false;
        textures.map.minFilter = THREE.NearestFilter;
        textures.map.magFilter = THREE.NearestFilter;
        materials.map = new THREE.MeshBasicMaterial({ map: textures.map });
        meshes.map = new THREE.Mesh(geometry.map, materials.map);
        scene.add(meshes.map);

        //
        // Player kart
        //
        geometry.kart = new THREE.PlaneGeometry(0.8, 0.8);
        textures.kart = new THREE.TextureLoader().load("graphics/racers/" + racer + ".png", function () { loadingstack -= 1; });
        textures.kart.generateMipmaps = false;
        textures.kart.minFilter = THREE.NearestFilter;
        textures.kart.magFilter = THREE.NearestFilter;
        textures.kart.repeat.set(0.25, 1);
        materials.kart = new THREE.MeshBasicMaterial({ map: textures.kart, transparent: true });
        meshes.kart = new THREE.Mesh(geometry.kart, materials.kart);
        scene.add(meshes.kart);

        //
        // Out of bounds
        //
        geometry.outOfBounds = new THREE.PlaneGeometry(500, 500);
        geometry.outOfBounds.rotateX(-(Math.PI / 2));
        geometry.outOfBounds.translate(0, -0.05, 0);

        textures.outOfBounds = new THREE.TextureLoader().load("tracks/" + self.TrackName + "/default.png", function () { loadingstack -= 1; });
        textures.outOfBounds.generateMipmaps = false;
        textures.outOfBounds.wrapS = THREE.RepeatWrapping;
        textures.outOfBounds.wrapT = THREE.RepeatWrapping;
        textures.outOfBounds.repeat.set(500, 500);
        textures.outOfBounds.minFilter = THREE.NearestFilter;
        textures.outOfBounds.magFilter = THREE.NearestFilter;

        materials.outOfBounds = new THREE.MeshBasicMaterial({ map: textures.outOfBounds });
        meshes.outOfBounds = new THREE.Mesh(geometry.outOfBounds, materials.outOfBounds);
        scene.add(meshes.outOfBounds);

        //
        // Skybox (far)
        //
        geometry.skyBox = new THREE.PlaneGeometry(500, 125);
        textures.skyBox = new THREE.TextureLoader().load("tracks/" + self.TrackName + "/skybox.png", function () { loadingstack -= 1; });
        textures.skyBox.generateMipmaps = false;
        textures.skyBox.minFilter = THREE.NearestFilter;
        textures.skyBox.magFilter = THREE.NearestFilter;
        materials.skyBox = new THREE.MeshBasicMaterial({ map: textures.skyBox });

        for (i = 0; i < 4; i++) {
            meshes.skyBox.push(new THREE.Mesh(geometry.skyBox, materials.skyBox));
            scene.add(meshes.skyBox[i]);
        }

        // Rotate and place meshes
        meshes.skyBox[0].position.set(0, 62, -250);
        meshes.skyBox[1].position.set(0, 62, 250);
        meshes.skyBox[1].rotateY(Math.PI);
        meshes.skyBox[2].position.set(-250, 62, 0);
        meshes.skyBox[2].rotateY(Math.PI / 2);
        meshes.skyBox[3].position.set(250, 62, 0);
        meshes.skyBox[3].rotateY(-Math.PI / 2);


        //
        // Skybox (near)
        //
        geometry.background = new THREE.PlaneGeometry(320, 80);
        for (i = 0; i < 4; i++) {
            textures.background.push(new THREE.TextureLoader().load("tracks/" + self.TrackName + "/background_" + i + ".png", function () { loadingstack -= 1; }));
            textures.background[i].generateMipmaps = false;
            textures.background[i].minFilter = THREE.NearestFilter;
            textures.background[i].magFilter = THREE.NearestFilter;

            materials.background.push(new THREE.MeshBasicMaterial({ map: textures.background[i], transparent: true }));
            meshes.background.push(new THREE.Mesh(geometry.background, materials.background[i]));

            scene.add(meshes.background[i]);
        }

        // Rotate and place meshes
        meshes.background[0].position.set(0, 40, -160);

        meshes.background[1].position.set(160, 40, 0);
        meshes.background[1].rotateY(-Math.PI / 2);

        meshes.background[2].position.set(0, 40, 160);
        meshes.background[2].rotateY(Math.PI);

        meshes.background[3].position.set(-160, 40, 0);
        meshes.background[3].rotateY(Math.PI / 2);
    }

    // Dispose scene, all event listeners, loaded textures, meshes and geometries
    this.dispose = function () {

        self.isDisposed = true;

        window.removeEventListener('resize', onWindowResize, false);

        sfx.engine.fade(1, 0, 500);
        sfx.engine.stop();

        scene.remove(meshes.map);
        geometry.map.dispose();
        textures.map.dispose();
        materials.map.dispose();

        scene.remove(meshes.outOfBounds);
        geometry.outOfBounds.dispose();
        textures.outOfBounds.dispose();
        materials.outOfBounds.dispose();

        scene.remove(meshes.kart);
        geometry.kart.dispose();
        textures.kart.dispose();
        materials.kart.dispose();

        for (i = 0; i < 4; i++) {
            scene.remove(meshes.kart);
        }
        geometry.skyBox.dispose();
        textures.skyBox.dispose();
        materials.skyBox.dispose();

        for (i = 0; i < 4; i++) {
            scene.remove(meshes.background[i]);
            textures.background[i].dispose();
            materials.background[i].dispose();
        }
        geometry.background.dispose();

        scene = null;
        camera = null;

    };


    // Init
    this.Track();

};