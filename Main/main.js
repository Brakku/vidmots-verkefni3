// 1. Initial Setup
import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

const sessionInit = {
    requiredFeatures: ['local'],
    domOverlay: { root: document.body }
};

async function startARSession(renderer, sessionInit) {
    try {
        const session = await navigator.xr.requestSession('immersive-ar', sessionInit);
        session.addEventListener('end', onSessionEnded);

        renderer.xr.setReferenceSpaceType('local');
        await renderer.xr.setSession(session);

        document.getElementById('ARButton').textContent = 'STOP AR';
        sessionInit.domOverlay.root.style.display = '';

        currentSession = session;
    } catch (error) {
        console.error('Failed to start AR session:', error);
    }
}

function onSessionEnded() {
    currentSession.removeEventListener('end', onSessionEnded);

    document.getElementById('ARButton').textContent = 'START AR';
    sessionInit.domOverlay.root.style.display = 'none';

    currentSession = null;
}

class ThreeContainer {
    constructor(id) {
        this.container = document.createElement('div');
        this.container.className = 'three-container';
        this.container.id = `${id}`;
        document.getElementById('grid-container').appendChild(this.container);



        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // camera
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.01, 100);
        this.camera.position.z = 1;

        // scene
        this.scene = new THREE.Scene();
        const color = new THREE.Color("rgb(255, 146, 146)");
        this.scene.background = color;
        this.scene.backgroundBlurriness = 0;

        const light = new THREE.DirectionalLight( 0xffffff, 6 );
        light.position.set( 0.5, 1, 0.5 );
        light.castShadow = true; // default false
        

        //Set up shadow properties for the light
        light.shadow.mapSize.width = 512; // default
        light.shadow.mapSize.height = 512; // default
        light.shadow.camera.near = 0.5; // default
        light.shadow.camera.far = 500; // default

        this.scene.add( light );


        // renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.domElement.id = 'thecanvas';
        this.container.appendChild(this.renderer.domElement);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

        this.renderer.gammaOutput = true;
        this.renderer.gammaFactor = 2.2

        // controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 0.2;
        this.controls.maxDistance = 500;
        this.controls.maxPolarAngle = 360;

        // Add button below the canvas
        const button = document.createElement('button');
        button.textContent = `Start AR ${id}`;
        button.style.position = 'relative';
        button.style.zIndex = 1;
        

        // Add event listener to the custom button
        button.addEventListener('click', () => {
            ARHandler.startARSession(id);
            console.log(`Custom button ${id} clicked`);
        });
        this.container.appendChild(button);

        // handle window resize
        window.addEventListener('resize', () => {
            if (!this.renderer.xr.isPresenting) {
                this.width = this.container.clientWidth - 10;
                this.height = this.container.clientHeight - 10;
                this.camera.aspect = this.width / this.height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(this.width, this.height);
            }
        });

        // animation
        this.animate();
    }

    addGeometry(geometryType, materialType, size, position, rotation, texturePath = null) {
        const geometry = new THREE[geometryType](size.width, size.height, size.depth);
        let material;

        if (texturePath) {
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load(texturePath);
            material = new THREE[materialType]({ map: texture });
        } else {
            material = new THREE[materialType]();
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        if (rotation) {
            mesh.rotation.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z));
        }
        mesh.castShadow = true; //default is false
        mesh.receiveShadow = true; //default
        this.scene.add(mesh);
    }

    animate() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate.bind(this));
    }
}

const containersList = [];

function addContainers(x) {
    for (let i = 0; i <= x; i++) {
        const container = new ThreeContainer(i);
        
        container.addGeometry('BoxGeometry', 'MeshStandardMaterial', { width: 20, height: 20, depth: 0.1 }, { x: 0, y: -1, z: 0 }, { x: 90, y: 0, z: 0 }, './wood-texture2.jpg');
        containersList.push(container);
    }
}

addContainers(2);

function addtocontaner(id, geometryType, materialType, size, position, rotation, texturePath = null) {
    containersList[id].addGeometry(geometryType, materialType, size, position, rotation, texturePath);
}

const ARHandler = {
    camera: null,
    scene: null,
    renderer: null,
    controller: null,
    model: null,
    currentSession: null,
    id: null,

    async startARSession(idin) {
        try {
            const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local'] });
            session.addEventListener('end', this.onSessionEnded.bind(this));

            this.renderer.xr.setReferenceSpaceType('local');
            await this.renderer.xr.setSession(session);

            this.currentSession = session;
            this.id = idin;

            // Add a history state to handle the back button
            history.pushState({ arSession: true }, '');
            window.addEventListener('popstate', this.onBackButtonPressed.bind(this));
        } catch (error) {
            console.error('Failed to start AR session:', error);
        }
    },

    onSessionEnded() {
        if (this.currentSession) {
            this.currentSession.removeEventListener('end', this.onSessionEnded.bind(this));
        }

        // Remove the model from the scene
        if (this.model) {
            this.scene.remove(this.model);
            this.model = null;
        }

        // Remove the exit button
        this.currentSession = null;

        // Remove the history state and event listener
        history.back();
        window.removeEventListener('popstate', this.onBackButtonPressed.bind(this));
    },

    onBackButtonPressed(event) {
        if (this.currentSession) {
            this.currentSession.end();
        }

        this.model = null;
    },

    init() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
        light.position.set(0.5, 1, 0.25);
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setAnimationLoop(this.animate.bind(this));
        this.renderer.xr.enabled = true;

        this.controller = this.renderer.xr.getController(0);
        console.log('Controller initialized:', this.controller);
        this.controller.addEventListener('select', this.onSelect.bind(this));
        this.scene.add(this.controller);

        window.addEventListener('resize', this.onWindowResize.bind(this));
    },

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    animate() {
        this.renderer.render(this.scene, this.camera);
    },

    onSelect() {
        console.log('onSelect event triggered');
        if (this.model) {
            this.model.position.set(0, 0, -0.3).applyMatrix4(this.controller.matrixWorld);
            this.model.quaternion.setFromRotationMatrix(this.controller.matrixWorld);
        }
        else{
            this.loadModel(this.id);
        }
    },

    loadModel(id) {
        console.log('loadModel');
        const loader = new GLTFLoader();
        const modelPaths = [
            './gtlfs/cube/cube.gltf',
            './gtlfs/underdasee/scene.gltf',
            './gtlfs/adamHead/adamHead.gltf'
        ];

        loader.load(modelPaths[id], (gltf) => {
            this.model = gltf.scene;
            this.model.scale.set(0.02, 0.02, 0.02); // Scale down the model
            this.model.position.set(0, 0, -0.3).applyMatrix4(this.controller.matrixWorld);
            this.model.quaternion.setFromRotationMatrix(this.controller.matrixWorld);
            this.scene.add(this.model);
        });
    }
};

ARHandler.init();

function addgtlf(id, url, position, rotation, scale = { x: 1, y: 1, z: 1 }) {
    const loader = new GLTFLoader();
    loader.load(url, function (gltf) {
        const model = gltf.scene;
        model.position.set(position.x, position.y, position.z);
        model.rotation.set(THREE.MathUtils.degToRad(rotation.x), THREE.MathUtils.degToRad(rotation.y), THREE.MathUtils.degToRad(rotation.z));
        model.scale.set(scale.x, scale.y, scale.z);
        model.castShadow = true; //default is false
        model.receiveShadow = true; //default
        containersList[id].scene.add(model);
    });
}

addgtlf(1, './gtlfs/underdasee/scene.gltf', { x: 0, y: 0, z: 0 }, { x: 0, y: -90, z: 0 },{ x: 0.08, y: 0.08, z: 0.08 });

addgtlf(2, './gtlfs/adamHead/adamHead.gltf', { x: 0, y: 0, z: 0 }, { x: 0, y: -90, z: 0 },{ x: 0.08, y: 0.08, z: 0.08 });


addtocontaner(0, 'BoxGeometry', 'MeshStandardMaterial', { width: 0.2, height: 0.2, depth: 0.2 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });


function logToConsoleOutput(message) {
    const consoleOutput = document.getElementById('console-output');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    consoleOutput.appendChild(messageElement);
}

const originalConsoleLog = console.log;
console.log = function (...args) {
    logToConsoleOutput(`Log: ${args.join(' ')}`);
    originalConsoleLog.apply(console, args);
};

const originalConsoleError = console.error;
console.error = function (...args) {
    logToConsoleOutput(`Error: ${args.join(' ')}`);
    originalConsoleError.apply(console, args);
};

const originalConsoleWarn = console.warn;
console.warn = function (...args) {
    logToConsoleOutput(`Warn: ${args.join(' ')}`);
    originalConsoleWarn.apply(console, args);
};

const originalConsoleInfo = console.info;
console.info = function (...args) {
    logToConsoleOutput(`Info: ${args.join(' ')}`);
    originalConsoleInfo.apply(console, args);
};

window.addEventListener('error', (event) => {
    logToConsoleOutput(`Error: ${event.message}`);
});

const originalAlert = window.alert;
window.alert = function (message) {
    logToConsoleOutput(`Alert: ${message}`);
    originalAlert(message);
};

function causeError() {
    nonExistentFunction(); // This will cause a ReferenceError
}
console.log("main.js loaded");