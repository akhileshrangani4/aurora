import * as THREE from 'three';
import RAPIER from '@dimforge/rapier2d-compat';
import { createPlayerSprite } from '../sprites';

export const PLAYER_SPEED = 5.0;

export interface Player {
  mesh: THREE.Mesh;
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
}

export function createPlayer(
  world: RAPIER.World,
  characterController: RAPIER.KinematicCharacterController,
  scene: THREE.Scene,
  spawnX: number,
  spawnY: number,
): Player {
  // Kinematic position-based body at spawn point
  const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(spawnX, spawnY);
  const body = world.createRigidBody(bodyDesc);

  // Ball collider for smooth wall sliding (slightly smaller than half-tile)
  const colliderDesc = RAPIER.ColliderDesc.ball(0.35);
  const collider = world.createCollider(colliderDesc, body);

  // Visual: pixel art astronaut sprite (above all floor tiles)
  const mesh = createPlayerSprite();
  mesh.position.set(spawnX, 0.5, -spawnY);

  scene.add(mesh);

  return { mesh, body, collider };
}

export function updatePlayer(
  player: Player,
  input: { w: boolean; a: boolean; s: boolean; d: boolean },
  characterController: RAPIER.KinematicCharacterController,
  dt: number,
): void {
  const speed = PLAYER_SPEED;
  const desiredX = ((input.d ? 1 : 0) - (input.a ? 1 : 0)) * speed * dt;
  const desiredY = ((input.w ? 1 : 0) - (input.s ? 1 : 0)) * speed * dt;

  characterController.computeColliderMovement(player.collider, { x: desiredX, y: desiredY });
  const corrected = characterController.computedMovement();

  const pos = player.body.translation();
  player.body.setNextKinematicTranslation({ x: pos.x + corrected.x, y: pos.y + corrected.y });
}

export function syncPlayerVisuals(player: Player): void {
  const pos = player.body.translation();
  player.mesh.position.x = pos.x;
  player.mesh.position.z = -pos.y; // Rapier Y maps to Three.js -Z for top-down
}
