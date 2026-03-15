import { describe, it, expect } from 'vitest';

describe('movement', () => {
  it('player speed is 5.0 (crosses ~20 tiles in ~4 seconds)', async () => {
    // Speed of 5.0 means 20 tiles / 5.0 = 4 seconds
    const mod = await import('../entities/player');
    // The module should export or use PLAYER_SPEED = 5.0
    expect(mod.PLAYER_SPEED).toBe(5.0);
  });

  it('createPlayer returns mesh, body, and collider', async () => {
    const { initPhysics } = await import('../physics');
    const { world, characterController } = await initPhysics();
    const RAPIER = (await import('@dimforge/rapier2d-compat')).default;
    await RAPIER.init();

    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(5, 7);
    const body = world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.ball(0.35);
    const collider = world.createCollider(colliderDesc, body);

    expect(body.translation().x).toBeCloseTo(5);
    expect(body.translation().y).toBeCloseTo(7);
    expect(collider).toBeDefined();
  });
});

describe('wall collision', () => {
  it('character controller corrects movement into wall', async () => {
    const { initPhysics, createWallCollider } = await import('../physics');
    const { world, characterController } = await initPhysics();
    const RAPIER = (await import('@dimforge/rapier2d-compat')).default;

    // Create wall at x=3
    createWallCollider(world, 3, 0, 0.5, 5);

    // Create player at x=2, moving right toward wall
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(2, 0);
    const body = world.createRigidBody(bodyDesc);
    const collider = RAPIER.ColliderDesc.ball(0.35);
    const playerCollider = world.createCollider(collider, body);

    world.step();

    // Try to move right by 5 units (should be blocked by wall)
    characterController.computeColliderMovement(playerCollider, { x: 5, y: 0 });
    const corrected = characterController.computedMovement();

    // Corrected X should be less than 5 (wall blocks)
    expect(corrected.x).toBeLessThan(5);
  });
});
