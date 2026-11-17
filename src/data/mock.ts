/* 原型中的样例数据集中在这里，接后端时整份替换为接口响应即可。 */

export type NavItem = { k: string; n: string; i: string; key?: string }
export type NavGroup = { g: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  { g: '工作台 WORKSPACE', items: [
    { k: 'overview', n: '控制台总览', i: '◫', key: '1' },
    { k: 'chat', n: '智能问答', i: '◆', key: '2' } ] },
  { g: '知识工程 KNOWLEDGE', items: [
    { k: 'docs', n: '知识库 / 文档 ETL', i: '▤', key: '3' },
    { k: 'retrieval', n: '检索调试台', i: '⌕', key: '4' } ] },
  { g: '智能体 AGENT', items: [
    { k: 'agent', n: 'Agent 工作台', i: '✦', key: '5' } ] },
  { g: '平台治理 PLATFORM', items: [
    { k: 'gateway', n: 'AI 网关', i: '⇄', key: '6' },
    { k: 'finops', n: '成本与用量', i: '¥', key: '7' },
    { k: 'observability', n: '可观测与审计', i: '◉', key: '8' },
    { k: 'eval', n: '评测中心', i: '✓', key: '9' },
    { k: 'security', n: '安全与租户', i: '⛨' },
    { k: 'ops', n: '部署运维', i: '⚙' } ] },
  { g: '交付说明 DESIGN', items: [
    { k: 'design', n: '信息架构与设计规范', i: '◈' } ] },
]

export const ALL_VIEWS = NAV.flatMap(g => g.items.map(i => i.k))

export const ROLE_VIEWS: Record<string, string[] | null> = {
  ops: null,
  tenant: ['overview', 'chat', 'docs', 'finops', 'security', 'eval', 'design'],
  kb: ['overview', 'chat', 'docs', 'retrieval', 'eval', 'design'],
  user: ['overview', 'chat', 'design'],
}

export const ROLE_NAME: Record<string, string> = {
  ops: '运维 / 开发者',
  tenant: '租户管理员',
  kb: '知识库管理员',
  user: '终端用户',
}

export const WEEK: Record<string, string> = {
  overview: 'W3', chat: 'W1/W3', docs: 'W1', retrieval: 'W1/W3', agent: 'W2',
  gateway: 'W2', finops: 'W2', observability: 'W3', eval: 'W3', security: 'W3',
  ops: 'W4', design: 'W3',
}

export const PAGE_META: Record<string, { title: string; sub: string; fr: string[] }> = {
  overview: { title: '控制台总览', sub: '一眼看清健康、成本、质量与交付进度 —— 面向运维 / 开发者的着陆页', fr: ['FR-15', 'FR-04', 'FR-09', 'FR-19'] },
  chat: { title: '智能问答', sub: 'SSE 逐字渲染、引用溯源、单次调用全量下钻 —— 演示主链路的起点', fr: ['FR-03', 'FR-08', 'FR-12', 'FR-13', 'FR-18'] },
  docs: { title: '知识库 / 文档 ETL', sub: '把「垃圾进垃圾出」变成可观测的五阶段流水线，失败必须能重试', fr: ['FR-06', 'FR-07', 'FR-17'] },
  retrieval: { title: '检索调试台', sub: '同一查询对比三档策略，把「检索不准」从玄学变成可量化的工程问题', fr: ['FR-08', 'FR-09'] },
  agent: { title: 'Agent 工作台', sub: 'ReAct 轨迹、工具注册表、MCP 连接与循环保护全部可视化', fr: ['FR-10', 'FR-11', 'FR-12'] },
  gateway: { title: 'AI 网关', sub: 'Provider 抽象、路由熔断、限流与语义缓存 —— 10 年后端经验的主场', fr: ['FR-01', 'FR-02', 'FR-05'] },
  finops: { title: '成本与用量', sub: '每次调用可归因，日预算可告警，超预算按优先级降级而不是直接截断', fr: ['FR-04', 'FR-17'] },
  observability: { title: '可观测与审计', sub: '指标、Trace、告警、审计四位一体，能按 trace_id 还原一次完整问答', fr: ['FR-15', 'FR-16'] },
  eval: { title: '评测中心', sub: '没有 Golden Set 和 CI 闸门，任何「优化」都只是感觉', fr: ['FR-09', 'FR-13'] },
  security: { title: '安全与租户', sub: '注入防护、RBAC、租户隔离 —— 越权 0 容忍', fr: ['FR-14', 'FR-17'] },
  ops: { title: '部署运维', sub: 'Compose 一键起、备份可恢复、故障有 Runbook、上线有检查单', fr: ['FR-19'] },
  design: { title: '信息架构与设计规范', sub: '12 个页面 ↔ 19 条 FR 的可追溯矩阵、设计 Token 与组件状态', fr: ['FR-18'] },
}

export let CITES = [
  { n: '差旅与费用报销管理办法_v3.2.pdf', p: 'P7 · 第 4.2 条', sc: 0.91, txt: '一线城市指北京、上海、广州、深圳，住宿费上限为每人每晚 600 元；其余城市 400 元。超出部分原则上不予报销。' },
  { n: '差旅与费用报销管理办法_v3.2.pdf', p: 'P12 · 第 6.1 条', sc: 0.87, txt: '跨部门出差须由发起部门主管及费用归属部门主管双签确认，单笔超过 5000 元的报销追加财务复核节点。' },
  { n: '差旅与费用报销管理办法_v3.2.pdf', p: 'P9 · 第 4.5 条', sc: 0.79, txt: '因展会、旺季等客观原因导致住宿价格显著上浮的，可提交特批单，经费用归属部门总监批准后上浮幅度不超过 30%。' },
]

export let RETRIEVAL: Record<string, { n: string; s: string; raw: string; rr: string }[]> = {
  bm25: [
    { n: '差旅与费用报销管理办法_v3.2.pdf', s: '…一线城市住宿费上限为每人每晚 600 元…', raw: '8.42', rr: '—' },
    { n: '员工入职指引_v2026.pdf', s: '…一线城市补贴标准见差旅办法…', raw: '5.13', rr: '—' },
    { n: '2026-Q3 架构评审纪要.docx', s: '…预算与成本归因方案…', raw: '2.87', rr: '—' },
  ],
  vector: [
    { n: '差旅与费用报销管理办法_v3.2.pdf', s: '…旺季住宿价格上浮特批不超过 30%…', raw: '0.89', rr: '—' },
    { n: '差旅与费用报销管理办法_v3.2.pdf', s: '…跨部门费用确认节点、双签…', raw: '0.84', rr: '—' },
    { n: '研发环境接入规范.md', s: '…审批流接入内部系统…', raw: '0.61', rr: '—' },
  ],
  hybrid: [
    { n: '差旅与费用报销管理办法_v3.2.pdf', s: '…一线城市（北上广深）住宿上限 600 元/晚…', raw: '0.93', rr: '0.96' },
    { n: '差旅与费用报销管理办法_v3.2.pdf', s: '…跨部门出差双签，超 5000 元财务复核…', raw: '0.88', rr: '0.91' },
    { n: '差旅与费用报销管理办法_v3.2.pdf', s: '…旺季特批上浮不超过 30%…', raw: '0.81', rr: '0.84' },
  ],
}

export let AGENT_STEPS = [
  { t: 'Thought', b: '用户问「本季度差旅预算还剩多少，超了会怎样」。需要先查知识库拿到预算制度，再查用量接口拿实时数字。', c: '', tag: 'step 1' },
  { t: 'Action · tool=kb_search', b: '<span class="mono">{ "query": "Q3 差旅预算额度 超额处理", "top_k": 5 }</span>', c: 'cyan', tag: '' },
  { t: 'Observation', b: '召回 3 个片段：《差旅办法 v3.2》P14「季度预算 ¥120,000」、P15「超额 80% 预警、100% 冻结新增申请」。', c: 'ok', tag: '' },
  { t: 'Thought', b: '还需实时用量。调用 usage_query 工具，按 tenant=acme-rd 查询。', c: '', tag: 'step 4' },
  { t: 'Action · tool=usage_query', b: '<span class="mono">{ "tenant": "acme-rd", "period": "2026Q3" }</span>', c: 'cyan', tag: '' },
  { t: 'Observation', b: '已用 ¥98,400 / ¥120,000（82.0%），状态：预警已触发，超额自动降级到本地模型。', c: 'ok', tag: '' },
  { t: 'Final', b: '本季度差旅预算剩余 ¥21,600（已用 82%）。已越过 80% 预警线，新增申请需总监审批；若达 100% 系统冻结新增申请，并把问答调用降级到本地 qwen2:7b 以控成本。', c: 'purple', tag: '完成 · 6 步' },
]

export let AUDIT = [
  ['19:42:08', 'acme-rd', 'tang.lx', 'tr_8f3c21a9', 'prompt_v3', 'DeepSeek-V3', '1,534', '成功', '只追加'],
  ['19:41:55', 'acme-rd', 'demo.user', 'tr_2b91cc04', 'prompt_v3', 'qwen2:7b', '986', '降级', '只追加'],
  ['19:40:31', 'acme-rd', 'demo.user', 'tr_77de120a', 'prompt_v3', 'DeepSeek-V3', '1,102', '成功', '只追加'],
  ['19:38:02', 'beta-ops', 'ops.bot', 'tr_0a45fe31', 'prompt_v2', 'DeepSeek-V3', '2,410', '注入拦截', '只追加'],
  ['19:35:47', 'acme-rd', 'hr.zhang', 'tr_c19b8a52', 'prompt_v3', 'DeepSeek-V3', '744', '成功', '只追加'],
]

export let RUNBOOKS = [
  ['成本异常', '日成本 > 阈值 120%', '按租户降级到本地模型 → 冻结高耗会话 → 查 trace 归因', 'P07 / P08', '已演练'],
  ['供应商故障', '主 Provider 连续 5 次失败', '熔断 OPEN → 30s 内切备用 → 恢复后半开探测', 'P06 / P08', '已演练'],
  ['质量退化', 'Faithfulness 下降 > 3pt', 'CI 闸门阻断 → 回滚 Prompt 版本 → 坏例入 Golden Set', 'P09', '已演练'],
  ['SSE 中断', '断连率 > 2%', 'Last-Event-ID 续传 → 检查代理缓冲 → 心跳保活', 'P02 / P11', '已演练'],
  ['索引污染', '召回出现跨租户片段', '切回上一版索引 → 校验 namespace → 全量重建', 'P03 / P10', '已演练'],
]

export let CHECKS: [string, string][] = [
  ['AC-19-01', 'Dockerfile 多阶段构建且非 root 运行'], ['AC-19-02', 'Compose 在干净主机一键拉起全部服务'],
  ['AC-19-03', 'Caddy HTTPS 证书与 SSE 缓冲参数已配置'], ['AC-19-04', '/healthz /readyz /metrics 均可访问'],
  ['AC-19-05', '密钥仅来自环境变量，仓库无明文'], ['AC-19-06', 'pgvector 定时备份任务已启用'],
  ['AC-19-07', '备份恢复演练在干净数据卷通过'], ['AC-19-08', '四类告警规则均已配置并演练'],
  ['AC-19-09', 'Golden Set ≥ 100 条且 CI 闸门生效'], ['AC-19-10', '注入红队用例 100% 拦截'],
  ['AC-19-11', '跨租户越权回归用例通过'], ['AC-19-12', 'Trace 抽样 100% 覆盖且 Span 属性齐全'],
  ['AC-19-13', 'vegeta 压测报告含 SSE 并发结论'], ['AC-19-14', 'TTFT P95 满足 NFR-01 基线'],
  ['AC-19-15', '滚动更新不中断既有 SSE 流'], ['AC-19-16', '日志脱敏规则已生效'],
  ['AC-19-17', '镜像扫描无高危漏洞'], ['AC-19-18', '数据保留 TTL 与审计只追加已配置'],
  ['AC-19-19', '断网时本地模型仍可完成问答'], ['AC-19-20', 'README 可被第三人复现'],
  ['AC-19-21', '演示地址公网可访问且租户隔离'], ['AC-19-22', '五类故障 Runbook 有演练记录'],
]

export let COLORS = [
  ['--bg', '#F6F7FB', '页面底色'], ['--surface', '#FFFFFF', '卡片 / 侧栏'], ['--line', '#E5E9F2', '边框'],
  ['--ink', '#111827', '主文本'], ['--ink-2', '#475569', '次要文本'], ['--ink-3', '#94A3B8', '辅助文本'],
  ['--brand', '#3452D8', '主操作 / 选中'], ['--brand-soft', '#EEF2FF', '主色浅底'],
  ['--ok', '#0E9F6E', '健康 / 通过'], ['--warn', '#E79009', '降级 / 告警'],
  ['--danger', '#DC3C43', '失败 / 熔断'], ['--cyan', '#0891B2', '检索 / Trace'], ['--purple', '#7C4DD8', 'Agent / 高亮'],
]

export interface DocItem {
  n: string; t: string; s: string; chunks: number; st: string; stage: number; idx: string; acl: string; err?: string
}

export let DOCS: DocItem[] = [
  { n: '差旅与费用报销管理办法_v3.2.pdf', t: 'Acme 研发中心', s: '2.4 MB', chunks: 86, st: '就绪', stage: 5, idx: 'idx_20261109_01', acl: '全员可见' },
  { n: '研发环境接入规范.md', t: 'Acme 研发中心', s: '186 KB', chunks: 42, st: '就绪', stage: 5, idx: 'idx_20261109_01', acl: '研发组' },
  { n: '2026-Q3 架构评审纪要.docx', t: 'Acme 研发中心', s: '1.1 MB', chunks: 57, st: '向量化', stage: 4, idx: 'idx_20261109_01', acl: '研发组' },
  { n: '供应商安全合规手册.pdf', t: 'Acme 研发中心', s: '4.8 MB', chunks: 0, st: '解析失败', stage: 2, idx: '—', acl: '合规组', err: 'PDF 为扫描件，无文本层（需 OCR，当前 Won\'t）' },
  { n: '员工入职指引_v2026.pdf', t: 'Acme 研发中心', s: '920 KB', chunks: 31, st: '就绪', stage: 5, idx: 'idx_20261108_02', acl: '全员可见' },
]

export interface Provider {
  n: string; type: string; w: number; st: string; p95: string; c: string
}

export let PROVIDERS: Provider[] = [
  { n: 'DeepSeek-V3', type: '云端 API', w: 60, st: '健康', p95: '1.18s', c: 'ok' },
  { n: 'qwen2:7b (Ollama)', type: '本地推理', w: 25, st: '健康', p95: '2.94s', c: 'ok' },
  { n: 'OpenAI 兼容端点', type: '云端 API', w: 10, st: '备用', p95: '1.42s', c: 'gray' },
  { n: '通义千问', type: '云端 API', w: 5, st: '熔断', p95: '—', c: 'danger' },
]

export let CONVERSATIONS = [
  { t: '差旅报销标准与跨部门审批', s: '刚刚 · 6 个引用', on: true },
  { t: '研发环境 VPN 接入步骤', s: '今天 18:20 · 3 个引用', on: false },
  { t: 'Q3 架构评审结论摘要', s: '昨天 · 8 个引用', on: false },
  { t: 'Prompt 注入测试用例复盘', s: '11-07 · 2 个引用', on: false },
]

export const CHAT_ANSWER =
  '根据《差旅与费用报销管理办法 v3.2》：一线城市（北京、上海、广州、深圳）住宿上限为 ¥600 / 晚；其他城市 ¥400 / 晚 [1]。\n\n' +
  '跨部门出差需由发起部门主管与费用归属部门主管双签，系统里走「跨部门费用确认」节点，超过 ¥5,000 还需财务复核 [2]。若遇展会等旺季，可提交特批单，由费用归属部门总监审批后上浮不超过 30% [3]。'

export let CHAT_METRICS = { ttft: '0.84s', total: '2.31s', pt: 1248, ct: 286, cost: '¥0.042', cache: '未命中', chunks: 6, trace: 'tr_8f3c21a9' }

/**
 * 用后端 /api/bootstrap 的返回替换模块级数据。
 *
 * 说明：这是「先跑通数据链路」的最小改动——所有页面在 setup 时读取这些绑定，
 * 因此在 app.mount 之前调用即可全局生效。下一步会改成每页一个 Pinia store。
 */

// —— 其余页面的数据（hydrate 时由 /api/bootstrap 填充）——
export let OVERVIEW_KPIS: any[] = []
export let OVERVIEW_SERVICES: any[] = []
export let OVERVIEW_ALERTS: any[] = []
export let OVERVIEW_ROADMAP: any[] = []
export let OBS_CHARTS: any[] = []
export let OBS_RULES: any[] = []
export let OBS_TRACES: any[] = []
export let OPS_SERVICES: any[] = []
export let RETRIEVAL_METRICS: Record<string, any[]> = {}
export let FINOPS_SUMMARY: any[] = []
export let FINOPS_MODELS: any[] = []
export let FINOPS_TOP: any[] = []
export let FINOPS_QUOTAS: any[] = []
export let EVAL_KPIS: any[] = []
export let EVAL_VERSIONS: any[] = []
export let EVAL_CASES: any[] = []
export let SEC_INJECTIONS: any[] = []
export let SEC_MEMBERS: any[] = []
export let SEC_ISOLATION: any[] = []

export function hydrateFromApi(payload: Record<string, any>): void {
  const docs = payload?.docs?.items
  if (Array.isArray(docs) && docs.length) DOCS = docs as DocItem[]

  const gw = payload?.gateway?.providers
  if (Array.isArray(gw) && gw.length) PROVIDERS = gw as Provider[]

  const agentSteps = payload?.agent?.steps
  if (Array.isArray(agentSteps) && agentSteps.length) AGENT_STEPS = agentSteps

  const obs = payload?.observability
  if (Array.isArray(obs?.audit) && obs.audit.length) AUDIT = obs.audit

  const opsData = payload?.ops
  if (Array.isArray(opsData?.runbooks) && opsData.runbooks.length) RUNBOOKS = opsData.runbooks
  if (Array.isArray(opsData?.checks) && opsData.checks.length) CHECKS = opsData.checks

  const design = payload?.design
  if (Array.isArray(design?.colors) && design.colors.length) COLORS = design.colors

  const obsFull = payload?.observability
  if (Array.isArray(obs?.audit) && obs.audit.length) AUDIT = obs.audit
  if (Array.isArray(obsFull?.charts) && obs.charts.length) OBS_CHARTS = obs.charts
  if (Array.isArray(obsFull?.rules) && obs.rules.length) OBS_RULES = obs.rules
  if (Array.isArray(obsFull?.traces) && obs.traces.length) OBS_TRACES = obs.traces

  const ov = payload?.overview
  if (Array.isArray(ov?.kpis) && ov.kpis.length) OVERVIEW_KPIS = ov.kpis
  if (Array.isArray(ov?.services) && ov.services.length) OVERVIEW_SERVICES = ov.services
  if (Array.isArray(ov?.alerts) && ov.alerts.length) OVERVIEW_ALERTS = ov.alerts
  if (Array.isArray(ov?.roadmap) && ov.roadmap.length) OVERVIEW_ROADMAP = ov.roadmap

  const fin = payload?.finops
  if (Array.isArray(fin?.summary) && fin.summary.length) FINOPS_SUMMARY = fin.summary
  if (Array.isArray(fin?.models) && fin.models.length) FINOPS_MODELS = fin.models
  if (Array.isArray(fin?.top) && fin.top.length) FINOPS_TOP = fin.top
  if (Array.isArray(fin?.quotas) && fin.quotas.length) FINOPS_QUOTAS = fin.quotas

  const ev = payload?.eval
  if (Array.isArray(ev?.kpis) && ev.kpis.length) EVAL_KPIS = ev.kpis
  if (Array.isArray(ev?.versions) && ev.versions.length) EVAL_VERSIONS = ev.versions
  if (Array.isArray(ev?.cases) && ev.cases.length) EVAL_CASES = ev.cases

  const sec = payload?.security
  if (Array.isArray(sec?.injections) && sec.injections.length) SEC_INJECTIONS = sec.injections
  if (Array.isArray(sec?.members) && sec.members.length) SEC_MEMBERS = sec.members
  if (Array.isArray(sec?.isolation) && sec.isolation.length) SEC_ISOLATION = sec.isolation

  const opsData2 = payload?.ops
  if (Array.isArray(opsData2?.services) && opsData2.services.length) OPS_SERVICES = opsData2.services

  const ret = payload?.retrieval
  if (ret?.results) RETRIEVAL = ret.results
  if (ret?.metrics) RETRIEVAL_METRICS = ret.metrics

  const chatData = payload?.chat
  if (Array.isArray(chatData?.conversations) && chatData.conversations.length) CONVERSATIONS = chatData.conversations
  if (chatData?.metrics) CHAT_METRICS = chatData.metrics
}
