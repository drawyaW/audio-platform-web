import { CheckCircle2, Clock3, FileAudio, Filter, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader, StatusBadge } from '../components/Shared'
import { useProjects } from '../hooks/useProjects'
import { taskProgressFromStoredJob } from '../lib/separationJobs'
import { audioAssetsApi } from '../services/audioAssetsApi'
import { audioSeparatorApi } from '../services/audioSeparatorApi'
import type { Task } from '../types/audioAssets'

const typeLabels: Record<string, string> = { upload: '上传', separate: '音轨分离', analyze: '音乐分析', generate: 'AI 生成' }

export function TasksPage() {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [query, setQuery] = useState('')
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [error, setError] = useState('')
  const { projects, loading, reload: reloadProjects } = useProjects()

  useEffect(() => {
    if (!projects.length || selectedProjectId) return
    const initial = projects.find((project) => project.is_default) || projects[0]
    setSelectedProjectId(initial.project_id)
  }, [projects, selectedProjectId])

  const reload = useCallback(async () => {
    if (!selectedProjectId) return
    setLoadingTasks(true)
    setError('')
    try {
      await reloadProjects()
      let records = await audioAssetsApi.listProjectTasks(selectedProjectId)
      await Promise.all(records.filter((task) => task.type === 'separate' && task.status === 'running').map(async (task) => {
        try {
          const job = await audioSeparatorApi.getJob(task.task_id)
          if (job.status === 'finished' || job.status === 'failed') {
            records = records.map((item) => item.task_id === task.task_id ? { ...item, status: job.status === 'finished' ? 'success' : 'failed' } : item)
          }
        } catch {
          // The SQL task remains the source of truth if the queue job has expired.
        }
      }))
      setTasks(records)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '任务加载失败')
    } finally {
      setLoadingTasks(false)
    }
  }, [reloadProjects, selectedProjectId])

  useEffect(() => { void reload() }, [reload])

  const filtered = useMemo(() => tasks.filter((task) => {
    const text = `${task.task_id} ${task.type} ${task.status} ${JSON.stringify(task.params || {})}`.toLowerCase()
    return text.includes(query.trim().toLowerCase())
  }), [query, tasks])

  const runningCount = tasks.filter((task) => ['pending', 'running'].includes(task.status)).length
  const doneTodayCount = tasks.filter((task) => task.status === 'success' && isToday(task.finished_at || task.created_at)).length
  const outputCount = tasks.reduce((total, task) => total + taskOutputCount(task), 0)

  return (
    <div className="tasks-page">
      <PageHeader eyebrow="PROCESSING QUEUE" title="任务中心" description="追踪分离、分析、处理与生成任务的运行状态。" action={<button className="secondary-button" disabled={loadingTasks || !selectedProjectId} onClick={() => void reload()}><RefreshCw size={16} /> 刷新状态</button>} />
      <div className="asset-project-bar">
        <label>当前项目<select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={loading}>{projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.name}{project.is_default ? ' · 默认' : ''}</option>)}</select></label>
        <span>{tasks.length} 个任务</span>
      </div>
      <div className="task-summary-grid">
        <div><span className="summary-icon cyan"><Clock3 size={19} /></span><p><small>进行中的任务</small><strong>{runningCount}</strong></p><span>{tasks.filter((task) => task.status === 'running').length} 个正在运行</span></div>
        <div><span className="summary-icon lime"><CheckCircle2 size={19} /></span><p><small>今日已完成</small><strong>{doneTodayCount}</strong></p><span>来自 audio-assets task</span></div>
        <div><span className="summary-icon violet"><FileAudio size={19} /></span><p><small>生成资产</small><strong>{outputCount}</strong></p><span>result.outputs 合计</span></div>
      </div>
      <div className="list-toolbar"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务或参数" /></label><button><Filter size={16} /> 全部类型</button></div>
      {error && <div className="data-state error">{error}<button onClick={() => void reload()}>重新加载</button></div>}
      <div className="task-list full-task-list">
        {filtered.map((task) => {
          const stored = taskProgressFromStoredJob(task.task_id)
          const progress = task.status === 'success' ? 100 : task.status === 'failed' ? 100 : stored?.progress_percent ?? (task.status === 'running' ? 10 : 0)
          return (
            <div className="task-row" key={task.task_id}>
              <div className="task-file-icon"><FileAudio size={19} /></div>
              <div className="task-main"><strong>{typeLabels[task.type] || task.type}</strong><span>{task.task_id.slice(0, 8)} · {taskInputLabel(task)}</span></div>
              <div className="full-progress"><div><i style={{ width: `${progress}%` }} /></div><span>{progress}%</span></div>
              <span className="task-time">{formatDate(task.created_at)}</span><StatusBadge status={statusLabel(task.status)} />
            </div>
          )
        })}
        {!loadingTasks && !error && !filtered.length && <div className="empty-state"><Search size={24} /><strong>{query ? '没有找到匹配任务' : '当前项目还没有任务'}</strong></div>}
      </div>
    </div>
  )
}

function statusLabel(status: string) {
  const labels: Record<string, string> = { failed: '失败', pending: '排队中', running: '运行中', success: '已完成' }
  return labels[status] || status
}

function taskInputLabel(task: Task) {
  const model = task.params?.model_name
  if (typeof model === 'string') return model
  if (task.input_asset_id) return `input ${task.input_asset_id.slice(0, 8)}`
  return '无输入资产'
}

function taskOutputCount(task: Task) {
  const outputs = task.result?.outputs
  return Array.isArray(outputs) ? outputs.length : 0
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function isToday(value: string) {
  const date = new Date(value)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
}
