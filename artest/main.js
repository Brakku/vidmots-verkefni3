import * as THREE from 'three';
//import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/webxr/ARButton.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let controller;
let model = null;
let currentSession = null;


class ARButton {

    static createButton(renderer, sessionInit = {}) {

        const button = document.createElement('button');

        function showStartAR() {

            if (sessionInit.domOverlay === undefined) {

                var overlay = document.createElement('div');
                overlay.style.display = 'none';
                document.body.appendChild(overlay);

                var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', 38);
                svg.setAttribute('height', 38);
                svg.style.position = 'absolute';
                svg.style.right = '20px';
                svg.style.top = '20px';
                svg.addEventListener('click', function () {

                    currentSession.end();

                });
                overlay.appendChild(svg);

                var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M 12,12 L 28,28 M 28,12 12,28');
                path.setAttribute('stroke', '#fff');
                path.setAttribute('stroke-width', 2);
                svg.appendChild(path);

                if (sessionInit.optionalFeatures === undefined) {

                    sessionInit.optionalFeatures = [];

                }

                sessionInit.optionalFeatures.push('dom-overlay');
                sessionInit.domOverlay = { root: overlay };

            }

            button.style.display = '';

            button.style.cursor = 'pointer';
            button.style.left = 'calc(50% - 50px)';
            button.style.width = '100px';

            button.textContent = 'START AR';

            button.onmouseenter = function () {

                button.style.opacity = '1.0';

            };

            button.onmouseleave = function () {

                button.style.opacity = '0.5';

            };

            button.onclick = function () {

                if (currentSession === null) {

                    startARSession(renderer, sessionInit);

                } else {

                    currentSession.end();

                }

            };

        }

        function disableButton() {

            button.style.display = '';

            button.style.cursor = 'auto';
            button.style.left = 'calc(50% - 75px)';
            button.style.width = '150px';

            button.onmouseenter = null;
            button.onmouseleave = null;

            button.onclick = null;

        }

        function showARNotSupported() {

            disableButton();

            button.textContent = 'AR NOT SUPPORTED';

        }

        function stylizeElement(element) {

            element.style.position = 'absolute';
            element.style.bottom = '20px';
            element.style.padding = '12px 6px';
            element.style.border = '1px solid #fff';
            element.style.borderRadius = '4px';
            element.style.background = 'rgba(0,0,0,0.1)';
            element.style.color = '#fff';
            element.style.font = 'normal 13px sans-serif';
            element.style.textAlign = 'center';
            element.style.opacity = '0.5';
            element.style.outline = 'none';
            element.style.zIndex = '999';

        }

        if ('xr' in navigator) {

            button.id = 'ARButton';
            button.style.display = 'none';

            stylizeElement(button);

            navigator.xr.isSessionSupported('immersive-ar').then(function (supported) {

                supported ? showStartAR() : showARNotSupported();

            }).catch(showARNotSupported);

            return button;

        } else {

            const message = document.createElement('a');

            if (window.isSecureContext === false) {

                message.href = document.location.href.replace(/^http:/, 'https:');
                message.innerHTML = 'WEBXR NEEDS HTTPS'; // TODO Improve message

            } else {

                message.href = 'https://immersiveweb.dev/';
                message.innerHTML = 'WEBXR NOT AVAILABLE';

            }

            message.style.left = 'calc(50% - 90px)';
            message.style.width = '180px';
            message.style.textDecoration = 'none';

            stylizeElement(message);

            return message;

        }

    }

}

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