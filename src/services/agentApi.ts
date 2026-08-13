import { serviceUrls } from '../lib/api'
import type { AgentChatRequest, AgentStreamEvent } from '../types/agent'

const baseUrl = serviceUrls.agent

export async function streamAgentChat(
  payload: AgentChatRequest,
  onEvent: (event: AgentStreamEvent) => void,
  signal?: AbortSignal,
) {
  const token = window.localStorage.getItem('access_token')
  const response = await fetch(`${baseUrl}/agent/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  })
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const detail = errorPayload?.detail
    throw new Error(typeof detail === 'string' ? detail : `Agent request failed: ${response.status}`)
  }
  if (!response.body) throw new Error('Agent stream is unavailable')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  function consume(block: string) {
    const lines = block.split('\n')
    const eventName = lines.find((line) => line.startsWith('event:'))?.slice(6).trim()
    const data = lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n')
    if (!data) return
    const parsed = JSON.parse(data) as AgentStreamEvent
    if (eventName && parsed.type !== eventName) return
    onEvent(parsed)
  }

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replaceAll('\r\n', '\n')
    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      consume(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf('\n\n')
    }
    if (done) break
  }
  if (buffer.trim()) consume(buffer)
}
