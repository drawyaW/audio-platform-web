import { apiRequest, serviceUrls } from '../lib/api'
import type { Asset, AssetPlayUrlResponse, LoginResponse, LyricsAssetResponse, Project, Task, UploadResponse, User } from '../types/audioAssets'

const baseUrl = serviceUrls.assets

export const audioAssetsApi = {
  login(usernameOrEmail: string, password: string) {
    return apiRequest<LoginResponse>(`${baseUrl}/users/login`, {
      method: 'POST',
      body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
    })
  },

  register(payload: { username: string; email?: string; display_name?: string; password: string }) {
    return apiRequest<User>(`${baseUrl}/users`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  getMe() {
    return apiRequest<User>(`${baseUrl}/users/me`)
  },

  listProjects(userId: string) {
    return apiRequest<Project[]>(`${baseUrl}/users/${encodeURIComponent(userId)}/projects`)
  },

  getDefaultProject(userId: string) {
    return apiRequest<Project>(`${baseUrl}/users/${encodeURIComponent(userId)}/default-project`)
  },

  createProject(payload: { user_id: string; name: string; description?: string; is_default?: boolean }) {
    return apiRequest<Project>(`${baseUrl}/projects`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateProject(projectId: string, payload: { name?: string; description?: string }) {
    return apiRequest<Project>(`${baseUrl}/projects/${encodeURIComponent(projectId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  listProjectAssets(projectId: string) {
    return apiRequest<Asset[]>(`${baseUrl}/projects/${encodeURIComponent(projectId)}/assets`)
  },

  listProjectTasks(projectId: string) {
    return apiRequest<Task[]>(`${baseUrl}/projects/${encodeURIComponent(projectId)}/tasks`)
  },

  getTask(taskId: string) {
    return apiRequest<Task>(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`)
  },

  uploadAsset(payload: { file: File; projectId?: string; userId?: string; subtype?: string; duration?: number }) {
    const body = new FormData()
    if (payload.projectId) body.append('project_id', payload.projectId)
    if (payload.userId) body.append('user_id', payload.userId)
    body.append('subtype', payload.subtype || 'full')
    if (payload.duration !== undefined) body.append('duration', String(payload.duration))
    body.append('file', payload.file)
    return apiRequest<UploadResponse>(`${baseUrl}/assets/upload`, { method: 'POST', body })
  },

  getAssetLyrics(assetId: string) {
    return apiRequest<LyricsAssetResponse>(`${baseUrl}/assets/${encodeURIComponent(assetId)}/lyrics`)
  },

  uploadAssetLyrics(assetId: string, file: File, replace = true) {
    const body = new FormData()
    body.append('replace', String(replace))
    body.append('file', file)
    return apiRequest<UploadResponse>(`${baseUrl}/assets/${encodeURIComponent(assetId)}/lyrics`, { method: 'POST', body })
  },

  deleteAsset(assetId: string) {
    return apiRequest<{ deleted_asset_id: string; deleted_task_ids: string[]; storage_path: string }>(
      `${baseUrl}/assets/${encodeURIComponent(assetId)}`,
      { method: 'DELETE' },
    )
  },

  getAssetPlayUrl(assetId: string) {
    return apiRequest<AssetPlayUrlResponse>(`${baseUrl}/assets/${encodeURIComponent(assetId)}/play-url`)
  },
}
