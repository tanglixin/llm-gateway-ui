/**
 * 后端接口封装。默认同源（Go 服务托管构建产物），
 * 单独起 dev server 时用 VITE_API_BASE 指向 http://127.0.0.1:8080。
 */
import { authHeaders } from './token'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

export interface Usage {
  prompt: number
  completion: number
}

export interface Cite {
  n: number
  doc: string
  chunk: string
  snippet: string
  score: number
}

export interface ChatReply {
  answer: string
  usage: Usage
  model: string
  latencyMs?: number
  cites?: Cite[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init?.headers ?? {}) },
  })
  if (res.status === 401) {
    window.dispatchEvent(new Event('nova:unauthorized'))
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      if (body?.error?.message) message = body.error.message
    } catch {
      /* 非 JSON 响应 */
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

/** 拉取 12 个页面的初始数据。 */
export function fetchBootstrap(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>('/api/bootstrap')
}

export interface Convo {
  id: string
  title: string
  model: string
  preview: string
  updatedAt: string
  count: number
}

export interface ApiMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  tokensIn: number
  tokensOut: number
  latencyMs: number
  createdAt: string
}

/** 真实调用后端 → Ollama，并把两条消息落库。 */
export function chat(conversationId: string, prompt: string): Promise<ChatReply & { conversationId: string }> {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ conversationId, prompt }),
  })
}

export function listConversations(): Promise<{ conversations: Convo[] }> {
  return request('/api/conversations')
}

export function getConversation(id: string): Promise<Convo & { messages: ApiMessage[] }> {
  return request(`/api/conversations/${id}`)
}

export function createConversation(title = ''): Promise<Convo> {
  return request('/api/conversations', { method: 'POST', body: JSON.stringify({ title }) })
}

export function deleteConversation(id: string): Promise<void> {
  return request(`/api/conversations/${id}`, { method: 'DELETE' })
}

export function retrievalSearch(body: {
  query: string
  mode: string
  topK: number
  threshold: number
}): Promise<{ hits: unknown[] }> {
  return request('/api/retrieval/search', { method: 'POST', body: JSON.stringify(body) })
}

export function toggleDrill(enable: boolean): Promise<Record<string, unknown>> {
  return request('/api/gateway/drill', { method: 'POST', body: JSON.stringify({ enable }) })
}

export function backup(): Promise<Record<string, unknown>> {
  return request('/api/ops/backup', { method: 'POST', body: '{}' })
}

export function restore(backupId: string): Promise<Record<string, unknown>> {
  return request('/api/ops/restore', { method: 'POST', body: JSON.stringify({ backupId }) })
}


export interface StreamResult {
  conversationId: string
  answer: string
  usage: { prompt: number; completion: number }
  ttftMs: number
  latencyMs: number
  cites: Cite[]
}

/**
 * 流式对话：边收边回调 onDelta，结束后返回完整结果。
 * 服务端每帧是 OpenAI 兼容的 chunk，最后一帧带 usage，然后是 [DONE]。
 */
export async function chatStream(
  conversationId: string,
  prompt: string,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<StreamResult> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ conversationId, prompt, stream: true }),
    signal,
  })
  if (res.status === 401) {
    window.dispatchEvent(new Event('nova:unauthorized'))
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      if (body?.error?.message) message = body.error.message
    } catch {
      /* 非 JSON */
    }
    throw new Error(message)
  }
  if (!res.body) throw new Error('浏览器不支持流式读取')

  const convId = res.headers.get('X-Conversation-Id') ?? conversationId
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  let usage = { prompt: 0, completion: 0 }
  let ttftMs = 0
  let latencyMs = 0
  let cites: Cite[] = []
  let firstAt = 0
  const startedAt = performance.now()

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let idx = buffer.indexOf('\n\n')
    while (idx >= 0) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      idx = buffer.indexOf('\n\n')

      for (const line of frame.split('\n')) {
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload) continue
        if (payload === '[DONE]') {
          return { conversationId: convId, answer, usage, ttftMs, latencyMs, cites }
        }
        try {
          const chunk = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>
            usage?: { prompt: number; completion: number }
            ttftMs?: number
            latencyMs?: number
            cites?: Cite[]
            error?: { message?: string }
          }
          if (chunk.error?.message) throw new Error(chunk.error.message)
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            if (!firstAt) {
              firstAt = 1
              ttftMs = Math.round(performance.now() - startedAt)
            }
            answer += delta
            onDelta(delta)
          }
          if (chunk.usage) usage = chunk.usage
          if (typeof chunk.ttftMs === 'number') ttftMs = chunk.ttftMs
          if (typeof chunk.latencyMs === 'number') latencyMs = chunk.latencyMs
          if (Array.isArray(chunk.cites)) cites = chunk.cites
        } catch (err) {
          if (err instanceof Error && err.message && !err.message.includes('JSON')) throw err
        }
      }
    }
  }
  return { conversationId: convId, answer, usage, ttftMs, latencyMs, cites }
}


export interface ApiDoc {
  id: string
  name: string
  acl: string
  status: string
  stage: number
  chunks: number
  sizeBytes: number
  storageKey?: string
  error?: string
  updatedAt: string
}

export function listDocuments(): Promise<{ documents: ApiDoc[]; queueDepth: number }> {
  return request('/api/documents')
}

export function uploadDocument(file: File, acl = '全员可见'): Promise<ApiDoc> {
  const form = new FormData()
  form.append('file', file)
  form.append('acl', acl)
  return fetch(`${BASE}/api/documents`, { method: 'POST', headers: authHeaders(), body: form }).then(async res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as ApiDoc
  })
}

export function retryDocument(id: string): Promise<ApiDoc> {
  return request(`/api/documents/${id}/retry`, { method: 'POST', body: '{}' })
}


export interface ModeMetric {
  mode: string
  label: string
  recall: number
  mrr: number
  ndcg: number
  avgMs: number
}

export function evaluateRetrieval(): Promise<{
  cases: number
  topK: number
  embedAvgMs: number
  modes: ModeMetric[]
}> {
  return request('/api/retrieval/evaluate', { method: 'POST', body: '{}' })
}


export interface UsageSummary {
  requests: number
  tokensIn: number
  tokensOut: number
  tokensTotal: number
  cost: number
  avgLatencyMs: number
  p95LatencyMs: number
  models: Array<{ model: string; requests: number; tokensIn: number; tokensOut: number; cost: number; avgLatencyMs: number }>
  top: Array<{ at: string; tenant: string; traceId: string; preview: string; model: string; tokens: number; cost: number; latencyMs: number }>
  daily: Array<{ day: string; requests: number; tokens: number; cost: number }>
}

export function usageSummary(range: 'all' | 'today' = 'all'): Promise<{
  summary: UsageSummary
  documents: number
  chunks: number
}> {
  return request(`/api/usage/summary?range=${range}`)
}


export interface ObsBucket {
  at: string
  requests: number
  avgMs: number
  p95Ms: number
  tokens: number
}

export function observability(minutes = 60): Promise<{
  minutes: number
  series: ObsBucket[]
  recent: Array<{ at: string; preview: string; model: string; tokens: number; latencyMs: number; traceId: string }>
}> {
  return request(`/api/observability/series?minutes=${minutes}`)
}


export interface ProviderStatus {
  name: string
  kind: string
  model: string
  weight: number
  state: 'closed' | 'open' | 'half'
  requests: number
  errors: number
  lastError?: string
}

export function gatewayStatus(): Promise<{ providers: ProviderStatus[] }> {
  return request('/api/gateway/status')
}

export function gatewayDrill(enable: boolean, provider = ''): Promise<{
  enabled: boolean
  providers: ProviderStatus[]
  message: string
}> {
  return request('/api/gateway/drill', { method: 'POST', body: JSON.stringify({ enable, provider }) })
}


export function login(email: string, password: string): Promise<{
  token: string
  expiresAt: string
  user: { id: string; email: string; name: string; tenant: string; role: string }
}> {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}


export interface AgentStep {
  index: number
  kind: 'thought' | 'action' | 'observation' | 'final'
  content?: string
  tool?: string
  input?: string
  durationMs?: number
  ok: boolean
}

export function runAgent(task: string, maxSteps = 2): Promise<{
  task: string
  steps: AgentStep[]
  grounded: boolean
  unverified: string[] | null
  tools: Array<{ name: string; desc: string; spec: string }>
}> {
  return request('/api/agent/run', { method: 'POST', body: JSON.stringify({ task, maxSteps }) })
}


export interface TraceSummary {
  traceId: string
  rootName: string
  startedAt: string
  durationMs: number
  spans: number
  status: string
}

export interface SpanInfo {
  traceId: string
  spanId: string
  parentSpanId: string
  name: string
  kind: string
  startMs: number
  durationMs: number
  status: string
  attributes: Record<string, unknown>
}

export function listTraces(limit = 10): Promise<{ traces: TraceSummary[] }> {
  return request(`/api/observability/traces?limit=${limit}`)
}

export function getTrace(traceId: string): Promise<{ traceId: string; spans: SpanInfo[] }> {
  return request(`/api/observability/traces/${traceId}`)
}


export interface EvalRunResult {
  id: number
  version: string
  cases: number
  recall: number
  mrr: number
  ndcg: number
  gate: string
  tookMs: number
  createdAt: string
}

export interface PromptVersionInfo {
  name: string
  description: string
  retrievalMode: string
  topK: number
  isActive: boolean
  run?: EvalRunResult
}

export function evalVersions(): Promise<{
  versions: PromptVersionInfo[]
  cases: number
  baseline: number
  goldenSet: Array<{ query: string; doc: string }>
}> {
  return request('/api/eval/versions')
}

export function runEval(version = ''): Promise<{ results: EvalRunResult[]; baseline: number }> {
  return request('/api/eval/run', { method: 'POST', body: JSON.stringify({ version }) })
}

export function activateVersion(version: string): Promise<{ active: string }> {
  return request('/api/eval/activate', { method: 'POST', body: JSON.stringify({ version }) })
}
