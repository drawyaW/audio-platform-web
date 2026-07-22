# SONORA Web

Unified React frontend for the audio creation platform. Chinese documentation
is available in [README.md](README.md).

## Stack

- React 19 and TypeScript
- Vite
- React Router
- Lucide icons
- Conda environment: `audio-frontend`

## Start Locally

```bash
./scripts/start_dev.sh
```

Open `http://127.0.0.1:8040`. For a persistent tmux session, run:

```bash
./scripts/tmux_dev.sh
```

## Connected Backends

- `audio-assets` (`8030`): JWT login, users, projects, uploads, assets, tasks,
  deletion, and temporary playback URLs.
- `audio-separator` (`8001`): model selection, separation submission, progress,
  and durable stem results.
- `audio-analyzer` (`8020`): analysis submission, progress, unified
  `analysis.json`, metrics, waveform peaks, and chord timeline.

The access token issued by `audio-assets` is attached to all three service
calls. Long-running separator/analyzer identifiers are saved locally so polling
can resume after route changes or page refreshes.

The Agent, AI generation, and parts of the home page remain preview/mock
features and are not yet part of the durable asset workflow.

Copy `.env.example` to `.env.local` when backend addresses need to be changed.

## Verification

```bash
npm run lint
npm run build
```
