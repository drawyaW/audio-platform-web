import { Heart, ListMusic, Maximize2, Pause, Play, Repeat2, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useState } from 'react'
import { usePlayback } from '../context/usePlayback'
import { assetName, formatDuration } from '../lib/assetUtils'

const bars = [7, 12, 18, 9, 23, 14, 28, 20, 12, 25, 31, 17, 10, 24, 16, 28, 12, 20, 32, 18, 25, 14, 8, 19, 27, 12, 22, 16, 29, 18]

export function PlayerBar() {
  const [liked, setLiked] = useState(false)
  const { currentAsset, currentTime, duration, error, playing, toggle } = usePlayback()
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0
  const playedBars = Math.round(progress * bars.length)

  return (
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
        <button aria-label="全屏"><Maximize2 size={16} /></button>
      </div>
    </div>
  )
}

function AudioGlyph() {
  return <div className="audio-glyph"><i /><i /><i /><i /><i /></div>
}
