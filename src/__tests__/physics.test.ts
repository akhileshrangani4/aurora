import { describe, it, expect } from 'vitest';

describe('rapier init', () => {
  it('initPhysics returns world and characterController', async () => {
    const { initPhysics } = await import('../physics');
    const { world, characterController, RAPIER } = await initPhysics();
    expect(world).toBeDefined();
    expect(characterController).toBeDefined();
    expect(RAPIER).toBeDefined();
  });

  it('world has zero gravity (top-down)', async () => {
    const { initPhysics } = await import('../physics');
    const { world } = await initPhysics();
    const gravity = world.gravity;
    expect(gravity.x).toBe(0);
    expect(gravity.y).toBe(0);
  });

  it('createWallCollider creates fixed body at position', async () => {
    const { initPhysics, createWallCollider } = await import('../physics');
    const { world } = await initPhysics();
    const { body, collider } = createWallCollider(world, 5, 3, 0.5, 0.5);
    const pos = body.translation();
    expect(pos.x).toBeCloseTo(5);
    expect(pos.y).toBeCloseTo(3);
    expect(collider).toBeDefined();
  });
});
