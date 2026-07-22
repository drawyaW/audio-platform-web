import { Activity, ChevronDown, CircleCheck, Download, Gauge, Music2, Pause, Play, Plus, RotateCcw, Scissors, SlidersHorizontal, Sparkles, Upload, Waves } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { PageHeader } from '../components/Shared'
import { usePlayback } from '../context/usePlayback'
import { useProjects } from '../hooks/useProjects'
import { assetName, formatDuration, formatFileSize, isPlayableAsset } from '../lib/assetUtils'
import { listStoredSeparatorJobs, updateStoredSeparatorJob, upsertStoredSeparatorJob } from '../lib/separationJobs'
import { audioAssetsApi } from '../services/audioAssetsApi'
import { audioSeparatorApi } from '../services/audioSeparatorApi'
import type { Asset, RecommendedSeparatorModel, SeparatorJob } from '../types/audioAssets'

const wave = [32, 55, 44, 80, 36, 68, 92, 47, 70, 38, 62, 87, 54, 30, 75, 48, 83, 57, 38, 67, 91, 52, 76, 40, 63, 85, 45, 70, 34, 56, 78, 43, 66, 89, 50, 73, 39, 60, 82, 47, 69, 35, 58, 76, 42, 64, 86, 52]
const fallbackModel = 'UVR-MDX-NET-Inst_HQ_3.onnx'
const stemColors = ['#56d4dd', '#9b8cff', '#ff8e73', '#d5f469', '#78c6ff', '#f6c85f']
const stemLabels: Record<string, string> = {
  bass: '贝斯',
  drums: '鼓组',
  guitar: '吉他',
  instrumental: '伴奏',
  noise: '噪声',
  other: '其他',
  piano: '钢琴',
  vocals: '人声',
}

export function StudioPage() {
  const [activeTool, setActiveTool] = useState('separate')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [models, setModels] = useState<RecommendedSeparatorModel[]>([])
  const [selectedModel, setSelectedModel] = useState(fallbackModel)
  const [outputFormat, setOutputFormat] = useState('wav')
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [job, setJob] = useState<SeparatorJob | null>(null)
  const [separating, setSeparating] = useState(false)
  const [mutedAssetIds, setMutedAssetIds] = useState<Record<string, boolean>>({})
  const [mixerPlaying, setMixerPlaying] = useState(false)
  const [mixerLoading, setMixerLoading] = useState(false)
  const [soloAssetId, setSoloAssetId] = useState('')
  const [mixerCurrentTime, setMixerCurrentTime] = useState(0)
  const mixerAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const activePollRef = useRef('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { projects, loading, error, reload } = useProjects()
  const { currentAsset, currentTime, duration, loadingAssetId, playing, playAsset, toggle: toggleGlobalPlayback } = usePlayback()

  useEffect(() => {
    void audioSeparatorApi.listRecommendedModels()
      .then((records) => {
        setModels(records)
        const preferred = records.find((model) => model.use_case === 'balanced_two_stem') || records.find((model) => model.outputs.includes('vocals') && model.outputs.includes('instrumental')) || records[0]
        if (preferred) setSelectedModel((current) => records.some((model) => model.filename === current) ? current : preferred.filename)
      })
      .catch(() => setModels([]))
  }, [])

  useEffect(() => {
    if (!projects.length || selectedProjectId) return
    const initial = projects.find((project) => project.is_default) || projects[0]
    setSelectedProjectId(initial.project_id)
  }, [projects, selectedProjectId])

  const selectedProject = projects.find((project) => project.project_id === selectedProjectId)
  const rawAssets = useMemo(() => (selectedProject?.assets || []).filter((asset) => asset.type === 'raw'), [selectedProject])
  const separatedAssets = useMemo(() => (selectedProject?.assets || []).filter((asset) => asset.type === 'separated'), [selectedProject])

  useEffect(() => {
    if (selectedAssetId && rawAssets.some((asset) => asset.asset_id === selectedAssetId)) return
    setSelectedAssetId(rawAssets[0]?.asset_id || '')
  }, [rawAssets, selectedAssetId])

  const selectedAsset = rawAssets.find((asset) => asset.asset_id === selectedAssetId)
  const selectedModelInfo = models.find((model) => model.filename === selectedModel)
  const modelOutputs = selectedModelInfo?.outputs.length ? selectedModelInfo.outputs : ['vocals', 'instrumental']
  const resultAssets = useMemo(() => {
    if (job?.output_assets.length) return job.output_assets
    return selectedAsset ? separatedAssets.filter((asset) => asset.parent_asset_id === selectedAsset.asset_id) : separatedAssets.slice(0, 6)
  }, [job, selectedAsset, separatedAssets])
  const currentJobDone = job?.status === 'finished'
  const currentJobFailed = job?.status === 'failed'
  const progress = job?.progress_percent ?? (separating ? 3 : 0)
  const taskProgress = currentJobDone ? 100 : currentJobFailed ? 100 : progress
  const resultAssetIds = resultAssets.map((asset) => asset.asset_id).join(',')
  const timelineAsset = currentAsset || selectedAsset
  const timelineDuration = duration || timelineAsset?.duration || null
  const timelineProgress = timelineDuration && currentAsset?.asset_id === timelineAsset?.asset_id ? Math.min(100, Math.round((currentTime / timelineDuration) * 100)) : progress

  const pollJob = useCallback(async (jobId: string) => {
    activePollRef.current = jobId
    for (;;) {
      await wait(1800)
      if (activePollRef.current !== jobId) return
      const next = await audioSeparatorApi.getJob(jobId)
      setJob(next)
      updateStoredSeparatorJob(jobId, next)
      if (next.status === 'finished') {
        setSeparating(false)
        setNotice({ tone: 'info', text: `分离完成，生成 ${next.output_assets.length || next.files.length} 个资产。` })
        await reload()
        return
      }
      if (next.status === 'failed') {
        setSeparating(false)
        throw new Error(next.message || '分离任务失败')
      }
    }
  }, [reload])

  useEffect(() => {
    if (!selectedProjectId) return
    const activeJob = listStoredSeparatorJobs().find((record) => record.project_id === selectedProjectId && !['finished', 'failed'].includes(record.status))
    if (!activeJob || activePollRef.current === activeJob.job_id) return
    setSelectedAssetId(activeJob.input_asset_id)
    setSelectedModel(activeJob.model_name)
    setOutputFormat(activeJob.output_format)
    setSeparating(true)
    setJob({
      job_id: activeJob.job_id,
      task_id: activeJob.task_id,
      input_asset_id: activeJob.input_asset_id,
      status: activeJob.status,
      files: [],
      output_assets: [],
      message: activeJob.message || 'restored',
      progress_percent: activeJob.progress_percent,
      elapsed_seconds: null,
      estimated_remaining_seconds: null,
      queue_position: null,
    })
    void pollJob(activeJob.job_id).catch((requestError: unknown) => {
      setSeparating(false)
      setNotice({ tone: 'error', text: requestError instanceof Error ? requestError.message : '分离任务失败' })
    })
  }, [pollJob, selectedProjectId])

  useEffect(() => {
    const audios = mixerAudioRef.current
    return () => {
      audios.forEach((audio) => {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      })
      audios.clear()
    }
  }, [])

  useEffect(() => {
    mixerAudioRef.current.forEach((audio, assetId) => {
      audio.muted = !!mutedAssetIds[assetId]
    })
  }, [mutedAssetIds])

  useEffect(() => {
    if (!mixerPlaying) return
    const timer = window.setInterval(() => {
      const activeAudios = [...mixerAudioRef.current.values()].filter((audio) => !audio.paused || audio.ended)
      const master = activeAudios.find((audio) => !audio.ended) || activeAudios[0]
      if (master) setMixerCurrentTime(master.currentTime || 0)
      if (activeAudios.length && activeAudios.every((audio) => audio.ended)) {
        setMixerPlaying(false)
        setSoloAssetId('')
      }
    }, 150)
    return () => window.clearInterval(timer)
  }, [mixerPlaying])

  useEffect(() => {
    mixerAudioRef.current.forEach((audio) => audio.pause())
    setMixerPlaying(false)
    setSoloAssetId('')
    setMixerCurrentTime(0)
  }, [resultAssetIds])

  async function upload(file: File) {
    if (!selectedProject) return
    setUploading(true)
    setNotice({ tone: 'info', text: `正在上传 ${file.name}...` })
    try {
      const assetDuration = await readAudioDuration(file)
      const response = await audioAssetsApi.uploadAsset({ file, projectId: selectedProject.project_id, subtype: 'full', duration: assetDuration })
      await reload()
      setSelectedAssetId(response.asset.asset_id)
      setNotice({ tone: 'info', text: `${file.name} 已上传，可以直接发起分离。` })
    } catch (requestError) {
      setNotice({ tone: 'error', text: requestError instanceof Error ? requestError.message : '上传失败' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function runSeparation() {
    if (!selectedAsset || !selectedProject) {
      setNotice({ tone: 'error', text: '请先选择一个原始音频资产。' })
      return
    }
    setSeparating(true)
    setJob(null)
    setNotice({ tone: 'info', text: `正在提交分离任务：${assetName(selectedAsset)}` })
    try {
      const created = await audioSeparatorApi.createSeparation({
        assetId: selectedAsset.asset_id,
        modelName: selectedModel,
        outputFormat,
      })
      setJob(created)
      if (!created.job_id || !created.task_id) throw new Error('分离服务没有返回 job_id/task_id')
      upsertStoredSeparatorJob({
        job_id: created.job_id,
        task_id: created.task_id,
        project_id: selectedProject.project_id,
        input_asset_id: selectedAsset.asset_id,
        asset_name: assetName(selectedAsset),
        model_name: selectedModel,
        output_format: outputFormat,
        status: created.status,
        progress_percent: created.progress_percent ?? 0,
        message: created.message || 'queued',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      setNotice({ tone: 'info', text: '分离任务已进入队列，离开页面后也会继续追踪。' })
      await pollJob(created.job_id)
    } catch (requestError) {
      setSeparating(false)
      setNotice({ tone: 'error', text: requestError instanceof Error ? requestError.message : '分离失败' })
    }
  }

  async function play(asset: Asset | undefined) {
    if (!asset || !isPlayableAsset(asset)) return
    stopMixer()
    await playAsset(asset)
  }

  function stopMixer() {
    mixerAudioRef.current.forEach((audio) => audio.pause())
    setMixerPlaying(false)
    setSoloAssetId('')
  }

  async function prepareMixerAudio(asset: Asset) {
    const existing = mixerAudioRef.current.get(asset.asset_id)
    if (existing) return existing
    const response = await audioAssetsApi.getAssetPlayUrl(asset.asset_id)
    const audio = new Audio(response.url)
    audio.preload = 'auto'
    audio.muted = !!mutedAssetIds[asset.asset_id]
    mixerAudioRef.current.set(asset.asset_id, audio)
    return audio
  }

  async function toggleMixer() {
    if (!resultAssets.length || mixerLoading) return
    if (mixerPlaying && !soloAssetId) {
      stopMixer()
      return
    }
    if (playing) toggleGlobalPlayback()
    setMixerLoading(true)
    try {
      const audios = await Promise.all(resultAssets.filter(isPlayableAsset).map(async (asset) => ({ asset, audio: await prepareMixerAudio(asset) })))
      mixerAudioRef.current.forEach((audio) => audio.pause())
      const startAt = mixerCurrentTime > 0 && audios.some(({ audio }) => audio.duration > mixerCurrentTime) ? mixerCurrentTime : 0
      audios.forEach(({ asset, audio }) => {
        audio.currentTime = startAt
        audio.muted = !!mutedAssetIds[asset.asset_id]
      })
      await Promise.all(audios.map(({ audio }) => audio.play()))
      setSoloAssetId('')
      setMixerPlaying(true)
    } catch (requestError) {
      stopMixer()
      setNotice({ tone: 'error', text: requestError instanceof Error ? requestError.message : '多轨播放失败' })
    } finally {
      setMixerLoading(false)
    }
  }

  async function toggleSolo(asset: Asset) {
    if (!isPlayableAsset(asset) || mixerLoading) return
    if (mixerPlaying && soloAssetId === asset.asset_id) {
      stopMixer()
      return
    }
    if (playing) toggleGlobalPlayback()
    setMixerLoading(true)
    try {
      const audio = await prepareMixerAudio(asset)
      mixerAudioRef.current.forEach((item) => item.pause())
      audio.currentTime = mixerCurrentTime > 0 && (!audio.duration || audio.duration > mixerCurrentTime) ? mixerCurrentTime : 0
      audio.muted = false
      await audio.play()
      setSoloAssetId(asset.asset_id)
      setMixerPlaying(true)
    } catch (requestError) {
      stopMixer()
      setNotice({ tone: 'error', text: requestError instanceof Error ? requestError.message : 'Solo 播放失败' })
    } finally {
      setMixerLoading(false)
    }
  }

  function togglePreviewMute(assetId: string) {
    setMutedAssetIds((current) => ({ ...current, [assetId]: !current[assetId] }))
  }

  return (
    <div className="studio-page">
      <PageHeader
        eyebrow="AUDIO WORKSPACE"
        title="音频工作台"
        description="分离、分析和处理你的声音资产。"
        action={<button className="secondary-button" disabled={!selectedProject || uploading} onClick={() => inputRef.current?.click()}><Upload size={17} /> {uploading ? '正在上传' : '上传音频'}</button>}
      />
      <input ref={inputRef} type="file" accept="audio/*" hidden onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])} />
      {notice && <div className={`upload-notice ${notice.tone === 'error' ? 'error' : ''}`}><Music2 size={17} /><span>{notice.text}</span><button onClick={() => setNotice(null)}>关闭</button></div>}
      {error && <div className="upload-notice error"><Music2 size={17} /><span>{error}</span><button onClick={() => void reload()}>重新加载</button></div>}

      <div className="studio-toolbar">
        <button className={activeTool === 'separate' ? 'active' : ''} onClick={() => setActiveTool('separate')}><Scissors size={17} /> 音轨分离</button>
        <button className={activeTool === 'analyze' ? 'active' : ''} onClick={() => setActiveTool('analyze')}><Activity size={17} /> 音乐分析</button>
        <button className={activeTool === 'process' ? 'active' : ''} onClick={() => setActiveTool('process')}><SlidersHorizontal size={17} /> 音频处理</button>
      </div>

      <section className="timeline-card">
        <div className="studio-project-row">
          <label>项目<select value={selectedProjectId} onChange={(event) => { setSelectedProjectId(event.target.value); setSelectedAssetId('') }} disabled={loading}>{projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.name}{project.is_default ? ' · 默认' : ''}</option>)}</select></label>
          <label>输入资产<select value={selectedAssetId} onChange={(event) => setSelectedAssetId(event.target.value)} disabled={!rawAssets.length || separating}>{rawAssets.map((asset) => <option key={asset.asset_id} value={asset.asset_id}>{assetName(asset)}</option>)}</select></label>
        </div>
        <div className="timeline-head">
          <div className="timeline-track-cover cover-a"><Music2 size={23} /></div>
          <div><strong>{timelineAsset ? assetName(timelineAsset) : '当前项目还没有原始音频'}</strong><span>{timelineAsset ? `${formatDuration(timelineDuration)} · ${timelineAsset.format.toUpperCase()} · ${timelineAsset.asset_id.slice(0, 8)}` : '先上传或到资产库选择项目'}</span></div>
          <button onClick={() => inputRef.current?.click()}><RotateCcw size={15} /> 替换</button>
          <button disabled={!currentJobDone}><Download size={16} /></button>
        </div>
        <div className="timeline-ruler"><span>{formatDuration(currentAsset?.asset_id === timelineAsset?.asset_id ? currentTime : null)}</span><span>00:45</span><span>01:30</span><span>02:15</span><span>03:00</span><span>{formatDuration(timelineDuration)}</span></div>
        <div className="large-wave" onClick={() => void play(timelineAsset || undefined)}>
          <div className="wave-playhead" style={{ left: `${Math.max(2, timelineProgress)}%` }}><i /><span>{separating ? `${progress}%` : formatDuration(currentAsset?.asset_id === timelineAsset?.asset_id ? currentTime : null)}</span></div>
          {wave.map((height, index) => <i key={index} className={index < Math.round(timelineProgress / 2.2) ? 'played' : ''} style={{ height: `${height}%` }} />)}
        </div>
        <div className="timeline-controls">
          <button className="timeline-play" disabled={!timelineAsset || loadingAssetId === timelineAsset.asset_id} onClick={() => void play(timelineAsset || undefined)}>{currentAsset?.asset_id === timelineAsset?.asset_id && playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
          <span>{job ? `${statusText(job.status)} · ${job.message || 'processing'}` : `${formatDuration(timelineDuration)} · ${rawAssets.length} 个原始资产`}</span>
          <div className="timeline-spacer" />
          <button><Waves size={16} /> 波形</button><button><Plus size={16} /> 添加标记</button>
        </div>
      </section>

      <div className="studio-columns">
        <section className="studio-panel stems-panel">
          <div className="panel-title"><div><h2>{activeTool === 'separate' ? '分离音轨' : activeTool === 'analyze' ? '音乐理解' : '处理与增强'}</h2><p>{activeTool === 'separate' ? '选择模型，输出轨道由模型定义' : '从音乐中提取结构化信息'}</p></div><button><ChevronDown size={16} /></button></div>
          {activeTool === 'separate' ? (
            <>
              <div className="separation-controls">
                <label>分离模型<select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} disabled={separating}>{models.length ? models.map((model) => <option key={model.filename} value={model.filename}>{model.label} · {model.filename}</option>) : <option value={fallbackModel}>{fallbackModel}</option>}</select></label>
                <label>输出格式<select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)} disabled={separating}><option value="wav">WAV</option><option value="flac">FLAC</option><option value="mp3">MP3</option></select></label>
              </div>
              <div className="model-output-card">
                <div className="model-output-head">
                  <span>模型输出轨道</span>
                  <strong>{selectedModelInfo?.architecture || 'MDX'}</strong>
                </div>
                <div className="output-track-grid">
                  {modelOutputs.map((stem, index) => <div className="output-track-pill" key={stem} style={{ '--stem-color': stemColors[index % stemColors.length] } as CSSProperties}><i /><span><strong>{stemLabel(stem)}</strong><small>{stem}</small></span></div>)}
                </div>
                <small>{selectedModelInfo?.notes || '输出轨道由当前模型决定，结果生成后可在右侧预览播放。'}</small>
              </div>
              <div className={`separation-run-strip ${separating ? 'is-running' : ''}`}>
                <button className="run-tool-button" disabled={!selectedAsset || separating} onClick={() => void runSeparation()}>
                  {separating && <i className="run-progress-fill" style={{ width: `${Math.max(0, Math.min(100, taskProgress))}%` }} />}
                  <span><Scissors size={17} /> {separating ? `${statusText(job?.status || 'started')} ${Math.round(taskProgress)}%` : '开始分离'}</span>
                </button>
                {(job || resultAssets.length) && (
                  <div className="separation-task-status">
                    <span>{job ? job.message || 'processing' : '已同步资产'}</span>
                    <strong>{job ? `${Math.round(taskProgress)}%` : '100%'}</strong>
                  </div>
                )}
              </div>
            </>
          ) : activeTool === 'analyze' ? (
            <div className="analysis-options">
              {['BPM 与节拍', '调性与音阶', '和弦时间轴', '旋律与音高'].map((item, index) => <label key={item}><input type="checkbox" defaultChecked={index < 3} /><span><CircleCheck size={17} />{item}</span></label>)}
              <button className="run-tool-button"><Activity size={17} /> 开始分析</button>
            </div>
          ) : (
            <div className="analysis-options">
              {['响度标准化', '智能降噪', '人声增强', '格式转换'].map((item, index) => <label key={item}><input type="checkbox" defaultChecked={index === 0} /><span><CircleCheck size={17} />{item}</span></label>)}
              <button className="run-tool-button"><SlidersHorizontal size={17} /> 开始处理</button>
            </div>
          )}
        </section>

        <section className="studio-panel insight-panel">
          <div className="panel-title"><div><h2>分离结果</h2><p>真实生成的轨道资产</p></div><span className={`analysis-ready ${currentJobFailed ? 'failed' : ''}`}><i /> {currentJobDone ? '已完成' : separating ? '运行中' : resultAssets.length ? '有结果' : '暂无结果'}</span></div>
          <div className="metric-grid">
            <div><span><Gauge size={17} /> 当前输入</span><strong>{selectedAsset ? assetName(selectedAsset) : '—'}</strong><small>{selectedAsset ? `${selectedAsset.format.toUpperCase()} · ${formatDuration(selectedAsset.duration)} · ${formatFileSize(selectedAsset.file_size)}` : '请选择输入资产'}</small></div>
            <div><span><Music2 size={17} /> 输出轨道</span><strong>{resultAssets.length}</strong><small>{resultAssets.length ? '已生成 separated assets' : '等待分离结果'}</small></div>
          </div>
          <div className="chord-block">
            <div><span>多轨预览 · {formatDuration(mixerCurrentTime)}</span><div className="mixer-preview-actions"><button className="mixer-master-play" type="button" disabled={!resultAssets.length || mixerLoading} onClick={() => void toggleMixer()}>{mixerPlaying && !soloAssetId ? <Pause size={11} fill="currentColor" /> : <Play size={11} fill="currentColor" />}{mixerLoading ? '加载中' : mixerPlaying && !soloAssetId ? '暂停混音' : '播放混音'}</button><button onClick={() => void reload()}>刷新资产</button></div></div>
            <div className="stem-list preview-stem-list">
              {resultAssets.map((asset, index) => {
                const color = stemColors[index % stemColors.length]
                const muted = !!mutedAssetIds[asset.asset_id]
                return (
                  <div className={`stem-row is-active ${muted ? 'is-muted' : ''}`} key={asset.asset_id}>
                    <button className={`stem-solo ${soloAssetId === asset.asset_id && mixerPlaying ? 'active' : ''}`} type="button" onClick={() => void toggleSolo(asset)} disabled={!isPlayableAsset(asset) || mixerLoading} aria-label={`Solo ${stemLabel(asset.subtype)}`}>{soloAssetId === asset.asset_id && mixerPlaying ? <Pause size={10} fill="currentColor" /> : 'S'}</button>
                    <i className="stem-color" style={{ background: color }} />
                    <div><strong>{stemLabel(asset.subtype)}</strong><small>{assetName(asset)}</small></div>
                    <div className="stem-mini-wave">{wave.slice(index * 5, index * 5 + 18).map((height, waveIndex) => <i key={waveIndex} style={{ height: `${Math.max(18, height - 18)}%`, background: color }} />)}</div>
                    <button className={`stem-toggle ${muted ? '' : 'on'}`} type="button" onClick={() => togglePreviewMute(asset.asset_id)} title={muted ? '加入混音' : '从混音中静音'} aria-pressed={!muted}><i /></button>
                  </div>
                )
              })}
              {!resultAssets.length && <div className="result-empty"><Music2 size={18} /><strong>暂无真实分离结果</strong><span>{selectedAsset ? '点击左侧“开始分离”后，生成的资产会出现在这里。' : '请先选择或上传一个输入音频。'}</span></div>}
            </div>
          </div>
          <button className="insight-action" disabled={!resultAssets.length}><Sparkles size={16} /> 用真实分离结果继续分析或创作</button>
        </section>
      </div>
    </div>
  )
}

function stemLabel(stem: string) {
  return stemLabels[stem.toLowerCase()] || stem
}

function statusText(status: string) {
  const labels: Record<string, string> = { queued: '排队中', started: '运行中', finished: '已完成', failed: '失败' }
  return labels[status] || status
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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
