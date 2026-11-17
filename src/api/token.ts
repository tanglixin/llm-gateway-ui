/** token 的存储：内存 + localStorage 双写，供 fetch 层统一读取。 */
const KEY = 'nova.token'

let token = localStorage.getItem(KEY) ?? ''

export function getToken(): string {
  return token
}

export function setToken(next: string): void {
  token = next
  if (next) localStorage.setItem(KEY, next)
  else localStorage.removeItem(KEY)
}

export function authHeaders(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
