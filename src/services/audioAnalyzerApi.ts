import { apiRequest, serviceUrls } from '../lib/api'
import type { AnalyzerJob } from '../types/audioAssets'

const baseUrl = serviceUrls.analyzer

export const audioAnalyzerApi = {
  createAnalysis(payload: { assetId: string; rhythmBackend?: string; rhythmModel?: string; beatsPerBar?: number | null }) {
    return apiRequest<AnalyzerJob>(`${baseUrl}/jobs`, {
      method: 'POST',
      body: JSON.stringify({
        asset_id: payload.assetId,
        rhythm_backend: payload.rhythmBackend || 'beat_this',
        rhythm_model: payload.rhythmModel || 'small0',
        beats_per_bar: payload.beatsPerBar ?? null,
      }),
    })
  },

  getJob(jobId: string) {
    return apiRequest<AnalyzerJob>(`${baseUrl}/jobs/${encodeURIComponent(jobId)}`)
  },
}
