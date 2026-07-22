import type { AnalyzerJob } from '../types/audioAssets'

const storageKey = 'analysis_jobs'

export type StoredAnalysisJob = {
  job_id: string
  task_id: string
  project_id: string
  input_asset_id: string
  asset_name: string
  status: string
  stage: string
  progress_percent: number
  created_at: string
  updated_at: string
}

export function listStoredAnalysisJobs() {
  try {
    const value = window.localStorage.getItem(storageKey)
    const parsed = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed.filter(isStoredJob) : []
  } catch {
    return []
  }
}

export function upsertStoredAnalysisJob(record: StoredAnalysisJob) {
  const records = listStoredAnalysisJobs()
  const next = [record, ...records.filter((item) => item.job_id !== record.job_id)].slice(0, 50)
  window.localStorage.setItem(storageKey, JSON.stringify(next))
}

export function updateStoredAnalysisJob(jobId: string, job: AnalyzerJob) {
  const records = listStoredAnalysisJobs()
  const next = records.map((record) => {
    if (record.job_id !== jobId) return record
    return {
      ...record,
      status: job.status,
      stage: job.stage || record.stage,
      progress_percent: job.progress_percent ?? record.progress_percent,
      updated_at: new Date().toISOString(),
    }
  })
  window.localStorage.setItem(storageKey, JSON.stringify(next))
}

export function analysisTaskProgressFromStoredJob(taskId: string) {
  return listStoredAnalysisJobs().find((record) => record.task_id === taskId)
}

function isStoredJob(value: unknown): value is StoredAnalysisJob {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.job_id === 'string' && typeof record.task_id === 'string'
}
