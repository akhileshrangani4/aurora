import * as THREE from 'three';

const GAME_HEIGHT = 14; // world units visible vertically

export function createRenderer(): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1); // 1:1 for crisp pixel art
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera(): THREE.OrthographicCamera {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.OrthographicCamera(
    -GAME_HEIGHT * aspect / 2, GAME_HEIGHT * aspect / 2,
    GAME_HEIGHT / 2, -GAME_HEIGHT / 2,
    0.1, 100
  );
  camera.position.set(0, 50, 0); // high above, looking down
  camera.lookAt(0, 0, 0);
  return camera;
}

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12); // very dark blue-black
  // Dim emergency ambient light
  const ambient = new THREE.AmbientLight(0x1a1a2e, 0.3);
  scene.add(ambient);
  return scene;
}

export function handleResize(camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer): void {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -GAME_HEIGHT * aspect / 2;
  camera.right = GAME_HEIGHT * aspect / 2;
  camera.top = GAME_HEIGHT / 2;
  camera.bottom = -GAME_HEIGHT / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export { GAME_HEIGHT };
