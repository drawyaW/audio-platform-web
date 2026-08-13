export type AgentHistoryItem = {
  role: 'user' | 'agent'
  text: string
}

export type AgentChatRequest = {
  message: string
  project_id: string
  asset_id?: string
  history: AgentHistoryItem[]
}

export type AgentStreamEvent =
  | { type: 'status'; status: string }
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_called'; tool_name: string | null }
  | { type: 'tool_output'; output: string }
  | { type: 'completed'; response: string }
  | { type: 'error'; error: string }
