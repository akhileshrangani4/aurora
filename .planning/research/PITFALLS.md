# Pitfalls Research

**Domain:** Web-based game jam (Three.js + Rapier WASM + OpenAI API, 2-hour build window)
**Researched:** 2026-03-15
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Rapier WASM Initialization Blocks Game Start

**What goes wrong:**
The game crashes or shows a blank screen because Rapier's WASM module hasn't finished loading before physics code runs. Rapier must be loaded asynchronously -- the `@dimforge/rapier2d-compat` package requires an explicit `await RAPIER.init()` call before any physics world or body creation. Skipping or misplacing this await is the single most common Rapier integration failure.

**Why it happens:**
Developers write synchronous game initialization code (create scene, create physics world, add bodies) without awaiting WASM readiness. The non-compat Rapier package assumes WASM is already loaded at import time, which fails with most bundlers unless specific plugins are configured.

**How to avoid:**
Use `@dimforge/rapier2d-compat` (not the raw package). Structure initialization as: `await RAPIER.init()` first, then create `RAPIER.World`, then create bodies. Gate the entire game setup behind this await. Do NOT attempt to configure Vite WASM plugins -- the compat version embeds WASM as base64 and just works. The file size increase is negligible for a game jam demo.

**Warning signs:**
- Console error: "Cannot read properties of undefined" on RAPIER calls
- Physics world is `undefined` or `null`
- Game renders visuals but nothing moves

**Phase to address:**
Phase 1 (project scaffolding). The very first thing built should be a working `init()` -> physics world -> single body test. Confirm this works before writing any game logic.

---

### Pitfall 2: OpenAI API Call Freezes the Game for 3-10 Seconds

**What goes wrong:**
The game makes a synchronous-feeling API call to OpenAI. The player stabilizes the reactor, then stares at a frozen screen for 3-10 seconds while the LLM generates JSON. This kills the demo moment -- judges see a hang, not a smooth transition.

**Why it happens:**
OpenAI structured output has a cold-start penalty of 2-60 seconds on the first call with a new schema (the constrained decoding grammar must be compiled). Even after caching, gpt-4o responses with structured output typically take 2-5 seconds. Developers underestimate this latency because they test with simple prompts.

**How to avoid:**
Design the "AI observation moment" as a 3-5 second scripted sequence (camera lights tracking player, screen flicker, data readout overlay) that runs WHILE the API call happens in the background. Fire the API call the instant the reactor stabilizes, then play the observation animation. By the time the animation finishes, the response is likely ready. If it isn't, hold on a "ANALYZING..." screen state. Use streaming to detect early completion. Keep the JSON schema small -- short field names, minimal nesting, few tokens in the response.

**Warning signs:**
- API response takes > 2 seconds in testing
- No visual activity between reactor stabilization and sector assembly
- The "AI observation" sequence is purely cosmetic with no async work behind it

**Phase to address:**
Phase 2 (core mechanics). The API integration pattern (fire-and-mask) must be designed into the game flow from the start, not bolted on later. Build the observation animation and API call as a paired unit.

---

### Pitfall 3: Pixel Art Textures Render Blurry on Three.js Planes

**What goes wrong:**
Pixel art sprites loaded onto Three.js planes render as blurry smears instead of crisp pixels. The atmospheric sci-fi look is destroyed -- everything looks like a bad bilinear filter.

**Why it happens:**
Three.js defaults to `LinearFilter` for both `minFilter` and `magFilter` on textures, which interpolates between texels. Pixel art requires nearest-neighbor sampling to preserve hard edges. Additionally, if mipmaps are generated (the default), they further blur the texture at certain zoom levels.

**How to avoid:**
For every texture load, set three properties:
```javascript
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;
```
Create a wrapper function like `loadPixelTexture(path)` that sets these automatically. Use it for ALL texture loads. Also set `texture.colorSpace = THREE.SRGBColorSpace` to prevent washed-out colors. Disable antialiasing on the renderer (`antialias: false`) since AA blurs pixel edges.

**Warning signs:**
- Sprites look "soft" or smeared at any zoom level
- Colors appear slightly different from the source PNG
- Edges between transparent and opaque pixels look muddy

**Phase to address:**
Phase 1 (project scaffolding). Create the texture loading utility immediately and use it from the first sprite placed. Retrofitting filter settings across scattered texture loads wastes time.

---

### Pitfall 4: Scope Explosion -- Building 5 Rooms Instead of 1 Perfect Beat

**What goes wrong:**
With only 2 hours, the developer tries to build the full spatial layout (Airlock -> Catwalk -> Reactor -> Console -> Blast Door) and runs out of time with nothing polished. The demo shows 5 half-broken rooms instead of 1 complete transition.

**Why it happens:**
The PROJECT.md lists a 5-room spatial layout. It's tempting to build all the rooms first, then add interactions. But in a 2-hour jam, this means spending 60+ minutes on static environments and having no time for the core mechanic (reactor puzzle + AI + sector generation) that actually impresses judges.

**How to avoid:**
Build exactly ONE room (the reactor chamber) with full interactivity first. The docking airlock is a 5-minute visual-only entry. The "generated sector" is whatever the LLM JSON produces rendered as tiles. Skip the observation catwalk and control console entirely -- they add no value to the core demo beat. Time budget: 15 min scaffolding, 30 min reactor room + physics, 30 min reactor puzzle logic, 30 min AI integration + sector generation, 15 min polish/bug fixes.

**Warning signs:**
- 30 minutes in, no interactive objects exist yet
- Working on room decorations before the pickup mechanic works
- Building multiple room files/scenes before the first room is playable

**Phase to address:**
This is a roadmap-level concern. The phase structure itself must enforce "one room first, everything else after."

---

### Pitfall 5: OpenAI API Key Exposed in Frontend Code

**What goes wrong:**
The API key is embedded in client-side JavaScript. During the demo it works fine, but if the game is deployed to a public URL (itch.io, GitHub Pages) for judges to try, anyone can extract the key from the browser console and rack up charges on the developer's account.

**Why it happens:**
In a 2-hour jam, developers skip building a backend proxy and hardcode the key directly. This works locally but is a real financial risk if deployed.

**How to avoid:**
For a game jam demo: use a tiny serverless proxy function (Cloudflare Worker or Vercel Edge Function, ~15 lines of code) that holds the API key and forwards requests. Alternatively, if the game is only demoed live on the developer's machine, a local Express server on port 3001 that proxies to OpenAI is sufficient and takes 5 minutes to set up. Set a hard spending cap ($5) on the OpenAI account regardless.

If time is truly critical and deployment is local-only: use an environment variable loaded at build time and accept the risk for the demo session only. But NEVER commit the key to git.

**Warning signs:**
- `fetch("https://api.openai.com/v1/...", { headers: { Authorization: "Bearer sk-..." } })` in client code
- API key visible in browser Network tab
- No `.env` file or proxy server in the project

**Phase to address:**
Phase 1 (scaffolding). Set up the proxy or env-var pattern before writing any API call code.

---

### Pitfall 6: Three.js/Rapier Position Desync -- Objects Float or Clip

**What goes wrong:**
Visual sprites and physics bodies get out of sync. The player character visually walks through walls, or physics objects appear to float above their sprites. Items the player "picks up" remain at their old position visually.

**Why it happens:**
Three.js meshes and Rapier rigid bodies are completely independent objects. Developers create both but forget to synchronize positions every frame, or sync positions but not rotations, or sync in the wrong direction (copying mesh position to body instead of body position to mesh).

**How to avoid:**
Create a simple sync function called every frame in the game loop:
```javascript
function syncPhysicsToGraphics(mesh, body) {
  const pos = body.translation();
  mesh.position.set(pos.x, pos.y, 0); // top-down, Z is up/depth
  // For 2D top-down, rotation is around Z axis only
  mesh.rotation.z = body.rotation();
}
```
Call this for every physics-enabled object in the render loop. Store mesh-body pairs in an array and iterate. The physics body is the source of truth, always copy FROM body TO mesh, never the reverse (except for kinematic bodies the player controls).

**Warning signs:**
- Objects visually overlap but don't collide
- Player sprite doesn't match collision boundaries
- Picked-up items stay in their old visual position

**Phase to address:**
Phase 1 (scaffolding). Build the sync loop as part of the initial game loop, not after objects are already placed.

---

### Pitfall 7: OrthographicCamera Framing Breaks on Window Resize

**What goes wrong:**
The game looks correct at one window size but stretches, crops, or misaligns when the window is resized or when running on a different monitor than the developer's.

**Why it happens:**
OrthographicCamera frustum is defined in world units (left, right, top, bottom), not pixels. If the camera isn't updated on window resize, the aspect ratio breaks. Unlike PerspectiveCamera where you just update the aspect ratio, OrthographicCamera requires recalculating all four frustum boundaries.

**How to avoid:**
Define a fixed game world height (e.g., 20 units) and calculate width from aspect ratio:
```javascript
const GAME_HEIGHT = 20;
function updateCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -GAME_HEIGHT * aspect / 2;
  camera.right = GAME_HEIGHT * aspect / 2;
  camera.top = GAME_HEIGHT / 2;
  camera.bottom = -GAME_HEIGHT / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', updateCamera);
```
For a game jam, you can also just set a fixed canvas size (e.g., 960x540) and skip resize handling entirely. This is faster to implement and acceptable for a demo.

**Warning signs:**
- Game looks stretched on ultrawide monitors
- Sprites appear at wrong positions after resize
- Camera shows more/less of the world than intended

**Phase to address:**
Phase 1 (scaffolding). Set up the camera correctly once during initial setup.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode API key in client JS | Saves 10 min not building proxy | Financial risk if deployed publicly | Only for local-only demo, never for deployment |
| Skip physics for pickup (use distance check) | Save 20 min of collision setup | Can't add physics puzzles later | Always acceptable for a game jam -- walk-over-to-carry doesn't need real physics |
| One giant file instead of modules | No import/bundler hassles | Unmaintainable after 500 lines | Acceptable for 2-hour jam if file stays under 400 lines |
| No error handling on API call | Saves 5 min | Demo crashes if OpenAI is slow/down | Never -- always have a fallback JSON |
| Inline magic numbers for positions | Faster to place objects | Hard to rebalance layout | Acceptable for jam, use comments to mark them |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI Structured Output | Schema too complex, causing 30-60 second cold-start | Keep schema flat: `{ rooms: [{ name, tiles: number[][], objects: string[] }] }`. Fewer fields = faster grammar compilation |
| OpenAI API | No timeout on fetch call | Set `AbortController` with 8-second timeout; fall back to pre-built JSON if it fails |
| Rapier WASM (compat) | Forgetting `await RAPIER.init()` | Gate all physics code behind init; don't create World in module scope |
| Free asset packs (itch.io) | Sprites have inconsistent tile sizes (16x16 mixed with 32x32) | Verify ALL sprites from a pack use the same grid size before starting; pick one pack and commit |
| Three.js texture loading | TextureLoader is async but often treated as sync | Preload all textures in a loading phase; don't create meshes until textures are ready |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Individual Mesh per tile (no instancing) | FPS drops below 30 | Use `InstancedMesh` for floor tiles; one draw call for all identical tiles | > 200 individual tile meshes |
| Creating new materials per sprite | GPU stalls, high draw call count | Reuse materials; use a texture atlas with UV offsets | > 50 unique materials |
| Physics step in render loop without fixed timestep | Physics behaves differently on 30fps vs 144fps monitors | Use fixed timestep: accumulate delta, step physics in fixed increments (1/60s) | Always -- different monitors = different physics |
| No object pooling for particles | GC stutters during spark/explosion effects | Pre-allocate particle pool; reuse objects instead of creating/destroying | > 100 particles created per second |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| API key in client-side code | Unlimited charges on your OpenAI account | Proxy through serverless function or local backend |
| No spending cap on OpenAI account | A leaked key could cost hundreds of dollars | Set hard monthly limit ($5-10) in OpenAI dashboard before the jam starts |
| LLM response rendered as HTML without sanitization | XSS if LLM returns malicious content (unlikely but possible) | Parse JSON only; never use innerHTML with LLM output |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback during API wait | Player/judge thinks game froze or crashed | Show "AI analyzing" animation with camera lights, screen flicker, data readouts |
| Reactor puzzle has no feedback on wrong placement | Player confused, doesn't know what to do | Sparks/red flash on wrong rod, temperature indicator changes, warning lights |
| Sector generation happens instantly with no buildup | Judges miss the "AI designed this" moment | Tiles slide in from edges with staggered animation (200ms per row); HUD map updates from "???" with typewriter effect |
| No initial orientation -- player dropped into dark room | 5 seconds of confusion in a 30-second demo window | Boot-up sequence: lights flicker on in sequence, pointing toward reactor chamber |
| Movement feels sluggish or too fast | Immediate bad impression | Tune WASD speed to cross the reactor room in ~2 seconds; test immediately |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Texture loading:** All sprites use NearestFilter -- verify by zooming in; any blurriness means a texture was missed
- [ ] **Physics sync:** Every physics body has a corresponding mesh being synced every frame -- drop a test object and watch it fall
- [ ] **API fallback:** If OpenAI is unreachable, a hardcoded JSON fallback generates the sector anyway -- test with airplane mode
- [ ] **Reactor puzzle:** All 3 states work (overheat, stall, stable) -- not just the happy path
- [ ] **Sector generation:** Tiles actually assemble visually, not just appear -- record a video of the transition to verify timing
- [ ] **Camera follows player:** Camera tracks player smoothly and doesn't jitter at room boundaries
- [ ] **Browser compatibility:** Test in Chrome AND Firefox -- WASM behavior can differ

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Rapier init fails in production | LOW | Switch to `rapier2d-compat` package; add `await RAPIER.init()` at top of main |
| API call too slow for demo | LOW | Pre-record a known-good API response as JSON; use it as default with API as optional upgrade |
| Pixel art blurry | LOW | Add NearestFilter to all textures in one pass; takes 5 minutes if textures are centralized |
| Scope overrun (too many rooms) | MEDIUM | Delete all rooms except reactor; redirect entry to go straight to reactor |
| Physics desync | MEDIUM | Add sync loop; if too broken, remove physics entirely and use simple distance-based collision |
| API key leaked | HIGH | Immediately rotate key in OpenAI dashboard; no code fix can undo the exposure |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Rapier WASM init failure | Phase 1 (Scaffolding) | Physics world creates successfully; test body falls under gravity |
| Pixel art blur | Phase 1 (Scaffolding) | Place one sprite; zoom in; pixels are crisp with no interpolation |
| Camera/resize breakage | Phase 1 (Scaffolding) | Resize window; game still renders correctly |
| Physics-graphics desync | Phase 1 (Scaffolding) | Drop a physics body; mesh follows it frame-by-frame |
| Scope explosion | Phase structure itself | Reactor room is fully playable before any other room is started |
| API latency killing demo flow | Phase 2 (Core Mechanics) | Time the full reactor->AI->sector flow; total wait with no visual dead time |
| API key exposure | Phase 1 (Scaffolding) | API key is not in any client-side JS file; grep confirms |
| No API fallback | Phase 2 (Core Mechanics) | Disconnect network; game still generates a sector from fallback JSON |
| Reactor puzzle only tests happy path | Phase 2 (Core Mechanics) | All 3 outcomes (overheat, stall, stable) produce distinct feedback |
| Sector assembly has no visual drama | Phase 3 (Polish) | Screen-record the transition; tiles visibly animate into place |

## Sources

- [Three.js Pixel Art Blur Discussion](https://discourse.threejs.org/t/texture-blur-when-using-pixelart-three-js-editor/32535)
- [Pixel-Perfect OrthographicCamera Discussion](https://discourse.threejs.org/t/pixelperfect-orthographic-camera-with-blocks-for-a-pixelart-2d-look/46637)
- [Rapier.js Getting Started (Official)](https://rapier.rs/docs/user_guides/javascript/getting_started_js/)
- [Rapier.js Async Init Issue](https://github.com/dimforge/rapier.js/issues/30)
- [Rapier + Vite WASM Compat Issue](https://github.com/dimforge/rapier.js/issues/49)
- [Three.js Sprite Batching Performance](https://github.com/mrdoob/three.js/issues/7371)
- [OpenAI Latency Optimization Guide](https://platform.openai.com/docs/guides/latency-optimization)
- [OpenAI Structured Output Cold-Start Latency](https://community.openai.com/t/structured-output-caching-and-latency/904483)
- [OpenAI API Key Best Practices](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [OpenAI Frontend Key Exposure Discussion](https://community.openai.com/t/web-implentation-and-keeping-the-api-key-private/150422)
- [Three.js + Rapier Integration Guide](https://sbcode.net/threejs/physics-rapier/)
- [Three.js + Rapier Sync Tutorial (Medium)](https://medium.com/javascript-alliance/integrating-physics-in-three-js-with-rapier-a-complete-guide-55620630621c)

---
*Pitfalls research for: Aurora -- The Self-Designing Station (game jam)*
*Researched: 2026-03-15*
