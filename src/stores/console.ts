import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { DOCS, ROLE_NAME, ROLE_VIEWS, CHAT_ANSWER, CHAT_METRICS, type DocItem } from '@/data/mock'
import type { Cite } from '@/api/client'
import { runEval as runEvalAPI, evalVersions as evalVersionsAPI, type PromptVersionInfo, runAgent as runAgentAPI, chatStream as chatStreamAPI, listDocuments, uploadDocument, retryDocument as retryDocAPI, listConversations, getConversation, createConversation, type Convo, type ApiMessage, type ApiDoc } from '@/api/client'

export interface ChatMsg {
  role: 'user' | 'ai'
  text: string
  done: boolean
  cites?: Cite[]
}

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'ok' | 'warn' | 'danger'
}

let toastSeq = 0
let abortStream: AbortController | null = null

export const useConsole = defineStore('console', () => {
  const role = ref<string>('ops')
  const env = ref('DEMO')

  /** 各页面的 Tab 选中项（原型里叫 S.tab） */
  const tabs = reactive<Record<string, string>>({
    observability: 'metrics',
    security: 'injection',
    ops: 'services',
    design: 'tokens',
  })

  const switches = reactive<Record<string, boolean>>({
    rerank: true, agent: false, cache: true, budget: true,
    autofail: true, audit: true, desense: true, acl: true,
  })

  const checks = reactive<Record<string, boolean>>({})

  /** 会话列表（来自 PostgreSQL） */
  const convos = ref<Convo[]>([])
  const currentConvId = ref('')

  const chat = reactive({
    model: 'DeepSeek-V3',
    temp: 0.3,
    topk: 5,
    degraded: false,
    streaming: false,
    metrics: { ...CHAT_METRICS },
    messages: [
      { role: 'user', text: '公司差旅报销标准里，一线城市的住宿上限是多少？跨部门审批怎么走？', done: true },
      { role: 'ai', text: CHAT_ANSWER, cites: [], done: true },
    ] as ChatMsg[],
  })

  const docs = ref<DocItem[]>(DOCS.map(d => ({ ...d })))
  const docsSource = ref<ApiDoc[]>([])
  let pollTimer: number | undefined

  const STAGE_LABEL = ['排队中', '解析中', '切分中', '向量化', '入库中', '就绪']

  function toDocItem(d: ApiDoc): DocItem {
    const st = d.status === 'failed' ? '解析失败' : (STAGE_LABEL[d.stage] ?? '就绪')
    return {
      n: d.name,
      t: 'Acme 研发中心',
      s: d.sizeBytes > 1024 * 1024 ? `${(d.sizeBytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(d.sizeBytes / 1024))} KB`,
      chunks: d.chunks,
      st,
      stage: d.stage,
      idx: `idx_${d.id.slice(0, 8)}`,
      acl: d.acl,
    }
  }

  /** 拉文档列表；有任务在跑就每 1.2s 轮询一次。 */
  async function loadDocuments(): Promise<void> {
    try {
      const res = await listDocuments()
      docsSource.value = res.documents
      docs.value = res.documents.map(toDocItem)

      const busy = res.documents.some(d => d.stage > 0 && d.stage < 5 && d.status !== 'failed')
      if (busy && !pollTimer) {
        pollTimer = window.setInterval(() => void loadDocuments(), 1200)
      } else if (!busy && pollTimer) {
        window.clearInterval(pollTimer)
        pollTimer = undefined
      }
    } catch (err) {
      toast(`加载文档失败：${err instanceof Error ? err.message : err}`, 'danger')
    }
  }

  async function uploadDoc(file: File): Promise<void> {
    try {
      const doc = await uploadDocument(file)
      toast(`已上传「${doc.name}」，ETL 处理中…`, 'ok')
      await loadDocuments()
    } catch (err) {
      toast(`上传失败：${err instanceof Error ? err.message : err}`, 'danger')
    }
  }

  async function retryDoc(id: string): Promise<void> {
    try {
      await retryDocAPI(id)
      toast('已重新加入 ETL 队列', 'ok')
      await loadDocuments()
    } catch (err) {
      toast(`重试失败：${err instanceof Error ? err.message : err}`, 'danger')
    }
  }
  const etl = reactive({ running: false, idx: -1, stage: 0 })

  const retrievalMode = ref<'bm25' | 'vector' | 'hybrid'>('hybrid')
  const retrievalTopK = ref(5)
  const retrievalThreshold = ref(0.72)

  const agent = reactive({
    running: false,
    task: '一线城市住宿上限是多少？帮我算一下出差 3 晚最多能报多少',
    steps: [] as Array<{
      index: number; kind: 'thought' | 'action' | 'observation' | 'final'
      content?: string; tool?: string; input?: string; durationMs?: number; ok: boolean
    }>,
    grounded: null as boolean | null,
    unverified: [] as string[],
    tools: [] as Array<{ name: string; desc: string; spec: string }>,
  })

  const drill = ref(false)
  const evalRunning = ref(false)
  const evalDone = ref(false)
  const backupRunning = ref(false)
  const restoreDone = ref(false)

  const toasts = ref<Toast[]>([])
  const cmdkOpen = ref(false)
  const drawer = reactive({ open: false, title: '详情', body: '' })

  const roleName = computed(() => ROLE_NAME[role.value] ?? role.value)
  const allowedViews = computed<string[] | null>(() => ROLE_VIEWS[role.value] ?? null)

  function visible(k: string): boolean {
    const allow = allowedViews.value
    return !allow || allow.includes(k)
  }

  function toast(text: string, kind: Toast['kind'] = 'info'): void {
    const id = ++toastSeq
    toasts.value.push({ id, text, kind })
    window.setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 2600)
  }

  function toggle(key: string): void {
    switches[key] = !switches[key]
  }

  function openDrawer(title: string, body: string): void {
    drawer.title = title
    drawer.body = body
    drawer.open = true
  }

  function closeDrawer(): void {
    drawer.open = false
  }

  function toChatMsg(m: ApiMessage): ChatMsg {
    return {
      role: m.role === 'user' ? 'user' : 'ai',
      text: m.content,
      done: true,
      cites: [],
    }
  }

  /** 拉会话列表，默认选中最近一条。 */
  async function loadConversations(): Promise<void> {
    try {
      const { conversations } = await listConversations()
      convos.value = conversations
      if (!currentConvId.value && conversations.length > 0) {
        await selectConversation(conversations[0].id)
      }
    } catch (err) {
      toast(`加载会话失败：${err instanceof Error ? err.message : err}`, 'danger')
    }
  }

  async function selectConversation(id: string): Promise<void> {
    currentConvId.value = id
    try {
      const conv = await getConversation(id)
      chat.messages = conv.messages.map(toChatMsg)
    } catch (err) {
      toast(`加载消息失败：${err instanceof Error ? err.message : err}`, 'danger')
    }
  }

  async function newConversation(): Promise<void> {
    try {
      const conv = await createConversation()
      convos.value.unshift(conv)
      currentConvId.value = conv.id
      chat.messages = []
    } catch (err) {
      toast(`新建会话失败：${err instanceof Error ? err.message : err}`, 'danger')
    }
  }

  /** 真实流式调用 /api/chat：边收边渲染，服务端落库。 */
  function send(text: string): void {
    const content = text.trim()
    if (!content || chat.streaming) return

    chat.messages.push({ role: 'user', text: content, done: true })
    chat.messages.push({ role: 'ai', text: '', cites: [], done: false })
    // 必须取数组里的响应式代理：直接改 push 进去的原始对象不会触发视图更新
    const msg = chat.messages[chat.messages.length - 1]
    chat.streaming = true

    const controller = new AbortController()
    abortStream = controller

    void (async () => {
      try {
        const reply = await chatStreamAPI(
          currentConvId.value,
          content,
          delta => {
            msg.text += delta
          },
          controller.signal,
        )
        currentConvId.value = reply.conversationId
        if (reply.cites?.length) msg.cites = reply.cites

        chat.metrics.pt = reply.usage.prompt
        chat.metrics.ct = reply.usage.completion
        chat.metrics.ttft = `${(reply.ttftMs / 1000).toFixed(2)}s`
        chat.metrics.total = `${(reply.latencyMs / 1000).toFixed(2)}s`
        chat.metrics.cost = `¥${(
          (reply.usage.prompt / 1e6) * 0.14 +
          (reply.usage.completion / 1e6) * 0.28
        ).toFixed(4)}`

        await loadConversations()
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          msg.text += '\n\n（已停止生成）'
        } else {
          msg.text = `请求失败：${err instanceof Error ? err.message : String(err)}`
          toast(msg.text, 'danger')
        }
      } finally {
        msg.done = true
        chat.streaming = false
        abortStream = null
      }
    })()
  }

  /** 停止生成：中断请求，服务端会保存已生成的部分。 */
  function stop(): void {
    abortStream?.abort()
  }

  function simulateUpload(): void {
    if (etl.running) return
    etl.running = true
    etl.stage = 0
    const timer = window.setInterval(() => {
      etl.stage += 1
      if (etl.stage >= 5) {
        window.clearInterval(timer)
        etl.running = false
      }
    }, 900)
  }

  /** 真实跑一次 ReAct 循环（后端调模型 + 工具）。 */
  async function runAgent(task: string): Promise<void> {
    if (agent.running) return
    agent.running = true
    agent.task = task
    agent.steps = []
    agent.grounded = null

    try {
      const res = await runAgentAPI(task, 2)
      agent.steps = res.steps
      agent.grounded = res.grounded
      agent.unverified = res.unverified ?? []
      agent.tools = res.tools
      if (!res.grounded) {
        toast(`回答里有 ${agent.unverified.length} 个数字在资料中找不到出处`, 'warn')
      }
    } catch (err) {
      toast(`Agent 运行失败：${err instanceof Error ? err.message : err}`, 'danger')
    } finally {
      agent.running = false
    }
  }

  /** 真实跑一次版本回归（后端对每个版本跑 Golden Set）。 */
  async function runEval(version = ''): Promise<void> {
    if (evalRunning.value) return
    evalRunning.value = true
    evalDone.value = false
    try {
      const res = await runEvalAPI(version)
      const blocked = res.results.filter(r => r.gate === 'blocked')
      evalDone.value = true
      if (blocked.length > 0) {
        toast(`${blocked.map(b => b.version).join('、')} 未达基线 ${res.baseline}，闸门已阻断`, 'warn')
      }
      await loadEvalVersions()
    } catch (err) {
      toast(`回归失败：${err instanceof Error ? err.message : err}`, 'danger')
    } finally {
      evalRunning.value = false
    }
  }

  const promptVersions = ref<PromptVersionInfo[]>([])
  const goldenSet = ref<Array<{ query: string; doc: string }>>([])
  const evalCases = ref(0)
  const evalBaseline = ref(0.8)

  async function loadEvalVersions(): Promise<void> {
    try {
      const res = await evalVersionsAPI()
      promptVersions.value = res.versions
      evalCases.value = res.cases
      evalBaseline.value = res.baseline
      goldenSet.value = res.goldenSet ?? []
    } catch (err) {
      toast(`读取版本失败：${err instanceof Error ? err.message : err}`, 'danger')
    }
  }

  function toggleCheck(id: string): void {
    checks[id] = !checks[id]
  }

  const doneChecks = computed(() => Object.values(checks).filter(Boolean).length)

  return {
    role, env, tabs, switches, checks, chat, docs, docsSource, loadDocuments, uploadDoc, retryDoc, etl,
    promptVersions, evalCases, evalBaseline, goldenSet, loadEvalVersions,
    convos, currentConvId, loadConversations, selectConversation, newConversation,
    retrievalMode, retrievalTopK, retrievalThreshold,
    agent, drill, evalRunning, evalDone, backupRunning, restoreDone,
    toasts, cmdkOpen, drawer,
    roleName, allowedViews, visible, toast, toggle, openDrawer, closeDrawer,
    send, stop, simulateUpload, runAgent, runEval, toggleCheck, doneChecks,
  }
})
