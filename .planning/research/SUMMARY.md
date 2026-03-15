# Project Research Summary

**Project:** Aurora: The Self-Designing Station
**Domain:** Web-based game jam demo -- top-down sci-fi exploration with AI-driven level generation
**Researched:** 2026-03-15
**Confidence:** HIGH

## Executive Summary

Aurora is a 2-hour game jam build: a top-down pixel-art space station game where an LLM generates new sectors based on observed player behavior. The expert approach for this type of project is vanilla Three.js (no React/R3F overhead) with Rapier 2D WASM physics, a single OpenAI structured output call, and ruthless scope discipline. The stack is well-proven -- Three.js for atmospheric lighting over 2D sprite planes, Rapier-compat for zero-config WASM physics, and gpt-4o-mini with Zod schema validation for guaranteed-valid room layout JSON. No frameworks, no ECS, no build complexity.

The recommended build strategy is depth-first on a single gameplay beat rather than breadth across multiple rooms. Build one fully interactive reactor chamber with physics-based object carrying, a 3-metric behavioral profiler, a single LLM call masked by a scripted "AI observation" animation, and a tile-slide sector assembly. This one complete loop -- interact, profile, generate, reveal -- is what wins game jam judging. Five half-finished rooms prove nothing; one polished transition proves the concept.

The top risks are: (1) OpenAI API latency killing the demo's pacing (mitigate by firing the API call during the observation animation sequence and having a hardcoded fallback JSON), (2) Rapier WASM initialization failing silently (mitigate by using the -compat package and gating all code behind `await RAPIER.init()`), and (3) scope explosion beyond the reactor room (mitigate through strict phase structure that enforces full interactivity before any second room). Every other risk -- blurry textures, physics desync, camera resize bugs -- is preventable with known patterns applied in the scaffolding phase.

## Key Findings

### Recommended Stack

The entire stack fits in 4 core dependencies plus TypeScript. No framework layer, no state management library, no animation library. Every addition was evaluated against a 2-hour time budget.

**Core technologies:**
- **Vite 6.x + TypeScript 5.7**: Dev server and bundler. Do NOT use Vite 8 (released 2 days ago, plugin ecosystem unverified). TS is non-optional given WASM + API integration complexity.
- **Three.js 0.183**: 3D renderer used for 2D sprites on planes with atmospheric point lighting. OrthographicCamera, NearestFilter textures, MeshStandardMaterial. WebGLRenderer only (no WebGPU).
- **@dimforge/rapier2d-compat 0.19**: 2D physics via WASM. Must use the `-compat` package (base64-embedded WASM, zero bundler config). Zero gravity for top-down. Sensor colliders for pickup/slot detection.
- **openai 6.27 + zod 3.24**: Official SDK with native structured output support via Zod schemas. Use `zodResponseFormat()` for guaranteed schema-compliant JSON. Target gpt-4o-mini for speed.
- **API key strategy**: For local-only demo, use `import.meta.env.VITE_OPENAI_KEY`. Set a $5 spending cap on OpenAI. If deploying publicly, add a 20-line Node proxy.

### Expected Features

**Must have (table stakes -- judges stop playing without these):**
- Responsive WASD movement with collision
- Environmental lighting that reacts to game state (dark-to-lit transitions)
- Clear interaction affordances (proximity highlight, walk-over-to-carry)
- Reactor puzzle solvable in 30 seconds (2 fuel rods + 1 coolant cell)
- Visible AI-generated sector assembly (tiles sliding in -- this IS the demo)
- HUD mini-map with "???" to named sector reveal
- Stable frame rate throughout

**Should have (differentiators that win judging):**
- Behavioral profiling with visible feedback (tracking lights, data readouts)
- Profiled sector that visibly differs by play style
- Station boot-up sequence (5-10 second atmospheric intro)
- AI observation "reveal" moment (station notices the player)
- Environmental storytelling in generated sectors (named rooms with thematic objects)

**Defer (not in 2 hours):**
- Multiple generation loops / sectors
- Combat or enemy AI
- Audio of any kind (silent by design constraint)
- Inventory UI, dialogue system, custom shaders
- Mobile/touch support, save/load, streaming LLM calls

### Architecture Approach

The architecture is a fixed-timestep game loop orchestrating four independent systems: input, physics, game state, and rendering. Game progression follows a linear phase state machine (BOOT -> AIRLOCK -> REACTOR -> PROFILING -> GENERATION -> EXPLORE). Entities are simple mesh+body tuples created by factory functions -- no ECS overhead for fewer than 20 entities. The LLM integration is fire-and-forget: one async fetch masked by animation, response parsed into tile data for the sector builder.

**Major components:**
1. **Game Loop** -- fixed 1/60s timestep with accumulator, RAF for rendering
2. **Phase State Machine** -- string enum controlling what systems are active and what input does
3. **Entity Factory** -- functions returning `{mesh, body, collider}` tuples for each game object
4. **Scene Manager** -- loads/unloads room layouts, manages Three.js scene graph and Rapier body lifecycle
5. **Profiler + LLM Client** -- isolated AI subsystem that collects behavior data and produces sector JSON
6. **Sector Builder** -- parses LLM JSON response, creates tile meshes, animates slide-in assembly

### Critical Pitfalls

1. **Rapier WASM init failure** -- Gate ALL physics code behind `await RAPIER.init()`. Use -compat package. Test with a single falling body before writing any game logic. Phase 1 concern.
2. **OpenAI API latency freezing the demo** -- Structured output cold-start is 2-60 seconds on first call. Design the observation animation to run concurrently with the API call. Keep schema flat and small. Always have a hardcoded fallback JSON. Phase 2 concern.
3. **Pixel art rendering blurry** -- Set `NearestFilter` on both mag and min filter, disable mipmaps, disable renderer antialiasing. Create a `loadPixelTexture()` wrapper used everywhere. Phase 1 concern.
4. **Scope explosion beyond reactor room** -- The PROJECT.md lists 5 rooms. Build exactly ONE (reactor chamber) with full interactivity first. The airlock is a 5-minute visual-only entry. Everything else is cut. Roadmap-level concern.
5. **Physics-graphics position desync** -- Rapier bodies and Three.js meshes are independent. Build a sync function called every frame that copies body positions to mesh positions. Never write mesh positions back to bodies. Phase 1 concern.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Scaffolding
**Rationale:** Every subsequent feature depends on the rendering pipeline, physics engine, and game loop being correctly initialized. Four of seven critical pitfalls (WASM init, pixel art blur, camera framing, physics-graphics sync) must be resolved here. This is the highest-risk phase because silent failures here cascade into every other phase.
**Delivers:** Running game loop with a player sprite moving in a room with walls, crisp pixel art, working physics, and an orthographic camera.
**Addresses:** WASD movement + collision (table stakes), environmental lighting foundation, stable frame rate
**Avoids:** Rapier WASM init failure, pixel art blur, camera resize breakage, physics-graphics desync
**Stack:** Vite 6.x, TypeScript, Three.js 0.183, @dimforge/rapier2d-compat 0.19, .env setup for API key

### Phase 2: Core Gameplay Loop
**Rationale:** The reactor puzzle is the primary interaction that gates the entire AI demo. Object carrying, slot placement, and reactor balance logic must work before profiling or AI integration can be tested. This phase also establishes the entity factory pattern used for all subsequent objects.
**Delivers:** Playable reactor chamber with fuel rod/coolant carrying, reactor balance puzzle with visual feedback (sparks, glow, warning states), and the station boot-up intro sequence.
**Addresses:** Reactor puzzle (table stakes), interaction affordances (table stakes), station boot-up sequence (differentiator), physics-based object interaction
**Avoids:** Scope explosion (stay in one room), reactor puzzle only testing happy path

### Phase 3: AI Integration
**Rationale:** This is the differentiator and must be built as a paired unit: profiler collects data during reactor puzzle, observation animation plays while API call fires, sector builder renders the response. These three subsystems are tightly coupled in timing but cleanly separated in code.
**Delivers:** Behavioral profiling (3 metrics), AI observation reveal moment, single OpenAI API call with structured output, sector assembly tile animation, HUD mini-map update.
**Addresses:** Behavioral profiling (differentiator), profiled sector generation (differentiator), AI observation moment (differentiator), visible sector assembly (table stakes), HUD mini-map (table stakes)
**Avoids:** API latency killing demo flow (observation animation masks it), no API fallback (hardcoded JSON backup)
**Stack:** openai SDK, zod schemas, zodResponseFormat

### Phase 4: Polish and Demo Prep
**Rationale:** Only reached if Phases 1-3 are solid. Pure visual enhancement and edge case hardening. Nothing here is required for the demo to function, but everything here elevates "working prototype" to "impressive demo."
**Delivers:** Particle effects (sparks, dust, energy wisps), camera effects (shake during reactor events), environmental storytelling in generated sector, smooth transitions and eased animations.
**Addresses:** All P2 features from the prioritization matrix
**Avoids:** Sector assembly lacking visual drama

### Phase Ordering Rationale

- **Strict dependency chain:** Scene setup -> player movement -> object interaction -> reactor puzzle -> profiling -> API call -> sector generation. Each phase builds on the previous. Skipping ahead creates untestable code.
- **Risk-first ordering:** Phase 1 addresses 4 of 7 critical pitfalls. Phase 3 addresses the remaining high-risk integration (API latency). By the time Phase 4 starts, all known risks are resolved.
- **Demo-viable at each phase:** After Phase 2, there is a playable reactor puzzle demo (even without AI). After Phase 3, the full concept is proven. Phase 4 is pure upside.
- **Scope enforcement:** The phase structure itself prevents the "build 5 rooms" pitfall by keeping all work in the reactor chamber until Phase 3 introduces the generated sector.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (AI Integration):** The OpenAI structured output cold-start latency (2-60s) needs real-world testing with the actual schema. The prompt engineering for behavioral-profile-to-room-layout conversion is underspecified. The tile animation system needs concrete timing and easing decisions.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** All patterns are well-documented -- Three.js ortho camera, Rapier init, fixed-timestep loop, pixel texture loading. Code snippets exist in the research files.
- **Phase 2 (Core Gameplay):** Sensor-based pickup/drop, state machines, and entity factories are standard game dev patterns. No novel integration.
- **Phase 4 (Polish):** Particle systems, camera shake, and UI transitions are purely cosmetic with abundant Three.js examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against current versions, official docs consulted, known compatibility issues documented with workarounds |
| Features | MEDIUM-HIGH | Judging criteria well-mapped to features, but behavioral profiling's judge impact is assumed, not validated |
| Architecture | HIGH | Standard game loop patterns, well-documented Three.js + Rapier integration, code examples verified |
| Pitfalls | HIGH | Every pitfall sourced from documented community issues with reproduction steps and verified solutions |

**Overall confidence:** HIGH

### Gaps to Address

- **Prompt engineering for LLM call:** The exact prompt that converts player behavioral profile into a coherent room layout is unspecified. Needs experimentation during Phase 3 planning to determine what level of detail in the prompt produces good structured output.
- **Asset selection:** No specific free sprite pack has been chosen. Need to verify a single pack with consistent tile sizes (16x16 or 32x32) before Phase 1 begins. Inconsistent tile sizes across packs is a documented integration gotcha.
- **OpenAI cold-start latency:** Structured output grammar compilation can take up to 60 seconds on first call. Need to test with the actual Zod schema and consider a warm-up call during the boot-up sequence to pre-cache the grammar.
- **InstancedMesh threshold:** Research flags that >200 individual tile meshes causes FPS drops. The generated sector's tile count needs to stay under this limit, or InstancedMesh must be used. Exact tile counts depend on room size decisions.

## Sources

### Primary (HIGH confidence)
- [Three.js v0.183 releases](https://github.com/mrdoob/three.js/releases) -- version verification
- [Rapier.js official docs](https://rapier.rs/docs/user_guides/javascript/getting_started_js/) -- init patterns, collider setup
- [@dimforge/rapier2d-compat NPM](https://www.npmjs.com/package/@dimforge/rapier2d-compat) -- v0.19.3, compat rationale
- [OpenAI Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) -- schema format, Zod integration
- [OpenAI Node SDK](https://www.npmjs.com/package/openai) -- v6.27.0, zodResponseFormat
- [Vite releases](https://vite.dev/releases) -- v6.x vs v8.0 decision

### Secondary (MEDIUM confidence)
- [Rapier.js WASM/Vite compat issue #49](https://github.com/dimforge/rapier.js/issues/49) -- why -compat is needed
- [OpenAI structured output cold-start latency](https://community.openai.com/t/structured-output-caching-and-latency/904483) -- 2-60s first-call penalty
- [Three.js pixel art texture discussions](https://discourse.threejs.org/t/pixelart-texture-becomes-fatter/65904) -- NearestFilter solution
- [NVIDIA AI Game Jam Case Study](https://research.nvidia.com/publication/2025-06_generative-ai-game-jam-case-study-october-2024) -- judging patterns
- [LLM Level Generation (arXiv)](https://arxiv.org/pdf/2302.05817) -- technical patterns for LLM-driven PCG

### Tertiary (LOW confidence)
- [HuggingFace AI Game Jam Results](https://huggingface.co/blog/game-jam-first-edition-results) -- competitor analysis (different jam, similar domain)
- Behavioral profiling judge impact -- inferred from judging criteria, not validated with actual judges

---
*Research completed: 2026-03-15*
*Ready for roadmap: yes*
