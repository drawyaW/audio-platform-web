import type { SeparatorJob } from '../types/audioAssets'

const storageKey = 'separator_jobs'

export type StoredSeparatorJob = {
  job_id: string
  task_id: string
  project_id: string
  input_asset_id: string
  asset_name: string
  model_name: string
  output_format: string
  status: string
  progress_percent: number
  message: string
  created_at: string
  updated_at: string
}

export function listStoredSeparatorJobs() {
  try {
    const value = window.localStorage.getItem(storageKey)
    const parsed = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed.filter(isStoredJob) : []
  } catch {
    return []
  }
}

export function upsertStoredSeparatorJob(record: StoredSeparatorJob) {
  const records = listStoredSeparatorJobs()
  const next = [record, ...records.filter((item) => item.job_id !== record.job_id)].slice(0, 50)
  window.localStorage.setItem(storageKey, JSON.stringify(next))
}

export function updateStoredSeparatorJob(jobId: string, job: SeparatorJob) {
  const records = listStoredSeparatorJobs()
  const next = records.map((record) => {
    if (record.job_id !== jobId) return record
    return {
      ...record,
      status: job.status,
      progress_percent: job.progress_percent ?? record.progress_percent,
      message: job.message || record.message,
      updated_at: new Date().toISOString(),
    }
  })
  window.localStorage.setItem(storageKey, JSON.stringify(next))
}

export function taskProgressFromStoredJob(taskId: string) {
  return listStoredSeparatorJobs().find((record) => record.task_id === taskId)
}

function isStoredJob(value: unknown): value is StoredSeparatorJob {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.job_id === 'string' && typeof record.task_id === 'string'
}
