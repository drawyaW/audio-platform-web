import type { AnalysisDocument } from '../types/audioAssets'

export type MusicMetadata = {
  title: string
  artist: string
  album: string
  albumArtist: string
  genre: string
  date: string
  track: string
}

export function readMusicMetadata(document: AnalysisDocument | null | undefined): MusicMetadata {
  const tags = document?.metadata?.tags || {}
  return {
    title: readTag(tags, 'title'),
    artist: readTag(tags, 'artist'),
    album: readTag(tags, 'album'),
    albumArtist: readTag(tags, 'albumartist', 'album_artist', 'album artist'),
    genre: readTag(tags, 'genre'),
    date: readTag(tags, 'date', 'year'),
    track: readTag(tags, 'tracknumber', 'track_number', 'track'),
  }
}

function readTag(tags: Record<string, unknown>, ...keys: string[]) {
  const normalized = new Map(Object.entries(tags).map(([key, value]) => [key.toLowerCase(), value]))
  for (const key of keys) {
    const formatted = formatTagValue(normalized.get(key.toLowerCase()))
    if (formatted) return formatted
  }
  return ''
}

function formatTagValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(formatTagValue).filter(Boolean).join(' / ')
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}
