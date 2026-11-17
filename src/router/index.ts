import { createRouter, createWebHistory } from 'vue-router'

export const routes = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', component: () => import('@/views/OverviewView.vue') },
  { path: '/chat', component: () => import('@/views/ChatView.vue') },
  { path: '/docs', component: () => import('@/views/DocsView.vue') },
  { path: '/retrieval', component: () => import('@/views/RetrievalView.vue') },
  { path: '/agent', component: () => import('@/views/AgentView.vue') },
  { path: '/gateway', component: () => import('@/views/GatewayView.vue') },
  { path: '/finops', component: () => import('@/views/FinopsView.vue') },
  { path: '/observability', component: () => import('@/views/ObservabilityView.vue') },
  { path: '/eval', component: () => import('@/views/EvalView.vue') },
  { path: '/security', component: () => import('@/views/SecurityView.vue') },
  { path: '/ops', component: () => import('@/views/OpsView.vue') },
  { path: '/design', component: () => import('@/views/DesignView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/overview' },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
