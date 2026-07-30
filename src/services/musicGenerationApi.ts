import { apiRequest, serviceUrls } from '../lib/api'
import type { MusicGenerationCapabilities, MusicGenerationJob, MusicGenerationRequest } from '../types/musicGeneration'

const baseUrl = serviceUrls.generation

export const musicGenerationApi = {
  getCapabilities() {
    return apiRequest<MusicGenerationCapabilities>(`${baseUrl}/capabilities`)
  },

  createMusicJob(payload: MusicGenerationRequest) {
    return apiRequest<MusicGenerationJob>(`${baseUrl}/music/jobs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getJob(jobId: string) {
    return apiRequest<MusicGenerationJob>(`${baseUrl}/jobs/${encodeURIComponent(jobId)}`)
  },
}
