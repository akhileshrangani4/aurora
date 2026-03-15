import * as THREE from 'three';
import RAPIER from '@dimforge/rapier2d-compat';
import type { RoomDef } from '../types';
import { createColoredRect } from '../sprites';

export interface InteractableEntity {
  mesh: THREE.Mesh;
  sensorBody: RAPIER.RigidBody;
  sensorCollider: RAPIER.Collider;
  def: { tileX: number; tileY: number; type: string; name: string };
  isHighlighted: boolean;
}

export function createInteractables(
  roomDef: RoomDef,
  world: RAPIER.World,
  scene: THREE.Scene,
  _playerCollider: RAPIER.Collider,
): InteractableEntity[] {
  const interactables: InteractableEntity[] = [];

  for (const def of roomDef.interactables) {
    // Color based on type
    const color = def.type === 'console_panel' ? 0xdd8833 : 0x88aa44;
    const mesh = createColoredRect(0.8, 0.8, color);
    mesh.position.set(def.tileX + 0.5, 0.15, -(def.tileY + 0.5));
    scene.add(mesh);

    // Sensor collider for proximity detection (radius 1.5)
    const sensorBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      def.tileX + 0.5,
      def.tileY + 0.5,
    );
    const sensorBody = world.createRigidBody(sensorBodyDesc);
    const sensorColliderDesc = RAPIER.ColliderDesc.ball(1.5).setSensor(true);
    const sensorCollider = world.createCollider(sensorColliderDesc, sensorBody);

    interactables.push({
      mesh,
      sensorBody,
      sensorCollider,
      def,
      isHighlighted: false,
    });
  }

  return interactables;
}

export function updateInteractables(
  interactables: InteractableEntity[],
  world: RAPIER.World,
  playerCollider: RAPIER.Collider,
): void {
  for (const obj of interactables) {
    const intersecting = world.intersectionPair(obj.sensorCollider, playerCollider);
    const mat = obj.mesh.material as THREE.MeshStandardMaterial;

    if (intersecting && !obj.isHighlighted) {
      mat.emissive.setHex(0x003344);
      mat.emissiveIntensity = 0.5;
      obj.isHighlighted = true;
    } else if (!intersecting && obj.isHighlighted) {
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      obj.isHighlighted = false;
    }
  }
}

export function destroyInteractables(
  interactables: InteractableEntity[],
  world: RAPIER.World,
  scene: THREE.Scene,
): void {
  for (const obj of interactables) {
    scene.remove(obj.mesh);
    obj.mesh.geometry.dispose();
    (obj.mesh.material as THREE.Material).dispose();
    world.removeRigidBody(obj.sensorBody);
  }
}
