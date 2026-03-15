# Aurora: The Self-Designing Station

## What This Is

A web-based top-down sci-fi exploration game built for a game jam demo. The player enters a derelict space station, stabilizes a reactor through physical interaction, and watches as an LLM-driven AI analyzes their behavior and dynamically generates the next station sector on screen. The core loop is: interact with systems → AI profiles player → station builds new environment in response.

## Core Value

One perfect adaptive transition: the player stabilizes the reactor, the AI observes their behavior, and the station visibly constructs a new sector based on the player profile. Judges must immediately see that the AI designed the level.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Web-based game running in browser (Three.js for lighting/particles, 2D pixel art sprites on planes, Rapier WASM for physics)
- [ ] Top-down perspective with WASD movement and mouse interaction
- [ ] Docking airlock entry with emergency lighting and station boot-up sequence
- [ ] Reactor chamber with central fusion core, maintenance platforms, coolant pipes, and storage racks
- [ ] Reactor calibration system: 2 fuel rods + 1 coolant cell, physical walk-over-to-carry interaction
- [ ] Reactor balance logic: too much fuel = overheat, too much coolant = stall, correct balance = stabilize
- [ ] Environmental feedback: sparks, warning lights, temperature indicators on mistakes; stable glow, lights powering on, machinery humming on success
- [ ] AI behavior profiling: track movement efficiency, interaction speed, exploration tendency after reactor stabilizes
- [ ] Subtle AI observation moment: camera-like lights track player, brief screen flicker, momentary data readout
- [ ] OpenAI API call at runtime: send player profile, receive JSON room layout for next sector
- [ ] Dynamic sector assembly: room tiles animate/slide into position from screen edges as station builds itself
- [ ] Corner HUD mini-map that updates from "???" to generated sector name when new sector appears
- [ ] Spatial layout: Docking Airlock → Observation Catwalk → Reactor Chamber → Control Console → Exit Blast Door
- [ ] Free pixel art asset packs for sci-fi tileset and objects
- [ ] No audio (silent — focus on visuals and mechanics)

### Out of Scope

- Full 10-minute demo flow — only building the one killer beat (reactor → AI → sector generation)
- Guardian/enemy encounters — no combat for v1
- Multiple sector generation loops — one transition is the proof of concept
- Sound design / music — silent prototype
- Custom pixel art — using free asset packs only
- Inventory system — simple walk-over carry mechanic
- Save/load — single session demo
- Mobile / touch controls — keyboard + mouse only

## Context

This is a game jam project with a ~2 hour build window. The judging criteria focus on: spatial understanding, environmental coherence, dynamic simulation, emergent experiences, and AI-native gameplay. The demo must clearly show the AI-driven world generation loop in a single polished transition. The pitch line is: "Aurora is an AI-driven station that observes player behavior and dynamically generates new environments and system challenges in response."

The demo flow for judges:
1. Player enters dark station, power boots up
2. Player stabilizes reactor (2 fuel rods, 1 coolant cell — solvable in ~30 seconds)
3. AI briefly profiles player behavior (subtle ambient indicators)
4. LLM generates next sector as JSON → station visibly assembles new room with sliding tiles
5. HUD map updates from "???" to the new sector name

## Constraints

- **Timeline**: ~2 hours total build time — every decision must optimize for speed
- **Platform**: Web browser, no native builds
- **Rendering**: Three.js for lighting/particles/effects over 2D pixel art sprites on planes
- **Physics**: Rapier WASM for object physics
- **LLM**: OpenAI API for runtime sector generation (JSON structured output)
- **Assets**: Free pixel art packs from itch.io or similar — no custom art
- **Audio**: None — silent prototype
- **Controls**: Keyboard (WASD) + mouse only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three.js + Rapier over full game engine | Web-native, no build tooling overhead, fast iteration | — Pending |
| Pixel art sprites on Three.js planes | Get atmospheric lighting/particles without 3D modeling | — Pending |
| Simple walk-over carry (not drag physics) | Fastest to implement in 2-hour window | — Pending |
| 3 total reactor components (2 fuel, 1 coolant) | Minimal complexity, solvable in 30 seconds for demo flow | — Pending |
| LLM returns JSON room layout | Structured output is parseable, renderable directly as tile data | — Pending |
| Tiles slide in for sector assembly | Visually dramatic, shows station "building itself", reinforces core concept | — Pending |
| Corner HUD map over in-world hologram | Simpler to implement, always visible to judges | — Pending |
| One killer beat over full demo | 2-hour constraint — one perfect transition proves the concept | — Pending |

---
*Last updated: 2026-03-15 after initialization*
