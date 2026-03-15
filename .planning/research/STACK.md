# Technology Stack

**Project:** Aurora: The Self-Designing Station
**Researched:** 2026-03-15

## Recommended Stack

### Core Framework / Bundler

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | ^6.x | Dev server + bundler | Vite 8.0 just released (2 days ago) with Rolldown bundler -- too fresh for a game jam. Vite 6.x is battle-tested, has proven WASM compatibility, and sub-second HMR. Do NOT use Vite 8 for this project: plugin ecosystem compatibility (especially vite-plugin-wasm) is unverified. | HIGH |
| TypeScript | ^5.7 | Type safety | Structured output parsing, physics config, and Three.js types all benefit from TS. Not optional for a project with WASM + API integration. | HIGH |

### Rendering

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| three | ^0.183 | 3D rendering engine | Current stable (0.183.2). Provides OrthographicCamera for top-down view, PlaneGeometry for sprite planes, PointLight/SpotLight for atmospheric sci-fi lighting, particle systems for sparks/effects. Do NOT use WebGPURenderer -- stick with WebGLRenderer for maximum browser compatibility in a game jam. | HIGH |

### Physics

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @dimforge/rapier2d-compat | ^0.19 | 2D physics (WASM) | Use the `-compat` package, NOT `@dimforge/rapier2d`. The compat version embeds WASM as base64 in the JS bundle, eliminating all bundler WASM-loading issues with Vite. Slightly larger bundle (~2MB) but zero configuration headaches. For a 2-hour game jam, this tradeoff is mandatory. 2D is correct (top-down game, no need for 3D physics). | HIGH |

### LLM Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| openai | ^6.27 | OpenAI API client | Official TypeScript SDK with native Structured Outputs support via Zod schemas. Use `response_format: { type: "json_schema" }` for guaranteed schema-compliant room layout JSON. Do NOT use legacy JSON mode (`type: "json_object"`) -- it doesn't guarantee schema adherence. | HIGH |

### API Proxy (Critical Architecture Decision)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite proxy config | built-in | Dev proxy to OpenAI | For development, use `vite.config.ts` server.proxy to forward `/api/generate` to a local endpoint. Zero dependencies. | HIGH |
| Simple Node script | N/A | Tiny proxy server | A ~20-line Node.js script using native `fetch` and `http.createServer` that holds the API key and forwards requests to OpenAI. No Express, no Hono -- for a game jam, the fewer dependencies the better. Alternatively, hardcode the API key client-side if this is a throwaway demo that will never be deployed publicly (acceptable for game jam judging on localhost). | MEDIUM |

**Game jam shortcut:** If this demo only runs on your machine for judges, skip the proxy entirely and put the API key in a `.env` file loaded by Vite's `import.meta.env.VITE_OPENAI_KEY`. This exposes the key in the browser bundle but is acceptable for a single-session demo that never hits the public internet. Flag this as tech debt if the project continues.

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| vite-plugin-wasm | ^3.4 | WASM ES module support | Only needed if you switch from rapier2d-compat to rapier2d (don't). Listed for completeness. | HIGH |
| vite-plugin-top-level-await | ^1.4 | Top-level await in modules | Rapier requires async init (`await init()`). This plugin lets you use top-level await in Vite. Pair with vite-plugin-wasm if using non-compat Rapier. With -compat, you still need the async init but can handle it in your entry point. | MEDIUM |
| zod | ^3.24 | Schema validation | Define the room layout schema for OpenAI Structured Outputs. The openai SDK integrates directly with Zod for response parsing. Also validates the JSON response at runtime as a safety net. | HIGH |
| lil-gui | ^0.20 | Debug controls | Lightweight debug panel for tweaking physics, lighting, camera during development. Remove before demo. Not dat.gui (abandoned) -- lil-gui is the maintained successor. | HIGH |
| stats.js | ^0.17 | FPS counter | Monitor performance during development. Three.js ecosystem standard. | HIGH |

### Asset Pipeline

| Tool | Purpose | Why | Confidence |
|------|---------|-----|------------|
| TextureLoader (Three.js built-in) | Load sprite PNGs | No external loader needed. Set `texture.magFilter = THREE.NearestFilter` and `texture.minFilter = THREE.NearestFilter` to keep pixel art crisp. Also set `texture.colorSpace = THREE.SRGBColorSpace`. | HIGH |
| Sprite sheets (manual UV) | Animate sprites | Manually offset `texture.offset` and `texture.repeat` to step through spritesheet frames. No library needed for the ~3-4 animations in this demo. SpriteMixer is an option but adds dependency overhead for minimal gain in a game jam. | HIGH |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| React / React Three Fiber | Massive overhead for a game jam. R3F is great for complex apps but adds abstraction layers and React's reconciliation cycle. Vanilla Three.js + imperative game loop is faster to write and debug for a 2-hour build. |
| Cannon.js / Ammo.js / Matter.js | Rapier is faster (Rust/WASM), has better API ergonomics, and is actively maintained. Cannon.js is abandoned. Matter.js is JS-only and slower. |
| Phaser | Full 2D game framework that would fight Three.js for rendering control. You need Three.js for the atmospheric 3D lighting over 2D sprites -- Phaser can't do that. |
| @dimforge/rapier2d (non-compat) | WASM loading issues with Vite bundlers. The compat version works out of the box. |
| @dimforge/rapier3d | 2D physics is correct for a top-down game. 3D physics adds complexity with zero benefit. |
| Vite 8.0 | Released 2 days ago. Plugin ecosystem untested. Not worth the risk for a game jam. |
| WebGPURenderer | Safari support still limited. WebGLRenderer covers all browsers and is plenty performant for a 2D sprite game with lighting. |
| dat.gui | Abandoned. Use lil-gui instead. |
| Express / Hono / Fastify | Over-engineered for a proxy that forwards one POST request. Use native Node.js http or just expose the key for the demo. |
| ECS frameworks (bitecs, miniplex) | Entity Component Systems are great for large games. This demo has ~20 entities max. Plain objects and arrays are simpler and faster to write. |
| GSAP / Tween.js | For the tile sliding animation, use Three.js's built-in animation utilities or write a simple lerp in the game loop. One animation effect doesn't justify a tween library. |

## Architecture Notes

### Pixel Art on Three.js Planes (Critical Setup)

```typescript
// Load texture with pixel-perfect settings
const loader = new THREE.TextureLoader();
const texture = loader.load('sprites/player.png');
texture.magFilter = THREE.NearestFilter;  // CRITICAL: prevents blurry upscaling
texture.minFilter = THREE.NearestFilter;  // CRITICAL: prevents mipmap smoothing
texture.colorSpace = THREE.SRGBColorSpace;
texture.generateMipmaps = false;          // Pixel art should never use mipmaps

// Create sprite plane
const geometry = new THREE.PlaneGeometry(1, 1);
const material = new THREE.MeshStandardMaterial({
  map: texture,
  transparent: true,
  alphaTest: 0.5,  // Discard near-transparent pixels
});
const sprite = new THREE.Mesh(geometry, material);
sprite.rotation.x = -Math.PI / 2;  // Lay flat for top-down view
```

### OrthographicCamera for Top-Down View

```typescript
const frustumSize = 20;  // World units visible vertically
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -frustumSize * aspect / 2,
  frustumSize * aspect / 2,
  frustumSize / 2,
  -frustumSize / 2,
  0.1,
  1000
);
camera.position.set(0, 50, 0);  // High above, looking down
camera.lookAt(0, 0, 0);
```

### Rapier 2D Init Pattern (compat version)

```typescript
import RAPIER from '@dimforge/rapier2d-compat';

async function initPhysics() {
  await RAPIER.init();  // Must await before using any Rapier APIs
  const gravity = { x: 0.0, y: 0.0 };  // No gravity for top-down
  const world = new RAPIER.World(gravity);
  return world;
}
```

### OpenAI Structured Output Pattern

```typescript
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const RoomLayout = z.object({
  name: z.string(),
  tiles: z.array(z.object({
    x: z.number(),
    y: z.number(),
    type: z.enum(['floor', 'wall', 'console', 'pipe', 'vent', 'door']),
  })),
  lighting: z.enum(['dim', 'normal', 'bright', 'emergency']),
  description: z.string(),
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',  // Fast + cheap for structured output
  messages: [{ role: 'user', content: prompt }],
  response_format: zodResponseFormat(RoomLayout, 'room_layout'),
});
```

## Game Loop Pattern

```typescript
// No requestAnimationFrame wrapper library needed.
// Simple fixed-timestep loop:
const FIXED_DT = 1 / 60;
let accumulator = 0;
let lastTime = performance.now();

function gameLoop(currentTime: number) {
  const delta = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  accumulator += delta;

  // Fixed physics step
  while (accumulator >= FIXED_DT) {
    physicsWorld.step();
    accumulator -= FIXED_DT;
  }

  // Render (variable rate)
  updateSpritePositionsFromPhysics();
  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}
```

## Installation

```bash
# Create project
npm create vite@latest aurora -- --template vanilla-ts

# Core dependencies
npm install three @dimforge/rapier2d-compat openai zod

# Type definitions
npm install -D @types/three

# Dev utilities (remove before demo)
npm install -D lil-gui stats.js
```

## Project Structure

```
aurora/
  src/
    main.ts           # Entry point, init Three.js + Rapier + game loop
    scene.ts           # Three.js scene setup, camera, renderer
    physics.ts         # Rapier world, body creation helpers
    player.ts          # Player entity: movement, carrying logic
    reactor.ts         # Reactor puzzle: fuel rods, coolant, balance
    generation.ts      # OpenAI call, JSON parsing, sector assembly
    sprites.ts         # Texture loading, spritesheet animation
    hud.ts             # Mini-map overlay, sector name display
    types.ts           # Shared TypeScript types + Zod schemas
  public/
    sprites/           # Pixel art PNGs from free asset packs
  .env                 # VITE_OPENAI_KEY (gitignored)
  index.html
  vite.config.ts
  tsconfig.json
```

## Sources

- [Three.js releases](https://github.com/mrdoob/three.js/releases) - v0.183.2 current
- [Three.js NPM](https://www.npmjs.com/package/three) - version verification
- [Rapier.js getting started](https://rapier.rs/docs/user_guides/javascript/getting_started_js/) - official docs
- [@dimforge/rapier2d-compat NPM](https://www.npmjs.com/package/@dimforge/rapier2d-compat) - v0.19.3
- [Rapier.js WASM/Vite compatibility issue](https://github.com/dimforge/rapier.js/issues/49) - why -compat is needed
- [Dimforge 2025 year review](https://dimforge.com/blog/2026/01/09/the-year-2025-in-dimforge/) - SIMD improvements
- [OpenAI Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) - official docs
- [OpenAI Node SDK](https://www.npmjs.com/package/openai) - v6.27.0
- [OpenAI API key security](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety) - proxy rationale
- [Vite releases](https://vite.dev/releases) - v8.0 just released, v6.x recommended
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8) - Rolldown bundler details
- [Three.js pixel art texture settings](https://discourse.threejs.org/t/pixelart-texture-becomes-fatter/65904) - NearestFilter
- [Three.js OrthographicCamera pixel-perfect](https://discourse.threejs.org/t/pixelperfect-orthographic-camera-with-blocks-for-a-pixelart-2d-look/46637)
- [SpriteMixer for Three.js](https://github.com/felixmariotto/three-SpriteMixer) - spritesheet animation
- [lil-gui](https://www.npmjs.com/package/lil-gui) - dat.gui successor
