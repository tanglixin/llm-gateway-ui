<script setup lang="ts">
import { computed } from 'vue'
import PageHead from '@/components/PageHead.vue'
import UiBanner from '@/components/ui/UiBanner.vue'
import UiCard from '@/components/ui/Card.vue'
import UiCode from '@/components/ui/UiCode.vue'
import UiKpi from '@/components/ui/UiKpi.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiTabs from '@/components/ui/UiTabs.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import { onMounted, ref, watch } from 'vue'
import { retrievalSearch, evaluateRetrieval, type ModeMetric } from '@/api/client'
import { PAGE_META, WEEK } from '@/data/mock'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.retrieval
const modes = [
  { k: 'bm25', label: 'BM25 稀疏', hint: '关键词精确、可解释' },
  { k: 'vector', label: '向量稠密', hint: '语义相近、召回广' },
  { k: 'hybrid', label: '混合 + Rerank', hint: '生产默认，召回后重排' },
]

const query = ref('一线城市住宿上限是多少？跨部门审批怎么走？')
const hits = ref<Array<{ id: string; name: string; idx: number; content: string; score: number }>>([])
const took = ref(0)
const loading = ref(false)

async function runSearch(): Promise<void> {
  loading.value = true
  try {
    const res = await retrievalSearch({
      query: query.value,
      mode: store.retrievalMode,
      topK: store.retrievalTopK,
      threshold: store.retrievalThreshold,
    })
    hits.value = res.hits as typeof hits.value
    took.value = (res as any).tookMs ?? 0
  } catch (err) {
    store.toast(`检索失败：${err instanceof Error ? err.message : err}`, 'danger')
  } finally {
    loading.value = false
  }
}

const evalModes = ref<ModeMetric[]>([])
const evalCases = ref(0)
const embedMs = ref(0)
const evaluating = ref(false)

async function loadMetrics(): Promise<void> {
  evaluating.value = true
  try {
    const res = await evaluateRetrieval()
    evalModes.value = res.modes
    evalCases.value = res.cases
    embedMs.value = res.embedAvgMs
  } catch (err) {
    store.toast(`评测失败：${err instanceof Error ? err.message : err}`, 'danger')
  } finally {
    evaluating.value = false
  }
}

// 当前模式的真实指标
const currentMetric = computed(() => evalModes.value.find(m => m.mode === store.retrievalMode))

// 三种模式的分数不可比：BM25 是无上界词频分，向量是余弦，混合是 RRF
function scoreLabel(s: number): string {
  if (store.retrievalMode === 'bm25') return `bm25 ${s.toFixed(2)}`
  if (store.retrievalMode === 'hybrid') return `rrf ${s.toFixed(4)}`
  return `cosine ${s.toFixed(3)}`
}

const metrics = computed(() => {
  const m = currentMetric.value
  if (!m) {
    return [['Recall@5', '—', 'gray'], ['MRR', '—', 'gray'], ['NDCG@5', '—', 'gray'], ['检索耗时', '—', 'gray']] as [string, string, string][]
  }
  const color = (v: number) => (v >= 0.9 ? 'ok' : v >= 0.75 ? 'warn' : 'danger')
  return [
    ['Recall@5', m.recall.toFixed(2), color(m.recall)],
    ['MRR', m.mrr.toFixed(2), color(m.mrr)],
    ['NDCG@5', m.ndcg.toFixed(2), color(m.ndcg)],
    ['检索耗时', `${m.avgMs}ms`, 'cyan'],
  ] as [string, string, string][]
})

const compareRows = computed(() => {
  const hint: Record<string, string> = {
    bm25: '编号 / 专有名词精确的查询',
    vector: '口语化、同义表述多的查询',
    hybrid: 'RRF 融合两路，召回优先',
  }
  const rows = evalModes.value.map(m => [
    m.mode === store.retrievalMode ? `<b>${m.label}</b>` : m.label,
    m.recall.toFixed(2),
    m.mrr.toFixed(2),
    m.ndcg.toFixed(2),
    `${m.avgMs} ms`,
    hint[m.mode] ?? '',
  ])
  return rows
})

onMounted(() => {
  void runSearch()
  void loadMetrics()
})

// 切换模式/参数后自动重跑
watch(() => store.retrievalMode, () => void runSearch())
watch(() => store.retrievalTopK, () => void runSearch())
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.retrieval" />

  <UiBanner type="info" icon="⌕">
    <b>为什么混合检索更好</b>：BM25 保住「¥600」「P7」这类精确词，向量检索补上「住宿上限」与「每晚房费」的语义鸿沟；
    召回 Top-20 后交给 Rerank 取 Top-{{ store.retrievalTopK }}，可显著降低上下文噪声。
  </UiBanner>

  <div class="grid g32">
    <UiCard title="查询与参数" desc="改动后下一次检索生效，并写入审计">
      <div class="field-l">查询语句</div>
      <textarea v-model="query" class="inp" rows="3" />
      <div class="grid g2 mt16">
        <div>
          <div class="field-l">Top-K <span class="mono">{{ store.retrievalTopK }}</span></div>
          <input v-model.number="store.retrievalTopK" type="range" min="1" max="10" />
        </div>
        <div>
          <div class="field-l">相似度阈值 <span class="mono">{{ store.retrievalThreshold }}</span></div>
          <input v-model.number="store.retrievalThreshold" type="range" min="50" max="95" step="1" />
        </div>
      </div>
      <div class="row mt16">
        <button class="btn primary" :disabled="loading" @click="runSearch">
          {{ loading ? '检索中…' : '执行检索' }}
        </button>
        <button class="btn" @click="store.toast('已加入 Golden Set（演示）')">加入 Golden Set</button>
        <button class="btn sm" @click="$router.push('/eval')">去评测中心 →</button>
      </div>
      <div class="divider" />
      <UiTabs v-model="store.retrievalMode" :tabs="modes" />
      <div class="small muted">
        {{ modes.find(x => x.k === store.retrievalMode)?.hint }}。切换上方 Tab 可观察同一查询在不同策略下的片段与分数差异。
      </div>
      <div class="callout mt16" style="font-size: 11.5px">
        <span class="mono">POST /api/retrieval/search</span> · 返回片段、原始分数、重排分数、chunk_id 与 ACL 标签。
      </div>
    </UiCard>

    <UiCard title="检索结果" desc="展示来源 / 原始分数 / Rerank 分数">
      <div v-if="loading" class="small muted">检索中…</div>
      <div v-else-if="hits.length === 0" class="small muted">没有命中片段，换个问法试试</div>
      <div
        v-for="(d, i) in hits" :key="d.id"
        style="border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px"
        :style="{ background: i === 0 ? 'var(--brand-soft)' : '#fff' }"
      >
        <div class="spread">
          <span class="small strong">[{{ i + 1 }}] {{ d.name }}</span>
          <span class="row">
            <UiTag color="cyan">{{ scoreLabel(d.score) }}</UiTag>
          </span>
        </div>
        <div class="small mt8" style="color: var(--ink-2)">{{ d.content }}</div>
        <div class="tiny muted mt8 mono">chunk #{{ d.idx }} · {{ d.id.slice(0, 8) }} · nomic-embed-text 768d</div>
      </div>
      <div v-if="!loading && hits.length" class="small muted">
        {{ hits.length }} 个片段 · 耗时 {{ took }}ms · 来自 pgvector 余弦检索
      </div>
    </UiCard>
  </div>

  <div class="grid g4 mt16">
    <UiKpi v-for="m in metrics" :key="m[0]" :label="m[0]" :value="m[1]" :color="m[2]"
           :foot="m[0] === '检索耗时' ? `不含向量化（约 ${embedMs}ms）` : `Golden Set ${evalCases} 条`" />
  </div>

  <div class="mt16">
    <UiTable
      :heads="['策略', 'Recall@5', 'MRR', 'NDCG@5', '检索耗时', '适用判断']"
      :rows="compareRows"
    />
  </div>

  <div class="grid g2 mt16">
    <UiCard title="常见坑 → 工程解法" desc="面试高频">
      <UiTimeline :items="[
        { t: '召回不准', b: '先查 ETL 切片与 Embedding 版本，再查混合权重；不要第一反应换模型', c: 'warn' },
        { t: '上下文挤压', b: '限制 Top-K 与单 chunk token，超预算按相关性截断并记指标', c: 'warn' },
        { t: '重复信息', b: '按 doc_id + chunk 窗口做 MMR 去冗', c: 'ok' },
        { t: '噪声文档污染', b: 'Rerank + 相似度阈值 + 低分片段不进 Prompt', c: 'ok' },
      ]" />
    </UiCard>

    <UiCard title="与评测的闭环" desc="AC-09 / NFR-06">
      <div class="callout">
        调参时发现坏例 → 「加入 Golden Set」→ P09 触发回归 → CI 闸门判断 Faithfulness 是否低于基线 → 阻断合并。
        这保证了「优化」有证据，而不是凭感觉。
      </div>
      <UiCode class="mt12" text="POST /api/admin/eval&#10;  prompt_version: prompt_v3&#10;  golden_set: 128 cases&#10;  gate: faithfulness >= 0.89" />
    </UiCard>
  </div>
</template>
