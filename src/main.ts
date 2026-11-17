import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { hydrate } from './api/hydrate'
import { useAuth } from './stores/auth'
import './styles/app.css'

async function main(): Promise<void> {
  const pinia = createPinia()
  const app = createApp(App).use(pinia).use(router)

  // 未登录时先渲染登录页，拿到 token 再拉数据
  const auth = useAuth(pinia)
  if (auth.token) {
    const online = await hydrate()
    if (!online) console.warn('[nova] 离线模式：页面数据来自本地样例')
  }

  app.mount('#app')

  // 任何请求返回 401 都强制回到登录页
  window.addEventListener('nova:unauthorized', () => {
    if (auth.token) {
      auth.logout()
      window.location.hash = '#/overview'
    }
  })
}

void main()
