<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHead from '@/components/PageHead.vue'
import UiBanner from '@/components/ui/UiBanner.vue'
import UiCard from '@/components/ui/Card.vue'
import UiCode from '@/components/ui/UiCode.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiTag from '@/components/ui/UiTag.vue'
import { COLORS, NAV, PAGE_META, WEEK } from '@/data/mock'
import { useConsole } from '@/stores/console'

const store = useConsole()
const meta = PAGE_META.design
const copied = ref('')

const rows = computed(() =>
  NAV.flatMap(g => g.items.map(i => ({
    ...i,
    g: g.g,
    fr: PAGE_META[i.k].fr,
  }))).map(n => [
    `<b>${n.n}</b><div class="tiny muted mono">#/${n.k}</div>`,
    n.fr.map(f => `<span class="fr">${f}</span>`).join(' '),
    WEEK[n.k],
    `<span class="mono tiny">${n.g.split(' ')[0]}</span>`,
  ]),
)

async function copyColor(hex: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(hex)
    copied.value = hex
    store.toast(`已复制 ${hex}`, 'ok')
  } catch {
    store.toast('复制失败', 'danger')
  }
}
</script>

<template>
  <PageHead :title="meta.title" :sub="meta.sub" :fr="meta.fr" :week="WEEK.design" />

  <UiBanner type="info" icon="◈">
    <b>本页是交付说明</b>：把「界面 ↔ 需求 ↔ 实施周次」对齐，避免做一个好看但和 SRS 脱节的前端。点击任意色块可复制 HEX。
  </UiBanner>

  <div class="grid g2">
    <UiCard title="色板 · Design Tokens" desc="浅色主题，8px 基准栅格">
      <div class="swatches">
        <div v-for="c in COLORS" :key="c[0]" class="sw" style="cursor: pointer" @click="copyColor(c[1])">
          <div class="c" :style="{ background: c[1] }" />
          <div class="m"><b>{{ c[0] }}</b><span>{{ c[1] }} · {{ c[2] }}</span></div>
        </div>
      </div>
      <div class="divider" />
      <div class="field-l">字阶 / 间距 / 形状</div>
      <UiCode text="type: 12 / 13 / 14 / 16 / 20 / 26 / 32 px&#10;space: 4 / 8 / 12 / 16 / 20 / 24 / 32 px&#10;radius: 8 控件 · 12 卡片 · 999 徽章&#10;shadow: 0 8px 24px rgba(16,24,40,.05)" />
    </UiCard>

    <UiCard title="组件与状态矩阵" desc="七种状态不是一句口号">
      <UiTable
        :heads="['组件', '默认', '交互 / 异常态']"
        :rows="[
          ['Button', '主 / 次 / 危险 / 幽灵', 'disabled · loading · 二次确认'],
          ['Input / Select', '聚焦 3px 主色环', '校验失败 · 占位 · 只读'],
          ['Table', '斑马 hover', '空态 CTA · 横向滚动 · 加载骨架'],
          ['消息气泡', '逐字 + 光标', '断线续传 · 停止生成 · 降级横幅'],
          ['Tag / Badge', '6 种语义色', '健康 / 熔断 / 降级 / 拦截'],
          ['Drawer / Modal', '右侧 460px / 居中', 'Esc 关闭 · 遮罩 · 破坏性确认'],
          ['Toast', '右下角队列', '成功 / 告警 / 失败 三态'],
          ['Chart', '纯 SVG，零依赖', '替换数据即接真实 API'],
        ]"
      />
    </UiCard>
  </div>

  <div class="mt16">
    <UiTable :heads="['页面 / 路由', '覆盖需求', '实施周', '分组']" :rows="rows">
      <template #tools><span class="small muted">页面 ↔ FR ↔ 周次 追溯矩阵 · 与 SRS 第 8 章 RTM 完全一致</span></template>
    </UiTable>
  </div>

  <div class="grid g2 mt16">
    <UiCard title="快捷键与全局交互" desc="键盘可达">
      <UiTable
        :heads="['操作', '快捷键 / 行为']"
        :rows="[
          ['打开命令面板', '<span class=&quot;mono&quot;>⌘/Ctrl + K</span> · 搜页面名、FR 编号'],
          ['快速切页', '<span class=&quot;mono&quot;>⌘/Ctrl + 1..9</span>'],
          ['关闭抽屉 / 面板', '<span class=&quot;mono&quot;>Esc</span>'],
          ['路由', '<span class=&quot;mono&quot;>/overview … /design</span> · 刷新保持'],
          ['角色预览', '右上角下拉 · 实时裁剪侧栏'],
        ]"
      />
    </UiCard>

    <UiCard title="明确不做（Won't / P2）" desc="防止 4 周范围蔓延">
      <div class="row">
        <UiTag v-for="x in ['GraphRAG 可视化编辑器', 'A2A 编排画布', '多模态上传', 'K8s Helm 可视化', '移动端原生 App', '在线 Prompt IDE', '深色主题', '真实鉴权后端']" :key="x" color="gray">{{ x }}</UiTag>
      </div>
      <div class="callout warn mt16" style="font-size: 11.5px">
        与 SRS 1.3 / 第 9 章一致：<b>绝不砍</b> FR-09 评测、FR-15 可观测、FR-14 安全、FR-19 部署 ——
        这四项是高薪岗位与培训班 Demo 的分界线。
      </div>
    </UiCard>
  </div>

  <UiCard class="mt16" title="零依赖实现说明" desc="原型单文件；本工程已拆成 Vue 组件">
    <div class="grid g3">
      <div class="card" style="padding: 14px">
        <b class="small">自包含</b>
        <div class="small muted mt8">组件 + 静态样例数据，不依赖外部 CDN</div>
      </div>
      <div class="card" style="padding: 14px">
        <b class="small">图表</b>
        <div class="small muted mt8">SVG polyline / dasharray，零第三方图表库</div>
      </div>
      <div class="card" style="padding: 14px">
        <b class="small">状态</b>
        <div class="small muted mt8">Pinia 集中管理，接 API 只需替换 store 里的数据源</div>
      </div>
    </div>
    <div class="small muted mt12">
      原型数据均为样例；字段命名与 <span class="mono">SRS 5.1 HTTP API</span> 对齐，接后端时把
      <span class="mono">src/data/mock.ts</span> 换成接口响应即可。
    </div>
  </UiCard>
</template>
