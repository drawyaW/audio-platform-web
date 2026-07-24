import type { AnalysisDocument } from '../types/audioAssets'
import { readMusicMetadata } from '../lib/analysisMetadata'

export function AnalysisMetadata({ document, className = '' }: { document: AnalysisDocument | null | undefined; className?: string }) {
  const metadata = readMusicMetadata(document)
  const fields = [
    ['标题', metadata.title],
    ['艺术家', metadata.artist],
    ['专辑', metadata.album],
    ['专辑艺术家', metadata.albumArtist],
    ['流派', metadata.genre],
    ['发行时间', metadata.date],
    ['音轨', metadata.track],
  ].filter((field) => field[1])

  if (!fields.length) return null
  return (
    <div className={`analysis-metadata-grid ${className}`.trim()}>
      {fields.map(([label, value]) => <div key={label}><span>{label}</span><strong title={value}>{value}</strong></div>)}
    </div>
  )
}
