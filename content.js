import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js"

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

let object;
let controls;

const loader = new GLTFLoader();

loader.load(
    "models/model.gltf",
    function (gltf) {
        object = gltf.scene;
        scene.add(object);
    },
    function (xhr) {
        console.log((xhr.loader / xhr.total * 100) + "% loaded");
    },
    function (error) {
        console.error(error)
    }
);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

document.getElementById("container3D").appendChild(renderer.domElement)

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 500)
topLight.castShadow = true;
scene.add(topLight);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera)
}

window.addEventListener("resize", function () {
    camera.aspect = this.window.innerWidth / this.window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(this.window.innerWidth, this.window.innerHeight);
});

animate();