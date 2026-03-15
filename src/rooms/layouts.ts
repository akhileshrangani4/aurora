import type { RoomDef } from '../types';

// Helper to create a tile grid filled with floor (0)
function createGrid(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

// Helper to draw walls on a grid
function drawWalls(tiles: number[][], positions: [number, number][], value = 1): void {
  for (const [x, y] of positions) {
    if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
      tiles[y][x] = value;
    }
  }
}

// Helper to draw a rectangular wall border with gaps for doors
function drawBorder(
  tiles: number[][],
  width: number,
  height: number,
  doorGaps: { side: 'top' | 'bottom' | 'left' | 'right'; from: number; to: number }[],
): void {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        tiles[y][x] = 1;
      }
    }
  }
  // Cut door gaps (set to door tile 2)
  for (const gap of doorGaps) {
    if (gap.side === 'top') {
      for (let x = gap.from; x <= gap.to; x++) { tiles[0][x] = 2; }
    } else if (gap.side === 'bottom') {
      for (let x = gap.from; x <= gap.to; x++) { tiles[height - 1][x] = 2; }
    } else if (gap.side === 'left') {
      for (let y = gap.from; y <= gap.to; y++) { tiles[y][0] = 2; }
    } else if (gap.side === 'right') {
      for (let y = gap.from; y <= gap.to; y++) { tiles[y][width - 1] = 2; }
    }
  }
}

// ============================================================
// REACTOR CHAMBER — central hub, 22x16, wide open with interior features
// ============================================================
const reactorTiles = createGrid(22, 16);
drawBorder(reactorTiles, 22, 16, [
  { side: 'top', from: 9, to: 12 },     // 4-tile wide door to catwalk
  { side: 'left', from: 6, to: 9 },      // 4-tile wide door to airlock
  { side: 'right', from: 6, to: 9 },     // 4-tile wide door to console
  { side: 'bottom', from: 9, to: 12 },   // 4-tile wide door to blast door
]);

// Interior: reactor core (glowing center)
const cx = 11, cy = 8;
drawWalls(reactorTiles, [[cx, cy], [cx - 1, cy], [cx, cy - 1], [cx - 1, cy - 1]], 8); // 2x2 reactor core

// Reactor containment ring
drawWalls(reactorTiles, [
  [cx - 3, cy - 2], [cx + 2, cy - 2], // top corners
  [cx - 3, cy + 1], [cx + 2, cy + 1], // bottom corners
], 7); // machinery

// Coolant pipes running to/from reactor
drawWalls(reactorTiles, [
  [cx - 5, cy], [cx - 4, cy], [cx + 3, cy], [cx + 4, cy], // horizontal pipes
  [cx, cy - 4], [cx, cy - 3], [cx, cy + 2], [cx, cy + 3], // vertical pipes
], 4);

// Crates and storage around edges
drawWalls(reactorTiles, [
  [2, 2], [3, 2], [2, 3],           // top-left storage
  [18, 2], [19, 2],                  // top-right storage
  [2, 12], [3, 12], [2, 13],        // bottom-left storage
  [18, 12], [19, 12],               // bottom-right storage
], 5);

// Vent grates on floor
drawWalls(reactorTiles, [
  [5, 5], [16, 5], [5, 10], [16, 10], // corner vents
  [cx - 1, cy - 5], [cx, cy + 4],     // near-reactor vents
], 6);

// Machinery units along walls
drawWalls(reactorTiles, [
  [5, 1], [6, 1], [15, 1], [16, 1],   // top wall machinery
  [5, 14], [6, 14], [15, 14], [16, 14], // bottom wall machinery
  [1, 4], [1, 11],                      // left wall machinery
  [20, 4], [20, 11],                    // right wall machinery
], 7);

// Damaged walls
drawWalls(reactorTiles, [
  [3, 0], [18, 0], [0, 12], [21, 3],
], 3);

export const REACTOR_CHAMBER: RoomDef = {
  id: 'reactor',
  name: 'Reactor Chamber',
  width: 22,
  height: 16,
  tiles: reactorTiles,
  cameraCenter: { x: 11, y: 8 },
  cameraZoom: 16,
  doors: [
    { tileX: 10, tileY: 0, leadsTo: 'catwalk', spawnAtX: 7, spawnAtY: 6, locked: false },
    { tileX: 0, tileY: 7, leadsTo: 'airlock', spawnAtX: 7, spawnAtY: 5, locked: false },
    { tileX: 21, tileY: 7, leadsTo: 'console', spawnAtX: 2, spawnAtY: 5, locked: false },
    { tileX: 10, tileY: 15, leadsTo: 'blastdoor', spawnAtX: 5, spawnAtY: 2, locked: false },
  ],
  interactables: [],
  spawnPoint: { x: 11, y: 8 },
};

// ============================================================
// AIRLOCK CORRIDOR — 10x14, wide corridor with damaged sections
// ============================================================
const airlockTiles = createGrid(10, 14);
drawBorder(airlockTiles, 10, 14, [
  { side: 'right', from: 5, to: 8 },  // 4-tile door to reactor
]);
// Damaged walls
drawWalls(airlockTiles, [[1, 3], [8, 5], [1, 8], [8, 10], [0, 6], [9, 2]], 3);
// Pipes along walls
drawWalls(airlockTiles, [[1, 1], [1, 2], [8, 1], [8, 2], [1, 11], [8, 11]], 4);
// Crates scattered — debris from docking
drawWalls(airlockTiles, [[3, 3], [6, 8], [3, 10]],5);
// Vent grates
drawWalls(airlockTiles, [[5, 5], [4, 9]], 6);
// Machinery
drawWalls(airlockTiles, [[7, 3], [2, 7]], 7);

export const AIRLOCK_CORRIDOR: RoomDef = {
  id: 'airlock',
  name: 'Airlock Corridor',
  width: 10,
  height: 14,
  tiles: airlockTiles,
  cameraCenter: { x: 5, y: 7 },
  cameraZoom: 16,
  doors: [
    { tileX: 9, tileY: 6, leadsTo: 'reactor', spawnAtX: 2, spawnAtY: 7, locked: false },
  ],
  interactables: [],
  spawnPoint: { x: 5, y: 7 },
};

// ============================================================
// OBSERVATION CATWALK — 16x8, wide horizontal corridor
// ============================================================
const catwalkTiles = createGrid(16, 8);
drawBorder(catwalkTiles, 16, 8, [
  { side: 'bottom', from: 6, to: 9 },  // 4-tile door to reactor
]);
// Damaged walls
drawWalls(catwalkTiles, [[4, 0], [11, 0], [9, 7], [2, 7], [14, 0]], 3);
// Pipes running length of catwalk
drawWalls(catwalkTiles, [[1, 2], [2, 2], [3, 2], [11, 2], [12, 2], [13, 2]], 4);
// Crates
drawWalls(catwalkTiles, [[2, 5], [12, 5]], 5);
// Vents
drawWalls(catwalkTiles, [[6, 3], [9, 3]], 6);
// Machinery at ends
drawWalls(catwalkTiles, [[1, 1], [14, 1]], 7);

export const OBSERVATION_CATWALK: RoomDef = {
  id: 'catwalk',
  name: 'Observation Catwalk',
  width: 16,
  height: 8,
  tiles: catwalkTiles,
  cameraCenter: { x: 8, y: 4 },
  cameraZoom: 16,
  doors: [
    { tileX: 7, tileY: 7, leadsTo: 'reactor', spawnAtX: 11, spawnAtY: 2, locked: false },
  ],
  interactables: [],
  spawnPoint: { x: 8, y: 4 },
};

// ============================================================
// CONTROL CONSOLE — 12x10, room with console panels
// ============================================================
const consoleTiles = createGrid(12, 10);
drawBorder(consoleTiles, 12, 10, [
  { side: 'left', from: 4, to: 6 },  // 3-tile door to reactor
]);
// Console banks along walls (machinery)
drawWalls(consoleTiles, [[4, 1], [5, 1], [7, 1], [8, 1], [9, 1]], 7);
drawWalls(consoleTiles, [[10, 3], [10, 4], [10, 5], [10, 6]], 7);
// Pipes
drawWalls(consoleTiles, [[1, 2], [1, 3], [1, 7], [1, 8]], 4);
// Crates
drawWalls(consoleTiles, [[6, 7], [7, 7]], 5);
// Vents
drawWalls(consoleTiles, [[5, 5], [8, 5]], 6);

export const CONTROL_CONSOLE: RoomDef = {
  id: 'console',
  name: 'Control Console',
  width: 12,
  height: 10,
  tiles: consoleTiles,
  cameraCenter: { x: 6, y: 5 },
  cameraZoom: 12,
  doors: [
    { tileX: 0, tileY: 5, leadsTo: 'reactor', spawnAtX: 20, spawnAtY: 7, locked: false },
  ],
  interactables: [
    { tileX: 4, tileY: 3, type: 'console_panel', name: 'Main Console' },
    { tileX: 8, tileY: 3, type: 'console_panel', name: 'Aux Console' },
    { tileX: 10, tileY: 5, type: 'console_panel', name: 'Status Monitor' },
  ],
  spawnPoint: { x: 6, y: 5 },
};

// ============================================================
// BLAST DOOR CORRIDOR — 10x14, corridor with locked exit at far end
// ============================================================
const blastdoorTiles = createGrid(10, 14);
drawBorder(blastdoorTiles, 10, 14, [
  { side: 'top', from: 3, to: 6 },     // 4-tile door to reactor
  { side: 'bottom', from: 3, to: 6 },  // 4-tile locked blast door (exit)
]);
// Damaged walls — heavy damage near blast door
drawWalls(blastdoorTiles, [[1, 4], [8, 7], [1, 10], [8, 11], [0, 8], [9, 5]], 3);
// Pipes running along corridor
drawWalls(blastdoorTiles, [[1, 2], [1, 3], [8, 2], [8, 3], [1, 11], [8, 11]], 4);
// Crates near blast door
drawWalls(blastdoorTiles, [[2, 10], [7, 10], [2, 11]], 5);
// Vents
drawWalls(blastdoorTiles, [[4, 6], [5, 6]], 6);
// Machinery
drawWalls(blastdoorTiles, [[3, 3], [6, 3]], 7);

export const BLAST_DOOR_CORRIDOR: RoomDef = {
  id: 'blastdoor',
  name: 'Blast Door Corridor',
  width: 10,
  height: 14,
  tiles: blastdoorTiles,
  cameraCenter: { x: 5, y: 7 },
  cameraZoom: 16,
  doors: [
    { tileX: 4, tileY: 0, leadsTo: 'reactor', spawnAtX: 11, spawnAtY: 14, locked: false },
    { tileX: 4, tileY: 13, leadsTo: 'exit', spawnAtX: 5, spawnAtY: 2, locked: true },
  ],
  interactables: [],
  spawnPoint: { x: 5, y: 3 },
};

export const ROOMS: Record<string, RoomDef> = {
  reactor: REACTOR_CHAMBER,
  airlock: AIRLOCK_CORRIDOR,
  catwalk: OBSERVATION_CATWALK,
  console: CONTROL_CONSOLE,
  blastdoor: BLAST_DOOR_CORRIDOR,
};
