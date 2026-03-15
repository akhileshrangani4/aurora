import RAPIER from '@dimforge/rapier2d-compat';

export async function initPhysics() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: 0 }); // zero gravity for top-down
  const characterController = world.createCharacterController(0.01); // 0.01 skin width
  return { world, characterController, RAPIER };
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
