import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp } from './helpers.js'

test('headers de segurança do Helmet e sem X-Powered-By', async () => {
  const { app } = await buildApp()
  const res = await request(app).get('/healthz')
  assert.equal(res.headers['x-powered-by'], undefined)
  assert.equal(res.headers['x-content-type-options'], 'nosniff')
  assert.match(res.headers['content-security-policy'], /default-src 'none'/)
  assert.match(res.headers['strict-transport-security'], /max-age=/)
  assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN')
})

test('CORS só libera origens da allowlist', async () => {
  const { app } = await buildApp()
  const ok = await request(app).options('/api/vehicles').set('Origin', 'https://localhost').set('Access-Control-Request-Method', 'GET')
  const evil = await request(app).options('/api/vehicles').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'GET')
  assert.equal(ok.headers['access-control-allow-origin'], 'https://localhost')
  assert.equal(evil.headers['access-control-allow-origin'], undefined)
})

test('JSON malformado vira 400 sem stack trace', async () => {
  const { app } = await buildApp()
  const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":')
  assert.equal(res.status, 400)
  assert.deepEqual(res.body, { error: 'JSON malformado' })
})

test('telemetria do app aceita só eventos da lista fechada', async () => {
  const { app, metrics } = await buildApp()
  const ok = await request(app).post('/api/telemetry/events').send({ event: 'MODEL_LOAD_FAILURE', platform: 'android', screen: 'home' })
  const bad = await request(app).post('/api/telemetry/events').send({ event: 'QUALQUER', platform: 'android', latitude: -23.5 })
  assert.equal(ok.status, 202)
  assert.equal(bad.status, 400)
  assert.match(await metrics.registry.metrics(), /mobile_client_events_total\{event="MODEL_LOAD_FAILURE",platform="android".*\} 1/)
})

test('X-Request-Id é devolvido para correlacionar logs', async () => {
  const { app } = await buildApp()
  const id = '3f0c9a8e-8a57-4c3b-9d0e-2f1f6f1f7c11'
  const res = await request(app).get('/healthz').set('X-Request-Id', id)
  assert.equal(res.headers['x-request-id'], id)
  // Valor fora do formato UUID é descartado e um novo id é gerado (evita log forging).
  const forged = await request(app).get('/healthz').set('X-Request-Id', '","level":"FATAL","event":"FAKE')
  assert.match(forged.headers['x-request-id'], /^[0-9a-f-]{36}$/)
})
