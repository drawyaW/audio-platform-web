import type { LyricLine, LyricsDocument } from '../types/audioAssets'

const timestampPattern = /\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g

export function parseLrc(content: string, sourceAssetId: string | null = null): LyricsDocument {
  const offsetMatch = content.match(/^\[offset:(-?\d+)\]$/im)
  const offset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0
  const entries: Array<{ start: number; text: string }> = []

  content.split(/\r?\n/).forEach((rawLine) => {
    const matches = [...rawLine.matchAll(timestampPattern)]
    if (!matches.length) return
    const text = rawLine.replace(timestampPattern, '').trim()
    if (!text) return
    matches.forEach((match) => {
      const start = Math.max(0, Number(match[1]) * 60 + Number(match[2].replace(':', '.')) + offset)
      entries.push({ start: Math.round(start * 1000) / 1000, text })
    })
  })
  entries.sort((left, right) => left.start - right.start)
  const lines: LyricLine[] = entries.map((entry, index) => ({
    start_seconds: entry.start,
    end_seconds: entries[index + 1]?.start ?? null,
    text: entry.text,
  }))
  const plainText = lines.length
    ? lines.map((line) => line.text).join('\n')
    : content.split(/\r?\n/).filter((line) => !/^\[[a-z]+:/i.test(line.trim())).join('\n').trim()

  return {
    lrc: content,
    source: 'asset_lrc',
    source_asset_id: sourceAssetId,
    format: 'lrc',
    synced: lines.length > 0,
    plain_text: plainText,
    lines,
  }
}

export function findCurrentLyricIndex(lines: LyricLine[], currentTime: number) {
  if (!lines.length) return -1
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (currentTime >= lines[index].start_seconds) return index
  }
  return -1
}
