import { ArrowUp, AudioLines, Bot, FileAudio, Paperclip, Sparkles, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/Shared'

const suggestions = [
  '帮我把这首歌的人声和伴奏分开',
  '分析这段音乐的 BPM、调性和和弦',
  '根据这首歌的结构生成一首中文 R&B',
]

export function AgentPage() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([])

  function send(content = text) {
    if (!content.trim()) return
    setMessages((current) => [...current, { role: 'user', text: content }, { role: 'agent', text: '我明白了。我会先确认输入资产，然后为你创建对应的处理工作流。当前是界面预览模式，后端编排接口接通后会在这里显示实时步骤。' }])
    setText('')
  }

  return (
    <div className="agent-page">
      <PageHeader eyebrow="AGENT WORKFLOW" title="创作助手" description="不用理解每个工具，告诉我最终想得到什么。" />
      <section className="agent-shell">
        <div className="agent-context">
          <span><AudioLines size={16} /> 当前上下文</span>
          <button><span className="mini-cover cover-a"><FileAudio size={15} /></span><p><strong>雪花飘 (Demo).ogg</strong><small>Default Project · 原始音频</small></p></button>
          <div className="workflow-preview"><span>可调用能力</span><div><i>分离</i><i>分析</i><i>生成</i><i>资产</i></div></div>
        </div>
        <div className="chat-column">
          <div className="chat-scroll">
            {!messages.length ? (
              <div className="agent-welcome">
                <span className="agent-orb"><Bot size={28} /><i /></span>
                <h2>今天想对这段声音做什么？</h2>
                <p>我会帮你组合合适的工具，并把每个结果保存到当前项目。</p>
                <div className="suggestion-list">{suggestions.map((item) => <button key={item} onClick={() => send(item)}><Sparkles size={15} />{item}</button>)}</div>
              </div>
            ) : messages.map((message, index) => <div key={index} className={`chat-message ${message.role}`}><span>{message.role === 'agent' ? <Bot size={17} /> : 'YX'}</span><p>{message.text}</p></div>)}
          </div>
          <div className="chat-composer">
            <textarea value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() } }} placeholder="描述你想完成的音频或音乐任务…" />
            <div><button><Paperclip size={17} /> 添加资产</button><span>Enter 发送 · Shift + Enter 换行</span><button className="send-button" onClick={() => send()}><ArrowUp size={18} /></button></div>
          </div>
          <div className="agent-note"><WandSparkles size={13} /> Agent 的操作会创建可追踪的 task，并将结果登记为 project asset。</div>
        </div>
      </section>
    </div>
  )
}
