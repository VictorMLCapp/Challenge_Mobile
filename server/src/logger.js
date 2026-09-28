import { Writable } from 'node:stream'
import pino from 'pino'

// Campos que nunca podem aparecer em log (senha, JWT completo, segredos).
const REDACT = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  '*.password',
  'token',
  '*.token',
]

// Eventos que alimentam o painel de segurança (/dashboard, porta interna de métricas).
const SECURITY_EVENTS = new Set([
  'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_BLOCKED', 'LOGOUT', 'AUTH_INVALID_TOKEN', 'AUTHZ_DENIED',
  'RATE_LIMITED', 'VALIDATION_FAILED', 'AUDIT', 'MOBILE_MODEL_LOAD_FAILURE', 'MOBILE_API_ERROR', 'UNHANDLED_ERROR',
])

function createEventBuffer(size = 200) {
  const events = []
  const stream = new Writable({
    write(chunk, _enc, done) {
      for (const line of chunk.toString().split('\n')) {
        if (!line) continue
        try {
          const entry = JSON.parse(line)
          if (SECURITY_EVENTS.has(entry.event)) {
            events.push(entry)
            if (events.length > size) events.shift()
          }
        } catch { /* linha não-JSON: ignora */ }
      }
      done()
    },
  })
  return { stream, recent: (limit = 50) => events.slice(-limit).reverse() }
}

export function createLogger(config) {
  const options = {
    level: config.NODE_ENV === 'test' ? 'silent' : config.LOG_LEVEL,
    base: { service: 'ford-specs-api' },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    formatters: { level: (label) => ({ level: label.toUpperCase() }) },
    messageKey: 'message',
    redact: { paths: REDACT, censor: '[REDACTED]' },
  }
  const buffer = createEventBuffer()
  const streams = [{ stream: process.stdout }, { stream: buffer.stream }]
  if (config.LOG_FILE) streams.push({ stream: pino.destination({ dest: config.LOG_FILE, mkdir: true, sync: false }) })
  const logger = pino(options, pino.multistream(streams))
  logger.recentSecurityEvents = buffer.recent
  return logger
}

// LGPD: o IP entra no log só com o último octeto (IPv4) ou os últimos grupos (IPv6) mascarados.
export function maskIp(ip = '') {
  if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') return 'loopback'
  const v4 = ip.replace(/^::ffff:/, '')
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) return v4.replace(/\.\d+$/, '.xxx')
  const groups = ip.split(':')
  if (groups.length > 3) return `${groups.slice(0, 3).join(':')}:xxxx`
  return 'desconhecido'
}
