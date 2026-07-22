import { useContext } from 'react'
import { PlaybackContext } from './playbackState'

export function usePlayback() {
  const context = useContext(PlaybackContext)
  if (!context) throw new Error('usePlayback must be used within PlaybackProvider')
  return context
}
