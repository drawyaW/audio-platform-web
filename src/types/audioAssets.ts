export type User = {
  user_id: string
  username: string
  email: string | null
  display_name: string | null
  status: string
  created_at: string
  updated_at: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
  user: User
}

export type Project = {
  project_id: string
  user_id: string
  name: string
  description: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export type Asset = {
  asset_id: string
  project_id: string
  parent_asset_id: string | null
  type: 'raw' | 'separated' | 'analysis' | 'generated' | string
  subtype: string
  format: string
  storage_path: string
  file_size: number | null
  duration: number | null
  extra: Record<string, unknown> | null
  created_at: string
}

export type UploadResponse = {
  project: Project
  task: {
    task_id: string
    status: string
  }
  asset: Asset
}

export type ProjectWithAssets = Project & {
  assets: Asset[]
}

export type AssetPlayUrlResponse = {
  asset_id: string
  url: string
  expires_in_seconds: number
}

export type Task = {
  task_id: string
  project_id: string
  type: 'upload' | 'separate' | 'analyze' | 'generate' | string
  status: 'pending' | 'running' | 'success' | 'failed' | string
  input_asset_id: string | null
  params: Record<string, unknown> | null
  result: Record<string, unknown> | null
  error_msg: string | null
  created_at: string
  finished_at: string | null
}

export type SeparatorJob = {
  job_id: string | null
  task_id: string | null
  input_asset_id: string | null
  status: string
  files: string[]
  output_assets: Asset[]
  message: string | null
  progress_percent: number | null
  elapsed_seconds: number | null
  estimated_remaining_seconds: number | null
  queue_position: number | null
}

export type AnalysisSummary = {
  duration_seconds?: number | null
  bpm?: number | null
  beats_count?: number | null
  key?: string | null
  scale?: string | null
  key_strength?: number | null
  tuning_frequency?: number | null
  loudness?: number | null
  dynamic_complexity?: number | null
  danceability?: number | null
  chords_key?: string | null
  chords_scale?: string | null
  chords_changes_rate?: number | null
}

export type ChordSegment = {
  start_seconds: number
  end_seconds: number | null
  duration_seconds: number | null
  chord: string
  beat_count: number
  mean_strength: number | null
}

export type AnalysisDocument = {
  summary: AnalysisSummary
  waveform?: {
    version?: number
    method?: string | null
    sample_rate?: number | null
    duration_seconds?: number | null
    points?: number | null
    peaks?: number[]
  }
  rhythm?: {
    backend?: string | null
    model?: string | null
    device?: string | null
    bpm?: number | null
    beats_position?: number[]
    beats_count?: number | null
    downbeats_position?: number[]
    downbeats_count?: number | null
    bars?: Array<{
      bar_index: number
      start_seconds: number
      end_seconds: number | null
      duration_seconds: number | null
      detected_beat_count: number
      assumed_beats_per_bar: number | null
    }>
  }
  tonal?: {
    key?: string | null
    scale?: string | null
    key_strength?: number | null
    tuning_frequency?: number | null
  }
  audio_features?: {
    loudness?: number | null
    loudness_range?: number | null
    dynamic_complexity?: number | null
    average_loudness?: number | null
    spectral_centroid_mean?: number | null
    spectral_rolloff_mean?: number | null
    spectral_flux_mean?: number | null
  }
  chords?: {
    key?: string | null
    scale?: string | null
    changes_rate?: number | null
    number_rate?: number | null
    strength_mean?: number | null
    timeline?: {
      method?: string | null
      alignment?: string | null
      chord_count?: number | null
      beat_chords?: Array<{
        beat_index: number
        start_seconds: number
        end_seconds: number | null
        duration_seconds: number | null
        chord: string
        strength: number | null
      }>
      segments?: ChordSegment[]
    }
  }
}

export type AnalyzerJob = {
  job_id: string
  task_id: string | null
  input_asset_id: string | null
  status: string
  stage: string | null
  progress_percent: number | null
  result: {
    summary?: AnalysisSummary
    files?: string[]
    output_assets?: Asset[]
    message?: string
  } | null
  output_assets: Asset[]
  error: string | null
}

export type SeparatorModel = {
  filename: string
  name: string
  stems: string[]
  target_stem: string | null
  sdr: Record<string, number>
}

export type RecommendedSeparatorModel = {
  use_case: string
  label: string
  filename: string
  architecture: string
  outputs: string[]
  notes: string
}
