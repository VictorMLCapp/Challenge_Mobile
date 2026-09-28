import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { isAbsolute, resolve } from 'node:path'
import { z } from 'zod'

// Caminhos relativos são resolvidos a partir de server/, não do diretório atual.
const SERVER_ROOT = fileURLToPath(new URL('..', import.meta.url))
const fromServer = (p) => (isAbsolute(p) ? p : resolve(SERVER_ROOT, p))

// Falha no boot se o ambiente estiver incompleto: segredo fraco ou ausente
// nunca chega a assinar um token.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  METRICS_PORT: z.coerce.number().int().min(1).max(65535).default(9464),
  // Só loopback por padrão; em container o compose/k8s define 0.0.0.0 (rede interna).
  METRICS_HOST: z.string().default('127.0.0.1'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa de pelo menos 32 caracteres'),
  JWT_ISSUER: z.string().default('ford-specs-api'),
  JWT_AUDIENCE: z.string().default('ford-ranger-app'),
  JWT_TTL: z.string().regex(/^\d+[smh]$/).default('15m'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,https://localhost,capacitor://localhost'),
  USERS_FILE: z.string().default('data/users.json'),
  CATALOG_FILE: z.string().default('data/catalog.json'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_FILE: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  LOGIN_MAX_FAILURES: z.coerce.number().int().positive().default(5),
  LOGIN_LOCK_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
})

// JWT_SECRET_FILE (Docker/Kubernetes secret montado como arquivo) tem prioridade
// sobre JWT_SECRET em variável de ambiente, que vaza mais fácil (ps, /proc, dumps).
function withFileSecrets(env) {
  if (!env.JWT_SECRET_FILE) return env
  // Triagem Semgrep (node_secret): falso positivo. O valor é lido do arquivo montado em runtime,
  // não há segredo literal no código.
  return { ...env, JWT_SECRET: readFileSync(env.JWT_SECRET_FILE, 'utf8').trim() } // nosemgrep
}

export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(withFileSecrets(env))
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Configuração inválida: ${issues}`)
  }
  const config = parsed.data
  return {
    ...config,
    USERS_FILE: fromServer(config.USERS_FILE),
    CATALOG_FILE: fromServer(config.CATALOG_FILE),
    LOG_FILE: config.LOG_FILE && fromServer(config.LOG_FILE),
    corsOrigins: config.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  }
}
