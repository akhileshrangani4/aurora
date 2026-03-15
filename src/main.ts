import { createRenderer, createCamera, createScene, handleResize } from './renderer';
import { initPhysics } from './physics';
import { createInputHandler } from './input';
import { startGameLoop } from './loop';
import type { GameSystems } from './types';

async function init(): Promise<void> {
  // 1. Physics first (WASM must load before anything)
  const { world, characterController, RAPIER } = await initPhysics();

  // 2. Rendering
  const renderer = createRenderer();
  const scene = createScene();
  const camera = createCamera();

  // 3. Input
  const input = createInputHandler();

  // 4. Handle window resize
  window.addEventListener('resize', () => handleResize(camera, renderer));

  // 5. Systems bundle (passed to subsystems in later plans)
  const systems: GameSystems = {
    renderer, scene, camera, world, characterController, input,
  };

  // 6. Start game loop
  startGameLoop({
    processInput: () => {
      // Input already updates via event listeners
    },
    fixedUpdate: (dt: number) => {
      world.step();
    },
    render: () => {
      renderer.render(scene, camera);
    },
  });

  console.log('Aurora initialized. Systems ready.');
}

init().catch(console.error);
