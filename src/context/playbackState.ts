import { createContext } from 'react'
import type { Asset } from '../types/audioAssets'

export type PlaybackContextValue = {
  currentAsset: Asset | null
  currentTime: number
  duration: number
  error: string
  loadingAssetId: string
  playing: boolean
  playAsset: (asset: Asset) => Promise<void>
  toggle: () => void
}

export const PlaybackContext = createContext<PlaybackContextValue | null>(null)
