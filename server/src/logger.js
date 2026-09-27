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

export function createLogger(config) {
  const options = {
    level: config.NODE_ENV === 'test' ? 'silent' : config.LOG_LEVEL,
    base: { service: 'ford-specs-api' },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    formatters: { level: (label) => ({ level: label.toUpperCase() }) },
    messageKey: 'message',
    redact: { paths: REDACT, censor: '[REDACTED]' },
  }
  if (!config.LOG_FILE) return pino(options)
  const streams = [
    { stream: process.stdout },
    { stream: pino.destination({ dest: config.LOG_FILE, mkdir: true, sync: false }) },
  ]
  return pino(options, pino.multistream(streams))
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
