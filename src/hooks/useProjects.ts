import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { audioAssetsApi } from '../services/audioAssetsApi'
import type { ProjectWithAssets } from '../types/audioAssets'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectWithAssets[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      await audioAssetsApi.getDefaultProject(user.user_id)
      const records = await audioAssetsApi.listProjects(user.user_id)
      const withAssets = await Promise.all(records.map(async (project) => ({
        ...project,
        assets: await audioAssetsApi.listProjectAssets(project.project_id),
      })))
      setProjects(withAssets)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '项目加载失败')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void reload() }, [reload])
  return { projects, loading, error, reload }
}
