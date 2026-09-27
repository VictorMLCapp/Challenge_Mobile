import { Capacitor, CapacitorHttp } from '@capacitor/core'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const TIMEOUT_MS = 10_000
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2']

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

// Build de produção só conversa com a API por HTTPS (OWASP Mobile M5 – comunicação insegura).
// HTTP em claro fica restrito a hosts locais de desenvolvimento, e no Android
// só o build debug libera esses hosts (network_security_config).
function assertTransport() {
  const url = new URL(API_URL)
  if (url.protocol === 'https:') return
  if (!LOCAL_HOSTS.includes(url.hostname)) {
    throw new ApiError(0, 'Configuração insegura: a API precisa usar HTTPS.')
  }
}

async function send(path, { method, body, token }) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  if (Capacitor.isNativePlatform()) {
    // No APK a requisição sai pela pilha HTTP nativa, que respeita o
    // network_security_config do Android (sem mixed content na WebView).
    const res = await CapacitorHttp.request({
      url: API_URL + path, method, headers, data: body,
      connectTimeout: TIMEOUT_MS, readTimeout: TIMEOUT_MS, responseType: 'json',
    })
    return { status: res.status, data: res.data }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(API_URL + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer',
    })
    const text = await res.text()
    return { status: res.status, data: text ? JSON.parse(text) : null }
  } finally {
    clearTimeout(timer)
  }
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  assertTransport()
  let result
  try {
    result = await send(path, { method, body, token })
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(0, 'Não foi possível falar com o servidor. Verifique a conexão.')
  }
  const { status, data } = result
  if (status >= 200 && status < 300) return data
  throw new ApiError(status, data?.error ?? `Erro ${status}`, data?.detalhes)
}

export const api = {
  login: (email, password) => apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: (token) => apiRequest('/api/auth/logout', { method: 'POST', token }),
  vehicles: (token) => apiRequest('/api/vehicles', { token }),
  searchSpecs: (token, query) => apiRequest('/api/specs/search', { method: 'POST', body: query, token }),
  auditEvents: (token) => apiRequest('/api/admin/audit-events?limit=20', { token }),
}
