var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function () {
    return new BABYLON.Engine(canvas,
        true,
        {
            preserveDrawingBuffer: true,
            stencil: true,
            disableWebGL2Support: false
        });
};

initFunction = async function () {
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

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, 0, 0));
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0));

    //const box = BABYLON.MeshBuilder.CreateBox("box", {});
    //box.position.y = 0.5;

    var tile_array = [];
    var totalRows = 5;
    var totalCols = 5;
    var totalTiles = 0;
    // var tileMesh = BABYLON.SceneLoader.ImportMeshAsync("Cube", "assets/models/", "Tiles.gltf").then((result) => {
    //     console.log(result);
    //     console.log(scene);
    //     const tile = scene.getMeshByName("__root__");
    //     tile.position.x = 2;
    //     tile.scaling = new BABYLON.Vector3(.5,.5,.5);
    // });

    BABYLON.SceneLoader.ImportMesh("Cube", "assets/models/", "Tiles.gltf", scene, function (newMeshes) {
        const tile = scene.getMeshByName("__root__");
        for (let i = 0; i < totalRows; i++) {
            for (let j = 0; j < totalCols; j++) {
                var curTile = tile.clone("tile_" + i);
                curTile.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
                curTile.position.z = i * 1.1 - totalRows / 2;
                curTile.position.x = j * 1.1 - totalCols / 2;
                curTile.position.y = 0;
                tile_array.push(curTile);
            }
        }
        tile.setEnabled(false);
        //console.log(tile_array);
    });

    BABYLON.SceneLoader.ImportMesh("Body", "assets/models/", "Robo.gltf", scene, function (newMeshes) {
        const tile = scene.getMeshByName("__root__");
        //console.log(newMeshes);
        for (let i = 0; i < totalRows; i++) {
            var curTile = newMeshes[0].clone("Robo_" + i);
            curTile.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
            curTile.position.x = i * 1.1 - totalRows / 2;
            curTile.position.y = 1;
            CreateParticles_02(curTile.position);
            //curTile.position.y = 1;
            //tile_array.push(curTile);
        }
        newMeshes[0].setEnabled(false);
        //console.log(tile_array);
        engine.hideLoadingUI();
    });

    // var tileMesh = await BABYLON.SceneLoader.ImportMeshAsync("Cube", "assets/models/", "Tiles.gltf");
    // var curTile = tileMesh.createInstance("tile_2");

    CreateGroundGrid();

    // Skybox
    CreateSkybox(scene);

    // Mouse
    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                console.log("POINTER DOWN");
                break;
            case BABYLON.PointerEventTypes.POINTERUP:
                console.log("POINTER UP");
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
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                console.log("KEY UP: ", kbInfo.event.keyCode);
                break;
        }
    });

    //CreateParticles_02();
    // rain particles
    //CreateParticles_03();
    CreateParticles_04(scene);

    // Add audio to game
    //AddAudio(scene);

    // Post processing
    //ApplyPostProcessing_01(camera);

    // Debug Layer
    scene.debugLayer.show();

    return scene;
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


function CreateSkybox(scene){
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 500.0 }, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/skyboxes/skybox_01/sky", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
}


function AddAudio(scene){
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

    // Position where the particles are emiited from
    particleSystem.emitter = orgin;

    particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2); // Starting all from
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2); // To...

    particleSystem.minSize = 0.01;
    particleSystem.maxSize = 0.1;

    particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

    // particleSystem.addColorGradient(0, new BABYLON.Color4(1, 1, 1, 0), new BABYLON.Color4(1, 0, 1, 0)); //color range at start of particle lifetime
    // particleSystem.addColorGradient(0.4, new BABYLON.Color4(1, 1, 1, 0.5), new BABYLON.Color4(1, 0, 1, 0.5)); //color range at 2/5 of particle lifetime
    // particleSystem.addColorGradient(1.0, new BABYLON.Color4(1, 1, 1, 1), new BABYLON.Color4(1, 0, 1, 1)); //color range at end of particle lifetime

    // Set the gravity of all particles
    particleSystem.gravity = new BABYLON.Vector3(0, -10, 0);

    particleSystem.emitRate = 100;

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
            font: "16px Monospace",
            mixToNormal: 0.7,
            mixToTile: 0.7
        });
}

