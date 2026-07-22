export const serviceUrls = {
  assets: import.meta.env.VITE_ASSETS_API ?? 'http://127.0.0.1:8030/api',
  separator: import.meta.env.VITE_SEPARATOR_API ?? 'http://127.0.0.1:8001/api/audio-processing',
  analyzer: import.meta.env.VITE_ANALYZER_API ?? 'http://127.0.0.1:8020/api/audio-analysis',
  agent: import.meta.env.VITE_AGENT_API ?? 'http://127.0.0.1:8020',
  generation: import.meta.env.VITE_GENERATION_API ?? 'http://127.0.0.1:8050',
} as const

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const token = window.localStorage.getItem('access_token')
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init?.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  const response = await fetch(url, { ...init, headers })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.detail ?? `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}
