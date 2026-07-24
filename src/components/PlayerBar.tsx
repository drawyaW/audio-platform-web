import { Activity, ChevronDown, FileText, Gauge, Heart, ListMusic, Maximize2, Minimize2, Music2, Pause, Play, Repeat2, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { AnalysisMetadata } from './AnalysisMetadata'
import { usePlayback } from '../context/usePlayback'
import { buildTimelineMarks, buildTimelineWindow, findCurrentChord, sliceWaveform } from '../lib/analysisTimeline'
import { readMusicMetadata } from '../lib/analysisMetadata'
import { findCurrentLyricIndex, parseLrc } from '../lib/lyrics'
import { assetName, formatDuration } from '../lib/assetUtils'
import { audioAssetsApi } from '../services/audioAssetsApi'
import type { AnalysisDocument, Asset, LyricsDocument } from '../types/audioAssets'

const bars = [7, 12, 18, 9, 23, 14, 28, 20, 12, 25, 31, 17, 10, 24, 16, 28, 12, 20, 32, 18, 25, 14, 8, 19, 27, 12, 22, 16, 29, 18]
const fallbackWaveform = Array.from({ length: 120 }, (_, index) => bars[index % bars.length] / 32)

export function PlayerBar() {
  const [liked, setLiked] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { currentAsset, currentTime, duration, error, playing, toggle } = usePlayback()
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0
  const playedBars = Math.round(progress * bars.length)

  useEffect(() => {
    if (!currentAsset) setExpanded(false)
  }, [currentAsset])

  return (
    <>
      {expanded && currentAsset && <ExpandedPlayer onClose={() => setExpanded(false)} />}
      <div className="player-bar">
        <div className="now-playing">
          <div className="track-cover cover-a"><AudioGlyph /></div>
          <div className="track-meta">
            <strong>{currentAsset ? assetName(currentAsset) : '未选择音频'}</strong>
            <span>{currentAsset ? `${currentAsset.subtype} · ${currentAsset.format.toUpperCase()}` : error || '在资产库点击播放按钮'}</span>
          </div>
          <button className={`player-icon ${liked ? 'is-liked' : ''}`} onClick={() => setLiked(!liked)} aria-label="收藏">
            <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="player-center">
          <div className="player-controls">
            <button aria-label="循环"><Repeat2 size={15} /></button>
            <button aria-label="上一首"><SkipBack size={17} fill="currentColor" /></button>
            <button className="play-button" onClick={toggle} disabled={!currentAsset} aria-label={playing ? '暂停' : '播放'}>
              {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            </button>
            <button aria-label="下一首"><SkipForward size={17} fill="currentColor" /></button>
            <span className="mini-duration">{formatDuration(duration || currentAsset?.duration || null)}</span>
          </div>
          <div className="wave-progress">
            <span>{formatDuration(currentTime || null)}</span>
            <div className="wave-bars">
              {bars.map((height, index) => <i key={index} className={index < playedBars ? 'played' : ''} style={{ height }} />)}
            </div>
            <span>{formatDuration(duration || currentAsset?.duration || null)}</span>
          </div>
        </div>
        <div className="player-actions">
          <button aria-label="播放列表"><ListMusic size={17} /></button>
          <button aria-label="音量"><Volume2 size={17} /></button>
          <div className="volume-line"><i /></div>
          <button disabled={!currentAsset} onClick={() => setExpanded((value) => !value)} aria-label={expanded ? '收起播放器详情' : '展开播放器详情'} title={expanded ? '收起播放器详情' : '展开播放器详情'}>
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </>
  )
}

function ExpandedPlayer({ onClose }: { onClose: () => void }) {
  const { currentAsset, currentTime, duration, playing, seek, toggle } = usePlayback()
  const [analysisAsset, setAnalysisAsset] = useState<Asset | null>(null)
  const [analysisDocument, setAnalysisDocument] = useState<AnalysisDocument | null>(null)
  const [attachedLyrics, setAttachedLyrics] = useState<LyricsDocument | null>(null)
  const [loadingLyrics, setLoadingLyrics] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(true)
  const [analysisError, setAnalysisError] = useState('')

  useEffect(() => {
    if (!currentAsset) return
    let cancelled = false
    setAnalysisAsset(null)
    setAnalysisDocument(null)
    setAnalysisError('')
    setLoadingAnalysis(true)

    void audioAssetsApi.listProjectAssets(currentAsset.project_id)
      .then((assets) => assets
        .filter((asset) => asset.type === 'analysis' && asset.parent_asset_id === currentAsset.asset_id)
        .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0] || null)
      .then(async (latest) => {
        if (cancelled || !latest) return null
        setAnalysisAsset(latest)
        const playUrl = await audioAssetsApi.getAssetPlayUrl(latest.asset_id)
        const response = await fetch(playUrl.url)
        if (!response.ok) throw new Error(`读取最新分析结果失败（HTTP ${response.status}）`)
        return response.json() as Promise<AnalysisDocument>
      })
      .then((document) => {
        if (!cancelled && document) setAnalysisDocument(document)
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setAnalysisError(requestError instanceof Error ? requestError.message : '读取最新分析结果失败')
      })
      .finally(() => {
        if (!cancelled) setLoadingAnalysis(false)
      })

    return () => { cancelled = true }
  }, [currentAsset])

  useEffect(() => {
    if (!currentAsset) return
    let cancelled = false
    setAttachedLyrics(null)
    setLoadingLyrics(true)
    void audioAssetsApi.getAssetLyrics(currentAsset.asset_id)
      .then(async ({ lyrics_asset: lyricsAsset }) => {
        if (!lyricsAsset) return null
        const playUrl = await audioAssetsApi.getAssetPlayUrl(lyricsAsset.asset_id)
        const response = await fetch(playUrl.url)
        if (!response.ok) throw new Error(`读取歌词失败（HTTP ${response.status}）`)
        return parseLrc(await response.text(), lyricsAsset.asset_id)
      })
      .then((lyrics) => {
        if (!cancelled && lyrics) setAttachedLyrics(lyrics)
      })
      .catch(() => {
        // 歌词是可选增强项；读取失败不影响音频和分析结果播放。
      })
      .finally(() => {
        if (!cancelled) setLoadingLyrics(false)
      })
    return () => { cancelled = true }
  }, [currentAsset])

  const playbackDuration = analysisDocument?.summary?.duration_seconds || duration || currentAsset?.duration || 0
  const timelineWindow = useMemo(
    () => analysisDocument ? buildTimelineWindow(playbackDuration, currentTime, false) : { start: 0, end: playbackDuration || 1 },
    [analysisDocument, currentTime, playbackDuration],
  )
  const windowDuration = Math.max(.001, timelineWindow.end - timelineWindow.start)
  const timelineProgress = Math.max(0, Math.min(100, ((currentTime - timelineWindow.start) / windowDuration) * 100))
  const timelineMarks = buildTimelineMarks(timelineWindow.start, timelineWindow.end)
  const chordSegments = analysisDocument?.chords?.timeline?.segments || []
  const currentChord = findCurrentChord(chordSegments, currentTime)
  const visibleChordSegments = chordSegments.filter((segment) => (segment.end_seconds ?? playbackDuration) > timelineWindow.start && segment.start_seconds < timelineWindow.end)
  const analyzedWaveform = sliceWaveform(analysisDocument?.waveform?.peaks || [], timelineWindow, playbackDuration)
  const visibleWaveform = analyzedWaveform.length ? analyzedWaveform : fallbackWaveform
  const summary = analysisDocument?.summary
  const embeddedMetadata = readMusicMetadata(analysisDocument)
  const lyrics = attachedLyrics || analysisDocument?.lyrics || null
  const lyricLines = lyrics?.lines || []
  const currentLyricIndex = findCurrentLyricIndex(lyricLines, currentTime)
  const analysisStatus = analysisDocument ? `最新音乐分析 · ${formatDate(analysisAsset?.created_at)}` : loadingAnalysis ? '正在查找最新分析结果' : '普通播放模式 · 当前音频尚无分析结果'

  function seekFromTimeline(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width)))
    seek(timelineWindow.start + ratio * windowDuration)
  }

  return (
    <section className="expanded-player" aria-label="播放器详情">
      <div className="expanded-player-head">
        <div className="expanded-player-cover cover-a"><Music2 size={24} /></div>
        <div>
          <strong>{embeddedMetadata.title || (currentAsset ? assetName(currentAsset) : '未选择音频')}</strong>
          <span>{embeddedMetadata.artist ? `${embeddedMetadata.artist}${embeddedMetadata.album ? ` · ${embeddedMetadata.album}` : ''} · ${analysisStatus}` : analysisStatus}</span>
        </div>
        {analysisDocument && <i className="expanded-analysis-badge"><Activity size={14} /> 已加载分析</i>}
        <button className="expanded-player-close" onClick={onClose}><ChevronDown size={18} /> 收起</button>
      </div>

      <div className="expanded-player-timeline">
        <div className="timeline-ruler">{timelineMarks.map((mark, index) => <span key={`${mark}-${index}`}>{formatDuration(mark)}</span>)}</div>
        <div className={`large-wave ${visibleChordSegments.length ? 'has-chords' : ''}`} onClick={seekFromTimeline}>
          {visibleChordSegments.length > 0 && playbackDuration > 0 && (
            <div className="analysis-chord-timeline" aria-label="滚动和弦时间轴">
              {visibleChordSegments.map((segment, index) => {
                const start = Math.max(timelineWindow.start, segment.start_seconds)
                const end = Math.min(timelineWindow.end, Math.max(start, segment.end_seconds ?? playbackDuration))
                const left = Math.min(100, ((start - timelineWindow.start) / windowDuration) * 100)
                const width = Math.max(.2, Math.min(100 - left, ((end - start) / windowDuration) * 100))
                return <span key={`${segment.start_seconds}-${segment.chord}-${index}`} className={segment === currentChord ? 'active' : ''} style={{ left: `${left}%`, width: `${width}%` }} title={`${formatDuration(segment.start_seconds)}–${formatDuration(segment.end_seconds)} · ${segment.chord}`}><b>{segment.chord}</b></span>
              })}
            </div>
          )}
          <div className="wave-playhead" style={{ left: `${timelineProgress}%` }}><i /><span>{currentChord ? `${currentChord.chord} · ${formatDuration(currentTime || null)}` : formatDuration(currentTime || null)}</span></div>
          {visibleWaveform.map((peak, index) => <i key={index} className={(index / Math.max(1, visibleWaveform.length - 1)) * 100 < timelineProgress ? 'played' : ''} style={{ height: `${Math.max(4, peak * 100)}%` }} />)}
        </div>
        <div className="expanded-player-controls">
          <button className="timeline-play" onClick={toggle}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
          <span>{currentChord ? `当前和弦 ${currentChord.chord} · ${formatDuration(currentChord.start_seconds)}–${formatDuration(currentChord.end_seconds)}` : `${formatDuration(currentTime || null)} / ${formatDuration(playbackDuration || null)}`}</span>
          <strong>{analysisDocument ? '播放时自动滚动 24 秒窗口' : '点击波形可跳转播放位置'}</strong>
        </div>
      </div>

      {analysisError && <div className="expanded-player-message error">{analysisError}，暂时按普通播放模式展示。</div>}
      <div className="expanded-lyrics" aria-label="歌词">
        <div className="expanded-lyrics-head"><span><FileText size={15} /> 歌词</span><i>{lyrics?.synced ? 'LRC · 随播放同步' : lyrics?.plain_text ? '内嵌文本 · 静态展示' : loadingLyrics ? '读取中' : '暂无歌词'}</i></div>
        {lyrics?.synced && lyricLines.length ? (
          <div className="synced-lyrics">
            {lyricLines.slice(Math.max(0, currentLyricIndex - 2), Math.min(lyricLines.length, Math.max(4, currentLyricIndex + 3))).map((line, visibleIndex) => {
              const absoluteIndex = Math.max(0, currentLyricIndex - 2) + visibleIndex
              return <button key={`${line.start_seconds}-${absoluteIndex}`} className={absoluteIndex === currentLyricIndex ? 'active' : ''} onClick={() => seek(line.start_seconds)}><time>{formatDuration(line.start_seconds)}</time><span>{line.text}</span></button>
            })}
          </div>
        ) : lyrics?.plain_text ? (
          <pre className="static-lyrics">{lyrics.plain_text}</pre>
        ) : (
          <div className="lyrics-empty">{loadingLyrics ? '正在读取歌词信息…' : '暂无歌词信息'}</div>
        )}
      </div>
      {summary ? (
        <>
          <AnalysisMetadata document={analysisDocument} className="expanded-player-metadata" />
          <div className="analysis-summary-grid expanded-player-summary">
            <div><span>BPM</span><strong>{formatMetric(summary.bpm)}</strong></div>
            <div><span>Key</span><strong>{formatKey(summary.key, summary.scale)}</strong></div>
            <div><span>Beats</span><strong>{summary.beats_count ?? '—'}</strong></div>
            <div><span>Loudness</span><strong>{formatMetric(summary.loudness)}<small> LUFS</small></strong></div>
            <div><span>Danceability</span><strong>{formatMetric(summary.danceability)}</strong></div>
            <div><span>Chord Key</span><strong>{formatKey(summary.chords_key, summary.chords_scale)}</strong></div>
          </div>
        </>
      ) : !loadingAnalysis && !analysisError && (
        <div className="expanded-player-message"><Gauge size={16} /> 当前音频还没有分析结果，完成音乐分析后这里会自动显示最新指标和滚动和弦。</div>
      )}
    </section>
  )
}

function formatMetric(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value * 10) / 10) : '—'
}

function formatKey(key: string | null | undefined, scale: string | null | undefined) {
  if (!key) return '—'
  return `${key} ${scale || ''}`.trim()
}

function formatDate(value: string | undefined) {
  if (!value) return '刚刚'
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function AudioGlyph() {
  return <div className="audio-glyph"><i /><i /><i /><i /><i /></div>
}
