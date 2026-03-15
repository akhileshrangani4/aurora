import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier2d-compat';
import type { RoomDef } from '../types';
import { createColoredRect } from '../sprites';
import { createWallCollider } from '../physics';

export interface RoomData {
  meshes: THREE.Mesh[];
  bodies: RAPIER.RigidBody[];
  colliders: RAPIER.Collider[];
  lights: THREE.Light[];
}

export function buildRoom(
  roomDef: RoomDef,
  world: RAPIER.World,
  scene: THREE.Scene,
): RoomData {
  const meshes: THREE.Mesh[] = [];
  const bodies: RAPIER.RigidBody[] = [];
  const colliders: RAPIER.Collider[] = [];
  const lights: THREE.Light[] = [];

  // Floor plane
  const floor = createColoredRect(roomDef.width, roomDef.height, 0x1a1a2e);
  floor.position.set(roomDef.width / 2, 0, -roomDef.height / 2);
  scene.add(floor);
  meshes.push(floor);

  // Process tiles
  for (let y = 0; y < roomDef.height; y++) {
    for (let x = 0; x < roomDef.width; x++) {
      const tileValue = roomDef.tiles[y][x];

      if (tileValue === 1 || tileValue === 3) {
        // Wall or damaged wall — create mesh + collider
        const color = tileValue === 1 ? 0x334455 : 0x2a3344;
        const wallMesh = createColoredRect(1, 1, color);
        wallMesh.position.set(x + 0.5, 0.15, -(y + 0.5));
        scene.add(wallMesh);
        meshes.push(wallMesh);

        // Physics collider for wall
        const { body, collider } = createWallCollider(world, x + 0.5, y + 0.5, 0.5, 0.5);
        bodies.push(body);
        colliders.push(collider);
      } else if (tileValue === 2) {
        // Door tile — visual only, no collider (player can walk through)
        const doorMesh = createColoredRect(1, 1, 0x00cccc);
        doorMesh.position.set(x + 0.5, 0.15, -(y + 0.5));
        scene.add(doorMesh);
        meshes.push(doorMesh);
      }
    }
  }

  // Emergency lighting: red at one corner, blue at opposite corner
  const redLight = new THREE.PointLight(0xff2200, 0.4, 8);
  redLight.position.set(1.5, 1.5, -1.5);
  scene.add(redLight);
  lights.push(redLight);

  const blueLight = new THREE.PointLight(0x0044ff, 0.3, 8);
  blueLight.position.set(roomDef.width - 1.5, 1.5, -(roomDef.height - 1.5));
  scene.add(blueLight);
  lights.push(blueLight);

  return { meshes, bodies, colliders, lights };
}

export function destroyRoom(
  roomData: RoomData,
  world: RAPIER.World,
  scene: THREE.Scene,
): void {
  // Remove all meshes from scene
  for (const mesh of roomData.meshes) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => m.dispose());
    } else {
      mesh.material.dispose();
    }
  }

  // Remove lights from scene
  for (const light of roomData.lights) {
    scene.remove(light);
  }

  // Remove all rigid bodies from world (colliders are removed automatically)
  for (const body of roomData.bodies) {
    world.removeRigidBody(body);
  }
}
