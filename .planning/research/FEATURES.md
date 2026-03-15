# Feature Research

**Domain:** Web-based game jam sci-fi exploration with AI-driven level generation
**Researched:** 2026-03-15
**Confidence:** MEDIUM-HIGH (project scope well-defined, judging criteria clear, genre conventions established)

## Feature Landscape

### Table Stakes (Judges Expect These)

Features that must work or the demo fails to communicate the concept. Judges will not see past missing table stakes to evaluate the AI innovation.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Responsive WASD movement + collision | Broken movement = judges stop playing immediately | LOW | Rapier handles collision; keep player controller simple with velocity-based movement, not position snapping |
| Environmental lighting that reacts to state | Dark-to-lit transition is the first "wow" moment; static lighting feels amateur | LOW | Three.js point lights on reactor/power systems. Toggle intensity on state change. No complex shadow mapping needed |
| Clear interaction affordances | Judges have 60 seconds of patience; if they can't figure out what to do, they move on | LOW | Proximity-based highlight glow on interactable objects. Simple "E to interact" or walk-over-to-pick-up with visual cue |
| Reactor puzzle that is solvable in 30 seconds | The puzzle gates the demo; if judges get stuck, they never see the AI generation | LOW | 2 fuel rods + 1 coolant cell, clear visual slots, immediate feedback on wrong placement (sparks/warning) |
| Visible AI-generated sector assembly | This IS the core value proposition. If the generation isn't visually dramatic, the demo fails its pitch | MEDIUM | Tiles sliding in from edges, construction animation, camera acknowledgment. Must feel like the station is building itself |
| HUD mini-map with sector reveal | Judges need spatial context; "???" to named sector proves the AI generated something meaningful | LOW | Corner overlay, simple rectangle layout, text label swap on generation |
| Stable frame rate in browser | Stuttering or crashes during the critical moment destroys the demo | LOW | Keep draw calls low, limit particle count, test on modest hardware |

### Differentiators (Competitive Advantage with Judges)

Features that separate Aurora from "procedural generation with extra steps." These directly address the judging criteria: spatial understanding, environmental coherence, dynamic simulation, emergent experiences, AI-native gameplay.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Behavioral profiling with visible feedback** | Judges see the AI is WATCHING -- camera-like lights tracking player, brief data readout flicker. This proves "AI-native gameplay" and "emergent experiences" | MEDIUM | Track: movement efficiency (direct vs wandering), interaction speed (fast vs careful), exploration tendency (do they look around or beeline). Display subtle indicators -- screen flicker, tracking lights, brief HUD data flash |
| **Profiled sector reflects player behavior** | The generated sector should visibly differ based on play style. A cautious player gets a different room than an aggressive one. This is the "spatial understanding" and "environmental coherence" win | MEDIUM | LLM prompt includes player profile; JSON output specifies room type, object density, layout style. Even 2-3 distinct archetypes (explorer/efficient/cautious) is enough to demonstrate |
| **Station boot-up sequence** | Atmospheric entry sells the sci-fi fantasy. Dark airlock, emergency lights flickering on, systems humming to life. Judges remember atmosphere | LOW | Scripted sequence: fade in, flicker lights 2-3 times, ambient glow increases, particle dust. 5-10 seconds, no interaction needed |
| **Environmental storytelling through generated content** | Generated sector has a name, implied purpose, and object placement that tells a micro-story. "Xenobiology Lab" with specimen containers vs "Navigation Array" with star charts | LOW | Part of the LLM prompt design -- request sector name, purpose, and 3-5 placed objects with descriptions. Low implementation cost, high narrative payoff |
| **Physics-based object interaction** | Walking over and carrying fuel rods/coolant cells with Rapier physics feels tangible. Objects have weight and respond to the world | MEDIUM | Rapier WASM handles this but tuning physics feel takes time. Keep to pick-up/place-down, no throwing or complex stacking |
| **AI observation "reveal" moment** | A brief, deliberate moment where the player realizes the station is analyzing them -- subtle enough to feel organic, clear enough judges catch it | LOW | 1-2 second beat: camera lights swivel to player, screen glitches, data readout flashes player stats. Then it passes. This is the narrative hinge |

### Anti-Features (Do NOT Build in 2 Hours)

Features that seem appealing but will eat the time budget or muddy the demo's focus.

| Feature | Why Tempting | Why Problematic | Alternative |
|---------|-------------|-----------------|-------------|
| **Multiple generation loops** | "What if the station keeps building?" | One perfect transition proves the concept. Two mediocre ones prove nothing. Each loop multiplies testing time | One killer beat. Polish it. If judges want more, that's a win |
| **Combat / enemy encounters** | Sci-fi station = something should attack you, right? | Combat requires AI behavior, health systems, damage feedback, death/respawn -- each a 30+ minute feature | Environmental tension through lighting, sound design (oh wait, silent), and the AI observation moment |
| **Inventory system** | Carrying items "properly" with slots and UI | Walk-over-to-carry is faster to implement and reads clearly at demo scale | Simple: walk near object, it attaches to player, walk to slot, it places. One held item at a time |
| **Dialogue / text system** | NPCs or station AI talking to the player | Text systems need UI, pacing, skip logic, positioning. Zero NPCs in the design | Environmental storytelling through object placement, sector naming, and visual state changes |
| **Custom shader effects** | Holographic displays, force fields, energy beams | Shader authoring is a time sink with debugging risk. One broken shader can block the whole demo | Three.js built-in emissive materials, point lights with color, simple particle systems |
| **Audio / sound design** | "Just a few sound effects would help" | Audio requires sourcing, loading, timing, volume balancing. Every minute on audio is a minute not on the core loop | Explicitly silent. The visuals must carry the entire experience. This constraint focuses effort |
| **Procedural music that responds to AI** | Generative soundtrack matching the generated sector | Massive scope. Web Audio API, music theory, timing sync. A bad procedural soundtrack is worse than silence | Silent prototype. If anything, a single ambient drone loop (but even that is scope creep) |
| **Save/load or session persistence** | "What if judges want to replay?" | Serialization, state management, edge cases. Demo is one-shot by design | Refresh the page to restart. The demo is 2-3 minutes |
| **Mobile / touch support** | "More people can play it" | Touch input, responsive layout, performance testing on mobile -- each a significant effort | Keyboard + mouse only. Judges are at desks |
| **Multiple LLM calls or streaming** | Real-time AI narration, multiple generation passes | API latency, error handling, rate limits, streaming UI. One call is risky enough | Single structured JSON call after reactor stabilization. One shot, one result |

## Feature Dependencies

```
[WASD Movement + Collision]
    |
    +--requires--> [Scene Setup / Three.js + Rapier Init]
    |
    +--enables--> [Object Interaction (carry fuel rods/coolant)]
                      |
                      +--enables--> [Reactor Puzzle Logic]
                                        |
                                        +--enables--> [Behavioral Profiling]
                                        |                 |
                                        +--triggers--> [AI Observation Moment]
                                                          |
                                                          +--triggers--> [LLM API Call]
                                                                            |
                                                                            +--enables--> [Sector Assembly Animation]
                                                                            |                 |
                                                                            +--enables--> [HUD Map Update]

[Environmental Lighting]
    +--enhances--> [Station Boot-up Sequence]
    +--enhances--> [Reactor Puzzle Feedback]
    +--enhances--> [Sector Assembly Animation]

[Station Boot-up Sequence] --independent-- (runs first, no dependencies beyond scene setup)
```

### Dependency Notes

- **Object Interaction requires Scene Setup:** Rapier physics world must exist before objects can have rigid bodies
- **Reactor Puzzle requires Object Interaction:** Players must carry fuel rods and coolant to slots
- **Behavioral Profiling requires Reactor Puzzle:** Profiling happens during and after puzzle solving -- needs player actions to observe
- **LLM Call requires Behavioral Profiling:** The prompt includes the player profile data
- **Sector Assembly requires LLM Call:** The JSON response defines what to build
- **Environmental Lighting enhances everything:** Invest early; it makes every subsequent feature look better
- **Station Boot-up is independent:** Can be built and polished separately, runs as the first experience

## MVP Definition

### The Demo (Build in 2 Hours)

Minimum viable demo that proves the concept to judges.

- [ ] **Scene with atmospheric lighting** -- dark station, emergency reds, reactor glow. This sets the tone in the first 3 seconds
- [ ] **Player movement with collision** -- WASD, camera follows, walls stop you. Non-negotiable foundation
- [ ] **Station boot-up sequence** -- scripted 5-second intro, lights flicker on. Cheap but high-impact atmosphere
- [ ] **Reactor chamber with interactive objects** -- 2 fuel rods, 1 coolant cell, clear placement zones
- [ ] **Reactor balance logic with visual feedback** -- wrong = sparks/warning, right = stable glow and power-up
- [ ] **Behavioral profiling** -- track 3 metrics during puzzle: speed, efficiency, exploration
- [ ] **AI observation moment** -- 2-second beat showing the station noticed you
- [ ] **Single LLM API call** -- send profile, receive JSON sector layout
- [ ] **Sector assembly animation** -- tiles slide in, station builds the new room
- [ ] **HUD mini-map update** -- "???" becomes the generated sector name

### If Time Permits (Polish Layer)

Features to add only if core loop is working and stable.

- [ ] **Particle effects** -- dust motes, reactor sparks, energy wisps during generation
- [ ] **More nuanced profiling** -- additional behavioral dimensions beyond the core 3
- [ ] **Environmental storytelling in generated sector** -- objects with implied narrative purpose
- [ ] **Screen shake / camera effects** -- during reactor events and sector assembly
- [ ] **Smooth transitions** -- fade effects between states, eased animations

### Explicitly Deferred

- [ ] **Multiple sectors** -- one is the proof of concept
- [ ] **Any form of combat** -- not this demo
- [ ] **Audio of any kind** -- silent by design constraint
- [ ] **Custom art** -- free asset packs only

## Feature Prioritization Matrix

| Feature | Judge Impact | Implementation Cost | Priority |
|---------|-------------|---------------------|----------|
| Environmental lighting (dark-to-lit) | HIGH | LOW | P1 |
| WASD movement + collision | HIGH | LOW | P1 |
| Reactor puzzle (carry + place) | HIGH | MEDIUM | P1 |
| Reactor visual feedback (sparks/glow) | HIGH | LOW | P1 |
| LLM API call (structured JSON) | HIGH | MEDIUM | P1 |
| Sector assembly animation (tiles slide in) | HIGH | MEDIUM | P1 |
| HUD mini-map with reveal | MEDIUM | LOW | P1 |
| Station boot-up sequence | MEDIUM | LOW | P1 |
| Behavioral profiling (3 metrics) | HIGH | LOW | P1 |
| AI observation moment (tracking lights) | HIGH | LOW | P1 |
| Physics-based carry interaction | MEDIUM | MEDIUM | P2 |
| Particle effects | MEDIUM | LOW | P2 |
| Environmental storytelling in generated room | MEDIUM | LOW | P2 |
| Camera effects (shake, zoom) | LOW | LOW | P2 |
| Multiple behavioral archetypes | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must exist for the demo to communicate "AI-native gameplay" to judges
- P2: Polish that elevates from "working prototype" to "impressive demo"
- P3: Nice-to-have if somehow ahead of schedule

## Competitor Feature Analysis (Game Jam Context)

Based on analysis of PROCJAM, HuggingFace AI Game Jam, and AI NPC Jam entries:

| Feature | Typical AI Game Jam Entry | Top-Ranked Entries | Aurora's Approach |
|---------|---------------------------|-------------------|-------------------|
| AI integration depth | AI generates assets pre-game or simple runtime text | AI drives core gameplay loop; generation is THE mechanic | AI profiles behavior AND generates environment -- double integration |
| Visual polish | Functional but rough | Cohesive art style, atmospheric lighting | Pixel art + Three.js lighting = stylish without custom art |
| Interactivity | Click-based, menu-driven | Physical, spatial, tactile | Walk-over carry, physics-based placement, spatial puzzles |
| Generation visibility | Behind-the-scenes, results just appear | Player sees or understands the generation | Tiles visibly slide into place -- generation IS the spectacle |
| Player agency in generation | Random or prompt-based | Player behavior influences output | Behavioral profiling directly shapes the generated world |
| Demo completeness | Often broken or incomplete loops | Full loop from input to visible output | One complete loop: interact -> profile -> generate -> reveal |

## What Judges Will Be Looking For (Mapped to Features)

Based on the stated judging criteria:

| Criterion | What Proves It | Aurora Feature |
|-----------|---------------|----------------|
| **Spatial Understanding** | AI generates layouts that make spatial sense -- rooms connect logically, objects are placed purposefully | LLM structured output specifying room dimensions, door placement, object positions in a coherent grid |
| **Environmental Coherence** | Generated environment feels like it belongs in the station -- consistent theme, logical purpose | LLM prompt requests sector name, purpose, and thematically appropriate objects. Tileset consistency from shared asset pack |
| **Dynamic Simulation** | Systems respond to player actions in real-time -- reactor physics, environmental state changes | Reactor balance logic with immediate visual feedback, lighting state tied to power level, physics-based objects |
| **Emergent Experiences** | Different players get different results -- the system creates unique moments | Behavioral profiling ensures no two playthroughs generate the same sector. The AI observation moment is emergent narrative |
| **AI-Native Gameplay** | AI is not a gimmick -- it IS the game. Remove the AI and the game doesn't work | The entire second half of the demo (sector generation) cannot exist without the LLM. The station's core identity is that it adapts |

## Sources

- [PROCJAM - The Procedural Generation Jam](https://itch.io/jam/procjam) -- Genre conventions, entry patterns
- [HuggingFace AI Game Jam Results](https://huggingface.co/blog/game-jam-first-edition-results) -- Winning entry analysis, judging patterns
- [It's Alive! AI NPC Jam](https://itch.io/jam/its-alive-ai-npc) -- AI-native gameplay evaluation criteria
- [NVIDIA Generative AI Game Jam Case Study](https://research.nvidia.com/publication/2025-06_generative-ai-game-jam-case-study-october-2024) -- Academic analysis of AI game jam patterns
- [Level Generation Through Large Language Models (arXiv)](https://arxiv.org/pdf/2302.05817) -- LLM level generation technical patterns
- [Game Generation via LLMs (arXiv)](https://arxiv.org/abs/2404.08706) -- Runtime generation approaches and pitfalls
- [Procedural Content in Games: Gen AI Levels Up in 2025](https://www.thinkgamerz.com/procedural-content-generation-genai-ai-level-design/) -- Current state of AI-driven PCG
- [Judging a Global Game Jam](https://www.gamedeveloper.com/design/judging-a-global-game-jam) -- Game jam judging philosophy
- [The Designer's Notebook: How Should We Judge a Game Jam?](https://www.gamedeveloper.com/design/the-designer-s-notebook-how-should-we-judge-a-game-jam-) -- Evaluation frameworks

---
*Feature research for: Aurora -- AI-driven space station exploration game jam demo*
*Researched: 2026-03-15*
