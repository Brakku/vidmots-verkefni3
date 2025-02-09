// 1. Initial Setup
import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

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
        let controller;
        let gmodel = null;
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
        button.textContent = 'Start AR';
        button.style.position = 'relative';
        button.style.zIndex = 1;
        this.container.appendChild(button);

        // Add event listener to the custom button
        button.addEventListener('click', () => {
            startARSession(this.renderer, {});
            console.log("Custom button clicked");
        });

        const loader = new GLTFLoader();
        function onSelect() {
            
            if (!gmodel) {
                loader.load('./gtlfs/adamHead/adamHead.gltf', function (gltf) {
                    gmodel = gltf.scene;
                    gmodel.scale.set(0.1, 0.1, 0.1); // Scale the model to be smaller
                    gmodel.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
                    gmodel.quaternion.setFromRotationMatrix(controller.matrixWorld);
                    scene.add(model);
                });
            } else {
                gmodel.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
                gmodel.quaternion.setFromRotationMatrix(controller.matrixWorld);
            }
        }
    
        controller = this.renderer.xr.getController(0);
        controller.addEventListener('select', onSelect);
        this.scene.add(controller);

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

addContainers(4);

function addtocontaner(id, geometryType, materialType, size, position, rotation, texturePath = null) {
    containersList[id].addGeometry(geometryType, materialType, size, position, rotation, texturePath);
}


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