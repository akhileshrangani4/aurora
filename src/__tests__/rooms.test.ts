import { describe, it, expect } from 'vitest';

describe('reactor', () => {
  it('reactor chamber is 20x14 tiles', async () => {
    const { ROOMS } = await import('../rooms/layouts');
    const reactor = ROOMS['reactor'];
    expect(reactor.width).toBe(20);
    expect(reactor.height).toBe(14);
    expect(reactor.tiles.length).toBe(14); // 14 rows
    expect(reactor.tiles[0].length).toBe(20); // 20 columns
  });

  it('reactor has doors to all 4 connected rooms', async () => {
    const { ROOMS } = await import('../rooms/layouts');
    const reactor = ROOMS['reactor'];
    const doorTargets = reactor.doors.map(d => d.leadsTo).sort();
    expect(doorTargets).toContain('airlock');
    expect(doorTargets).toContain('catwalk');
    expect(doorTargets).toContain('console');
    expect(doorTargets).toContain('blastdoor');
  });
});

describe('airlock', () => {
  it('airlock corridor is narrow (width <= 6)', async () => {
    const { ROOMS } = await import('../rooms/layouts');
    const airlock = ROOMS['airlock'];
    expect(airlock.width).toBeLessThanOrEqual(6);
  });
});

describe('catwalk', () => {
  it('catwalk is narrow horizontal corridor (height <= 6)', async () => {
    const { ROOMS } = await import('../rooms/layouts');
    const catwalk = ROOMS['catwalk'];
    expect(catwalk.height).toBeLessThanOrEqual(6);
  });
});

describe('console', () => {
  it('console area has interactable positions', async () => {
    const { ROOMS } = await import('../rooms/layouts');
    const consoleRoom = ROOMS['console'];
    expect(consoleRoom.interactables.length).toBeGreaterThan(0);
  });
});

describe('blast door', () => {
  it('blast door corridor has a locked door', async () => {
    const { ROOMS } = await import('../rooms/layouts');
    const blastdoor = ROOMS['blastdoor'];
    const lockedDoors = blastdoor.doors.filter(d => d.locked);
    expect(lockedDoors.length).toBeGreaterThanOrEqual(1);
  });
});

describe('all rooms', () => {
  it('all 5 rooms exist', async () => {
    const { ROOMS } = await import('../rooms/layouts');
    expect(Object.keys(ROOMS).length).toBe(5);
    expect(ROOMS['reactor']).toBeDefined();
    expect(ROOMS['airlock']).toBeDefined();
    expect(ROOMS['catwalk']).toBeDefined();
    expect(ROOMS['console']).toBeDefined();
    expect(ROOMS['blastdoor']).toBeDefined();
  });

  it('every room has walls on all non-door border tiles', async () => {
    const { ROOMS } = await import('../rooms/layouts');
    for (const [id, room] of Object.entries(ROOMS)) {
      // Check top and bottom rows
      for (let x = 0; x < room.width; x++) {
        const topTile = room.tiles[0][x];
        const bottomTile = room.tiles[room.height - 1][x];
        expect([1, 2, 3]).toContain(topTile); // wall, door, or damaged wall
        expect([1, 2, 3]).toContain(bottomTile);
      }
    }
  });
});
