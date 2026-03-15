import { describe, it, expect } from 'vitest';

describe('scene init', () => {
  it('GAME_HEIGHT is 14 world units', async () => {
    const { GAME_HEIGHT } = await import('../renderer');
    expect(GAME_HEIGHT).toBe(14);
  });
});

describe('sprites', () => {
  it('loadPixelTexture function exists', async () => {
    const { loadPixelTexture } = await import('../sprites');
    expect(typeof loadPixelTexture).toBe('function');
  });

  it('createColoredRect function exists', async () => {
    const { createColoredRect } = await import('../sprites');
    expect(typeof createColoredRect).toBe('function');
  });
});
