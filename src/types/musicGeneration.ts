import type { Asset } from './audioAssets'

export type MusicGenerationRequest = {
  project_id: string
  prompt: string
  lyrics?: string
  model?: 'music-3.0' | 'music-3.0-free' | 'music-2.6' | 'music-2.6-free'
  instrumental?: boolean
  lyrics_optimizer?: boolean
  sample_rate?: 44100
  bitrate?: 128000 | 256000 | 320000
  audio_format?: 'mp3' | 'wav'
  title?: string
}

export type MusicGenerationJob = {
  job_id: string
  task_id: string | null
  job_type: string | null
  status: string
  stage: string | null
  progress_percent: number | null
  result: Record<string, unknown> | null
  output_assets: Asset[]
  error: string | null
}

export type MusicGenerationCapabilities = {
  provider: string
  available: boolean
  features: string[]
  default_music_model: string
  supported_music_models: string[]
}
