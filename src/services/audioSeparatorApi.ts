import { apiRequest, serviceUrls } from '../lib/api'
import type { RecommendedSeparatorModel, SeparatorJob } from '../types/audioAssets'

const baseUrl = serviceUrls.separator

export const audioSeparatorApi = {
  listRecommendedModels() {
    return apiRequest<RecommendedSeparatorModel[]>(`${baseUrl}/models/recommended`)
  },

  createSeparation(payload: { assetId: string; modelName: string; outputFormat?: string }) {
    return apiRequest<SeparatorJob>(`${baseUrl}/separations`, {
      method: 'POST',
      body: JSON.stringify({
        asset_id: payload.assetId,
        model_name: payload.modelName,
        output_format: payload.outputFormat || 'wav',
      }),
    })
  },

  getJob(jobId: string) {
    return apiRequest<SeparatorJob>(`${baseUrl}/jobs/${encodeURIComponent(jobId)}`)
  },
}
