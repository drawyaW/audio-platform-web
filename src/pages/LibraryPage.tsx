import { Activity, ChevronDown, FileAudio, FileJson, FileText, Filter, MoreHorizontal, Music2, Pause, Play, Search, Trash2, Upload, Video } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { AnalysisMetadata } from '../components/AnalysisMetadata'
import { LyricsUploadPrompt } from '../components/LyricsUploadPrompt'
import { PageHeader } from '../components/Shared'
import { usePlayback } from '../context/usePlayback'
import { useProjects } from '../hooks/useProjects'
import { assetName, formatDuration, isPlayableAsset } from '../lib/assetUtils'
import { audioAssetsApi } from '../services/audioAssetsApi'
import type { AnalysisDocument, Asset } from '../types/audioAssets'

const tabs = ['全部资产', '原始音频', '分离音轨', '分析结果', 'AI 生成'] as const
const typeLabels: Record<string, string> = { raw: '原始音频', separated: '分离音轨', analysis: '分析结果', generated: 'AI 生成' }
const taskTypeLabels: Record<string, string> = { raw: '歌词文件', separated: '分离任务', analysis: '分析任务', generated: '生成任务' }

type AssetGroup = {
  root: Asset | null
  children: Asset[]
  latestAnalysisAssetId: string | null
}

export function LibraryPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('全部资产')
  const [query, setQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [lyricsPromptAsset, setLyricsPromptAsset] = useState<Asset | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { projects, loading, error, reload } = useProjects()

  useEffect(() => {
    if (!projects.length || selectedProjectId) return
    const initial = projects.find((project) => project.is_default) || projects[0]
    setSelectedProjectId(initial.project_id)
  }, [projects, selectedProjectId])

  const selectedProject = projects.find((project) => project.project_id === selectedProjectId)
  const filteredGroups = useMemo(() => buildAssetGroups(selectedProject?.assets || [], tab, query), [selectedProject, tab, query])
  const visibleAssetCount = filteredGroups.reduce((total, group) => {
    const rootCount = group.root && assetMatches(group.root, tab, query) ? 1 : 0
    return total + rootCount + group.children.length
  }, 0)

  async function upload(file: File) {
    if (!selectedProject) return
    setUploading(true)
    setNotice({ tone: 'info', text: `正在上传 ${file.name}…` })
    try {
      const duration = await readAudioDuration(file)
      const response = await audioAssetsApi.uploadAsset({ file, projectId: selectedProject.project_id, subtype: 'full', duration })
      await reload()
      setNotice({ tone: 'info', text: `${file.name} 已上传到 ${selectedProject.name}` })
      if (isAudioFile(file)) setLyricsPromptAsset(response.asset)
    } catch (requestError) {
      setNotice({ tone: 'error', text: requestError instanceof Error ? requestError.message : '上传失败' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove(asset: Asset) {
    const displayName = asset.type === 'analysis' ? '这条音乐分析结果' : `“${assetName(asset)}”`
    if (!window.confirm(`确认删除${displayName}？\n数据库记录和 MinIO 文件会一并删除。`)) return
    setDeletingId(asset.asset_id)
    setNotice(null)
    try {
      await audioAssetsApi.deleteAsset(asset.asset_id)
      await reload()
      setNotice({ tone: 'info', text: `${assetName(asset)} 已从数据库和 MinIO 删除` })
    } catch (requestError) {
      setNotice({ tone: 'error', text: requestError instanceof Error ? requestError.message : '删除失败' })
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="library-page">
      <PageHeader
        eyebrow="ASSET LIBRARY"
        title="资产库"
        description="所有音频、分轨、音乐分析和生成结果都在这里。"
        action={<button className="primary-button" disabled={!selectedProject || uploading} onClick={() => inputRef.current?.click()}><Upload size={17} /> {uploading ? '正在上传' : '上传资产'}</button>}
      />
      <input hidden ref={inputRef} type="file" accept="audio/*,video/*,.json,.mid" onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])} />
      {notice && <div className={`upload-notice ${notice.tone === 'error' ? 'error' : ''}`}><Music2 size={17} /><span>{notice.text}</span><button onClick={() => setNotice(null)}>关闭</button></div>}
      {lyricsPromptAsset && <LyricsUploadPrompt asset={lyricsPromptAsset} onClose={() => setLyricsPromptAsset(null)} onUploaded={async () => { await reload(); setNotice({ tone: 'info', text: 'LRC 歌词已关联，下一次分析会自动写入歌词结果。' }); setLyricsPromptAsset(null) }} />}
      <div className="asset-project-bar">
        <label>当前项目<select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={loading}>{projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.name}{project.is_default ? ' · 默认' : ''}</option>)}</select></label>
        <span>{selectedProject?.assets.length || 0} 个资产</span>
      </div>
      <div className="asset-tabs">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="list-toolbar asset-toolbar">
        <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索资产名称" /></label>
        <button><Filter size={16} /> 筛选</button>
      </div>
      <div className="asset-table-wrap">
        <table className="asset-table">
          <thead><tr><th>资产</th><th>类型</th><th>格式</th><th>时长</th><th>大小</th><th>创建时间</th><th /></tr></thead>
          <tbody>
            {filteredGroups.map((group, index) => (
              <Fragment key={group.root?.asset_id || `orphan-${index}`}>
                {group.root && (
                  <AssetRow
                    asset={group.root}
                    deletingId={deletingId}
                    disabledDelete={group.children.length > 0}
                    index={index}
                    isContextOnly={!assetMatches(group.root, tab, query)}
                    onRemove={remove}
                    onAddLyrics={setLyricsPromptAsset}
                  />
                )}
                {!group.root && <tr className="asset-source-row"><td colSpan={7}><span>未找到来源资产</span><strong>{group.children.length} 个衍生资产</strong></td></tr>}
                {groupedByTask(group.children).map((taskGroup) => taskGroup.isAnalysis ? (
                  <AnalysisResultRows
                    key={`${group.root?.asset_id || 'orphan'}-${taskGroup.taskId}`}
                    asset={taskGroup.assets[0]}
                    deletingId={deletingId}
                    isLatest={taskGroup.assets.some((asset) => asset.asset_id === group.latestAnalysisAssetId)}
                    onRemove={remove}
                  />
                ) : (
                  <Fragment key={`${group.root?.asset_id || 'orphan'}-${taskGroup.taskId}`}>
                    <tr className="asset-task-row">
                      <td colSpan={7}><span>{taskTypeLabels[taskGroup.assets[0]?.type] || '处理任务'}</span><strong>{taskGroup.taskId === 'unknown' ? '未知任务' : taskGroup.taskId.slice(0, 8)}</strong><i>{taskGroup.assets.length} 个输出</i></td>
                    </tr>
                    {taskGroup.assets.map((asset, childIndex) => (
                      <AssetRow key={asset.asset_id} asset={asset} deletingId={deletingId} index={childIndex} isChild onRemove={remove} />
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        {loading && <div className="empty-state"><span className="spinner" /><strong>正在读取资产</strong></div>}
        {error && <div className="empty-state error"><strong>{error}</strong><button onClick={() => void reload()}>重新加载</button></div>}
        {!loading && !error && !visibleAssetCount && <div className="empty-state"><Search size={24} /><strong>{query ? '没有找到匹配的资产' : '当前项目还没有资产'}</strong><p>{query ? '试试修改搜索词或筛选条件。' : '点击右上角上传第一个音频文件。'}</p></div>}
      </div>
    </div>
  )
}

function AnalysisResultRows({
  asset,
  deletingId,
  isLatest,
  onRemove,
}: {
  asset: Asset
  deletingId: string
  isLatest: boolean
  onRemove: (asset: Asset) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [document, setDocument] = useState<AnalysisDocument | null>(null)
  const [error, setError] = useState('')

  async function loadDocument() {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const playUrl = await audioAssetsApi.getAssetPlayUrl(asset.asset_id)
      const response = await fetch(playUrl.url)
      if (!response.ok) throw new Error(`读取分析结果失败（HTTP ${response.status}）`)
      setDocument(await response.json() as AnalysisDocument)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '读取分析结果失败')
    } finally {
      setLoading(false)
    }
  }

  function toggle() {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (!document) void loadDocument()
  }

  const summary = document?.summary
  return (
    <>
      <tr className={`analysis-library-row ${expanded ? 'is-expanded' : ''}`}>
        <td colSpan={7}>
          <div className="analysis-library-line">
            <button className="analysis-library-open" onClick={toggle} aria-expanded={expanded}>
              <span className="analysis-library-icon"><Activity size={17} /></span>
              <span className="analysis-library-copy">
                <strong>音乐分析结果 {isLatest && <i>最新</i>}</strong>
                <small>{formatDate(asset.created_at)} · 点击查看 BPM、调性、节拍与音频特征</small>
              </span>
              <span className="analysis-library-action">{expanded ? '收起' : '查看结果'} <ChevronDown size={15} /></span>
            </button>
            <button className="table-icon delete" disabled={deletingId === asset.asset_id} onClick={() => void onRemove(asset)} title="删除这条分析结果"><Trash2 size={16} /></button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="analysis-library-detail-row">
          <td colSpan={7}>
            {loading && <div className="analysis-library-state"><span className="spinner" />正在读取分析结果</div>}
            {error && <div className="analysis-library-state error"><strong>{error}</strong><button onClick={() => void loadDocument()}>重试</button></div>}
            {summary && (
              <div className="analysis-library-content">
                <AnalysisMetadata document={document} />
                <div className="analysis-summary-grid library-analysis-grid">
                  <div><span>BPM</span><strong>{formatMetric(summary.bpm)}</strong></div>
                  <div><span>Key</span><strong>{formatAnalysisKey(summary.key, summary.scale)}</strong></div>
                  <div><span>Beats</span><strong>{summary.beats_count ?? '—'}</strong></div>
                  <div><span>Loudness</span><strong>{formatMetric(summary.loudness)}<small> LUFS</small></strong></div>
                  <div><span>Danceability</span><strong>{formatMetric(summary.danceability)}</strong></div>
                  <div><span>Chord Key</span><strong>{formatAnalysisKey(summary.chords_key, summary.chords_scale)}</strong></div>
                </div>
                <div className="analysis-detail-grid library-analysis-detail-grid">
                  <div><span>节奏</span><strong>{document.rhythm?.backend || 'beat_this'} · {document.rhythm?.downbeats_count ?? 0} 个强拍</strong><small>{document.rhythm?.bars?.length ?? 0} 个小节边界</small></div>
                  <div><span>调性</span><strong>强度 {formatMetric(summary.key_strength)}</strong><small>调音 {formatMetric(summary.tuning_frequency)} Hz</small></div>
                  <div><span>音频特征</span><strong>动态 {formatMetric(summary.dynamic_complexity)}</strong><small>响度范围 {formatMetric(document.audio_features?.loudness_range)}</small></div>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function AssetRow({
  asset,
  deletingId,
  disabledDelete = false,
  index,
  isChild = false,
  isContextOnly = false,
  onRemove,
  onAddLyrics,
}: {
  asset: Asset
  deletingId: string
  disabledDelete?: boolean
  index: number
  isChild?: boolean
  isContextOnly?: boolean
  onRemove: (asset: Asset) => Promise<void>
  onAddLyrics?: (asset: Asset) => void
}) {
  const { currentAsset, loadingAssetId, playing, playAsset } = usePlayback()
  const isCurrent = currentAsset?.asset_id === asset.asset_id
  const isLoading = loadingAssetId === asset.asset_id
  const playable = isPlayableAsset(asset)

  return (
    <tr className={`${isChild ? 'asset-child-row' : 'asset-root-row'} ${isContextOnly ? 'is-context-only' : ''}`}>
      <td>
        <div className={`asset-thumb ${['cover-a', 'cover-b', 'cover-c', 'cover-d'][index % 4]}`}>
          {asset.format.toLowerCase() === 'json' ? <FileJson size={18} /> : asset.type === 'generated' && asset.format.toLowerCase() === 'mp4' ? <Video size={18} /> : <FileAudio size={18} />}
          {playable && <button className={isCurrent && playing ? 'is-playing' : ''} disabled={isLoading} onClick={() => void playAsset(asset)} title={isCurrent && playing ? '暂停' : '播放'}>{isCurrent && playing ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}</button>}
        </div>
        <div>
          <strong title={assetName(asset)}>{assetName(asset)}</strong>
          <span>{asset.subtype} · {asset.asset_id.slice(0, 8)}{sourceTaskId(asset) ? ` · task ${sourceTaskId(asset)?.slice(0, 8)}` : ''}</span>
        </div>
      </td>
      <td><span className={`asset-type type-${asset.type}`}>{isLyricsAsset(asset) ? '歌词文件' : typeLabels[asset.type] || asset.type}</span></td>
      <td>{asset.format.toUpperCase()}</td><td>{formatDuration(asset.duration)}</td><td>{formatBytes(asset.file_size)}</td><td>{formatDate(asset.created_at)}</td>
      <td>{onAddLyrics && asset.type === 'raw' && !asset.parent_asset_id && <button className="table-icon" onClick={() => onAddLyrics(asset)} title="添加或替换 LRC 歌词"><FileText size={16} /></button>}<button className="table-icon" title="更多信息"><MoreHorizontal size={17} /></button><button className="table-icon delete" disabled={disabledDelete || deletingId === asset.asset_id} onClick={() => void onRemove(asset)} title={disabledDelete ? '请先删除下方衍生资产' : '删除资产'}><Trash2 size={16} /></button></td>
    </tr>
  )
}

function buildAssetGroups(assets: Asset[], tab: (typeof tabs)[number], query: string): AssetGroup[] {
  const rawAssets = assets.filter((asset) => asset.type === 'raw' && !asset.parent_asset_id && !isLyricsAsset(asset)).sort(sortByCreatedDesc)
  const derivedAssets = assets.filter((asset) => asset.type !== 'raw' || !!asset.parent_asset_id || isLyricsAsset(asset)).sort(sortByCreatedDesc)
  const childrenByParent = new Map<string, Asset[]>()
  const orphans: Asset[] = []

  for (const asset of derivedAssets) {
    if (!asset.parent_asset_id) {
      orphans.push(asset)
      continue
    }
    const list = childrenByParent.get(asset.parent_asset_id) || []
    list.push(asset)
    childrenByParent.set(asset.parent_asset_id, list)
  }

  const groups: AssetGroup[] = rawAssets.map((root) => {
    const children = childrenByParent.get(root.asset_id) || []
    return {
      root,
      children,
      latestAnalysisAssetId: children.find((asset) => asset.type === 'analysis')?.asset_id || null,
    }
  })
  if (orphans.length) groups.push({ root: null, children: orphans, latestAnalysisAssetId: orphans.find((asset) => asset.type === 'analysis')?.asset_id || null })

  return groups.map((group) => {
    const children = group.children.filter((asset) => assetMatches(asset, tab, query))
    return { ...group, children }
  }).filter((group) => {
    if (group.root && assetMatches(group.root, tab, query)) return true
    return group.children.length > 0
  })
}

function groupedByTask(assets: Asset[]) {
  const buckets = new Map<string, Asset[]>()
  for (const asset of assets) {
    const taskId = sourceTaskId(asset) || 'unknown'
    const list = buckets.get(taskId) || []
    list.push(asset)
    buckets.set(taskId, list)
  }
  return Array.from(buckets.entries()).map(([taskId, records]) => {
    const sortedRecords = records.sort(sortBySubtype)
    const isAnalysis = sortedRecords[0]?.type === 'analysis'
    return { taskId, assets: sortedRecords, isAnalysis }
  })
}

function assetMatches(asset: Asset, tab: (typeof tabs)[number], query: string) {
  const label = isLyricsAsset(asset) ? '原始音频' : typeLabels[asset.type] || asset.type
  const normalizedQuery = query.trim().toLowerCase()
  const searchable = `${assetName(asset)} ${asset.subtype} ${asset.asset_id} ${sourceTaskId(asset) || ''}`.toLowerCase()
  return (tab === '全部资产' || label === tab) && (!normalizedQuery || searchable.includes(normalizedQuery))
}

function isLyricsAsset(asset: Asset) {
  return asset.subtype === 'timed_lyrics' || asset.format.toLowerCase() === 'lrc'
}

function isAudioFile(file: File) {
  return file.type.startsWith('audio/') || /\.(aac|flac|m4a|mp3|ogg|opus|wav|webm)$/i.test(file.name)
}

function sourceTaskId(asset: Asset) {
  const value = asset.extra?.source_task_id
  return typeof value === 'string' ? value : null
}

function sortByCreatedDesc(a: Asset, b: Asset) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

function sortBySubtype(a: Asset, b: Asset) {
  return a.subtype.localeCompare(b.subtype)
}

function formatBytes(size: number | null) {
  if (size === null) return '—'
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatMetric(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return Number(value.toFixed(1)).toString()
}

function formatAnalysisKey(key: string | null | undefined, scale: string | null | undefined) {
  if (!key) return '—'
  return `${key}${scale ? ` ${scale}` : ''}`
}

function readAudioDuration(file: File): Promise<number | undefined> {
  if (!file.type.startsWith('audio/')) return Promise.resolve(undefined)
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(file)
    const finish = (value?: number) => { URL.revokeObjectURL(url); resolve(value) }
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? audio.duration : undefined)
    audio.onerror = () => finish(undefined)
    audio.src = url
  })
}
