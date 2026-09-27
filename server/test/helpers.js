import bcrypt from 'bcryptjs'
import request from 'supertest'
import { loadConfig } from '../src/config.js'
import { createLogger } from '../src/logger.js'
import { createMetrics } from '../src/metrics.js'
import { createUserStore } from '../src/auth/users.js'
import { loadCatalog } from '../src/catalog/catalog.js'
import { createApp } from '../src/app.js'

export const PASSWORD = 'senha-de-teste-123'

export async function buildApp(env = {}) {
  const config = loadConfig({
    NODE_ENV: 'test',
    JWT_SECRET: 'segredo-apenas-para-testes-automatizados-0123456789',
    CATALOG_FILE: new URL('../data/catalog.json', import.meta.url).pathname,
    ...env,
  })
  const hash = await bcrypt.hash(PASSWORD, 4)
  const users = createUserStore([
    { id: 'u-viewer', email: 'viewer@test.local', name: 'Viewer', role: 'VIEWER', passwordHash: hash },
    { id: 'u-analista', email: 'analista@test.local', name: 'Analista', role: 'ANALISTA', passwordHash: hash },
    { id: 'u-admin', email: 'admin@test.local', name: 'Admin', role: 'ADMIN', passwordHash: hash },
  ])
  const metrics = createMetrics()
  const app = createApp({ config, logger: createLogger(config), metrics, users, catalog: loadCatalog(config.CATALOG_FILE) })
  return { app, config, metrics }
}

export async function login(app, role) {
  const res = await request(app).post('/api/auth/login').send({ email: `${role}@test.local`, password: PASSWORD })
  return res.body.accessToken
}
