import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

export function loadPixelTexture(path: string): THREE.Texture {
  const texture = textureLoader.load(path);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createColoredRect(
  width: number,
  height: number,
  color: number
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2; // lay flat for top-down
  return mesh;
}

// ============================================================
// Tile sprite factories — pixel art for every environment tile
// ============================================================

/** Create a pixel art texture from a 2D pixel array */
function createPixelTexture(pixels: string[][], size: number): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const color = pixels[y][x];
      if (color === '.') continue; // transparent
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

/** 16x16 pixel art astronaut character (top-down view) */
export function createPlayerSprite(): THREE.Mesh {
  const _ = '.'; // transparent
  const H = '#8899aa'; // helmet (light steel)
  const V = '#55ccee'; // visor (cyan glow)
  const S = '#556677'; // suit body
  const D = '#3a4555'; // suit dark/shadow
  const B = '#2a3040'; // boots/belt
  const G = '#44aaff'; // glow accent
  const W = '#ccddee'; // white highlight

  // 16x16 top-down astronaut
  const pixels: string[][] = [
    [_,_,_,_,_,_,H,H,H,H,_,_,_,_,_,_],
    [_,_,_,_,_,H,H,W,W,H,H,_,_,_,_,_],
    [_,_,_,_,H,H,V,V,V,V,H,H,_,_,_,_],
    [_,_,_,_,H,V,V,G,G,V,V,H,_,_,_,_],
    [_,_,_,_,H,H,V,V,V,V,H,H,_,_,_,_],
    [_,_,_,_,_,H,H,H,H,H,H,_,_,_,_,_],
    [_,_,_,_,S,S,S,S,S,S,S,S,_,_,_,_],
    [_,_,_,S,S,D,S,S,S,S,D,S,S,_,_,_],
    [_,_,S,S,D,D,S,G,G,S,D,D,S,S,_,_],
    [_,_,S,S,D,S,S,S,S,S,S,D,S,S,_,_],
    [_,_,_,S,S,S,B,B,B,B,S,S,S,_,_,_],
    [_,_,_,S,S,B,B,D,D,B,B,S,S,_,_,_],
    [_,_,_,_,S,B,D,D,D,D,B,S,_,_,_,_],
    [_,_,_,_,B,B,D,_,_,D,B,B,_,_,_,_],
    [_,_,_,_,B,D,D,_,_,D,D,B,_,_,_,_],
    [_,_,_,_,_,D,D,_,_,D,D,_,_,_,_,_],
  ];

  const texture = createPixelTexture(pixels, 16);
  const geometry = new THREE.PlaneGeometry(0.9, 0.9);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

// Cache textures so we don't recreate them every tile
const textureCache: Record<string, THREE.Texture> = {};

function getCachedTexture(key: string, factory: () => THREE.Texture): THREE.Texture {
  if (!textureCache[key]) {
    textureCache[key] = factory();
  }
  return textureCache[key];
}

function makeTileMesh(textureKey: string, factory: () => THREE.Texture, lit = true): THREE.Mesh {
  const texture = getCachedTexture(textureKey, factory);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = lit
    ? new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide })
    : new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/** 16x16 steel wall tile */
export function createWallTile(): THREE.Mesh {
  const _ = '#2a3040';
  const L = '#445566'; // light panel
  const M = '#3a4858'; // mid steel
  const D = '#2e3848'; // dark seam
  const R = '#333f50'; // rivet
  const pixels: string[][] = [
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
    [D,L,L,M,M,M,R,M,M,R,M,M,M,L,L,D],
    [D,L,M,M,M,M,M,M,M,M,M,M,M,M,L,D],
    [D,M,M,L,M,M,M,M,M,M,M,M,L,M,M,D],
    [D,M,M,M,M,M,M,M,M,M,M,M,M,M,M,D],
    [D,M,M,M,M,R,M,M,M,M,R,M,M,M,M,D],
    [D,M,M,M,M,M,M,M,M,M,M,M,M,M,M,D],
    [D,R,M,M,M,M,M,L,L,M,M,M,M,M,R,D],
    [D,R,M,M,M,M,M,L,L,M,M,M,M,M,R,D],
    [D,M,M,M,M,M,M,M,M,M,M,M,M,M,M,D],
    [D,M,M,M,M,R,M,M,M,M,R,M,M,M,M,D],
    [D,M,M,M,M,M,M,M,M,M,M,M,M,M,M,D],
    [D,M,M,L,M,M,M,M,M,M,M,M,L,M,M,D],
    [D,L,M,M,M,M,M,M,M,M,M,M,M,M,L,D],
    [D,L,L,M,M,M,R,M,M,R,M,M,M,L,L,D],
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
  ];
  return makeTileMesh('wall', () => createPixelTexture(pixels, 16));
}

/** 16x16 damaged wall tile — cracks and exposed wiring */
export function createDamagedWallTile(): THREE.Mesh {
  const D = '#2a3040';
  const M = '#3a4858';
  const L = '#445566';
  const C = '#1a2030'; // crack / hole
  const W = '#cc6622'; // exposed wire
  const S = '#ffaa33'; // spark
  const pixels: string[][] = [
    [D,D,D,D,D,C,C,D,D,D,D,D,D,D,D,D],
    [D,M,M,M,C,C,C,C,M,M,M,M,M,L,M,D],
    [D,M,M,C,C,W,C,M,M,M,M,M,M,M,M,D],
    [D,M,C,C,W,W,M,M,M,M,C,C,M,M,M,D],
    [D,M,C,W,S,W,M,M,M,C,C,C,C,M,M,D],
    [D,M,M,C,W,M,M,M,C,C,M,M,C,M,M,D],
    [D,M,M,M,C,M,M,M,C,M,M,M,M,M,M,D],
    [D,M,M,M,M,M,M,L,M,M,M,M,M,M,M,D],
    [D,M,M,M,M,M,M,M,M,M,C,M,M,M,M,D],
    [D,M,C,C,M,M,M,M,M,C,C,C,M,M,M,D],
    [D,C,C,C,C,M,M,M,C,C,W,C,C,M,M,D],
    [D,C,W,W,C,C,M,M,C,W,S,W,C,M,M,D],
    [D,M,C,S,W,C,M,M,M,C,W,C,M,M,M,D],
    [D,M,M,C,C,M,M,M,M,C,C,M,M,M,L,D],
    [D,L,M,M,M,M,M,M,M,M,M,M,M,L,L,D],
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
  ];
  return makeTileMesh('damaged_wall', () => createPixelTexture(pixels, 16));
}

/** 16x16 floor tile — metal grating with subtle detail */
export function createFloorTile(): THREE.Mesh {
  const A = '#141a24'; // dark base
  const B = '#1a2230'; // slightly lighter
  const C = '#1e2838'; // panel edge
  const D = '#111820'; // deep groove
  const pixels: string[][] = [
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
    [D,A,A,B,A,A,A,B,A,A,B,A,A,A,B,D],
    [D,A,B,B,A,A,B,B,A,B,B,A,A,B,B,D],
    [D,B,B,C,B,B,B,A,B,B,C,B,B,B,A,D],
    [D,A,A,B,A,A,A,A,A,A,B,A,A,A,A,D],
    [D,A,A,B,A,A,A,A,A,A,B,A,A,A,A,D],
    [D,A,B,B,A,A,B,A,A,B,B,A,A,B,A,D],
    [D,B,B,A,A,A,B,B,B,B,A,A,A,B,B,D],
    [D,A,A,A,A,A,A,B,A,A,A,A,A,A,A,D],
    [D,A,B,B,A,A,B,B,A,B,B,A,A,B,B,D],
    [D,A,A,B,A,A,A,A,A,A,B,A,A,A,A,D],
    [D,B,B,C,B,B,B,A,B,B,C,B,B,B,A,D],
    [D,A,A,B,A,A,A,A,A,A,B,A,A,A,A,D],
    [D,A,A,B,A,A,A,B,A,A,B,A,A,A,B,D],
    [D,A,B,B,A,A,B,B,A,B,B,A,A,B,B,D],
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
  ];
  return makeTileMesh('floor', () => createPixelTexture(pixels, 16));
}

/** 16x16 door tile — sci-fi sliding door with cyan light strip */
export function createDoorTile(): THREE.Mesh {
  const D = '#1a2030';
  const M = '#334455';
  const C = '#00ccdd'; // cyan glow
  const G = '#00eeff'; // bright glow center
  const S = '#2a3848';
  const pixels: string[][] = [
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
    [D,M,M,M,M,M,M,S,S,M,M,M,M,M,M,D],
    [D,M,S,S,M,M,S,C,C,S,M,M,S,S,M,D],
    [D,M,S,S,M,M,S,G,G,S,M,M,S,S,M,D],
    [D,M,S,S,M,M,S,C,C,S,M,M,S,S,M,D],
    [D,M,M,M,M,M,S,C,C,S,M,M,M,M,M,D],
    [D,M,S,M,M,M,S,G,G,S,M,M,M,S,M,D],
    [D,C,C,C,C,C,C,G,G,C,C,C,C,C,C,D],
    [D,C,C,C,C,C,C,G,G,C,C,C,C,C,C,D],
    [D,M,S,M,M,M,S,C,C,S,M,M,M,S,M,D],
    [D,M,M,M,M,M,S,C,C,S,M,M,M,M,M,D],
    [D,M,S,S,M,M,S,C,C,S,M,M,S,S,M,D],
    [D,M,S,S,M,M,S,G,G,S,M,M,S,S,M,D],
    [D,M,S,S,M,M,S,C,C,S,M,M,S,S,M,D],
    [D,M,M,M,M,M,M,S,S,M,M,M,M,M,M,D],
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
  ];
  return makeTileMesh('door', () => createPixelTexture(pixels, 16), false);
}

/** 16x16 locked blast door — red warning lights */
export function createLockedDoorTile(): THREE.Mesh {
  const D = '#1a1520';
  const M = '#3a2535';
  const R = '#cc2200'; // red warning
  const B = '#ff3300'; // bright red
  const S = '#2a1a28';
  const X = '#551100'; // dark red
  const pixels: string[][] = [
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
    [D,M,M,M,M,M,M,S,S,M,M,M,M,M,M,D],
    [D,M,R,R,M,M,S,R,R,S,M,M,R,R,M,D],
    [D,M,R,B,M,M,S,X,X,S,M,M,B,R,M,D],
    [D,M,R,R,M,M,S,R,R,S,M,M,R,R,M,D],
    [D,M,M,M,M,M,S,X,X,S,M,M,M,M,M,D],
    [D,M,S,M,M,M,S,R,R,S,M,M,M,S,M,D],
    [D,R,R,R,R,R,R,B,B,R,R,R,R,R,R,D],
    [D,R,R,R,R,R,R,B,B,R,R,R,R,R,R,D],
    [D,M,S,M,M,M,S,R,R,S,M,M,M,S,M,D],
    [D,M,M,M,M,M,S,X,X,S,M,M,M,M,M,D],
    [D,M,R,R,M,M,S,R,R,S,M,M,R,R,M,D],
    [D,M,R,B,M,M,S,X,X,S,M,M,B,R,M,D],
    [D,M,R,R,M,M,S,R,R,S,M,M,R,R,M,D],
    [D,M,M,M,M,M,M,S,S,M,M,M,M,M,M,D],
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
  ];
  return makeTileMesh('locked_door', () => createPixelTexture(pixels, 16), false);
}

/** 16x16 interactable console panel */
export function createConsoleTile(): THREE.Mesh {
  const D = '#1a2030';
  const M = '#334455';
  const G = '#22aa44'; // green screen
  const B = '#33cc55'; // bright green
  const S = '#2a3848';
  const O = '#1a3328'; // dark screen
  const pixels: string[][] = [
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
    [D,M,M,M,M,M,M,M,M,M,M,M,M,M,M,D],
    [D,M,O,O,O,O,O,O,O,O,O,O,O,O,M,D],
    [D,M,O,G,G,B,G,O,G,B,G,G,G,O,M,D],
    [D,M,O,G,G,G,G,O,G,G,G,B,G,O,M,D],
    [D,M,O,B,G,G,G,O,G,G,B,G,G,O,M,D],
    [D,M,O,G,G,B,G,O,B,G,G,G,G,O,M,D],
    [D,M,O,G,G,G,G,O,G,G,G,G,B,O,M,D],
    [D,M,O,O,O,O,O,O,O,O,O,O,O,O,M,D],
    [D,M,M,M,M,M,M,M,M,M,M,M,M,M,M,D],
    [D,M,S,S,M,S,S,M,M,S,S,M,S,S,M,D],
    [D,M,S,S,M,S,S,M,M,S,S,M,S,S,M,D],
    [D,M,M,M,M,M,M,M,M,M,M,M,M,M,M,D],
    [D,M,S,M,S,M,S,M,M,S,M,S,M,S,M,D],
    [D,M,M,M,M,M,M,M,M,M,M,M,M,M,M,D],
    [D,D,D,D,D,D,D,D,D,D,D,D,D,D,D,D],
  ];
  return makeTileMesh('console', () => createPixelTexture(pixels, 16), false);
}
