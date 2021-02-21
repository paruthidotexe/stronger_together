import Player from "./player.js";

var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var camera;
var tile_array = [];
var player;
var playerScale = 0.3;
var playerMove = playerScale / 2;
var bulletArray = [];
var totalBullets = 32;

var angle = 0;
//var playerObj = new Player("MainPlayer");

var createDefaultEngine = function () {
    return new BABYLON.Engine(canvas,
        true,
        {
            preserveDrawingBuffer: true,
            stencil: true,
            disableWebGL2Support: false
        });
};

var initFunction = async function () {
    var asyncEngineCreation = async function () {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    }
    engine = await asyncEngineCreation();
    if (!engine) throw 'engine should not be null.';
    scene = createScene();
};
initFunction().then(() => {
    sceneToRender = scene
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            angle += 0.01;
            for (var i = 0; i < tile_array.length; i = i + 1) {
                if (tile_array[i]) {
                    tile_array[i].position.y = Math.sin(angle + i) / 10.0;
                }
            }
            // for (var i = 0; i < bulletArray.length; i = i + 1) {
            //     bulletArray[i].position.x += 0.1;
            // }
            bulletArray[0].position.x += 0.1;

            //playerObj.Update();
               
            sceneToRender.render();
        }
    });
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});


BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = function () {
    if (document.getElementById("customLoadingScreenDiv")) {
        // Do not add a loading screen if there is already one
        document.getElementById("customLoadingScreenDiv").style.display = "initial";
        return;
    }
    this._loadingDiv = document.createElement("div");
    this._loadingDiv.id = "customLoadingScreenDiv";
    this._loadingDiv.innerHTML = "Loading Scene...";
    var customLoadingScreenCss = document.createElement('style');
    customLoadingScreenCss.type = 'text/css';
    customLoadingScreenCss.innerHTML = `
    #customLoadingScreenDiv{
        background-color: #001A33FF;
        color: white;
        font-size:50px;
        text-align:center;
    }`;
    document.getElementsByTagName('head')[0].appendChild(customLoadingScreenCss);
    this._resizeLoadingUI();
    window.addEventListener("resize", this._resizeLoadingUI);
    document.body.appendChild(this._loadingDiv);
};


BABYLON.DefaultLoadingScreen.prototype.hideLoadingUI = function () {
    document.getElementById("customLoadingScreenDiv").style.display = "none";
    console.log("scene is now loaded");
}


const createScene = () => {
    engine.displayLoadingUI();

    const scene = new BABYLON.Scene(engine);

    // Camera and lights
    SetupEnvironment();

    // Load the level
    CreateLevel(scene);

    // player
    CreatePlayer(scene);

    var yellowMat = new BABYLON.StandardMaterial("yellowMat", scene);
    yellowMat.emissiveColor = new BABYLON.Color3(1, 1, 0);
    var bulletMesh = BABYLON.Mesh.CreateIcoSphere("icosphere", { radius: 0.05, subdivisions: 1 });
    for (let i = 0; i < 10; i++) {
        var curBullet = bulletMesh.createInstance();
        curBullet.position.x = i;
        curBullet.position.y = 100;
        //curBullet.material = yellowMat;
        bulletArray.push(curBullet);
    }

    // Mouse
    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                console.log("POINTER DOWN");
                player.position.y = 1;
                break;
            case BABYLON.PointerEventTypes.POINTERUP:
                console.log("POINTER UP");
                player.position.y = 0.5;
                break;
            case BABYLON.PointerEventTypes.POINTERMOVE:
                console.log("POINTER MOVE");
                break;
            case BABYLON.PointerEventTypes.POINTERWHEEL:
                console.log("POINTER WHEEL");
                break;
            case BABYLON.PointerEventTypes.POINTERPICK:
                console.log("POINTER PICK");
                break;
            case BABYLON.PointerEventTypes.POINTERTAP:
                console.log("POINTER TAP");
                break;
            case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
                console.log("POINTER DOUBLE-TAP");
                break;
        }
    });

    // Keyboard
    scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                console.log("KEY DOWN: ", kbInfo.event.key);
                if (kbInfo.event.key == "w") {
                    player.position.z += playerMove;
                    //player.rotate(new BABYLON.Vector3(0,1,0), Math.PI/2);
                    player.rotation = new BABYLON.Vector3(0, 0, 0);
                }
                else if (kbInfo.event.key == "s") {
                    player.position.z -= playerMove;
                    player.rotation = new BABYLON.Vector3(0, -Math.PI, 0);
                }
                if (kbInfo.event.key == "a") {
                    player.position.x -= playerMove;
                    player.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);
                }
                else if (kbInfo.event.key == "d") {
                    player.position.x += playerMove;
                    player.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
                }
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                console.log("KEY UP: ", kbInfo.event.keyCode);
                if(kbInfo.event.keyCode == 32){
                    bulletArray[0].position.x = player.position.x;
                    bulletArray[0].position.y = player.position.y;
                    bulletArray[0].position.z = player.position.z;
                }
                break;
        }
    });

    // random mesh particles
    //CreateParticles_04(scene);

    // Add audio to game
    //AddAudio(scene);

    // Post processing
    //ApplyPostProcessing_01(camera);

    // Debug Layer
    scene.debugLayer.show();

    return scene;
}


function SetupEnvironment() {

    // camera
    SetupCamera();

    // light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0));

    // ground grid
    CreateGroundGrid();

    // Skybox
    CreateSkybox();
}


function SetupCamera() {
    //const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, 0, 0));
    camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 5, -13), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
}


function CreateGroundGrid() {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 25, height: 25 });
    var defaultGridMaterial = new BABYLON.GridMaterial("default", scene);
    defaultGridMaterial.majorUnitFrequency = 10;
    defaultGridMaterial.gridRatio = 0.1;
    defaultGridMaterial.lineColor = new BABYLON.Color3(0, .5, 1);
    defaultGridMaterial.mainColor = new BABYLON.Color3(.1, .1, .2);
    ground.material = defaultGridMaterial;
}


function CreateSkybox() {
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 500.0 }, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/skyboxes/skybox_01/sky", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;

    var defaultGridMaterial = new BABYLON.GridMaterial("default", scene);
    defaultGridMaterial.majorUnitFrequency = 10;
    defaultGridMaterial.backFaceCulling = false;
    defaultGridMaterial.gridRatio = 10;
    defaultGridMaterial.lineColor = new BABYLON.Color3(0, .5, 1);
    defaultGridMaterial.mainColor = new BABYLON.Color3(.1, .1, .2);
    skybox.material = defaultGridMaterial;
}


function CreateLevel(scene) {
    var totalRows = 12;
    var totalCols = 12;
    var totalTiles = 0;

    BABYLON.SceneLoader.ImportMesh("Cube", "assets/models/", "Tiles.gltf", scene, function (newMeshes) {
        var levlMapRoot = new BABYLON.TransformNode("levlMap");
        levlMapRoot.position = new BABYLON.Vector3(0, 0, 0);
        var pivotPos = new BABYLON.Vector3(0, 0, 0);
        pivotPos.z = -totalRows / 2;
        pivotPos.x = -totalCols / 2;
        for (let i = 0; i < totalRows; i++) {
            for (let j = 0; j < totalCols; j++) {
                var tilePos = new BABYLON.Vector3(0, 0, 0);
                tilePos.x = pivotPos.x + j;
                tilePos.z = pivotPos.z + i;
                tilePos.y = 0;
                var curChild = newMeshes[0].instantiateHierarchy();
                curChild.name = "Tile_" + i + "_" + j;
                curChild.position = tilePos;
                curChild.setParent(levlMapRoot);
                tile_array.push(curChild);
            }
        }
        for (let k = 0; k < newMeshes.length; k++) {
            newMeshes[k].isVisible = false;
        }
    });
    //CreatePlayer(scene);
}


function CreatePlayer(scene) {
    var totalPlayers = 2;

    BABYLON.SceneLoader.ImportMesh("Body", "assets/models/", "Robo.gltf", scene, function (newMeshes, transformNodes) {
        //console.log(newMeshes);
        //console.log(transformNodes);
        var pivotPos = new BABYLON.Vector3(0, 0, 0);
        //var player = new BABYLON.TransformNode("Player_");// + i + "_" + j);
        for (let i = 0; i < totalPlayers; i++) {
            newMeshes[0].setParent(null);
            var curChild = newMeshes[0].instantiateHierarchy();
            curChild.name = "Player_" + i;
            curChild.position.x = i * 3;
            curChild.position.z = i * 3;
            curChild.position.y = 0.5;
            curChild.scaling = new BABYLON.Vector3(playerScale, playerScale, playerScale);
            CreateParticles_02(curChild.position);
            if (i == 0) {
                player = curChild;
                console.log("player = " + player);
            }
        }
        for (let k = 0; k < newMeshes.length; k++) {
            newMeshes[k].isVisible = false;
        }
        console.log("player = " + player);
        engine.hideLoadingUI();
    });
}


function AddAudio(scene) {
    const musicBg = new BABYLON.Sound("musicBg", "assets/audios/chordz.mp3", scene, null, { loop: true, autoplay: true });
    const sfxClick = new BABYLON.Sound("sfxClick", "assets/audios/click.wav", scene, null, { loop: false, autoplay: false });
    setInterval(() => sfxClick.play(), 3000);
}


function CreateParticles_01() {
    // Emitter object
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
    var sphereMat = new BABYLON.StandardMaterial("coreMat", scene)
    sphereMat.diffuseColor = new BABYLON.Color3(0.1, 0.5, 1);
    sphereMat.specularColor = BABYLON.Color3.Black();

    sphere.material = sphereMat;

    var particleSystem = new BABYLON.ParticleSystem("particles", 1000, scene);
    particleSystem.particleTexture = new BABYLON.Texture("assets/textures/flare.png", scene);

    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.1;

    // Where the particles come from
    var meshEmitter = new BABYLON.MeshParticleEmitter(sphere);
    particleSystem.particleEmitterType = meshEmitter;

    particleSystem.emitter = sphere;

    // Life time of each particle (random between...
    particleSystem.minLifeTime = 1.0;
    particleSystem.maxLifeTime = 4.0;

    // Emission rate
    particleSystem.emitRate = 100;

    // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    // Set the gravity of all particles
    particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);

    // Speed
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 4;
    particleSystem.updateSpeed = 1 / 60;

    // Start the particle system
    particleSystem.start();
}


function CreateParticles_02(orgin) {
    // Create a particle system
    const particleSystem = new BABYLON.ParticleSystem("particles", 1000);

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("assets/textures/flare.png");

    particleSystem.emitter = orgin;

    //createConeEmitter
    var hemisphericEmitter = particleSystem.createCylinderEmitter();
    hemisphericEmitter.height = 0.1;
    hemisphericEmitter.radius = 0.2;
    hemisphericEmitter.radiusRange = 0.3;
    //hemisphericEmitter.angle = Math.PI;

    // particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2); // Starting all from
    // particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2); // To...

    particleSystem.minEmitPower = 0.3;
    particleSystem.maxEmitPower = 0.3;

    particleSystem.emitRate = 100;
    // size
    particleSystem.minSize = 0.02;
    particleSystem.maxSize = 0.13;
    // time
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 0.5;
    // colors
    particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 1.0);

    // particleSystem.addColorGradient(0, new BABYLON.Color4(1, 1, 1, 0), new BABYLON.Color4(1, 0, 1, 0)); //color range at start of particle lifetime
    // particleSystem.addColorGradient(0.4, new BABYLON.Color4(1, 1, 1, 0.5), new BABYLON.Color4(1, 0, 1, 0.5)); //color range at 2/5 of particle lifetime
    // particleSystem.addColorGradient(1.0, new BABYLON.Color4(1, 1, 1, 1), new BABYLON.Color4(1, 0, 1, 1)); //color range at end of particle lifetime

    // Set the gravity of all particles
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);

    particleSystem.start();
}


function CreateParticles_03() {
    BABYLON.ParticleHelper.CreateAsync("rain", scene, false).then((set) => {
        set.start();
    });
}


function CreateParticles_04(scene) {
    const SPS = new BABYLON.SolidParticleSystem("SPS", scene);
    const sphere = BABYLON.MeshBuilder.CreateSphere("s", {});
    const poly = BABYLON.MeshBuilder.CreatePolyhedron("p", { type: 2 });
    SPS.addShape(sphere, 20); // 20 spheres
    SPS.addShape(poly, 120); // 120 polyhedrons
    SPS.addShape(sphere, 80); // 80 other spheres
    sphere.dispose(); //dispose of original model sphere
    poly.dispose(); //dispose of original model poly

    const mesh = SPS.buildMesh(); // finally builds and displays the SPS mesh

    // initiate particles function
    SPS.initParticles = () => {
        for (let p = 0; p < SPS.nbParticles; p++) {
            const particle = SPS.particles[p];
            particle.position.x = BABYLON.Scalar.RandomRange(-20, 20);
            particle.position.y = BABYLON.Scalar.RandomRange(-20, 20);
            particle.position.z = BABYLON.Scalar.RandomRange(-20, 20);
            particle.color = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
            particle.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);
        }
    };

    //Update SPS mesh
    SPS.initParticles();
    SPS.setParticles();
}


// Creates the post process
function ApplyPostProcessing_01(camera) {
    var postProcess = new BABYLON.DigitalRainPostProcess("DigitalRain", camera,
        {
            font: "21px Monospace",
            mixToNormal: 0.7,
            mixToTile: 0.45
        });
}

