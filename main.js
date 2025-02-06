import { io } from "socket.io-client";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const socket = io("http://localhost:3000"); // Connect to server

// Setup Three.js scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010803);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Ground
const groundSize = 100;
const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Load car model
const loader = new GLTFLoader();
let players = {};
const boundary = groundSize / 2 - 2; // Set boundary limits

socket.on("updatePlayers", (serverPlayers) => {
  for (const id in serverPlayers) {
    if (!players[id]) {
      loader.load("car.glb", (gltf) => {
        players[id] = gltf.scene;
        scene.add(players[id]);
      });
    }
  }

  for (const id in players) {
    if (serverPlayers[id]) {
      players[id].position.set(
        serverPlayers[id].x,
        serverPlayers[id].y,
        serverPlayers[id].z
      );
      players[id].rotation.y = serverPlayers[id].rotationY;
    } else {
      scene.remove(players[id]);
      delete players[id];
    }
  }
});

// Movement handling
const keys = { w: false, a: false, s: false, d: false };

document.addEventListener("keydown", (event) => {
  if (keys.hasOwnProperty(event.key)) keys[event.key] = true;
});

document.addEventListener("keyup", (event) => {
  if (keys.hasOwnProperty(event.key)) keys[event.key] = false;
});

let lastSentTime = 0;

function animate() {
  requestAnimationFrame(animate);

  if (players[socket.id]) {
    let car = players[socket.id];
    const speed = 0.5;
    const rotationSpeed = 0.05;

    let moved = false;
    let newX = car.position.x;
    let newZ = car.position.z;

    if (keys.w) {
      newX += Math.sin(car.rotation.y) * speed;
      newZ += Math.cos(car.rotation.y) * speed;
      moved = true;
    }
    if (keys.s) {
      newX -= Math.sin(car.rotation.y) * speed;
      newZ -= Math.cos(car.rotation.y) * speed;
      moved = true;
    }
    if (keys.w || keys.s) {
      if (keys.a) {
        car.rotation.y += rotationSpeed;
      }
      if (keys.d) {
        car.rotation.y -= rotationSpeed;
      }
    }

    // **Wall Collision Check**
    if (Math.abs(newX) <= boundary && Math.abs(newZ) <= boundary) {
      car.position.x = newX;
      car.position.z = newZ;
    }

    // **Only send updates every 50ms to prevent server spam**
    const now = Date.now();
    if (moved && now - lastSentTime > 50) {
      socket.emit("move", {
        x: car.position.x,
        z: car.position.z,
        rotationY: car.rotation.y,
      });
      lastSentTime = now;
    }

    // **Smooth camera follow**
    const cameraOffset = new THREE.Vector3(0, 7, -6);
    const cameraPosition = cameraOffset.clone().applyMatrix4(car.matrixWorld);
    camera.position.lerp(cameraPosition, 0.1);
    camera.lookAt(car.position);
  }

  renderer.render(scene, camera);
}

animate();
