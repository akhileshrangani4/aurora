# Architecture Research

**Domain:** Web-based top-down game (Three.js + Rapier + OpenAI)
**Researched:** 2026-03-15
**Confidence:** HIGH

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Game Loop (RAF)                         │
│   processInput() -> updatePhysics() -> updateState() -> render()│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Input    │  │ Physics  │  │  Game    │  │  Renderer    │   │
│  │ Handler   │  │ (Rapier) │  │  State   │  │  (Three.js)  │   │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│        │            │             │                │            │
│        └────────────┴──────┬──────┴────────────────┘            │
│                            │                                    │
├────────────────────────────┴────────────────────────────────────┤
│                     Scene Manager                               │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────────┐   │
│  │  Sector    │  │  Entity    │  │  Profiler + LLM Client  │   │
│  │  Builder   │  │  Factory   │  │  (OpenAI API)           │   │
│  └────────────┘  └────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Game Loop** | Fixed-timestep RAF loop, delta time, orchestrates tick order | Single `requestAnimationFrame` with `performance.now()` delta |
| **Input Handler** | WASD movement + mouse position, maps to intents | `keydown`/`keyup` listeners writing to an input state object |
| **Physics (Rapier 2D)** | Collision detection, rigid bodies for player + objects, sensor triggers | `@dimforge/rapier2d` WASM module, `world.step()` each tick |
| **Game State** | Player position, carried item, reactor status, profiling data, phase flags | Plain object mutated in-place (no framework overhead) |
| **Renderer (Three.js)** | Orthographic camera, sprite planes, point lights, particles | `THREE.Scene` + `THREE.OrthographicCamera`, sprites as textured planes |
| **Scene Manager** | Loads/unloads room layouts, manages transitions between areas | Owns the Three.js scene graph and Rapier world entity lifecycle |
| **Entity Factory** | Creates game objects (player, fuel rods, coolant cell, reactor) with both visual + physics representations | Functions that return `{ mesh, body, collider }` tuples |
| **Sector Builder** | Parses LLM JSON response into tile layout, animates tiles sliding in | Reads tile array, instantiates sprites at offscreen positions, tweens in |
| **Profiler** | Tracks player behavior metrics during reactor phase | Records timestamps + positions, computes efficiency/exploration scores |
| **LLM Client** | Sends player profile to OpenAI, receives structured JSON room layout | Single `fetch()` call with structured output (`response_format: json_schema`) |

## Recommended Project Structure

```
src/
├── main.js              # Entry point: init WASM, create scene, start loop
├── loop.js              # Game loop with fixed timestep
├── input.js             # Keyboard + mouse input state
├── physics.js           # Rapier world setup, body creation helpers
├── renderer.js          # Three.js scene, camera, lighting setup
├── state.js             # Game state object + phase machine
├── entities/
│   ├── player.js        # Player entity (sprite + rigidbody + movement)
│   ├── fuelRod.js       # Fuel rod pickup entity
│   ├── coolantCell.js   # Coolant cell pickup entity
│   └── reactor.js       # Reactor core with slot detection
├── scenes/
│   ├── sceneManager.js  # Load/unload room layouts
│   ├── airlock.js       # Docking airlock room definition
│   ├── reactor.js       # Reactor chamber room definition
│   └── generated.js     # Dynamic sector from LLM output
├── ai/
│   ├── profiler.js      # Behavior tracking + score computation
│   └── llmClient.js     # OpenAI API call + response parsing
├── effects/
│   ├── particles.js     # Spark/glow particle systems
│   └── transitions.js   # Tile slide-in animation, screen effects
├── hud/
│   └── minimap.js       # Corner HUD with sector name
└── assets/
    └── sprites/         # Pixel art sprite sheets (free packs)
```

### Structure Rationale

- **Flat `src/` core files:** The 6 core systems (main, loop, input, physics, renderer, state) stay at root level because they are the backbone everything imports from. No nesting overhead for a jam project.
- **`entities/`:** Each game object is a module that couples its Three.js mesh with its Rapier body. This keeps the "what is a fuel rod" answer in one place.
- **`scenes/`:** Room layouts are data-driven. Each file exports a function that populates the scene with entities at specific positions. The scene manager handles cleanup.
- **`ai/`:** Isolated from game logic. The profiler collects data, the LLM client sends it. Neither knows about Three.js or Rapier.
- **`effects/`:** Visual-only code. No game logic. Can be stubbed out if time is tight.

## Architectural Patterns

### Pattern 1: Fixed-Timestep Game Loop

**What:** `requestAnimationFrame` drives rendering, but physics steps at a fixed interval (e.g., 1/60s) with accumulator-based catch-up.
**When to use:** Always for physics-based games. Prevents physics instability on fast/slow machines.
**Trade-offs:** Slightly more code than naive RAF, but critical for Rapier stability.

```javascript
const FIXED_DT = 1 / 60;
let accumulator = 0;
let lastTime = performance.now();

function gameLoop(currentTime) {
  const delta = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  accumulator += Math.min(delta, 0.1); // cap to prevent spiral of death

  processInput(state);

  while (accumulator >= FIXED_DT) {
    world.step(); // Rapier fixed step
    updateGameState(state, FIXED_DT);
    accumulator -= FIXED_DT;
  }

  syncVisualsToPhysics(state); // copy Rapier positions to Three.js meshes
  renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}
```

### Pattern 2: Entity as Mesh+Body Tuple

**What:** Each game entity is created by a factory function that returns both the Three.js visual and Rapier physics object, keeping them paired.
**When to use:** Every interactive object (player, fuel rods, coolant cell, reactor slots).
**Trade-offs:** Simple and direct. Not a full ECS, but for a jam with <20 entities, ECS is overkill.

```javascript
function createFuelRod(world, scene, x, y) {
  // Visual
  const texture = loadSprite('fuel_rod.png');
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  );
  mesh.position.set(x, y, 0);
  scene.add(mesh);

  // Physics
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
  const body = world.createRigidBody(bodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.4, 0.4);
  const collider = world.createCollider(colliderDesc, body);

  return { mesh, body, collider, type: 'fuel_rod' };
}
```

### Pattern 3: Phase State Machine

**What:** Game progression tracked as a simple string enum state machine: `BOOT -> AIRLOCK -> REACTOR -> PROFILING -> GENERATION -> EXPLORE`.
**When to use:** Controls what input does, what gets rendered, when the LLM call fires.
**Trade-offs:** Dead simple. No state library needed. A switch statement in the update loop handles phase transitions.

```javascript
const state = {
  phase: 'BOOT', // BOOT | AIRLOCK | REACTOR | PROFILING | GENERATION | EXPLORE
  reactor: { fuelSlots: [null, null], coolantSlot: null, status: 'offline' },
  carrying: null,
  profile: { movementEfficiency: 0, explorationTendency: 0, interactionSpeed: 0 },
  generatedSector: null,
};
```

### Pattern 4: Fire-and-Forget LLM Call with Loading State

**What:** When reactor stabilizes, trigger a single `fetch()` to OpenAI. While awaiting response, play the "AI observing" visual sequence. When JSON arrives, build the sector.
**When to use:** The one LLM call in the entire demo.
**Trade-offs:** No streaming needed for a single structured JSON response. Latency (2-5s) is masked by the observation sequence animation.

## Data Flow

### Game Loop Tick Flow

```
Input Events (keyboard/mouse)
    |
    v
Input State Object { keys: {w,a,s,d}, mouse: {x,y} }
    |
    v
Physics Update: apply forces to player body, world.step()
    |
    v
Game State Update: check sensors, handle pickups, check reactor balance
    |
    v
Phase Transition Check: reactor stabilized? -> trigger profiling -> trigger LLM
    |
    v
Sync Visuals: copy Rapier body positions -> Three.js mesh positions
    |
    v
Render: Three.js renderer.render(scene, camera)
```

### LLM Integration Flow

```
Reactor Stabilized (phase -> PROFILING)
    |
    v
Profiler computes scores from recorded behavior data
    { movementEfficiency: 0.7, explorationTendency: 0.8, interactionSpeed: 0.5 }
    |
    v
"AI Observing" visual sequence plays (camera lights, screen flicker, data readout)
    |                                           (masks API latency)
    v
LLM Client fires fetch() to OpenAI with structured output schema
    |
    v
Response: JSON sector layout
    {
      name: "Hydroponics Bay",
      tiles: [[1,0,1,1],[1,1,1,0],...],
      objects: [{type:"console", x:3, y:2}, ...],
      description: "A living sector adapted to your exploratory nature"
    }
    |
    v
Sector Builder: creates tile meshes offscreen, animates slide-in
    |
    v
HUD: minimap updates from "???" to "Hydroponics Bay"
    |
    v
Phase -> EXPLORE
```

### Pickup/Carry Flow

```
Player walks over fuel rod (Rapier sensor overlap detected)
    |
    v
If not carrying: attach rod mesh to player mesh as child, mark state.carrying
    |
    v
Player walks to reactor slot (Rapier sensor overlap detected)
    |
    v
If carrying matching type: snap mesh to slot position, update reactor state
    |
    v
Check reactor balance: 2 fuel + 1 coolant -> status = 'stable' -> phase transition
```

## Key Data Flows

1. **Input -> Physics -> Visuals:** Every frame. Input sets velocity on player rigidbody, Rapier steps, mesh positions sync from body positions.
2. **Sensor Overlap -> State Mutation:** Rapier collision events trigger game logic (pickup, drop, slot detection).
3. **State Phase Change -> Scene Transition:** Phase machine drives which scene is active and what systems run.
4. **Profile -> LLM -> Sector:** One-shot async flow that bridges gameplay into procedural generation.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI API | Single `fetch()` with `response_format: { type: "json_schema" }` | Use `gpt-4o-mini` for speed. Structured output guarantees valid JSON. First call has schema caching latency (~2-5s) which is masked by observation animation. |
| Rapier WASM | Async `import('@dimforge/rapier2d')` then `await RAPIER.init()` | Must init before game loop starts. WASM load is ~200KB. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Physics <-> Renderer | Position sync each frame | One-directional: Rapier is source of truth, Three.js copies positions. Never set Rapier positions from Three.js. |
| Game State <-> Scenes | State drives scene loading | Scene manager reads `state.phase` to determine what to show. |
| Profiler <-> LLM Client | Profiler produces score object, LLM client consumes it | Clean boundary: profiler knows nothing about API, LLM client knows nothing about gameplay. |
| LLM Client <-> Sector Builder | LLM client returns parsed JSON, sector builder consumes it | Sector builder validates tile array dimensions before building. |

## Anti-Patterns

### Anti-Pattern 1: God Loop

**What people do:** Put all game logic (input, physics, state, rendering, effects) in a single giant `requestAnimationFrame` callback.
**Why it's wrong:** Impossible to debug, can't disable systems independently, 2-hour jam means you will have bugs to isolate.
**Do this instead:** Separate functions per system, called in order from the loop. Each system can be commented out for debugging.

### Anti-Pattern 2: Two-Way Physics Sync

**What people do:** Set Three.js mesh positions AND Rapier body positions, creating conflicts where visual and physics states diverge.
**Why it's wrong:** Causes teleporting, jitter, and impossible-to-debug collision issues.
**Do this instead:** Rapier is the single source of truth for positions. Three.js only reads, never writes. The only exception: initial entity placement.

### Anti-Pattern 3: Awaiting LLM in the Game Loop

**What people do:** `await fetch(openai)` inside the update tick, freezing the entire game.
**Why it's wrong:** Game freezes for 2-5 seconds while API responds.
**Do this instead:** Fire the fetch, continue the game loop (play observation animation), handle the response in a `.then()` callback that triggers sector building.

### Anti-Pattern 4: Full ECS for a Jam

**What people do:** Build a proper Entity-Component-System architecture with component registries, system schedulers, and query interfaces.
**Why it's wrong:** For <20 entities in a 2-hour build, ECS adds 30+ minutes of boilerplate with zero benefit.
**Do this instead:** Simple factory functions returning `{mesh, body}` tuples. Direct mutation of a state object. Graduate to ECS only if entity count exceeds ~100.

## Build Order (Dependencies)

This is the critical ordering for a 2-hour build:

1. **Rapier WASM init + Three.js scene + game loop** (foundation -- everything depends on this)
2. **Input handler + player entity with movement** (need to move before anything else matters)
3. **Room layout system + airlock scene** (static tiles, walls with colliders, proves the visual pipeline)
4. **Reactor room + fuel/coolant entities + carry mechanic** (core gameplay)
5. **Reactor balance logic + phase transitions** (game progression)
6. **Profiler + LLM client + structured output schema** (AI integration)
7. **Sector builder + tile slide animation** (the wow moment)
8. **HUD minimap + visual effects** (polish layer)

Steps 1-4 are the critical path. If time runs out at step 5, you still have a playable demo. Steps 6-7 are the differentiator. Step 8 is bonus polish.

## Rendering Specifics

### Camera Setup
Use `THREE.OrthographicCamera` for pixel-perfect top-down view. Set `texture.magFilter = THREE.NearestFilter` on all sprite textures to preserve pixel art crispness.

### Lighting for Atmosphere
Use `THREE.PointLight` for localized glow effects (reactor core, warning lights). Use `THREE.AmbientLight` at low intensity for the "dark station" feel. Toggle/animate light intensity for the boot-up sequence and reactor feedback.

### Sprite Layering
Use `mesh.renderOrder` and `material.depthTest = false` to control draw order for overlapping sprites (player on top of floor tiles, effects on top of player).

## Sources

- [Three.js Sprite Documentation](https://threejs.org/docs/pages/Sprite.html)
- [Rapier Getting Started (JavaScript)](https://rapier.rs/docs/user_guides/javascript/getting_started_js/)
- [Rapier Colliders Documentation](https://rapier.rs/docs/user_guides/javascript/colliders/)
- [OpenAI Structured Outputs Guide](https://developers.openai.com/api/docs/guides/structured-outputs/)
- [Three.js ECS Architecture (2026)](https://medium.com/@i_babkov/three-js-architecture-ecs-685768c7d91f)
- [Physics with Rapier - Three.js Tutorials](https://sbcode.net/threejs/physics-rapier/)
- [Rapier + Three.js Integration Demo](https://discourse.threejs.org/t/new-version-of-rapier-physics-three-js-demo-app/48755)
- [Spritesheet Animation with Three.js](https://fundamental.sh/p/sprite-sheet-animation-aseprite-react-threejs)
- [Pixel-Perfect Orthographic Camera Discussion](https://discourse.threejs.org/t/pixelperfect-orthographic-camera-with-blocks-for-a-pixelart-2d-look/46637)

---
*Architecture research for: Aurora - Web-based top-down sci-fi exploration game*
*Researched: 2026-03-15*
