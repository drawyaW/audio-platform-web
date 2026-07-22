import { AudioLines, ChevronDown, FileAudio, Image, Mic2, Music2, Plus, SlidersHorizontal, Sparkles, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/Shared'

const inspiration = [
  { title: '深夜城市 R&B', tags: '克制 · 温暖 · 男声', color: 'cover-a' },
  { title: '夏日独立流行', tags: '明亮 · 吉他 · 轻快', color: 'cover-c' },
  { title: '电影感氛围音乐', tags: '器乐 · 宽广 · 渐进', color: 'cover-b' },
]

export function CreatePage() {
  const [mode, setMode] = useState<'idea' | 'lyrics'>('idea')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  function generate() {
    setGenerating(true)
    window.setTimeout(() => setGenerating(false), 2400)
  }

  return (
    <div className="create-page">
      <PageHeader eyebrow="AI MUSIC GENERATION" title="把灵感写成一首歌" description="描述你脑海中的声音，剩下的交给创作引擎。" />
      <div className="create-layout">
        <section className="composer-card">
          <div className="mode-tabs">
            <button className={mode === 'idea' ? 'active' : ''} onClick={() => setMode('idea')}><Sparkles size={16} /> 灵感模式</button>
            <button className={mode === 'lyrics' ? 'active' : ''} onClick={() => setMode('lyrics')}><Mic2 size={16} /> 歌词模式</button>
          </div>
          <div className="prompt-area">
            <label>{mode === 'idea' ? '描述你想要的音乐' : '写下或粘贴你的歌词'}</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={mode === 'idea' ? '例如：一首适合雨夜开车听的中文 R&B，温暖的男声，松弛的鼓点和富有空气感的电钢琴……' : '[Verse]\n窗外的雨落在旧唱片上……'}
            />
            <span className="char-count">{prompt.length} / 1000</span>
          </div>
          <div className="composer-tools">
            <button><Music2 size={16} /> 参考音乐 <Plus size={14} /></button>
            <button><FileAudio size={16} /> 旋律 / MIDI <Plus size={14} /></button>
            <button><Image size={16} /> 封面灵感 <Plus size={14} /></button>
          </div>
          <div className="style-fields">
            <button><span><small>风格</small><strong>R&B · Neo Soul</strong></span><ChevronDown size={16} /></button>
            <button><span><small>人声</small><strong>温暖男声</strong></span><ChevronDown size={16} /></button>
            <button><span><small>时长</small><strong>约 3 分钟</strong></span><ChevronDown size={16} /></button>
          </div>
          <div className="composer-footer">
            <button className="advanced-button"><SlidersHorizontal size={16} /> 高级设置</button>
            <button className="generate-button" onClick={generate} disabled={generating}>
              {generating ? <><span className="spinner" /> 正在构思音乐...</> : <><WandSparkles size={17} /> 开始生成</>}
            </button>
          </div>
        </section>

        <aside className="create-aside">
          <div className="creation-balance">
            <span className="quick-icon tone-cyan"><AudioLines size={20} /></span>
            <div><strong>今日可生成 10 次</strong><p>每次生成 2 个音乐版本</p></div>
          </div>
          <div className="flow-card">
            <span>生成后可以继续</span>
            <div><i>01</i><p><strong>分析音乐</strong><small>查看 BPM、Key 与和弦</small></p></div>
            <div><i>02</i><p><strong>分离音轨</strong><small>获取人声、鼓、贝斯等 stems</small></p></div>
            <div><i>03</i><p><strong>制作新版本</strong><small>保留旋律并尝试另一种风格</small></p></div>
          </div>
        </aside>
      </div>

      <section className="inspiration-section">
        <div className="section-header"><div><h2>缺少灵感？</h2><p>从这些创作方向开始</p></div></div>
        <div className="inspiration-grid">
          {inspiration.map((item) => (
            <button key={item.title} onClick={() => setPrompt(`创作一首${item.title}，${item.tags.replaceAll(' · ', '、')}。`)}>
              <span className={`inspiration-art ${item.color}`}><Music2 size={25} /></span>
              <span><strong>{item.title}</strong><small>{item.tags}</small></span>
              <Plus size={18} />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
