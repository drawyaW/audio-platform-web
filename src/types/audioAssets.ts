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
