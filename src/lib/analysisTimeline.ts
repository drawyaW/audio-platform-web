import type { ChordSegment } from '../types/audioAssets'

export function findCurrentChord(segments: ChordSegment[], seconds: number) {
  if (!segments.length) return null
  return segments.find((segment) => seconds >= segment.start_seconds && seconds < (segment.end_seconds ?? Number.POSITIVE_INFINITY))
    || (seconds <= segments[0].start_seconds ? segments[0] : segments[segments.length - 1])
}

export function buildTimelineWindow(duration: number, currentTime: number, expanded: boolean) {
  if (!duration || !Number.isFinite(duration)) return { start: 0, end: 1 }
  if (expanded) return { start: 0, end: duration }
  const windowDuration = Math.min(24, duration)
  const start = Math.max(0, Math.min(duration - windowDuration, currentTime - 8))
  return { start, end: start + windowDuration }
}

export function buildTimelineMarks(start: number, end: number) {
  const duration = Math.max(0, end - start)
  return Array.from({ length: 6 }, (_, index) => start + (duration * index) / 5)
}

export function sliceWaveform(peaks: number[], window: { start: number; end: number }, duration: number) {
  if (!peaks.length || !duration) return []
  const startIndex = Math.max(0, Math.floor((window.start / duration) * peaks.length))
  const endIndex = Math.min(peaks.length, Math.max(startIndex + 1, Math.ceil((window.end / duration) * peaks.length)))
  return peaks.slice(startIndex, endIndex).map((peak) => Math.max(0, Math.min(1, peak)))
}
