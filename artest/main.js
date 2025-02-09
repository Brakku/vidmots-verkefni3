import * as THREE from 'three';
//import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let controller;
let model = null;
let currentSession = null;


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

init();

function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    //

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.xr.enabled = true;
    //container.appendChild(renderer.domElement);

    //

    //document.body.appendChild(ARButton.createButton(renderer));

    const customButton = document.createElement('button');
    customButton.textContent = 'Start AR';

    document.body.appendChild(customButton);

    // Add event listener to the custom button
    customButton.addEventListener('click', () => {
        startARSession(renderer, {});
        console.log("Custom button clicked");
    });

    //

    const loader = new GLTFLoader();

    function onSelect() {
        if (!model) {
            loader.load('./gtlfs/adamHead/adamHead.gltf', function (gltf) {
                model = gltf.scene;
                model.scale.set(0.1, 0.1, 0.1); // Scale the model to be smaller
                model.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
                model.quaternion.setFromRotationMatrix(controller.matrixWorld);
                scene.add(model);
            });
        } else {
            model.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
            model.quaternion.setFromRotationMatrix(controller.matrixWorld);
        }
    }

    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    //

    window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function animate() {

    renderer.render(scene, camera);

}


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