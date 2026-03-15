# Requirements: Aurora — The Self-Designing Station

**Defined:** 2026-03-15
**Core Value:** One perfect adaptive transition: player stabilizes reactor → AI profiles behavior → station visibly constructs new sector based on player profile

## v1 Requirements

### Scene & Atmosphere

- [x] **SCENE-01**: Game renders in browser with Three.js (OrthographicCamera, pixel art sprites on planes with NearestFilter)
- [x] **SCENE-02**: Rapier 2D WASM physics initialized with async gate
- [ ] **SCENE-03**: Environmental lighting: dark emergency reds → reactor glow → full power-up with point lights
- [ ] **SCENE-04**: Station boot-up sequence: 5-second scripted intro with fade-in, flickering emergency lights, ambient glow increase
- [ ] **SCENE-05**: Particle effects: dust motes, reactor sparks, energy wisps during sector generation

### Player & Movement

- [x] **PLAY-01**: Player moves with WASD, camera follows in top-down view
- [x] **PLAY-02**: Player collides with walls and environment objects via Rapier colliders
- [x] **PLAY-03**: Interactable objects show visual proximity cue (glow or highlight)

### Reactor System

- [ ] **REAC-01**: Reactor chamber with central fusion core, maintenance platforms, coolant pipes, storage racks
- [ ] **REAC-02**: 2 fuel rods and 1 coolant cell placed naturally in environment as carryable objects
- [ ] **REAC-03**: Walk-over-to-carry mechanic: walk near object to pick up, walk to slot to place, one item at a time
- [ ] **REAC-04**: Balance logic: too much fuel = overheat, too much coolant = stall, correct combination = stabilize
- [ ] **REAC-05**: Failure feedback: sparks, warning lights, temperature indicators rise, lights flicker aggressively
- [ ] **REAC-06**: Success feedback: reactor glow stabilizes, lights power on, machinery hums, monitors come online

### AI Profiling

- [ ] **AIPR-01**: Track movement efficiency (direct path vs wandering) during reactor interaction
- [ ] **AIPR-02**: Track interaction speed (time to solve puzzle)
- [ ] **AIPR-03**: Track exploration tendency (did player look around or beeline to objective)
- [ ] **AIPR-04**: Subtle AI observation moment: camera-like lights track player, brief screen flicker, momentary data readout

### Sector Generation

- [ ] **GENR-01**: Single OpenAI API call with structured JSON output (gpt-4o-mini, Zod schema)
- [ ] **GENR-02**: LLM prompt includes player profile data, receives sector name + tile layout + object positions
- [ ] **GENR-03**: Sector assembly animation: room tiles slide in from screen edges as station builds itself
- [ ] **GENR-04**: Corner HUD mini-map updates from "???" to generated sector name
- [ ] **GENR-05**: Hardcoded fallback JSON response if OpenAI API is unreachable

### Spatial Layout

- [x] **SPAT-01**: Docking Airlock corridor as entry point
- [x] **SPAT-02**: Observation Catwalk connecting to reactor
- [x] **SPAT-03**: Circular reactor chamber (main gameplay space)
- [x] **SPAT-04**: Control console area adjacent to reactor
- [x] **SPAT-05**: Exit blast door that unlocks on reactor stabilization

## v2 Requirements

### Combat & Encounters

- **ENCR-01**: Guardian construct that behaves according to player profile
- **ENCR-02**: System traps vs direct attacks based on play style

### Audio

- **AUDP-01**: Sound effects (hums, sparks, alarms, door sounds)
- **AUDP-02**: Ambient atmospheric drone loop

### Extended Generation

- **EXTG-01**: Multiple sector generation loops (station keeps building)
- **EXTG-02**: Multiple behavioral archetypes producing visibly different results
- **EXTG-03**: Environmental storytelling in generated sectors (named objects with narrative purpose)

### Polish

- **PLSH-01**: Camera effects (shake, zoom) during reactor events and sector assembly
- **PLSH-02**: Smooth transitions and eased animations between states

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom pixel art | 2-hour constraint — free asset packs only |
| Mobile / touch controls | Judges are at desks — keyboard + mouse only |
| Save / load | Single session demo — refresh to restart |
| Inventory system | Walk-over carry is simpler and reads clearly |
| Dialogue / text system | Environmental storytelling only, no NPCs |
| Custom shaders | Time sink with debugging risk — use Three.js built-ins |
| Procedural music | Massive scope — silent prototype by design |
| Streaming LLM calls | One structured call is risky enough — no streaming |
| Multiple LLM calls | Single call per playthrough |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCENE-01 | Phase 1 | Complete |
| SCENE-02 | Phase 1 | Complete |
| SCENE-03 | Phase 2 | Pending |
| SCENE-04 | Phase 2 | Pending |
| SCENE-05 | Phase 3 | Pending |
| PLAY-01 | Phase 1 | Complete |
| PLAY-02 | Phase 1 | Complete |
| PLAY-03 | Phase 1 | Complete |
| REAC-01 | Phase 2 | Pending |
| REAC-02 | Phase 2 | Pending |
| REAC-03 | Phase 2 | Pending |
| REAC-04 | Phase 2 | Pending |
| REAC-05 | Phase 2 | Pending |
| REAC-06 | Phase 2 | Pending |
| AIPR-01 | Phase 3 | Pending |
| AIPR-02 | Phase 3 | Pending |
| AIPR-03 | Phase 3 | Pending |
| AIPR-04 | Phase 3 | Pending |
| GENR-01 | Phase 3 | Pending |
| GENR-02 | Phase 3 | Pending |
| GENR-03 | Phase 3 | Pending |
| GENR-04 | Phase 3 | Pending |
| GENR-05 | Phase 3 | Pending |
| SPAT-01 | Phase 1 | Complete |
| SPAT-02 | Phase 1 | Complete |
| SPAT-03 | Phase 1 | Complete |
| SPAT-04 | Phase 1 | Complete |
| SPAT-05 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after roadmap creation*
