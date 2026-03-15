# Aurora: The Self-Designing Station

An AI-driven space station that observes player behavior and dynamically generates new environments in response.

## Concept

Aurora is a derelict space station controlled by an intelligent AI. As players interact with station systems, the AI profiles their behavior — movement efficiency, problem-solving speed, exploration tendency — and uses that data to generate the next sector of the station in real-time.

The core loop:
1. **Interact** — Stabilize the reactor by balancing fuel rods and coolant cells
2. **Observe** — The station AI silently analyzes how you play
3. **Generate** — A new sector assembles itself based on your player profile
4. **Explore** — Enter the AI-designed environment

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Controls

- **WASD** — Move
- Walk near doors to transition between rooms
- Walk near objects to interact

## Tech Stack

- **Three.js** — Rendering with dynamic lighting and pixel art sprites
- **Rapier** — WASM physics engine for collision and character movement
- **OpenAI API** — Runtime sector generation based on player behavioral profiling
- **Vite** — Build tooling
- **TypeScript** — Type-safe game logic

## Station Layout

- **Reactor Chamber** — Central hub with fusion core and containment ring
- **Airlock Corridor** — Damaged entry point with debris and storage
- **Observation Catwalk** — Narrow walkway with exposed pipes
- **Control Console** — System monitoring with interactive panels
- **Blast Door Corridor** — Locked exit leading to AI-generated sectors

## How It Works

The station's AI tracks three behavioral dimensions during gameplay:

- **Movement Efficiency** — Direct path vs exploration
- **Interaction Speed** — How quickly puzzles are solved
- **Curiosity** — Tendency to investigate or rush

After the reactor is stabilized, the AI sends this profile to an LLM which returns a JSON room layout. The station then visibly constructs the new sector — tiles slide into position, systems power on, and the station map updates from "???" to the generated sector name.

## License

MIT
