import { fetchBootstrap } from './client'
import { hydrateFromApi } from '@/data/mock'

/** 应用启动时同步后端数据；失败则保留本地样例，页面仍可演示。 */
export async function hydrate(): Promise<boolean> {
  try {
    const payload = await fetchBootstrap()
    hydrateFromApi(payload)
    return true
  } catch (err) {
    console.warn('[nova] bootstrap 失败，使用本地样例数据：', err)
    return false
  }
}
