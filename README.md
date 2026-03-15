# Aurora - 3D Asset Dashboard

A full-featured dashboard for generating, viewing, animating, and managing AI-powered 3D models. Built with Next.js, Three.js, and multiple AI APIs.

## Features

### 3D Model Generation
- **Text to 3D** - Describe what you want and generate a 3D model
- **Image to 3D** - Upload a photo and convert it to a 3D model
- **Multiview to 3D** - Provide front/right/back/left views for higher quality results

### Post-Processing
- **Retexture** - Regenerate textures on existing models
- **Stylize** - Apply artistic styles (cartoon, steampunk, clay, etc.)
- **Rig** - Auto-rig models with a skeleton for animation
- **Animate** - Apply preset animations (walk, run, slash, dance, etc.)
- **Convert** - Export to GLTF, GLB, FBX, OBJ, STL, USDZ

### AI Animation (GPT-5.4)
Describe what your character should do in plain English. GPT-5.4 reads the model's bone structure and generates keyframe animation data that plays directly on the 3D model in the browser. No presets needed.

### Smart Preset Matching (Seed 2.0)
For Tripo's preset animations, describe the action and Seed 2.0 picks the best matching presets and chains them into a sequence of up to 5 animations.

### Interactive 3D Viewer
- Three.js renderer with orbit controls
- Auto-rotation for static models
- Animation playback with play/pause
- Supports embedded and AI-generated animations

### Saved Gallery
- Save completed models with persistent thumbnails
- Re-open saved models with fresh download URLs
- Use saved models for post-processing

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **3D Rendering**: Three.js with GLTFLoader
- **3D Generation**: [Tripo3D API](https://platform.tripo3d.ai/docs/introduction)
- **AI Animation**: OpenAI GPT-5.4 (bone keyframe generation)
- **Smart Matching**: BytePlus Seed 2.0 (animation preset selection)
- **Storage**: localStorage for API keys, saved models, and thumbnails

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/akhileshrangani4/aurora.git
cd aurora
npm install --legacy-peer-deps
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### API Keys

On the login screen, enter:

| Key | Required | Source | Purpose |
|-----|----------|--------|---------|
| Tripo3D | Yes | [platform.tripo3d.ai](https://platform.tripo3d.ai) | 3D model generation and post-processing |
| OpenAI | Optional | [platform.openai.com](https://platform.openai.com) | AI animation (GPT-5.4 generates bone keyframes) |
| BytePlus | Optional | [console.byteplus.com](https://console.byteplus.com) | Smart animation preset matching via Seed 2.0 |

All keys are stored in localStorage and never leave your browser except to proxy through the Next.js API routes.

## Architecture

```
src/
  app/
    page.tsx              # Main dashboard UI
    layout.tsx            # App layout
    globals.css           # Global styles
    three-viewer.tsx      # Three.js 3D model viewer with animation support
    tripo-client.ts       # Tripo API client (create task, poll, upload)
    api/
      tripo/route.ts      # Tripo API proxy (generation, post-processing)
      proxy/route.ts      # CORS proxy for model/image downloads
      openai/route.ts     # GPT-5.4 animation keyframe generation
      byteplus/route.ts   # Seed 2.0 preset matching
```

### API Proxy

All external API calls are proxied through Next.js API routes. This keeps API keys server-side and avoids CORS issues when loading 3D model files from Tripo's CDN.

### AI Animation Pipeline

1. Rigged GLB model loads in Three.js viewer
2. Bone names are extracted from the skeleton
3. User describes the desired animation
4. GPT-5.4 receives bone names + description, outputs keyframe data (Euler rotations per bone per frame)
5. Keyframes are converted to `THREE.AnimationClip` and applied to the model
6. Animation plays in the viewer with play/pause controls

## Tripo API Coverage

| Feature | Endpoint | Status |
|---------|----------|--------|
| Text to 3D | `POST /task` (text_to_model) | Supported |
| Image to 3D | `POST /task` (image_to_model) | Supported |
| Multiview to 3D | `POST /task` (multiview_to_model) | Supported |
| Refine | `POST /task` (refine_model) | Supported (v1.4 only) |
| Retexture | `POST /task` (texture_model) | Supported |
| Stylize | `POST /task` (stylize_model) | Supported |
| Rig | `POST /task` (animate_rig) | Supported |
| Animate | `POST /task` (animate_retarget) | Supported |
| Convert | `POST /task` (convert_model) | Supported |
| Upload | `POST /upload` | Supported |
| Balance | `GET /user/balance` | Supported |
| Task Status | `GET /task/{id}` | Supported |

## License

See [LICENSE](LICENSE).
