import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { createTokenService } from './auth/tokens.js'
import { createLockout } from './auth/lockout.js'
import { authenticate } from './middleware/auth.js'
import { createAuditTrail } from './audit.js'
import { authRoutes } from './routes/auth.js'
import { specsRoutes } from './routes/specs.js'
import { adminRoutes } from './routes/admin.js'
import { telemetryRoutes } from './routes/telemetry.js'
import { maskIp } from './logger.js'

const UUID = /^[0-9a-f-]{36}$/i

export function createApp({ config, logger, metrics, users, catalog }) {
  const app = express()
  const tokens = createTokenService(config)
  const lockout = createLockout({ maxFailures: config.LOGIN_MAX_FAILURES, lockMs: config.LOGIN_LOCK_MS })
  const audit = createAuditTrail(logger)

  app.locals.metrics = metrics
  app.set('trust proxy', config.TRUST_PROXY)

  // Cabeçalhos de segurança. A API só devolve JSON, então a CSP é a mais fechada possível.
  app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }))

  app.use(cors({
    origin(origin, callback) {
      // Sem Origin = cliente nativo (CapacitorHttp) ou ferramenta de linha de comando.
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true)
      return callback(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    maxAge: 600,
  }))

  app.use(pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers['x-request-id']
      // Triagem Semgrep (regex_dos): falso positivo. UUID é uma classe fixa com tamanho exato {36},
      // sem quantificador aninhado, então não há backtracking exponencial.
      const id = typeof incoming === 'string' && incoming.length === 36 && UUID.test(incoming) ? incoming : randomUUID() // nosemgrep
      res.setHeader('X-Request-Id', id)
      return id
    },
    customProps: (req) => ({ ip: maskIp(req.ip) }),
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return 'error'
      if (res.statusCode >= 400) return 'warn'
      return 'info'
    },
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    autoLogging: { ignore: (req) => req.url === '/healthz' },
  }))

  // Métricas RED por rota (usa o padrão da rota, não a URL, para não explodir cardinalidade).
  app.use((req, res, next) => {
    const end = metrics.httpDuration.startTimer()
    res.on('finish', () => {
      const route = req.route ? req.baseUrl + req.route.path : req.baseUrl || 'unmatched'
      const labels = { method: req.method, route, status: String(res.statusCode) }
      metrics.httpRequests.inc(labels)
      end(labels)
    })
    next()
  })

  app.use(express.json({ limit: '16kb', strict: true }))

  const limiter = (name, max) => rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
      metrics.rateLimited.inc({ limiter: name })
      req.log.warn({ event: 'RATE_LIMITED', limiter: name }, 'rate limit atingido')
      res.status(429).json({ error: 'Muitas requisições. Tente novamente mais tarde.' })
    },
  })
  const apiLimiter = limiter('api', config.RATE_LIMIT_MAX)
  const loginLimiter = limiter('login', config.LOGIN_RATE_LIMIT_MAX)
  const telemetryLimiter = limiter('telemetry', 60)

  app.get('/healthz', (req, res) => res.json({ status: 'ok' }))

  app.use('/api', apiLimiter)
  app.use('/api/auth', authRoutes({ users, tokens, lockout, metrics, loginLimiter }))
  app.use('/api/telemetry', telemetryRoutes({ metrics, limiter: telemetryLimiter }))
  app.use('/api/admin', authenticate({ tokens, metrics }), adminRoutes({ users, audit }))
  app.use('/api', authenticate({ tokens, metrics }), specsRoutes({ catalog, metrics, audit }))

  app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }))

  // Nunca devolve stack trace nem mensagem interna para o cliente.
  app.use((err, req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON malformado' })
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload muito grande' })
    req.log.error({ event: 'UNHANDLED_ERROR', err }, 'erro não tratado')
    return res.status(500).json({ error: 'Erro interno', requestId: req.id })
  })

  return app
}

// Porta interna (não publicada): /metrics para o Prometheus e o painel de
// monitoramento de segurança em /dashboard, que lê as mesmas métricas ao vivo.
export function createMetricsApp(metrics, logger) {
  const app = express()
  app.use(helmet())
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', metrics.registry.contentType)
    res.end(await metrics.registry.metrics())
  })
  app.get('/security-events', (req, res) => {
    res.json({ eventos: logger?.recentSecurityEvents?.(60) ?? [] })
  })
  app.use('/dashboard', express.static(fileURLToPath(new URL('./dashboard', import.meta.url))))
  return app
}
