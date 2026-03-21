import RAPIER from '@dimforge/rapier2d-compat';

export interface CollisionAudioSystem {
  wasBlocked: boolean;
  minImpactSpeed: number;
  playImpact: (volume: number) => void;
}

export async function initPhysics() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: 0 }); // zero gravity for top-down
  const characterController = world.createCharacterController(0.01); // 0.01 skin width
  return { world, characterController, RAPIER };
}

export function createCollisionAudioSystem(
  playImpact: (volume: number) => void,
  minImpactSpeed = 0.15,
): CollisionAudioSystem {
  return {
    wasBlocked: false,
    minImpactSpeed,
    playImpact,
  };
}

export function updateCollisionAudio(
  audio: CollisionAudioSystem,
  characterController: RAPIER.KinematicCharacterController,
  desiredMovement: { x: number; y: number },
  correctedMovement: { x: number; y: number },
): void {
  const blockedX = Math.abs(desiredMovement.x) - Math.abs(correctedMovement.x);
  const blockedY = Math.abs(desiredMovement.y) - Math.abs(correctedMovement.y);
  const impactSpeed = Math.max(blockedX, blockedY, 0);
  const isBlocked = impactSpeed > audio.minImpactSpeed || characterController.numComputedCollisions() > 0;

  if (isBlocked && !audio.wasBlocked) {
    audio.playImpact(Math.min(1, impactSpeed));
  }

  audio.wasBlocked = isBlocked;
}

export function createWallCollider(
  world: RAPIER.World,
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number
): { body: RAPIER.RigidBody; collider: RAPIER.Collider } {
  const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y);
  const body = world.createRigidBody(bodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight);
  const collider = world.createCollider(colliderDesc, body);
  return { body, collider };
}

export function createSensorCollider(
  world: RAPIER.World,
  x: number,
  y: number,
  radius: number,
  _parentBody: RAPIER.RigidBody
): RAPIER.Collider {
  const colliderDesc = RAPIER.ColliderDesc.ball(radius).setSensor(true);
  colliderDesc.setTranslation(0, 0);
  // Create sensor on a fixed body at the position
  const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y);
  const sensorBody = world.createRigidBody(bodyDesc);
  return world.createCollider(colliderDesc, sensorBody);
}
