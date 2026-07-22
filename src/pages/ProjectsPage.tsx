import { Grid2X2, List, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { NewProjectCard, PageHeader, ProjectCard } from '../components/Shared'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../hooks/useProjects'
import { audioAssetsApi } from '../services/audioAssetsApi'

export function ProjectsPage() {
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const { user } = useAuth()
  const { projects, loading, error, reload } = useProjects()
  const visible = projects.filter((project) => `${project.name}${project.description || ''}`.toLowerCase().includes(query.toLowerCase()))

  async function createProject() {
    if (!user || !name.trim()) return
    setSaving(true)
    setFormError('')
    try {
      await audioAssetsApi.createProject({ user_id: user.user_id, name: name.trim(), description: description.trim() || undefined })
      setName('')
      setDescription('')
      setModalOpen(false)
      await reload()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="projects-page">
      <PageHeader
        eyebrow="WORKSPACE"
        title="我的项目"
        description="项目连接原始素材、处理任务和每一个创作版本。"
        action={<button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={17} /> 新建项目</button>}
      />
      <div className="list-toolbar">
        <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索项目" /></label>
        <button><SlidersHorizontal size={16} /> 最近更新</button>
        <div className="view-toggle"><button className="active"><Grid2X2 size={16} /></button><button><List size={16} /></button></div>
      </div>
      <div className="project-grid large-project-grid">
        <div onClick={() => setModalOpen(true)}><NewProjectCard /></div>
        {visible.map((project, index) => <ProjectCard key={project.project_id} project={{
          id: project.project_id,
          name: project.name,
          description: project.description || '暂无项目描述',
          assetCount: project.assets.length,
          updatedAt: formatRelativeTime(project.updated_at),
          cover: ['cover-a', 'cover-b', 'cover-c'][index % 3],
          status: project.is_default ? '默认项目' : undefined,
        }} />)}
      </div>
      {loading && <div className="data-state"><span className="spinner" />正在读取项目...</div>}
      {error && <div className="data-state error">{error}<button onClick={() => void reload()}>重试</button></div>}
      {!loading && !error && !visible.length && query && <div className="data-state">没有找到匹配的项目</div>}

      {modalOpen && <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}><div className="form-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="form-modal-head"><div><span className="eyebrow">NEW PROJECT</span><h2>新建项目</h2></div><button onClick={() => setModalOpen(false)}><X size={18} /></button></div>
        <label>项目名称<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：新单曲 Demo" /></label>
        <label>项目描述<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="记录这个项目的目标或创作方向（可选）" /></label>
        {formError && <div className="form-error">{formError}</div>}
        <div className="form-modal-actions"><button onClick={() => setModalOpen(false)}>取消</button><button className="primary-button" disabled={!name.trim() || saving} onClick={() => void createProject()}>{saving ? '正在创建...' : '创建项目'}</button></div>
      </div></div>}
    </div>
  )
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return '刚刚更新'
  if (minutes < 60) return `${minutes} 分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`
  return `${Math.floor(minutes / 1440)} 天前`
}
