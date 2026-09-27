import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy do app (build web e APK). Só o próprio app e a API
// configurada em VITE_API_URL podem ser contatados; nada de script externo ou inline.
// No dev server a CSP fica de fora porque o React Refresh injeta script inline.
function contentSecurityPolicy(apiUrl) {
  const apiOrigin = new URL(apiUrl).origin
  const policy = [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval'", // decoder WASM (meshopt) do three.js; eval de JS continua proibido
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' blob: data: ${apiOrigin}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), contentSecurityPolicy(env.VITE_API_URL ?? 'http://localhost:3000')],
    build: { sourcemap: false },
  }
})
