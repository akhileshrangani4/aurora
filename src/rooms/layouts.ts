import type { RoomDef } from '../types';

// Helper to create a tile grid filled with floor (0), with wall borders (1)
function createBorderedGrid(width: number, height: number): number[][] {
  const tiles: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        row.push(1); // wall border
      } else {
        row.push(0); // floor
      }
    }
    tiles.push(row);
  }
  return tiles;
}

// ---- REACTOR CHAMBER (hub room) ----
// 20x14, doors at top center, left center, right center, bottom center
const reactorTiles = createBorderedGrid(20, 14);
// Door tiles (value 2): top center
reactorTiles[0][9] = 2;
reactorTiles[0][10] = 2;
// Left center
reactorTiles[7][0] = 2;
// Right center
reactorTiles[7][19] = 2;
// Bottom center
reactorTiles[13][9] = 2;
reactorTiles[13][10] = 2;

export const REACTOR_CHAMBER: RoomDef = {
  id: 'reactor',
  name: 'Reactor Chamber',
  width: 20,
  height: 14,
  tiles: reactorTiles,
  cameraCenter: { x: 10, y: 7 },
  cameraZoom: 14,
  doors: [
    { tileX: 9, tileY: 0, leadsTo: 'catwalk', spawnAtX: 7, spawnAtY: 2, locked: false },
    { tileX: 0, tileY: 7, leadsTo: 'airlock', spawnAtX: 4, spawnAtY: 10, locked: false },
    { tileX: 19, tileY: 7, leadsTo: 'console', spawnAtX: 1, spawnAtY: 4, locked: false },
    { tileX: 9, tileY: 13, leadsTo: 'blastdoor', spawnAtX: 3, spawnAtY: 1, locked: false },
  ],
  interactables: [],
  spawnPoint: { x: 10, y: 7 },
};

// ---- AIRLOCK CORRIDOR ----
// 6x12, narrow corridor, door at bottom to reactor, damaged walls for variety
const airlockTiles = createBorderedGrid(6, 12);
// Door at bottom leading to reactor
airlockTiles[11][2] = 2;
airlockTiles[11][3] = 2;
// Damaged wall tiles for visual variety
airlockTiles[3][0] = 3;
airlockTiles[5][5] = 3;
airlockTiles[8][0] = 3;

export const AIRLOCK_CORRIDOR: RoomDef = {
  id: 'airlock',
  name: 'Airlock Corridor',
  width: 6,
  height: 12,
  tiles: airlockTiles,
  cameraCenter: { x: 3, y: 6 },
  cameraZoom: 14,
  doors: [
    { tileX: 2, tileY: 11, leadsTo: 'reactor', spawnAtX: 1, spawnAtY: 7, locked: false },
  ],
  interactables: [],
  spawnPoint: { x: 3, y: 6 },
};

// ---- OBSERVATION CATWALK ----
// 14x4, very narrow horizontal corridor, door at right side to reactor
const catwalkTiles = createBorderedGrid(14, 4);
// Door at right side
catwalkTiles[2][13] = 2;
// Damaged walls scattered
catwalkTiles[0][4] = 3;
catwalkTiles[3][9] = 3;
catwalkTiles[0][11] = 3;

export const OBSERVATION_CATWALK: RoomDef = {
  id: 'catwalk',
  name: 'Observation Catwalk',
  width: 14,
  height: 4,
  tiles: catwalkTiles,
  cameraCenter: { x: 7, y: 2 },
  cameraZoom: 14,
  doors: [
    { tileX: 13, tileY: 2, leadsTo: 'reactor', spawnAtX: 10, spawnAtY: 1, locked: false },
  ],
  interactables: [],
  spawnPoint: { x: 7, y: 2 },
};

// ---- CONTROL CONSOLE ----
// 8x8, small room with interactable console panels, door at left to reactor
const consoleTiles = createBorderedGrid(8, 8);
// Door at left side
consoleTiles[4][0] = 2;
// Interior wall features (console banks along walls)

export const CONTROL_CONSOLE: RoomDef = {
  id: 'console',
  name: 'Control Console',
  width: 8,
  height: 8,
  tiles: consoleTiles,
  cameraCenter: { x: 4, y: 4 },
  cameraZoom: 14,
  doors: [
    { tileX: 0, tileY: 4, leadsTo: 'reactor', spawnAtX: 18, spawnAtY: 7, locked: false },
  ],
  interactables: [
    { tileX: 3, tileY: 1, type: 'console_panel', name: 'Main Console' },
    { tileX: 5, tileY: 1, type: 'console_panel', name: 'Aux Console' },
    { tileX: 6, tileY: 4, type: 'console_panel', name: 'Status Monitor' },
  ],
  spawnPoint: { x: 4, y: 4 },
};

// ---- BLAST DOOR CORRIDOR ----
// 6x10, narrow corridor, door at top to reactor, locked door at bottom (exit)
const blastdoorTiles = createBorderedGrid(6, 10);
// Door at top leading to reactor
blastdoorTiles[0][2] = 2;
blastdoorTiles[0][3] = 2;
// Exit blast door at bottom (locked)
blastdoorTiles[9][2] = 2;
blastdoorTiles[9][3] = 2;

export const BLAST_DOOR_CORRIDOR: RoomDef = {
  id: 'blastdoor',
  name: 'Blast Door Corridor',
  width: 6,
  height: 10,
  tiles: blastdoorTiles,
  cameraCenter: { x: 3, y: 5 },
  cameraZoom: 14,
  doors: [
    { tileX: 2, tileY: 0, leadsTo: 'reactor', spawnAtX: 10, spawnAtY: 12, locked: false },
    { tileX: 2, tileY: 9, leadsTo: 'exit', spawnAtX: 3, spawnAtY: 1, locked: true },
  ],
  interactables: [],
  spawnPoint: { x: 3, y: 5 },
};

export const ROOMS: Record<string, RoomDef> = {
  reactor: REACTOR_CHAMBER,
  airlock: AIRLOCK_CORRIDOR,
  catwalk: OBSERVATION_CATWALK,
  console: CONTROL_CONSOLE,
  blastdoor: BLAST_DOOR_CORRIDOR,
};
