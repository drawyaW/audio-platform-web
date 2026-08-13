# SONORA Web

SONORA Web is the unified browser workspace for the audio creation platform. It
connects users, projects, audio assets, source separation, music analysis, AI
music generation, and Agent orchestration through durable `asset_id` and `task`
records.

Chinese documentation: [README.md](README.md)

![SONORA home](docs/images/home.png)

## Implemented features

### Account and project workspace

- Registration, JWT login, and session restoration through `audio-assets`.
- An automatically created Default Project plus user-created projects.
- Project-scoped audio, tasks, and derived assets throughout the application.
- Automatic light/dark theme selection based on local time.

### AI music generation

- Real `music-generation` and MiniMax Music integration.
- Prompt and lyrics modes with title, instrumental, sample-rate, bitrate, and
  output-format controls.
- Asynchronous progress followed by durable asset registration and immediate
  playback when generation finishes.
- `music-3.0-free` is the current default; actual availability comes from the
  backend capabilities endpoint.

![AI music generation](docs/images/ai-music.png)

### Audio workspace

- Project and `asset_id` based input selection with a shared player.
- Backend-provided separation models, model-defined stems, WAV/FLAC/MP3 output,
  live progress, and task recovery after navigation or refresh.
- Stem Solo controls and synchronized multi-track mix/mute preview.
- Essentia + beat_this analysis with BPM, key, beats, loudness, danceability,
  chord key, metadata, lyrics, and additional structured metrics.
- Playback-synchronized waveform and chord timeline views.

![Audio workspace](docs/images/audio-workspace.png)

### Asset library and playback

- Raw-audio upload and optional `.lrc` attachment or replacement.
- Raw assets grouped with their separation, analysis, and generated descendants.
- One bottom player for raw audio, stems, and generated music.
- Expandable analysis cards instead of exposing only an `analysis.json` filename.
- Database and MinIO deletion behavior designed to avoid orphaned records/files.

![Asset library](docs/images/asset-library.png)

When an asset with an analysis result is played from the library or workspace,
the bottom player can be expanded. It loads the latest analysis asset and linked
lyrics, then synchronizes a 24-second waveform window, the current chord, LRC
lyrics, music tags, and core analysis metrics with playback.

![Expanded playback with waveform, chords, lyrics, and analysis metrics](docs/images/playback-analysis.png)

### Task center

- Upload, separation, analysis, and generation tasks loaded from
  `audio-assets.task`.
- Type, status, progress, creation time, and output counts.
- Live queue enrichment for active separator/analyzer jobs, with SQL remaining
  the durable source of truth after queue records expire.

### Agent assistant

- Real SSE integration with `audio-openai-agent`; responses are no longer mock
  messages.
- Natural-language separation, analysis, generation, and chained workflows for
  the selected project and asset.
- Live tool-step visualization in the conversation.
- JWT remains transport context and is not displayed in chat; produced tasks and
  assets remain visible in the task center and asset library.

![Agent assistant](docs/images/agent-assistant.png)

## Backend integration

| Service | Default URL | Responsibility used by the frontend |
|---|---|---|
| `audio-assets` | `http://127.0.0.1:8030/api` | JWT, projects, uploads, assets, lyrics, tasks, playback URLs, deletion |
| `audio-separator` | `http://127.0.0.1:8001/api/audio-processing` | models, separation jobs, progress, stem assets |
| `audio-analyzer` | `http://127.0.0.1:8020/api/audio-analysis` | jobs, unified analysis, waveform, chords, lyrics, metrics |
| `audio-openai-agent` | `http://127.0.0.1:8010/api` | authenticated SSE chat and cross-service orchestration |
| `music-generation` | `http://127.0.0.1:8050/api/music-generation` | MiniMax generation jobs and generated assets |

Separation, analysis, and generation are asynchronous. The UI reports live queue
progress while SQL tasks and assets in `audio-assets` remain the durable source
of truth.

## Stack

- React 19 and TypeScript
- Vite
- React Router
- Lucide Icons
- Fetch and Server-Sent Events
- Conda environment: `audio-frontend`

## Local development

Create or reuse the frontend environment and install dependencies:

```bash
conda create -n audio-frontend -c conda-forge nodejs=22 -y
conda run -n audio-frontend npm install
cp .env.example .env.local
```

Start the development server:

```bash
./scripts/start_dev.sh
```

Open `http://127.0.0.1:8040`. To keep it in tmux:

```bash
./scripts/tmux_dev.sh
tmux attach -t audio-platform-web
```

Supported environment variables:

```env
VITE_ASSETS_API=http://127.0.0.1:8030/api
VITE_SEPARATOR_API=http://127.0.0.1:8001/api/audio-processing
VITE_ANALYZER_API=http://127.0.0.1:8020/api/audio-analysis
VITE_AGENT_API=http://127.0.0.1:8010/api
VITE_GENERATION_API=http://127.0.0.1:8050/api/music-generation
```

## Verification

```bash
conda run -n audio-frontend npm run lint
conda run -n audio-frontend npm run build
```

## Current boundaries

- The audio-processing tab is an extension point; conversion, loudness
  normalization, and denoising are not all connected yet.
- Reference audio, melody/MIDI, and cover inspiration controls on the creation
  page remain disabled until their backend capabilities are available.
- Production deployment still needs unified monitoring and recovery for chained
  asynchronous workflows.
