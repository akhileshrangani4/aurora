import * as THREE from 'three';
import RAPIER from '@dimforge/rapier2d-compat';
import type { RoomDef, DoorDef } from '../types';
import { createColoredRect } from '../sprites';
import { createWallCollider } from '../physics';

export interface DoorEntity {
  mesh: THREE.Mesh;
  sensorBody: RAPIER.RigidBody;
  sensorCollider: RAPIER.Collider;
  wallBody: RAPIER.RigidBody | null;
  wallCollider: RAPIER.Collider | null;
  def: DoorDef;
  isOpen: boolean;
}

export function createDoors(
  roomDef: RoomDef,
  world: RAPIER.World,
  scene: THREE.Scene,
  _playerCollider: RAPIER.Collider,
): DoorEntity[] {
  const doors: DoorEntity[] = [];

  for (const doorDef of roomDef.doors) {
    const color = doorDef.locked ? 0xcc2222 : 0x00cccc;
    const mesh = createColoredRect(1, 1, color);
    mesh.position.set(doorDef.tileX + 0.5, 0.2, -(doorDef.tileY + 0.5));
    scene.add(mesh);

    // Sensor collider for approach detection (radius 2.0)
    const sensorBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      doorDef.tileX + 0.5,
      doorDef.tileY + 0.5,
    );
    const sensorBody = world.createRigidBody(sensorBodyDesc);
    const sensorColliderDesc = RAPIER.ColliderDesc.ball(2.0).setSensor(true);
    const sensorCollider = world.createCollider(sensorColliderDesc, sensorBody);

    // Locked doors get a wall collider to block passage
    let wallBody: RAPIER.RigidBody | null = null;
    let wallCollider: RAPIER.Collider | null = null;
    if (doorDef.locked) {
      const wall = createWallCollider(world, doorDef.tileX + 0.5, doorDef.tileY + 0.5, 0.5, 0.5);
      wallBody = wall.body;
      wallCollider = wall.collider;
    }

    doors.push({
      mesh,
      sensorBody,
      sensorCollider,
      wallBody,
      wallCollider,
      def: doorDef,
      isOpen: false,
    });
  }

  return doors;
}

export function updateDoors(
  doors: DoorEntity[],
  world: RAPIER.World,
  playerCollider: RAPIER.Collider,
): void {
  for (const door of doors) {
    const intersecting = world.intersectionPair(door.sensorCollider, playerCollider);

    if (door.def.locked) {
      // Locked doors pulse red emissive but never open
      const mat = door.mesh.material as THREE.MeshStandardMaterial;
      if (intersecting) {
        const pulse = 0.3 + Math.sin(performance.now() * 0.005) * 0.2;
        mat.emissive.setHex(0xcc2222);
        mat.emissiveIntensity = pulse;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
      continue;
    }

    // Unlocked door auto-open/close
    if (intersecting && !door.isOpen) {
      door.isOpen = true;
      const mat = door.mesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(0x44ffff);
      door.mesh.scale.y = 0.3;
      // Remove wall collider if present so player can pass
      if (door.wallBody) {
        world.removeRigidBody(door.wallBody);
        door.wallBody = null;
        door.wallCollider = null;
      }
    } else if (!intersecting && door.isOpen) {
      door.isOpen = false;
      const mat = door.mesh.material as THREE.MeshStandardMaterial;
      mat.color.setHex(0x00cccc);
      door.mesh.scale.y = 1.0;
    }
  }
}

export function destroyDoors(
  doors: DoorEntity[],
  world: RAPIER.World,
  scene: THREE.Scene,
): void {
  for (const door of doors) {
    scene.remove(door.mesh);
    door.mesh.geometry.dispose();
    (door.mesh.material as THREE.Material).dispose();

    world.removeRigidBody(door.sensorBody);

    if (door.wallBody) {
      world.removeRigidBody(door.wallBody);
    }
  }
}
