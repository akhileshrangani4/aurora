import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initPhysics, createWallCollider, createCollisionAudioSystem, updateCollisionAudio } from '../physics';

describe('collision audio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('plays a collision sound when movement is blocked by a wall', async () => {
    const { world, characterController } = await initPhysics();
    createWallCollider(world, 1, 0, 0.5, 0.5);

    const play = vi.fn();
    const audio = createCollisionAudioSystem(play, 0.05);

    updateCollisionAudio(audio, characterController, { x: 1, y: 0 }, { x: 0.2, y: 0 });

    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith(expect.closeTo(0.8, 5));
  });

  it('does not replay the sound while sliding continuously into the same wall', async () => {
    const { world, characterController } = await initPhysics();
    createWallCollider(world, 1, 0, 0.5, 0.5);

    const play = vi.fn();
    const audio = createCollisionAudioSystem(play, 0.05);

    updateCollisionAudio(audio, characterController, { x: 1, y: 0 }, { x: 0.2, y: 0 });
    updateCollisionAudio(audio, characterController, { x: 1, y: 0 }, { x: 0.2, y: 0 });

    expect(play).toHaveBeenCalledTimes(1);
  });

  it('re-arms after movement is no longer blocked', async () => {
    const { characterController } = await initPhysics();
    const play = vi.fn();
    const audio = createCollisionAudioSystem(play, 0.05);

    updateCollisionAudio(audio, characterController, { x: 1, y: 0 }, { x: 0.2, y: 0 });
    updateCollisionAudio(audio, characterController, { x: 0, y: 0 }, { x: 0, y: 0 });
    updateCollisionAudio(audio, characterController, { x: 1, y: 0 }, { x: 0.2, y: 0 });

    expect(play).toHaveBeenCalledTimes(2);
  });
});
