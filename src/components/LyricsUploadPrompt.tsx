import { FileText, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { assetName } from '../lib/assetUtils'
import { audioAssetsApi } from '../services/audioAssetsApi'
import type { Asset } from '../types/audioAssets'

export function LyricsUploadPrompt({ asset, onUploaded, onClose }: {
  asset: Asset
  onUploaded: (lyricsAsset: Asset) => void | Promise<void>
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function upload(file: File) {
    setUploading(true)
    setError('')
    try {
      const response = await audioAssetsApi.uploadAssetLyrics(asset.asset_id, file)
      await onUploaded(response.asset)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '歌词上传失败')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="lyrics-upload-prompt">
      <span className="lyrics-upload-icon"><FileText size={18} /></span>
      <div><strong>是否有歌词文件？</strong><span>为“{assetName(asset)}”添加 LRC，播放时可实时同步歌词，预览效果更好。</span>{error && <small>{error}</small>}</div>
      <input ref={inputRef} hidden type="file" accept=".lrc,text/plain" onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])} />
      <button className="lyrics-upload-action" disabled={uploading} onClick={() => inputRef.current?.click()}><Upload size={15} /> {uploading ? '上传中' : '添加 LRC'}</button>
      <button className="lyrics-upload-close" onClick={onClose} aria-label="暂不添加歌词"><X size={15} /></button>
    </div>
  )
}
