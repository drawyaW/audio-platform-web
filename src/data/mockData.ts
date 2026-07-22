export type Project = {
  id: string
  name: string
  description: string
  assetCount: number
  updatedAt: string
  cover: string
  status?: string
}

export type Asset = {
  id: string
  name: string
  type: '原始音频' | '分离音轨' | '分析结果' | 'AI 生成'
  subtype: string
  format: string
  duration: string
  project: string
  updatedAt: string
  color: string
}

export const projects: Project[] = [
  {
    id: 'p-default',
    name: 'Default Project',
    description: '快速上传与临时音频处理',
    assetCount: 12,
    updatedAt: '刚刚更新',
    cover: 'cover-a',
    status: '默认项目',
  },
  {
    id: 'p-echoes',
    name: 'Echoes in Blue',
    description: '人声分离、和弦分析与 R&B 改编',
    assetCount: 8,
    updatedAt: '2 小时前',
    cover: 'cover-b',
  },
  {
    id: 'p-film',
    name: '短片配乐实验',
    description: '对白提取与氛围音乐生成',
    assetCount: 5,
    updatedAt: '昨天',
    cover: 'cover-c',
  },
]

export const assets: Asset[] = [
  {
    id: 'a-001',
    name: '雪花飘 (Demo)',
    type: '原始音频',
    subtype: 'Full mix',
    format: 'OGG',
    duration: '03:42',
    project: 'Default Project',
    updatedAt: '2 分钟前',
    color: 'cover-a',
  },
  {
    id: 'a-002',
    name: '雪花飘 · Vocals',
    type: '分离音轨',
    subtype: 'Vocals',
    format: 'WAV',
    duration: '03:42',
    project: 'Default Project',
    updatedAt: '1 分钟前',
    color: 'cover-d',
  },
  {
    id: 'a-003',
    name: '雪花飘 · Instrumental',
    type: '分离音轨',
    subtype: 'Instrumental',
    format: 'WAV',
    duration: '03:42',
    project: 'Default Project',
    updatedAt: '1 分钟前',
    color: 'cover-e',
  },
  {
    id: 'a-004',
    name: 'Echoes · Analysis',
    type: '分析结果',
    subtype: 'BPM / Key / Chords',
    format: 'JSON',
    duration: '—',
    project: 'Echoes in Blue',
    updatedAt: '2 小时前',
    color: 'cover-b',
  },
  {
    id: 'a-005',
    name: 'Midnight Blue · V2',
    type: 'AI 生成',
    subtype: 'Full song',
    format: 'WAV',
    duration: '02:58',
    project: 'Echoes in Blue',
    updatedAt: '昨天',
    color: 'cover-c',
  },
]

export const recentTasks = [
  { id: 'T-2407', name: '人声 / 伴奏分离', file: '雪花飘 (Demo).ogg', status: '已完成', time: '1 分钟前', progress: 100 },
  { id: 'T-2406', name: '音乐理解分析', file: 'Echoes in Blue.wav', status: '运行中', time: '正在分析和弦', progress: 68 },
  { id: 'T-2405', name: 'AI 歌曲生成', file: 'Midnight Blue · V2', status: '排队中', time: '预计 3 分钟', progress: 12 },
  { id: 'T-2404', name: '对白 / BGM 分离', file: 'film_scene_08.mov', status: '失败', time: '昨天 22:14', progress: 0 },
]

export const quickActions = [
  { title: '分离人声与伴奏', description: '从歌曲中提取干净人声和伴奏', icon: 'split', tone: 'cyan', href: '/studio' },
  { title: '理解一首音乐', description: '分析 BPM、调性、节拍与和弦', icon: 'analysis', tone: 'violet', href: '/studio' },
  { title: '创作一首新歌', description: '通过灵感、歌词或参考音乐生成', icon: 'sparkles', tone: 'coral', href: '/create' },
  { title: '让 Agent 帮我', description: '用一句话编排完整音频工作流', icon: 'agent', tone: 'lime', href: '/assistant' },
]
