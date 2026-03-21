import { createRenderer, createCamera, createScene, handleResize } from './renderer';
import { initPhysics, createCollisionAudioSystem } from './physics';
import { createInputHandler } from './input';
import { startGameLoop } from './loop';
import { createPlayer, updatePlayer, syncPlayerVisuals } from './entities/player';
import { ROOMS } from './rooms/layouts';
import { createRoomManager } from './rooms/roomManager';
import type { GameSystems } from './types';

function createCollisionSoundPlayer(): (volume: number) => void {
  let audioContext: AudioContext | null = null;

  return (volume: number) => {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    audioContext ??= new AudioContextCtor();
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(70, audioContext.currentTime + 0.08);

    gain.gain.setValueAtTime(Math.max(0.02, volume * 0.12), audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.08);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  };
}

async function init(): Promise<void> {
  console.log('[Aurora] Starting init...');
  // 1. Physics first (WASM must load before anything)
  const { world, characterController } = await initPhysics();
  console.log('[Aurora] Physics initialized');

  // 2. Rendering
  const renderer = createRenderer();
  const scene = createScene();
  const camera = createCamera();

  // 3. Input
  const input = createInputHandler();

  // 4. Handle window resize
  window.addEventListener('resize', () => handleResize(camera, renderer));

  // 5. Systems bundle
  const systems: GameSystems = {
    renderer, scene, camera, world, characterController, input,
  };

  // 6. Create player at reactor's spawn point
  const reactorDef = ROOMS['reactor'];
  const collisionAudio = createCollisionAudioSystem(createCollisionSoundPlayer());
  const player = createPlayer(
    world,
    characterController,
    scene,
    reactorDef.spawnPoint!.x,
    reactorDef.spawnPoint!.y,
    collisionAudio,
  );

  // 7. Create room manager and load initial room
  const roomManager = createRoomManager(systems, player);
  roomManager.loadRoom('reactor', reactorDef.spawnPoint!.x, reactorDef.spawnPoint!.y);

  // 8. Start game loop
  startGameLoop({
    processInput: () => {
      // Input already updates via event listeners
    },
    fixedUpdate: (dt: number) => {
      if (!roomManager.isTransitioning()) {
        updatePlayer(player, input, characterController, dt);
      }
      world.step();
      roomManager.update(dt);
    },
    render: () => {
      syncPlayerVisuals(player);
      renderer.render(scene, camera);
    },
  });

  console.log('[Aurora] Initialized. Camera at', camera.position.x, camera.position.y, camera.position.z);
  console.log('[Aurora] Station navigation ready.');
}

init().catch(console.error);
