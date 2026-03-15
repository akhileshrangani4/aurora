import { describe, it, expect } from 'vitest';

describe('proximity', () => {
  it('createInteractables and updateInteractables functions exist', async () => {
    const mod = await import('../entities/interactable');
    expect(typeof mod.createInteractables).toBe('function');
    expect(typeof mod.updateInteractables).toBe('function');
    expect(typeof mod.destroyInteractables).toBe('function');
  });
});
