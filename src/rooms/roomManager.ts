import type { GameSystems } from '../types';
import type { Player } from '../entities/player';
import { syncPlayerVisuals } from '../entities/player';
import { buildRoom, destroyRoom } from './roomBuilder';
import type { RoomData } from './roomBuilder';
import { ROOMS } from './layouts';
import { createDoors, updateDoors, destroyDoors } from '../entities/door';
import type { DoorEntity } from '../entities/door';
import { createInteractables, updateInteractables, destroyInteractables } from '../entities/interactable';
import type { InteractableEntity } from '../entities/interactable';

export interface RoomManager {
  currentRoom: string;
  loadRoom: (roomId: string, spawnX: number, spawnY: number) => void;
  update: (dt: number) => void;
  isTransitioning: () => boolean;
}

export function createRoomManager(
  systems: GameSystems,
  playerEntity: Player,
): RoomManager {
  const { scene, camera, world } = systems;

  let currentRoom = '';
  let currentRoomData: RoomData | null = null;
  let currentDoors: DoorEntity[] = [];
  let currentInteractables: InteractableEntity[] = [];

  // Camera transition state
  let transitionProgress = 1; // start complete (no initial transition)
  let cameraFrom = { x: 0, z: 0 };
  let cameraTo = { x: 0, z: 0 };

  function loadRoom(roomId: string, spawnX: number, spawnY: number): void {
    // Clean up old room
    if (currentRoomData) {
      destroyRoom(currentRoomData, world, scene);
      destroyDoors(currentDoors, world, scene);
      destroyInteractables(currentInteractables, world, scene);
      currentInteractables = [];
    }

    const roomDef = ROOMS[roomId];
    if (!roomDef) {
      console.error(`Room not found: ${roomId}`);
      return;
    }

    // Build new room
    currentRoomData = buildRoom(roomDef, world, scene);
    currentDoors = createDoors(roomDef, world, scene, playerEntity.collider);
    currentInteractables = createInteractables(roomDef, world, scene, playerEntity.collider);

    // Teleport player
    playerEntity.body.setTranslation({ x: spawnX, y: spawnY }, true);
    syncPlayerVisuals(playerEntity);

    // Start camera transition
    cameraFrom = { x: camera.position.x, z: camera.position.z };
    cameraTo = { x: roomDef.cameraCenter.x, z: -roomDef.cameraCenter.y };
    transitionProgress = 0;

    currentRoom = roomId;
  }

  function update(dt: number): void {
    // Camera transition
    if (transitionProgress < 1) {
      transitionProgress += dt / 0.4; // 0.4 second pan duration
      const t = 1 - Math.pow(1 - Math.min(transitionProgress, 1), 3); // cubic ease-out
      camera.position.x = cameraFrom.x + (cameraTo.x - cameraFrom.x) * t;
      camera.position.z = cameraFrom.z + (cameraTo.z - cameraFrom.z) * t;
      camera.lookAt(camera.position.x, 0, camera.position.z);
    }

    // Update doors
    updateDoors(currentDoors, world, playerEntity.collider);

    // Update interactables
    updateInteractables(currentInteractables, world, playerEntity.collider);

    // Check door transitions (only when not transitioning)
    if (transitionProgress >= 1) {
      const playerPos = playerEntity.body.translation();
      for (const door of currentDoors) {
        if (door.def.locked) continue;
        if (!door.isOpen) continue;

        const dx = playerPos.x - (door.def.tileX + 0.5);
        const dy = playerPos.y - (door.def.tileY + 0.5);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.5) {
          loadRoom(door.def.leadsTo, door.def.spawnAtX, door.def.spawnAtY);
          return; // exit update after loading new room
        }
      }
    }
  }

  function isTransitioning(): boolean {
    return transitionProgress < 1;
  }

  return {
    get currentRoom() { return currentRoom; },
    set currentRoom(val: string) { currentRoom = val; },
    loadRoom,
    update,
    isTransitioning,
  };
}
