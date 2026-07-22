import type { Asset } from '../types/audioAssets'

export function assetName(asset: Asset) {
  const original = asset.extra?.original_filename
  if (typeof original === 'string' && original) return original
  const filename = asset.extra?.filename
  if (typeof filename === 'string' && filename) return filename
  const value = asset.storage_path.split('/').pop()
  return value ? decodeURIComponent(value) : asset.asset_id
}

export function formatDuration(duration: number | null) {
  if (!duration || !Number.isFinite(duration)) return '—'
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatFileSize(size: number | null) {
  if (!size || !Number.isFinite(size)) return '—'
  if (size < 1024) return `${size} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = size / 1024
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[index]}`
}

export function isPlayableAsset(asset: Asset) {
  const format = asset.format.toLowerCase()
  return ['aac', 'flac', 'm4a', 'mp3', 'mp4', 'ogg', 'wav', 'webm'].includes(format)
}
