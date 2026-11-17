<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHead from '@/components/PageHead.vue'
import UiBanner from '@/components/ui/UiBanner.vue'
import UiBar from '@/components/ui/UiBar.vue'
import UiCard from '@/components/ui/Card.vue'
import UiCode from '@/components/ui/UiCode.vue'
import UiKpi from '@/components/ui/UiKpi.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import { PAGE_META, WEEK } from '@/data/mock'
import { useConsole } from '@/stores/console'
import { useAuth } from '@/stores/auth'

const store = useConsole()
const auth = useAuth()
const meta = PAGE_META.docs

const fileInput = ref<HTMLInputElement | null>(null)

const readyCount = computed(() => store.docs.filter(d => d.st === '就绪').length)
const failedCount = computed(() => store.docs.filter(d => d.st === '解析失败').length)

function onFile(e: Event): void {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void store.uploadDoc(file)
  input.value = ''
}

onMounted(() => {
  void store.loadDocuments()
})
const stages = ['已上传', '解析中', '切分中', '向量化', '就绪']

function stageColor(i: number): string {
  if (!store.etl.running) return '#CBD5E1'
  if (i < store.etl.stage) return '#0E9F6E'
  if (i === store.etl.stage) return '#3452D8'
  return '#CBD5E1'
}
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.docs" />

  <UiBanner type="info" icon="◈">
    <b>索引蓝绿</b> · 当前蓝版 <span class="mono">idx_20261109_01</span>（86+42 片段），绿版
    <span class="mono">idx_20261108_02</span> 保留可秒级回切。缓存键包含索引版本，换版自动失效（FR-05）。
    <button class="btn sm" style="margin-left: 10px" @click="store.toast('已切换索引（演示）')">切换索引</button>
  </UiBanner>

  <div class="grid g4">
    <UiKpi label="文档总数" :value="String(store.docs.length)" unit="份" :foot="`${readyCount} 份已就绪 · ${failedCount} 份失败`" />
    <UiKpi label="总片段数" value="216" unit="chunks" foot="平均 43 chunks / 文档" color="cyan" />
    <UiKpi label="ETL 成功率" value="80" unit="%" foot="失败原因：扫描件无文本层" color="warn" />
    <UiKpi label="索引版本" value="2" unit="版" foot="蓝绿可回切 · 维度 768" color="ok" />
  </div>

  <div class="card pad0 mt16">
    <div class="tbl-tools">
      <span class="small muted">共 {{ store.docs.length }} 份 · 按租户强制过滤，跨租户文档不可见（FR-17）</span>
      <div class="row" style="margin-left: auto; gap: 8px; align-items: center">
        <input ref="fileInput" type="file" accept=".md,.txt,.pdf" style="display: none" @change="onFile" />
        <button
          class="btn sm primary" :disabled="!auth.isAdmin"
          :title="auth.isAdmin ? '' : '需要管理员权限'"
          @click="auth.isAdmin ? fileInput?.click() : store.toast('上传需要管理员权限', 'warn')"
        >＋ 上传文档</button>
      </div>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>文档 / 索引版本</th><th>租户</th><th>大小</th><th>分块</th>
            <th>状态</th><th>ETL 进度</th><th>ACL</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(d, i) in store.docs" :key="d.n">
            <td style="min-width: 250px">
              <span class="t-main">{{ d.n }}</span>
              <div class="tiny muted mono mt8">{{ d.idx }}</div>
            </td>
            <td style="white-space: nowrap">{{ d.t }}</td>
            <td style="white-space: nowrap">{{ d.s }}</td>
            <td>{{ d.chunks || '—' }}</td>
            <td>
              <UiTag :color="d.st === '就绪' ? 'ok' : d.st === '解析失败' ? 'danger' : 'warn'">{{ d.st }}</UiTag>
            </td>
            <td style="min-width: 120px">
              <UiBar :pct="(d.stage / 5) * 100" :color="d.st === '解析失败' ? 'danger' : d.st === '就绪' ? 'ok' : 'cyan'" />
            </td>
            <td><UiTag color="gray">{{ d.acl }}</UiTag></td>
            <td style="white-space: nowrap">
              <button class="btn sm" @click="store.openDrawer('分块预览 · ' + d.n, '<div class=&quot;code-lite&quot;>chunk_id: ck_01a7 · token_count: 187 · overlap: 64</div>')">分块</button>
              <button
                class="btn sm" :class="{ danger: d.st === '解析失败' }"
                @click="d.st === '解析失败' ? store.retryDoc(store.docsSource[i]?.id) : store.retryDoc(store.docsSource[i]?.id)"
              >{{ d.st === '解析失败' ? '重试' : '重建' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="grid g2 mt16">
    <UiCard title="ETL 状态机" desc="异步队列 Asynq(Redis) · 10 MB 文档 ≤ 60s">
      <div class="row" style="justify-content: space-between">
        <div v-for="(s, i) in stages" :key="s" style="text-align: center; flex: 1; min-width: 70px">
          <div
            style="width: 26px; height: 26px; margin: 0 auto 6px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: #fff"
            :style="{ background: stageColor(i) }"
          >{{ i < store.etl.stage ? '✓' : i + 1 }}</div>
          <div class="tiny" :class="{ strong: i <= store.etl.stage }">{{ s }}</div>
        </div>
      </div>
      <div class="mt16"><UiBar :pct="store.etl.running ? ((store.etl.stage + 1) / 5) * 100 : 0" color="cyan" /></div>
      <div class="spread mt12">
        <span class="small muted">
          {{ store.etl.running ? `正在处理 interview_notes_2026.pdf · 阶段 ${store.etl.stage + 1}/5` : '点击「模拟上传」观察阶段自动推进' }}
        </span>
        <button class="btn sm primary" :disabled="store.etl.running" @click="store.simulateUpload()">
          {{ store.etl.running ? '处理中…' : '▤ 模拟上传' }}
        </button>
      </div>
      <div class="callout mt16" style="font-size: 11.5px">
        切片参数：<span class="mono">chunk_size=512</span>、<span class="mono">overlap=64</span>、语义边界优先；
        Embedding 维度固定 768，换模型需蓝绿重建索引（AC-07）。
      </div>
    </UiCard>

    <UiCard title="分块预览" desc="点列表「分块」查看">
      <UiCode text="chunk_id: ck_01a7 · doc v3.2 · P7&#10;token_count: 187 · overlap: 64&#10;embedding_dim: 768 · idx_20261109_01&#10;&#10;一线城市指北京、上海、广州、深圳，住宿费上限为每人每晚 600 元；其余城市 400 元。超出部分原则上不予报销。" />
      <div class="small muted mt12">引用跳转即定位到这里的 chunk（AC-18）。</div>
    </UiCard>
  </div>

  <div class="grid g2 mt16">
    <UiCard title="失败语义" desc="不吞异常，给出可操作原因">
      <div class="callout warn">
        供应商安全合规手册.pdf：PDF 为扫描件、无文本层 → <b>解析失败</b>，任务状态落库并暴露「重试」。
        OCR 属于 P2 Won't，不在 4 周范围内。
      </div>
      <div class="small muted mt12">重试采用幂等 task_id，重复提交不会产生重复片段；失败次数达 3 次触发告警。</div>
    </UiCard>

    <UiCard title="AC-06 / AC-07 验收" desc="可直接写进 README">
      <UiTimeline :items="[
        { t: '上传 PDF / MD / DOCX', b: 'POST /api/documents 返回 task_id', c: 'ok' },
        { t: '异步解析 → 切分 → 向量化', b: 'GET /api/documents/:id/status 轮询五阶段', c: 'ok' },
        { t: '写入 pgvector 并带 tenant_id', b: 'namespace 隔离，检索前置 ACL 过滤', c: 'ok' },
        { t: '重建索引蓝绿切换', b: '维度变化需全量重建，旧索引保留可回切', c: 'ok' },
      ]" />
    </UiCard>
  </div>
</template>
