# Roadmap: Aurora — The Self-Designing Station

## Overview

Three phases build the complete game jam demo in strict dependency order. Phase 1 delivers a movable player in a spatial layout with working physics. Phase 2 adds the reactor puzzle with full interactivity and environmental feedback. Phase 3 layers AI profiling, LLM-driven sector generation, and the visual payoff that proves the concept. Each phase produces a runnable increment — after Phase 1 you can walk around, after Phase 2 you can solve the reactor, after Phase 3 the AI builds a new room.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Rendering pipeline, physics, player movement, and spatial layout with collision
- [ ] **Phase 2: Reactor Gameplay** - Interactive reactor puzzle with carry mechanics, balance logic, and environmental feedback
- [ ] **Phase 3: AI Integration** - Behavioral profiling, LLM sector generation, tile assembly animation, and HUD

## Phase Details

### Phase 1: Foundation
**Goal**: Player can move through a spatially-laid-out station with crisp pixel art, working physics, and wall collision
**Depends on**: Nothing (first phase)
**Requirements**: SCENE-01, SCENE-02, PLAY-01, PLAY-02, PLAY-03, SPAT-01, SPAT-02, SPAT-03, SPAT-04, SPAT-05
**Success Criteria** (what must be TRUE):
  1. Game loads in browser and renders a top-down pixel art scene with crisp (non-blurry) sprites
  2. Player moves with WASD and camera follows smoothly in top-down view
  3. Player collides with walls and cannot walk through environment boundaries
  4. Interactable objects show a visual proximity cue (glow or highlight) when the player approaches
  5. All five spatial areas are traversable in sequence: Airlock corridor, Observation Catwalk, Reactor Chamber, Control Console area, Exit Blast Door
**Plans:** 4 plans

Plans:
- [ ] 01-01-PLAN.md — Vite + Three.js + Rapier scaffolding, renderer, physics, game loop
- [ ] 01-02-PLAN.md — Player entity with WASD movement, wall collision, reactor room layout
- [ ] 01-03-PLAN.md — Room manager, camera transitions, auto-doors, interactable proximity cues
- [ ] 01-04-PLAN.md — Human verification checkpoint for complete station navigation

### Phase 2: Reactor Gameplay
**Goal**: Player can solve the reactor calibration puzzle through physical interaction with fuel rods and coolant cells, with clear visual feedback for success and failure
**Depends on**: Phase 1
**Requirements**: REAC-01, REAC-02, REAC-03, REAC-04, REAC-05, REAC-06, SCENE-03, SCENE-04
**Success Criteria** (what must be TRUE):
  1. Reactor chamber contains a visible fusion core with maintenance platforms, coolant pipes, and storage racks
  2. Player can walk near a fuel rod or coolant cell to pick it up, carry one item at a time, and place it in a reactor slot by walking to it
  3. Placing wrong combinations produces failure feedback (sparks, warning lights, temperature indicators) and correct balance produces success feedback (stable glow, lights powering on, monitors activating)
  4. Station boot-up sequence plays on game start: fade-in, flickering emergency lights, ambient glow increase over approximately 5 seconds
  5. Environmental lighting transitions from dark emergency reds through reactor glow to full power-up as the player progresses
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: AI Integration
**Goal**: After reactor stabilization, the AI profiles player behavior, generates a new sector via LLM, and the station visibly assembles the new room on screen
**Depends on**: Phase 2
**Requirements**: AIPR-01, AIPR-02, AIPR-03, AIPR-04, GENR-01, GENR-02, GENR-03, GENR-04, GENR-05, SCENE-05
**Success Criteria** (what must be TRUE):
  1. After reactor stabilizes, subtle AI observation indicators appear: camera-like lights track the player, brief screen flicker, momentary data readout
  2. An OpenAI API call fires with the player's behavioral profile and returns a JSON sector layout (with hardcoded fallback if API is unreachable)
  3. New sector tiles animate into position by sliding from screen edges, visibly assembling the room the station designed
  4. Corner HUD mini-map updates from "???" to the generated sector name
  5. Particle effects (dust motes, reactor sparks, energy wisps) appear during sector generation to sell the visual drama
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/4 | Planning complete | - |
| 2. Reactor Gameplay | 0/0 | Not started | - |
| 3. AI Integration | 0/0 | Not started | - |
