import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { audioAssetsApi } from '../services/audioAssetsApi'
import type { Asset } from '../types/audioAssets'
import { PlaybackContext } from './playbackState'

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const [loadingAssetId, setLoadingAssetId] = useState('')
  const [playing, setPlaying] = useState(false)

  function getAudio() {
    if (!audioRef.current) {
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.onplay = () => setPlaying(true)
      audio.onpause = () => setPlaying(false)
      audio.onended = () => setPlaying(false)
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime || 0)
      audio.onloadedmetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      audio.onerror = () => {
        setPlaying(false)
        setError('浏览器无法播放这个文件格式或音频地址已失效')
      }
      audioRef.current = audio
    }
    return audioRef.current
  }

  async function playAsset(asset: Asset) {
    const audio = getAudio()
    if (currentAsset?.asset_id === asset.asset_id && !audio.paused) {
      audio.pause()
      return
    }

    setError('')
    setLoadingAssetId(asset.asset_id)
    try {
      if (currentAsset?.asset_id !== asset.asset_id || !audio.src) {
        const response = await audioAssetsApi.getAssetPlayUrl(asset.asset_id)
        audio.src = response.url
        audio.currentTime = 0
        setCurrentAsset(asset)
        setCurrentTime(0)
        setDuration(asset.duration || 0)
      }
      await audio.play()
    } catch (requestError) {
      setPlaying(false)
      setError(requestError instanceof Error ? requestError.message : '播放失败')
    } finally {
      setLoadingAssetId('')
    }
  }

  function toggle() {
    const audio = getAudio()
    if (!audio.src) return
    if (audio.paused) {
      void audio.play().catch((playError: unknown) => setError(playError instanceof Error ? playError.message : '播放失败'))
    } else {
      audio.pause()
    }
  }

  const value = {
    currentAsset,
    currentTime,
    duration,
    error,
    loadingAssetId,
    playing,
    playAsset,
    toggle,
  }

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}
