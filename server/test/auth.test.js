import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { buildApp, login, PASSWORD } from './helpers.js'

test('login válido devolve JWT HS256 com expiração de 15 min', async () => {
  const { app } = await buildApp()
  const res = await request(app).post('/api/auth/login').send({ email: 'viewer@test.local', password: PASSWORD })
  assert.equal(res.status, 200)
  const decoded = jwt.decode(res.body.accessToken, { complete: true })
  assert.equal(decoded.header.alg, 'HS256')
  assert.equal(decoded.payload.exp - decoded.payload.iat, 15 * 60)
  assert.equal(decoded.payload.role, 'VIEWER')
  assert.ok(decoded.payload.jti)
  assert.equal(res.body.user.passwordHash, undefined)
})

test('senha errada e usuário inexistente têm a mesma resposta', async () => {
  const { app } = await buildApp()
  const wrong = await request(app).post('/api/auth/login').send({ email: 'viewer@test.local', password: 'errada-123456' })
  const ghost = await request(app).post('/api/auth/login').send({ email: 'ninguem@test.local', password: 'errada-123456' })
  assert.equal(wrong.status, 401)
  assert.deepEqual(wrong.body, ghost.body)
})

test('conta bloqueia após 5 falhas seguidas', async () => {
  const { app } = await buildApp({ LOGIN_RATE_LIMIT_MAX: '50' })
  for (let i = 0; i < 5; i += 1) {
    await request(app).post('/api/auth/login').send({ email: 'viewer@test.local', password: 'errada-123456' })
  }
  const res = await request(app).post('/api/auth/login').send({ email: 'viewer@test.local', password: PASSWORD })
  assert.equal(res.status, 423)
})

test('rate limit do login devolve 429', async () => {
  const { app, metrics } = await buildApp({ LOGIN_RATE_LIMIT_MAX: '3' })
  let last
  for (let i = 0; i < 4; i += 1) {
    last = await request(app).post('/api/auth/login').send({ email: 'x@test.local', password: 'qualquer-coisa' })
  }
  assert.equal(last.status, 429)
  assert.ok(last.headers.ratelimit)
  assert.match(await metrics.registry.metrics(), /rate_limit_hits_total\{limiter="login".*\} 1/)
})

test('token com alg none, assinado com outro segredo ou expirado é recusado', async () => {
  const { app } = await buildApp()
  const payload = { sub: 'u-admin', role: 'ADMIN', iss: 'ford-specs-api', aud: 'ford-ranger-app' }
  const none = jwt.sign(payload, null, { algorithm: 'none' })
  const forged = jwt.sign(payload, 'outro-segredo-qualquer-com-32-caracteres!!', { algorithm: 'HS256' })
  const expired = jwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 10 }, 'segredo-apenas-para-testes-automatizados-0123456789')
  for (const token of [none, forged, expired]) {
    const res = await request(app).get('/api/vehicles').set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 401)
  }
})

test('logout revoga o token antes da expiração', async () => {
  const { app } = await buildApp()
  const token = await login(app, 'viewer')
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status, 200)
  assert.equal((await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`)).status, 204)
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status, 401)
})

test('boot falha com JWT_SECRET curto', async () => {
  await assert.rejects(() => buildApp({ JWT_SECRET: 'curto' }), /JWT_SECRET/)
})

test('JWT_SECRET_FILE (secret montado como arquivo) tem prioridade sobre a variável', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const { tmpdir } = await import('node:os')
  const file = join(mkdtempSync(join(tmpdir(), 'ford-')), 'jwt_secret')
  writeFileSync(file, 'segredo-vindo-de-arquivo-montado-pelo-orquestrador\n')
  const { config } = await buildApp({ JWT_SECRET: 'curto', JWT_SECRET_FILE: file })
  assert.equal(config.JWT_SECRET, 'segredo-vindo-de-arquivo-montado-pelo-orquestrador')
})
