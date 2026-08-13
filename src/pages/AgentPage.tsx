import { ArrowUp, AudioLines, Bot, FileAudio, Paperclip, Sparkles, WandSparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '../components/Shared'
import { useProjects } from '../hooks/useProjects'
import { assetName, formatDuration, isPlayableAsset } from '../lib/assetUtils'
import { streamAgentChat } from '../services/agentApi'
import type { AgentStreamEvent } from '../types/agent'

const suggestions = [
  '帮我把当前音频的人声和伴奏分开',
  '分析当前音乐的 BPM、调性和和弦',
  '创作一首夏日独立流行，明亮、吉他、轻快',
]

type ToolStep = { name: string; status: 'running' | 'finished' }
type UiMessage = { id: string; role: 'user' | 'agent'; text: string; tools?: ToolStep[] }

const toolLabels: Record<string, string> = {
  get_current_audio_context: '读取当前音频上下文',
  list_current_project_assets: '查询项目资产',
  list_current_project_tasks: '查询最近任务',
  list_recommended_separation_models: '选择分离模型',
  submit_audio_separation: '提交音轨分离任务',
  get_audio_separation_job: '查询分离进度',
  list_audio_analysis_capabilities: '确认分析能力',
  submit_audio_analysis: '提交音乐分析任务',
  get_audio_analysis_job: '查询分析进度',
  submit_separate_then_analyze_workflow: '创建分离并分析工作流',
  get_audio_workflow_status: '查询工作流进度',
  list_music_generation_capabilities: '确认音乐生成能力',
  submit_music_generation: '提交音乐生成任务',
  get_music_generation_job: '查询生成进度',
}

export function AgentPage() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const { projects, loading, error: projectsError, reload } = useProjects()
  const assetSelectRef = useRef<HTMLSelectElement | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!selectedProjectId && projects.length) {
      setSelectedProjectId((projects.find((project) => project.is_default) || projects[0]).project_id)
    }
  }, [projects, selectedProjectId])

  const project = projects.find((item) => item.project_id === selectedProjectId) || null
  const audioAssets = useMemo(
    () => (project?.assets || []).filter((asset) => isPlayableAsset(asset) && ['raw', 'separated', 'generated'].includes(asset.type)),
    [project],
  )

  useEffect(() => {
    if (selectedAssetId && audioAssets.some((asset) => asset.asset_id === selectedAssetId)) return
    const preferred = audioAssets.find((asset) => asset.type === 'raw') || audioAssets[0]
    setSelectedAssetId(preferred?.asset_id || '')
  }, [audioAssets, selectedAssetId])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const selectedAsset = audioAssets.find((asset) => asset.asset_id === selectedAssetId) || null

  function updateAgentMessage(id: string, update: (message: UiMessage) => UiMessage) {
    setMessages((current) => current.map((message) => message.id === id ? update(message) : message))
  }

  function handleStreamEvent(id: string, event: AgentStreamEvent) {
    if (event.type === 'text_delta') {
      updateAgentMessage(id, (message) => ({ ...message, text: message.text + event.delta }))
    } else if (event.type === 'tool_called') {
      const name = event.tool_name || 'unknown_tool'
      updateAgentMessage(id, (message) => ({ ...message, tools: [...(message.tools || []), { name, status: 'running' }] }))
    } else if (event.type === 'tool_output') {
      updateAgentMessage(id, (message) => {
        const tools = [...(message.tools || [])]
        const runningIndex = tools.findIndex((tool) => tool.status === 'running')
        if (runningIndex >= 0) tools[runningIndex] = { ...tools[runningIndex], status: 'finished' }
        return { ...message, tools }
      })
    } else if (event.type === 'completed') {
      updateAgentMessage(id, (message) => ({ ...message, text: event.response || message.text || '任务已处理。' }))
    } else if (event.type === 'error') {
      updateAgentMessage(id, (message) => ({ ...message, text: `Agent 执行失败：${event.error}` }))
    }
  }

  async function send(content = text) {
    const value = content.trim()
    if (!value || sending) return
    if (!project) {
      setError('请先选择项目')
      return
    }
    const history = messages.filter((message) => message.text.trim()).map(({ role, text: messageText }) => ({ role, text: messageText }))
    const userMessage: UiMessage = { id: crypto.randomUUID(), role: 'user', text: value }
    const agentMessage: UiMessage = { id: crypto.randomUUID(), role: 'agent', text: '', tools: [] }
    setMessages((current) => [...current, userMessage, agentMessage])
    setText('')
    setError('')
    setSending(true)
    try {
      await streamAgentChat({
        message: value,
        project_id: project.project_id,
        asset_id: selectedAsset?.asset_id,
        history,
      }, (event) => handleStreamEvent(agentMessage.id, event))
      await reload()
    } catch (requestError) {
      const detail = requestError instanceof Error ? requestError.message : 'Agent 请求失败'
      setError(detail)
      updateAgentMessage(agentMessage.id, (message) => ({ ...message, text: `暂时无法完成：${detail}` }))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="agent-page">
      <PageHeader eyebrow="AGENT WORKFLOW" title="创作助手" description="选择项目和音频资产，然后用自然语言调用分离、分析和音乐生成能力。" />
      {(error || projectsError) && <div className="upload-notice error"><Bot size={17} /><span>{error || projectsError}</span><button onClick={() => setError('')}>关闭</button></div>}
      <section className="agent-shell">
        <div className="agent-context">
          <span><AudioLines size={16} /> 当前上下文</span>
          <label className="agent-context-field"><small>项目</small><select value={selectedProjectId} disabled={loading || sending} onChange={(event) => { setSelectedProjectId(event.target.value); setSelectedAssetId('') }}>{projects.map((item) => <option key={item.project_id} value={item.project_id}>{item.name}{item.is_default ? ' · 默认' : ''}</option>)}</select></label>
          <label className="agent-context-field asset"><small>音频资产</small><span className="mini-cover cover-a"><FileAudio size={15} /></span><select ref={assetSelectRef} value={selectedAssetId} disabled={!audioAssets.length || sending} onChange={(event) => setSelectedAssetId(event.target.value)}><option value="">未选择音频</option>{audioAssets.map((asset) => <option key={asset.asset_id} value={asset.asset_id}>{assetName(asset)}</option>)}</select>{selectedAsset && <em>{selectedAsset.type} · {selectedAsset.format.toUpperCase()} · {formatDuration(selectedAsset.duration)}</em>}</label>
          {!audioAssets.length && !loading && <p className="agent-context-empty">当前项目没有可用音频，请先上传资产。</p>}
          <div className="workflow-preview"><span>真实可调用能力</span><div><i>分离</i><i>分析</i><i>生成</i><i>资产</i></div></div>
        </div>
        <div className="chat-column">
          <div className="chat-scroll" ref={chatRef}>
            {!messages.length ? (
              <div className="agent-welcome">
                <span className="agent-orb"><Bot size={28} /><i /></span>
                <h2>今天想完成什么？</h2>
                <p>{selectedAsset ? `当前已选择「${assetName(selectedAsset)}」，Agent 会把处理结果保存到「${project?.name}」。` : '可以直接生成新音乐；分离或分析前请先选择音频资产。'}</p>
                <div className="suggestion-list">{suggestions.map((item) => <button key={item} disabled={sending} onClick={() => void send(item)}><Sparkles size={15} />{item}</button>)}</div>
              </div>
            ) : messages.map((message) => <div key={message.id} className={`chat-message ${message.role}`}><span>{message.role === 'agent' ? <Bot size={17} /> : 'YX'}</span><div className="chat-message-body">{!!message.tools?.length && <div className="agent-tool-steps">{message.tools.map((tool, index) => <span key={`${tool.name}-${index}`} className={tool.status}><i />{toolLabels[tool.name] || tool.name}</span>)}</div>}<p>{message.text || (message.role === 'agent' ? '正在思考并选择工具…' : '')}</p></div></div>)}
          </div>
          <div className="chat-composer">
            <textarea value={text} disabled={sending} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send() } }} placeholder="描述你想完成的音频或音乐任务…" />
            <div><button type="button" onClick={() => assetSelectRef.current?.focus()}><Paperclip size={17} /> 选择资产</button><span>{sending ? 'Agent 正在执行…' : 'Enter 发送 · Shift + Enter 换行'}</span><button className="send-button" disabled={sending || !text.trim()} onClick={() => void send()}><ArrowUp size={18} /></button></div>
          </div>
          <div className="agent-note"><WandSparkles size={13} /> Agent 使用当前登录身份创建 task，结果自动登记到当前项目资产库。</div>
        </div>
      </section>
    </div>
  )
}
