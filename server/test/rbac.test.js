import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp, login } from './helpers.js'

const upsert = { especificacoes: [{ atributo: 'Potência', valor: 230, unidade: 'cv' }] }
const vehicle = { id: 'teste-veiculo', marca: 'Marca', modelo: 'Modelo', versao: 'V1', fonte: 'teste' }

test('sem token a API responde 401', async () => {
  const { app } = await buildApp()
  assert.equal((await request(app).get('/api/vehicles')).status, 401)
})

test('matriz de permissões por perfil', async () => {
  const { app } = await buildApp()
  const tokens = {
    viewer: await login(app, 'viewer'),
    analista: await login(app, 'analista'),
    admin: await login(app, 'admin'),
  }
  const call = (method, path, role, body) => {
    const req = request(app)[method](path).set('Authorization', `Bearer ${tokens[role]}`)
    return body ? req.send(body) : req
  }

  // Consulta: todos
  for (const role of ['viewer', 'analista', 'admin']) {
    assert.equal((await call('get', '/api/vehicles', role)).status, 200, role)
  }
  // Manter specs de concorrente: ANALISTA e ADMIN
  assert.equal((await call('put', '/api/vehicles/toyota-hilux-gr-s/specs', 'viewer', upsert)).status, 403)
  assert.equal((await call('put', '/api/vehicles/toyota-hilux-gr-s/specs', 'analista', upsert)).status, 200)
  // Criar/remover veículo e ver auditoria: só ADMIN
  assert.equal((await call('post', '/api/vehicles', 'analista', vehicle)).status, 403)
  assert.equal((await call('post', '/api/vehicles', 'admin', vehicle)).status, 201)
  assert.equal((await call('delete', '/api/vehicles/teste-veiculo', 'analista')).status, 403)
  assert.equal((await call('delete', '/api/vehicles/teste-veiculo', 'admin')).status, 204)
  assert.equal((await call('get', '/api/admin/users', 'analista')).status, 403)
  const users = await call('get', '/api/admin/users', 'admin')
  assert.equal(users.status, 200)
  assert.ok(users.body.usuarios.every((u) => !('passwordHash' in u)))

  const audit = await call('get', '/api/admin/audit-events', 'admin')
  assert.deepEqual(audit.body.eventos.map((e) => e.action), ['VEHICLE_DELETE', 'VEHICLE_CREATE', 'VEHICLE_SPECS_UPSERT'])
  assert.equal(audit.body.eventos[2].userId, 'u-analista')
})
