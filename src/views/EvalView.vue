<script setup lang="ts">
import PageHead from '@/components/PageHead.vue'
import UiBanner from '@/components/ui/UiBanner.vue'
import UiBar from '@/components/ui/UiBar.vue'
import UiCard from '@/components/ui/Card.vue'
import UiCode from '@/components/ui/UiCode.vue'
import UiDonut from '@/components/ui/UiDonut.vue'
import UiInspectRow from '@/components/ui/UiInspectRow.vue'
import UiKpi from '@/components/ui/UiKpi.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import { computed, onMounted } from 'vue'
import { PAGE_META, WEEK } from '@/data/mock'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.eval

// 版本与指标全部来自后端真实回归
const versions = computed(() =>
  store.promptVersions.map(v => {
    const r = v.run
    const gate = r?.gate === 'passed'
      ? '<span class="tag ok">通过</span>'
      : r?.gate === 'blocked'
        ? '<span class="tag danger">阻断</span>'
        : '<span class="tag gray">未跑</span>'
    return [
      `<b>${v.name}</b>${v.isActive ? ' <span class="tag info">生效中</span>' : ''}`,
      v.description,
      r ? r.recall.toFixed(3) : '—',
      r ? r.mrr.toFixed(3) : '—',
      r ? r.ndcg.toFixed(3) : '—',
      gate,
    ]
  }),
)

const kpis = computed(() => {
  const blocked = store.promptVersions.filter(v => v.run?.gate === 'blocked').length
  const active = store.promptVersions.find(v => v.isActive)
  const passed = store.promptVersions.filter(v => v.run?.gate === 'passed').length
  return [
    { label: 'Golden Set', value: String(store.evalCases), unit: '条', foot: '内置检索评测样本', color: 'ok' },
    { label: '闸门基线', value: store.evalBaseline.toFixed(2), unit: '', foot: 'Recall@5 低于基线即阻断', color: 'cyan' },
    { label: '生效版本', value: active?.name ?? '—', unit: '', foot: active?.description ?? '', color: 'warn' },
    { label: '本次通过', value: `${passed}/${store.promptVersions.length}`, unit: '', foot: blocked > 0 ? `${blocked} 个版本被阻断` : '全部达标', color: blocked > 0 ? 'danger' : 'ok' },
  ]
})

onMounted(() => {
  void store.loadEvalVersions()
})

// 评测集本身也是真的：来自后端 search.GoldenSet
const cases = computed(() =>
  store.goldenSet.map((g, i) => [
    `<span class="mono">Q-${String(i + 1).padStart(3, '0')}</span>`,
    g.query,
    g.doc,
    '<span class="tag gray">检索命中</span>',
  ]),
)
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.eval" />

  <UiBanner v-if="store.evalDone" type="ok" icon="✓">
    <b>回归完成</b>：128 条 Golden Set，Faithfulness 91.4%（基线 89.0%），Answer Relevancy 0.90，
    Recall@5 0.93 → <b>CI 闸门通过</b>，允许合并 prompt_v3。
  </UiBanner>
  <UiBanner v-else type="info" icon="✓">
    <b>评测闸门</b>：Prompt / 切片 / 模型任一变更都必须跑回归，指标低于基线直接阻断合并（NFR-06）。
    点击「触发回归」观察流程。
  </UiBanner>

  <div class="grid g4">
    <UiKpi
      v-for="k in kpis" :key="k.label"
      :label="k.label" :value="k.value" :unit="k.unit" :foot="k.foot" :color="k.color"
    />
  </div>

  <div class="grid g32 mt16">
    <UiCard title="版本对比" desc="同一 Golden Set 上的三组实验">
      <UiTable :heads="['版本', '变更内容', 'Recall@5', 'MRR', 'NDCG@5', '闸门']" :rows="versions" />
      <div class="callout warn mt16" style="font-size: 11.5px">
        prompt_v4 为了省 140ms 去掉 Rerank，导致 Faithfulness 下降 <b>4.2pt</b>，闸门直接阻断合并 ——
        这是「有证据地拒绝优化」的典型故事。
      </div>
      <div class="row mt16">
        <button class="btn primary" :disabled="store.evalRunning" @click="store.runEval()">
          {{ store.evalRunning ? '回归运行中…' : '▶ 触发回归' }}
        </button>
        <button class="btn sm" @click="store.toast('评测报告已生成（演示）', 'ok')">下载报告</button>
        <button class="btn sm danger" @click="store.toast('已回滚到 prompt_v2（演示）', 'warn')">回滚到 v2</button>
      </div>
      <div v-if="store.evalRunning" class="mt16">
        <UiBar :pct="64" color="cyan" />
        <div class="small muted mt8">正在跑 128 条用例 · 82/128 完成…</div>
      </div>
    </UiCard>

    <UiCard title="评测维度" desc="FR-09 / AC-09">
      <UiDonut :pct="91" color="#0E9F6E" label="通过率" sub="128 条用例 · 116 通过" />
      <div class="divider" />
      <UiInspectRow k="召回指标" v="Recall@5 / MRR / NDCG@5" />
      <UiInspectRow k="答案质量" v="Faithfulness / Answer Relevancy" />
      <UiInspectRow k="工程指标" v="TTFT / 单请求成本 / 缓存命中" />
      <UiInspectRow k="回归触发" v="Prompt / 切片 / 模型任一变更" />
      <UiInspectRow k="失败处理" v="坏例自动入 Golden Set" />
      <div class="callout mt16" style="font-size: 11.5px">
        「怎么证明优化有效？」—— 用同一份 Golden Set、同一套指标、CI 里跑，而不是拿一两个 demo 问题手动试。
      </div>
    </UiCard>
  </div>

  <div class="mt16">
    <UiTable :heads="['用例 ID', '问题', '得分', '结果']" :rows="cases">
      <template #tools><span class="small muted">用例下钻 · 点「加入 Golden Set」的坏例会落在这里</span></template>
    </UiTable>
  </div>

  <div class="grid g2 mt16">
    <UiCard title="CI 评测闸门" desc=".github/workflows/ci.yml 阶段">
      <UiTimeline :items="[
        { t: '① go test ./...', b: '单测与模块回归', c: 'ok' },
        { t: '② eval gate', b: '128 条 Golden Set，指标低于基线则 exit 1', c: 'warn' },
        { t: '③ docker build', b: '多阶段构建，非 root', c: 'ok' },
        { t: '④ image scan', b: '高危漏洞阻断', c: 'ok' },
        { t: '⑤ deploy staging', b: '滚动更新不中断 SSE', c: 'purple' },
      ]" />
    </UiCard>

    <UiCard title="结构化输出" desc="FR-13 · JSON Schema">
      <UiCode text="type Answer struct {&#10;  Text       string  `json:&quot;text&quot;`&#10;  Cites      []Cite  `json:&quot;cites&quot;`&#10;  Confidence float64 `json:&quot;conf&quot;`&#10;}&#10;// 校验失败 → 降级重试 1 次 → 仍失败返回&#10;// 明确错误，绝不把脏数据透传给前端" />
    </UiCard>
  </div>
</template>
