import * as THREE from 'three';
import RAPIER from '@dimforge/rapier2d-compat';
import type { RoomDef, DoorDef } from '../types';
import { createDoorTile, createLockedDoorTile } from '../sprites';
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
    const mesh = doorDef.locked ? createLockedDoorTile() : createDoorTile();
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
      // Locked doors pulse brightness but never open
      const mat = door.mesh.material as THREE.MeshBasicMaterial;
      if (intersecting) {
        const pulse = 0.6 + Math.sin(performance.now() * 0.005) * 0.4;
        mat.color.setRGB(pulse, pulse * 0.15, pulse * 0.1);
      } else {
        mat.color.setHex(0xffffff);
      }
      continue;
    }

    // Unlocked door auto-open/close
    if (intersecting && !door.isOpen) {
      door.isOpen = true;
      door.mesh.scale.x = 0.3; // shrink to show "opening"
      // Remove wall collider if present so player can pass
      if (door.wallBody) {
        world.removeRigidBody(door.wallBody);
        door.wallBody = null;
        door.wallCollider = null;
      }
    } else if (!intersecting && door.isOpen) {
      door.isOpen = false;
      door.mesh.scale.x = 1.0; // close back
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
