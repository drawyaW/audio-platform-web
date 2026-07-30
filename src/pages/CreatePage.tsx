import { AudioLines, CircleCheck, FileAudio, Image, Mic2, Music2, Pause, Play, Plus, SlidersHorizontal, Sparkles, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/Shared'
import { usePlayback } from '../context/usePlayback'
import { useProjects } from '../hooks/useProjects'
import { assetName, formatDuration } from '../lib/assetUtils'
import { musicGenerationApi } from '../services/musicGenerationApi'
import type { Asset } from '../types/audioAssets'
import type { MusicGenerationJob } from '../types/musicGeneration'

const inspiration = [
  { title: '深夜城市 R&B', tags: '克制 · 温暖 · 男声', color: 'cover-a' },
  { title: '夏日独立流行', tags: '明亮 · 吉他 · 轻快', color: 'cover-c' },
  { title: '电影感氛围音乐', tags: '器乐 · 宽广 · 渐进', color: 'cover-b' },
]

const activeStatuses = new Set(['queued', 'started', 'deferred', 'scheduled'])

export function CreatePage() {
  const [mode, setMode] = useState<'idea' | 'lyrics'>('idea')
  const [content, setContent] = useState('')
  const [stylePrompt, setStylePrompt] = useState('R&B, Neo Soul, warm vocal, polished production')
  const [title, setTitle] = useState('')
  const [instrumental, setInstrumental] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [job, setJob] = useState<MusicGenerationJob | null>(null)
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [completedJobId, setCompletedJobId] = useState('')
  const { projects, loading, error: projectsError, reload } = useProjects()
  const { currentAsset, loadingAssetId, playing, playAsset } = usePlayback()

  useEffect(() => {
    if (!projects.length || selectedProjectId) return
    setSelectedProjectId((projects.find((project) => project.is_default) || projects[0]).project_id)
  }, [projects, selectedProjectId])

  const generating = !!job && activeStatuses.has(job.status)
  const generatedAsset = useMemo(() => job?.output_assets?.find((asset) => asset.type === 'generated') || null, [job])
  const progress = job?.progress_percent ?? (generating ? 5 : job?.status === 'finished' ? 100 : 0)

  useEffect(() => {
    if (!job || !activeStatuses.has(job.status)) return
    let cancelled = false
    const poll = async () => {
      try {
        const latest = await musicGenerationApi.getJob(job.job_id)
        if (!cancelled) setJob(latest)
      } catch (requestError) {
        if (!cancelled) setNotice({ tone: 'error', text: requestError instanceof Error ? requestError.message : '查询生成任务失败' })
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), 2500)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [job?.job_id, job?.status])

  useEffect(() => {
    if (!job || activeStatuses.has(job.status) || completedJobId === job.job_id) return
    setCompletedJobId(job.job_id)
    if (job.status === 'finished') {
      setNotice({ tone: 'info', text: '音乐生成完成，音频已经保存到当前项目资产库。' })
      void reload()
    } else if (job.status === 'failed') {
      setNotice({ tone: 'error', text: compactError(job.error) || '音乐生成失败，请查看任务中心。' })
    }
  }, [completedJobId, job, reload])

  async function generate() {
    if (!selectedProjectId) {
      setNotice({ tone: 'error', text: '请先选择一个项目。' })
      return
    }
    if (!content.trim()) {
      setNotice({ tone: 'error', text: mode === 'idea' ? '请描述你想生成的音乐。' : '请填写歌词。' })
      return
    }
    if (mode === 'lyrics' && !stylePrompt.trim()) {
      setNotice({ tone: 'error', text: '歌词模式需要填写音乐风格。' })
      return
    }
    setNotice({ tone: 'info', text: '正在向 MiniMax Music 3.0 Free 提交任务…' })
    setJob(null)
    setCompletedJobId('')
    try {
      const created = await musicGenerationApi.createMusicJob({
        project_id: selectedProjectId,
        prompt: mode === 'idea' ? content.trim() : stylePrompt.trim(),
        lyrics: mode === 'lyrics' ? content.trim() : undefined,
        model: 'music-3.0-free',
        instrumental: mode === 'idea' && instrumental,
        lyrics_optimizer: mode === 'idea' && !instrumental,
        sample_rate: 44100,
        bitrate: 256000,
        audio_format: 'mp3',
        title: title.trim() || undefined,
      })
      setJob(created)
      setNotice({ tone: 'info', text: '任务已进入队列，可以在任务中心查看持久状态。' })
    } catch (requestError) {
      setNotice({ tone: 'error', text: requestError instanceof Error ? requestError.message : '提交音乐生成任务失败' })
    }
  }

  return (
    <div className="create-page">
      <PageHeader eyebrow="AI MUSIC GENERATION" title="把灵感写成一首歌" description="使用 MiniMax Music 3.0 Free 生成音乐，结果自动进入项目资产库。" />
      {notice && <div className={`upload-notice ${notice.tone === 'error' ? 'error' : ''}`}><Music2 size={17} /><span>{notice.text}</span><button onClick={() => setNotice(null)}>关闭</button></div>}
      {projectsError && <div className="upload-notice error"><Music2 size={17} /><span>{projectsError}</span><button onClick={() => void reload()}>重新加载</button></div>}
      <div className="create-layout">
        <section className="composer-card">
          <div className="mode-tabs">
            <button className={mode === 'idea' ? 'active' : ''} onClick={() => { setMode('idea'); setInstrumental(false) }} disabled={generating}><Sparkles size={16} /> 灵感模式</button>
            <button className={mode === 'lyrics' ? 'active' : ''} onClick={() => { setMode('lyrics'); setInstrumental(false) }} disabled={generating}><Mic2 size={16} /> 歌词模式</button>
          </div>
          <div className="prompt-area">
            <label>{mode === 'idea' ? '描述你想要的音乐' : '写下或粘贴你的歌词'}</label>
            <textarea
              value={content}
              maxLength={mode === 'idea' ? 2000 : 3500}
              disabled={generating}
              onChange={(event) => setContent(event.target.value)}
              placeholder={mode === 'idea' ? '例如：一首适合雨夜开车听的中文 R&B，温暖的男声，松弛的鼓点和富有空气感的电钢琴……' : '[Verse]\n窗外的雨落在旧唱片上……\n\n[Chorus]\n让回忆慢慢发亮……'}
            />
            <span className="char-count">{content.length} / {mode === 'idea' ? 2000 : 3500}</span>
          </div>
          {mode === 'lyrics' && <label className="generation-text-field"><span>音乐风格</span><input value={stylePrompt} maxLength={2000} disabled={generating} onChange={(event) => setStylePrompt(event.target.value)} placeholder="例如：Mandopop, warm male vocal, acoustic guitar" /></label>}
          <div className="composer-tools">
            <button disabled title="后续接入参考音频"><Music2 size={16} /> 参考音乐 <Plus size={14} /></button>
            <button disabled title="后续接入旋律和 MIDI"><FileAudio size={16} /> 旋律 / MIDI <Plus size={14} /></button>
            <button disabled title="后续接入封面生成"><Image size={16} /> 封面灵感 <Plus size={14} /></button>
          </div>
          <div className="style-fields generation-fields">
            <label><small>当前项目</small><select value={selectedProjectId} disabled={loading || generating} onChange={(event) => setSelectedProjectId(event.target.value)}>{projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.name}{project.is_default ? ' · 默认' : ''}</option>)}</select></label>
            <label><small>输出名称（可选）</small><input value={title} maxLength={120} disabled={generating} onChange={(event) => setTitle(event.target.value)} placeholder="result" /></label>
            <button className={instrumental ? 'active' : ''} disabled={mode === 'lyrics' || generating} onClick={() => setInstrumental((value) => !value)}><span><small>演唱模式</small><strong>{mode === 'lyrics' ? '使用给定歌词' : instrumental ? '纯音乐' : '自动生成歌词与人声'}</strong></span><CircleCheck size={16} /></button>
          </div>
          {job && <div className={`generation-progress ${job.status === 'failed' ? 'failed' : ''}`}><div><span>{generationStatus(job)}</span><strong>{Math.round(progress)}%</strong></div><i><b style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></i></div>}
          <div className="composer-footer">
            <button className="advanced-button" disabled><SlidersHorizontal size={16} /> 高级设置</button>
            <button className="generate-button" onClick={() => void generate()} disabled={generating || loading || !projects.length}>
              {generating ? <><span className="spinner" /> 正在生成音乐…</> : <><WandSparkles size={17} /> 开始生成</>}
            </button>
          </div>
        </section>

        <aside className="create-aside">
          <div className="creation-balance">
            <span className="quick-icon tone-cyan"><AudioLines size={20} /></span>
            <div><strong>免费模型已连接</strong><p>Music 3.0 Free · RPM 3</p></div>
          </div>
          {generatedAsset ? <GeneratedResult asset={generatedAsset} currentAsset={currentAsset} loadingAssetId={loadingAssetId} playing={playing} onPlay={playAsset} /> : (
            <div className="flow-card">
              <span>生成后可以继续</span>
              <div><i>01</i><p><strong>进入资产库</strong><small>生成音频自动持久保存</small></p></div>
              <div><i>02</i><p><strong>分析音乐</strong><small>查看 BPM、Key 与和弦</small></p></div>
              <div><i>03</i><p><strong>分离音轨</strong><small>获取人声、鼓、贝斯等 stems</small></p></div>
            </div>
          )}
        </aside>
      </div>

      <section className="inspiration-section">
        <div className="section-header"><div><h2>缺少灵感？</h2><p>从这些创作方向开始</p></div></div>
        <div className="inspiration-grid">
          {inspiration.map((item) => (
            <button key={item.title} disabled={generating} onClick={() => { setMode('idea'); setContent(`创作一首${item.title}，${item.tags.replaceAll(' · ', '、')}。`) }}>
              <span className={`inspiration-art ${item.color}`}><Music2 size={25} /></span>
              <span><strong>{item.title}</strong><small>{item.tags}</small></span>
              <Plus size={18} />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function GeneratedResult({ asset, currentAsset, loadingAssetId, playing, onPlay }: {
  asset: Asset
  currentAsset: Asset | null
  loadingAssetId: string
  playing: boolean
  onPlay: (asset: Asset) => Promise<void>
}) {
  const isCurrent = currentAsset?.asset_id === asset.asset_id
  return <div className="generated-result-card"><span>本次生成结果</span><div><i><Music2 size={20} /></i><p><strong>{assetName(asset)}</strong><small>{asset.format.toUpperCase()} · {formatDuration(asset.duration)}</small></p></div><button disabled={loadingAssetId === asset.asset_id} onClick={() => void onPlay(asset)}>{isCurrent && playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}{isCurrent && playing ? '暂停' : '播放结果'}</button></div>
}

function generationStatus(job: MusicGenerationJob) {
  const stageLabels: Record<string, string> = { queued: '等待生成', starting: '正在启动', generating_music: 'MiniMax 正在生成音乐', registering_asset: '正在保存到资产库', finished: '生成完成', failed: '生成失败' }
  return stageLabels[job.stage || ''] || stageLabels[job.status] || job.stage || job.status
}

function compactError(value: string | null) {
  if (!value) return ''
  return value.trim().split('\n').filter(Boolean).at(-1)?.slice(0, 280) || ''
}
