import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier2d-compat';
import type { RoomDef } from '../types';
import { createColoredRect, createWallTile, createDamagedWallTile, createFloorTile, createDoorTile, createLockedDoorTile } from '../sprites';
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

  // Process tiles — pixel art for every tile
  for (let y = 0; y < roomDef.height; y++) {
    for (let x = 0; x < roomDef.width; x++) {
      const tileValue = roomDef.tiles[y][x];

      if (tileValue === 1) {
        // Wall tile — pixel art steel panel
        const wallMesh = createWallTile();
        wallMesh.position.set(x + 0.5, 0.2, -(y + 0.5));
        scene.add(wallMesh);
        meshes.push(wallMesh);

        const { body, collider } = createWallCollider(world, x + 0.5, y + 0.5, 0.5, 0.5);
        bodies.push(body);
        colliders.push(collider);
      } else if (tileValue === 3) {
        // Damaged wall — cracks and exposed wiring
        const wallMesh = createDamagedWallTile();
        wallMesh.position.set(x + 0.5, 0.2, -(y + 0.5));
        scene.add(wallMesh);
        meshes.push(wallMesh);

        const { body, collider } = createWallCollider(world, x + 0.5, y + 0.5, 0.5, 0.5);
        bodies.push(body);
        colliders.push(collider);
      } else if (tileValue === 2) {
        // Door tile — cyan sci-fi sliding door
        const doorMesh = createDoorTile();
        doorMesh.position.set(x + 0.5, 0.2, -(y + 0.5));
        scene.add(doorMesh);
        meshes.push(doorMesh);
      } else if (tileValue === 0) {
        // Floor tile — metal grating
        const floorMesh = createFloorTile();
        floorMesh.position.set(x + 0.5, 0.01, -(y + 0.5));
        scene.add(floorMesh);
        meshes.push(floorMesh);
      }
    }
  }

  // Emergency lighting: red at one corner, blue at opposite corner
  const redLight = new THREE.PointLight(0xff3300, 1.0, 12);
  redLight.position.set(1.5, 2, -1.5);
  scene.add(redLight);
  lights.push(redLight);

  const blueLight = new THREE.PointLight(0x2266ff, 0.8, 12);
  blueLight.position.set(roomDef.width - 1.5, 2, -(roomDef.height - 1.5));
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
