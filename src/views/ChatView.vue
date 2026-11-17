<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import PageHead from '@/components/PageHead.vue'
import UiBanner from '@/components/ui/UiBanner.vue'
import UiBar from '@/components/ui/UiBar.vue'
import UiCard from '@/components/ui/Card.vue'
import UiCode from '@/components/ui/UiCode.vue'
import UiInspectRow from '@/components/ui/UiInspectRow.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import { PAGE_META, WEEK } from '@/data/mock'
import type { Cite } from '@/api/client'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.chat
const input = ref('')
const body = ref<HTMLElement | null>(null)

const m = store.chat.metrics

const currentTitle = computed(
  () => store.convos.find(c => c.id === store.currentConvId)?.title ?? '新对话',
)

onMounted(() => {
  void store.loadConversations()
})

function submit(): void {
  if (!input.value.trim()) return
  store.send(input.value)
  input.value = ''
}

watch(() => store.chat.messages.length, async () => {
  await nextTick()
  body.value?.scrollTo({ top: body.value.scrollHeight })
})

function cite(text: string): string {
  return text.replace(/\[(\d+)\]/g, (_all, n) => `<span class="cite">${n}</span>`)
}

function openCite(c: Cite): void {
  store.openDrawer(
    `引用 [${c.n}] · ${c.doc}`,
    `<div class="code-lite" style="white-space:pre-wrap">${c.snippet}</div>` +
      `<div class="mt12 small muted">相关度 ${c.score} · ${c.chunk} · 来自 pgvector 余弦检索</div>`,
  )
}
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.chat" />

  <UiBanner v-if="store.chat.degraded" type="warn" icon="⚠">
    <b>已自动降级</b>：主模型 DeepSeek-V3 连续超时，30s 内切换至备用模型
    <span class="mono">qwen2:7b（本地）</span>。答案完整返回，但推理质量与延迟会变化，该状态已写入审计日志。
  </UiBanner>

  <div class="chat-layout">
    <div class="chat-list">
      <div class="sec-t">会话 · {{ store.convos.length }}</div>
      <div
        v-for="c in store.convos" :key="c.id" class="conv"
        :class="{ on: c.id === store.currentConvId }"
        style="cursor: pointer"
        @click="store.selectConversation(c.id)"
      >
        <div class="conv-t">{{ c.title }}</div>
        <div class="conv-s">{{ c.count }} 条消息 · {{ c.preview || '暂无内容' }}</div>
      </div>
      <div v-if="store.convos.length === 0" class="small muted" style="padding: 0 13px 8px">
        还没有会话，发第一条消息就会自动创建
      </div>
      <div style="padding: 12px">
        <button class="btn sm" style="width: 100%" @click="store.newConversation()">＋ 新建会话</button>
      </div>
      <div class="sec-t">上下文</div>
      <div style="padding: 0 13px 14px; font-size: 11px; color: var(--ink-3)">
        已压缩 3 轮历史 · 窗口占用 42%
        <div class="mt8"><UiBar :pct="42" color="cyan" /></div>
      </div>
    </div>

    <div class="chat-main">
      <div class="chat-head">
        <b style="font-size: 13px">{{ currentTitle }}</b>
        <UiTag color="info">RAG 模式</UiTag>
        <UiTag color="ok">多租户隔离</UiTag>
        <span style="margin-left: auto" class="small muted mono">conv_91a2</span>
      </div>

      <div ref="body" class="chat-body">
        <div v-for="(msg, i) in store.chat.messages" :key="i" class="msg" :class="msg.role === 'user' ? 'user' : 'ai'">
          <div class="m-av">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
          <div class="m-body">
            <div class="m-name">
              {{ msg.role === 'user' ? '你' : 'LLM Gateway' }} · <span class="mono">{{ store.chat.model }}</span>
            </div>
            <div class="bubble">
              <span v-if="msg.role === 'user'">{{ msg.text }}</span>
              <span v-else v-html="cite(msg.text)" />
              <span v-if="msg.role === 'ai' && !msg.done" class="caret" />
            </div>

            <div v-if="msg.cites?.length" class="cites">
              <div v-for="c in msg.cites" :key="c.n" class="cite-card" style="cursor: pointer" @click="openCite(c)">
                <div class="cc-t">[{{ c.n }}] {{ c.doc }}</div>
                <div class="cc-m">{{ c.snippet.slice(0, 34) }}… · 相关度 {{ c.score }} · 点击展开 ↗</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-foot">
        <div class="chat-input-row">
          <textarea v-model="input" rows="2" placeholder="输入问题… 例如：把刚才的住宿标准按城市列成表格" @keydown.enter.exact.prevent="submit" />
          <button v-if="store.chat.streaming" class="btn primary" @click="store.stop()">■ 停止</button>
          <button v-else class="btn primary" @click="submit">发送 ↵</button>
        </div>
        <div class="chat-meta">
          <span>模型
            <select v-model="store.chat.model" class="sel" style="padding: 2px 6px; font-size: 11px">
              <option>DeepSeek-V3</option><option>qwen2:7b</option>
            </select>
          </span>
          <span>Top-K {{ store.chat.topk }}</span>
          <span>Temperature {{ store.chat.temp }}</span>
          <span>Rerank {{ store.switches.rerank ? '开' : '关' }}</span>
          <span>Agent {{ store.switches.agent ? '开' : '关' }}</span>
        </div>
      </div>
    </div>

    <div class="chat-inspect">
      <div class="sec-t">本次调用 · Live Inspector</div>
      <div style="padding: 0 14px 6px">
        <UiInspectRow k="首字延迟 TTFT" :v="m.ttft" />
        <UiInspectRow k="总耗时" :v="m.total" />
        <UiInspectRow k="Prompt Tokens" :v="m.pt.toLocaleString()" />
        <UiInspectRow k="Completion Tokens" :v="m.ct.toLocaleString()" />
        <UiInspectRow k="本次成本" :v="m.cost" />
        <UiInspectRow k="语义缓存" :v="m.cache" />
        <UiInspectRow k="召回片段" :v="`${m.chunks} 个`" />
        <UiInspectRow k="Prompt 版本" v="prompt_v3" />
        <UiInspectRow k="索引版本" v="idx_20261109_01" />
      </div>
      <div class="sec-t">链路证据</div>
      <div style="padding: 0 14px 16px">
        <UiCode :text="m.trace" size="10px" />
        <div class="row mt12">
          <button class="btn sm" @click="store.openDrawer('Trace · ' + m.trace, '<div class=\'code-lite\'>http.request 2.31s → retrieval 0.5s → llm.generate 1.06s</div>')">查看 Trace</button>
          <button class="btn sm" @click="$router.push('/docs')">跳到原文</button>
          <button class="btn sm" @click="store.toast('trace_id 已复制', 'ok')">复制 trace_id</button>
        </div>
        <div class="callout mt12" style="font-size: 11px">
          每个数字都来自同一次调用；成本、片段、审计记录用 <span class="mono">trace_id</span> 串起来（FR-04/15/16）。
        </div>
      </div>
    </div>
  </div>

  <div class="grid g3 mt16">
    <UiCard title="七种状态都在界面上" desc="不是只画 happy path">
      <div class="row">
        <UiTag v-for="t in ['加载 · 骨架屏', '流式 · 光标', '空 · CTA', '错误 · 重试']" :key="t" color="gray">{{ t }}</UiTag>
        <UiTag color="warn">降级 · 琥珀</UiTag>
        <UiTag color="purple">无权限</UiTag>
        <UiTag color="ok">完成 · 绿</UiTag>
      </div>
      <div class="small muted mt12">
        断线时显示「重新连接」并用 <span class="mono">Last-Event-ID</span> 续传；点击「停止生成」需向后端传播 cancel，避免继续计费。
      </div>
    </UiCard>

    <UiCard title="API 契约" desc="SRS 5.1 对齐">
      <UiCode text="GET  /api/chat/stream?q=&conversation_id=&#10;POST /api/chat                    # 评测 / 脚本&#10;Content-Type: text/event-stream&#10;data: {...}&#10;data: [DONE]" />
    </UiCard>

    <UiCard title="验收 AC-UI-02" desc="演示者可独立完成">
      <UiTimeline :items="[
        { t: '① 上传文档 → ETL 就绪', b: 'P03 知识库', c: 'ok' },
        { t: '② 提问 → 看到逐字输出', b: '点击「发送 ↵」即可复现', c: 'ok' },
        { t: '③ 点引用 → 看原文片段', b: '引用卡可展开并跳 P03 分块预览', c: 'ok' },
        { t: '④ 下钻 Token / Trace / 审计', b: '右侧检查器 + P08 瀑布图', c: 'ok' },
      ]" />
    </UiCard>
  </div>
</template>
