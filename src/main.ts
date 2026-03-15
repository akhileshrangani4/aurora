import { createRenderer, createCamera, createScene, handleResize } from './renderer';
import { initPhysics } from './physics';
import { createInputHandler } from './input';
import { startGameLoop } from './loop';
import { createPlayer, updatePlayer, syncPlayerVisuals } from './entities/player';
import { buildRoom } from './rooms/roomBuilder';
import { ROOMS } from './rooms/layouts';
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

  // 5. Build reactor room
  const reactorDef = ROOMS['reactor'];
  const roomData = buildRoom(reactorDef, world, scene);

  // 6. Create player at reactor's spawn point
  const player = createPlayer(world, characterController, scene, reactorDef.spawnPoint!.x, reactorDef.spawnPoint!.y);

  // 7. Position camera to reactor's camera center
  camera.position.x = reactorDef.cameraCenter.x;
  camera.position.z = -reactorDef.cameraCenter.y; // Rapier Y -> Three.js -Z
  camera.lookAt(reactorDef.cameraCenter.x, 0, -reactorDef.cameraCenter.y);

  // 8. Systems bundle (passed to subsystems in later plans)
  const systems: GameSystems = {
    renderer, scene, camera, world, characterController, input,
  };

  // 9. Start game loop
  startGameLoop({
    processInput: () => {
      // Input already updates via event listeners
    },
    fixedUpdate: (dt: number) => {
      updatePlayer(player, input, characterController, dt);
      world.step();
    },
    render: () => {
      syncPlayerVisuals(player);
      renderer.render(scene, camera);
    },
  });

  console.log('Aurora initialized. Reactor chamber loaded.');
}

init().catch(console.error);
