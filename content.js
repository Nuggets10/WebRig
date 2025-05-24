import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 3);

let isPerspective = true;

const orthoCamera = new THREE.OrthographicCamera(
  window.innerWidth / -200,
  window.innerWidth / 200,
  window.innerHeight / 200,
  window.innerHeight / -200,
  0.1,
  1000
);
orthoCamera.position.copy(camera.position);
orthoCamera.lookAt(scene.position);

document.getElementById("toggle-camera").addEventListener("click", () => {
  if (isPerspective) {
    orthoCamera.position.copy(camera.position);
    orthoCamera.rotation.copy(camera.rotation);
    controls.object = orthoCamera;
  } else {
    camera.position.copy(orthoCamera.position);
    camera.rotation.copy(orthoCamera.rotation);
    controls.object = camera;
  }
  isPerspective = !isPerspective;
});

function getCurrentCamera() {
  return isPerspective ? camera : orthoCamera;
}


let object;
const verticesElement = document.getElementById("vertices");
const trianglesElement = document.getElementById("triangles");
const sizeXElement = document.getElementById("sizeX");
const sizeYElement = document.getElementById("sizeY");
const sizeZElement = document.getElementById("sizeZ");
const fileSizeElement = document.getElementById("fileSize")

const loader = new GLTFLoader();

function roundNumber(number, digits) {
            var multiple = Math.pow(10, digits);
            var rndedNum = Math.round(number * multiple) / multiple;
            return rndedNum;
        }

        function generateGridTexture() {
  const size = 512;
  const divisions = 16;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8f8f8f';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  const step = size / divisions;

  for (let i = 0; i <= divisions; i++) {
    const pos = i * step;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}


function countVerticesAndTriangles(object3D) {
  let totalVertices = 0;
  let totalTriangles = 0;
  let fileSize = 0;

  object3D.traverse((child) => {
    if (child.isMesh) {
      const geometry = child.geometry;
      totalVertices += geometry.attributes.position.count;

      if (geometry.index) {
        totalTriangles += geometry.index.count / 3;
      } else {
        totalTriangles += geometry.attributes.position.count / 3;
      }

      fileSize = [(totalVertices * 32) + (totalTriangles * 12)] / 1048576
      fileSize = roundNumber(fileSize, 2)
    }
  });

  return { vertices: totalVertices, triangles: totalTriangles, fileSize: fileSize };
}

function getModelSize(object3D) {
  const box = new THREE.Box3().setFromObject(object3D);
  const size = new THREE.Vector3();
  box.getSize(size);
  return size;
}

loader.load(
  "models/model.gltf",
  function (gltf) {
    object = gltf.scene;
    scene.add(object);
    object.position.y -= 0.8;
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(500, 500, 500);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const gridTexture = generateGridTexture();
const planeGeometry = new THREE.PlaneGeometry(6, 6);
const planeMaterial = new THREE.MeshStandardMaterial({ map: gridTexture });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -1;
plane.receiveShadow = true;

scene.add(plane);


renderer.shadowMap.enabled = true;
topLight.castShadow = true;

const controls = new OrbitControls(camera, renderer.domElement);

function computeMeshVolume(mesh) {
  const geometry = mesh.geometry;
  let volume = 0;

  const posAttr = geometry.attributes.position;
  const index = geometry.index;

  function signedVolumeOfTriangle(p1, p2, p3) {
    return p1.dot(p2.cross(p3)) / 6.0;
  }

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);

      const p1 = new THREE.Vector3().fromBufferAttribute(posAttr, a);
      const p2 = new THREE.Vector3().fromBufferAttribute(posAttr, b);
      const p3 = new THREE.Vector3().fromBufferAttribute(posAttr, c);

      volume += signedVolumeOfTriangle(p1, p2, p3);
    }
  } else {
    for (let i = 0; i < posAttr.count; i += 3) {
      const p1 = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      const p2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
      const p3 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);

      volume += signedVolumeOfTriangle(p1, p2, p3);
    }
  }

  return Math.abs(volume);
}

function computeModelVolume(object3D) {
  let totalVolume = 0;
  object3D.traverse((child) => {
    if (child.isMesh) {
      totalVolume += computeMeshVolume(child);
    }
  });
  return totalVolume;
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, getCurrentCamera());

  if (object) {
    const counts = countVerticesAndTriangles(object);
    verticesElement.textContent = `Vertices: ${counts.vertices}`;
    trianglesElement.textContent = `Triangles: ${counts.triangles}`;
    fileSizeElement.textContent = `File size: ${counts.fileSize} MB`;

    const size = getModelSize(object);
    sizeXElement.textContent = `Width (X): ${size.x.toFixed(2)} m`;
    sizeYElement.textContent = `Height (Y): ${size.y.toFixed(2)} m`;
    sizeZElement.textContent = `Depth (Z): ${size.z.toFixed(2)} m`;

    const volume = computeModelVolume(object);
    const volumeRounded = volume.toFixed(3);
    // Assicurati che esista l'elemento HTML con id 'volume'
    const volumeElement = document.getElementById("volume");
    if (volumeElement) {
      volumeElement.textContent = `Volume: ${volumeRounded} m³`;
    }
  }
}

window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;

  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  orthoCamera.left = window.innerWidth / -200;
  orthoCamera.right = window.innerWidth / 200;
  orthoCamera.top = window.innerHeight / 200;
  orthoCamera.bottom = window.innerHeight / -200;
  orthoCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});


animate();
