import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier2d-compat';
import type { RoomDef } from '../types';
import {
  createColoredRect, createWallTile, createDamagedWallTile, createFloorTile,
  createDoorTile, createLockedDoorTile, createPipeTile, createCrateTile,
  createVentTile, createMachineryTile, createReactorCoreTile,
} from '../sprites';
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
      } else if (tileValue === 4) {
        // Pipe — walkable decoration (no collider)
        const pipeMesh = createPipeTile();
        pipeMesh.position.set(x + 0.5, 0.1, -(y + 0.5));
        scene.add(pipeMesh);
        meshes.push(pipeMesh);
        // Floor underneath
        const f = createFloorTile();
        f.position.set(x + 0.5, 0.01, -(y + 0.5));
        scene.add(f);
        meshes.push(f);
      } else if (tileValue === 5) {
        // Crate — solid, blocks player
        const crateMesh = createCrateTile();
        crateMesh.position.set(x + 0.5, 0.2, -(y + 0.5));
        scene.add(crateMesh);
        meshes.push(crateMesh);
        const { body, collider } = createWallCollider(world, x + 0.5, y + 0.5, 0.45, 0.45);
        bodies.push(body);
        colliders.push(collider);
      } else if (tileValue === 6) {
        // Vent — floor decoration, walkable
        const ventMesh = createVentTile();
        ventMesh.position.set(x + 0.5, 0.02, -(y + 0.5));
        scene.add(ventMesh);
        meshes.push(ventMesh);
      } else if (tileValue === 7) {
        // Machinery — solid, blocks player
        const machMesh = createMachineryTile();
        machMesh.position.set(x + 0.5, 0.2, -(y + 0.5));
        scene.add(machMesh);
        meshes.push(machMesh);
        const { body, collider } = createWallCollider(world, x + 0.5, y + 0.5, 0.5, 0.5);
        bodies.push(body);
        colliders.push(collider);
      } else if (tileValue === 8) {
        // Reactor core — glowing center, solid
        const coreMesh = createReactorCoreTile();
        coreMesh.position.set(x + 0.5, 0.25, -(y + 0.5));
        scene.add(coreMesh);
        meshes.push(coreMesh);
        const { body, collider } = createWallCollider(world, x + 0.5, y + 0.5, 0.5, 0.5);
        bodies.push(body);
        colliders.push(collider);
        // Add glow light
        const glow = new THREE.PointLight(0x6633ff, 1.2, 6);
        glow.position.set(x + 0.5, 1.5, -(y + 0.5));
        scene.add(glow);
        lights.push(glow);
      } else if (tileValue === 0) {
        // Floor tile — metal grating
        const floorMesh = createFloorTile();
        floorMesh.position.set(x + 0.5, 0.01, -(y + 0.5));
        scene.add(floorMesh);
        meshes.push(floorMesh);
      }
    }
  }

  // Emergency lighting: red and blue at corners
  const redLight = new THREE.PointLight(0xff3300, 1.0, 12);
  redLight.position.set(1.5, 2, -1.5);
  scene.add(redLight);
  lights.push(redLight);

  const blueLight = new THREE.PointLight(0x2266ff, 0.8, 12);
  blueLight.position.set(roomDef.width - 1.5, 2, -(roomDef.height - 1.5));
  scene.add(blueLight);
  lights.push(blueLight);

  // Additional atmospheric lights at center and other corners
  const centerLight = new THREE.PointLight(0x334466, 0.5, 10);
  centerLight.position.set(roomDef.width / 2, 3, -roomDef.height / 2);
  scene.add(centerLight);
  lights.push(centerLight);

  const cornerLight3 = new THREE.PointLight(0xff2200, 0.4, 8);
  cornerLight3.position.set(roomDef.width - 1.5, 2, -1.5);
  scene.add(cornerLight3);
  lights.push(cornerLight3);

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
