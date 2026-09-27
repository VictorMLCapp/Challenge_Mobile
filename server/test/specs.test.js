import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { buildApp, login } from './helpers.js'

// Critério de validação do Desafio 01: a Ford Ranger Raptor.
const RAPTOR_ATTRS = [
  'Motor', 'Potência', 'Torque', 'Câmbio', '0-100 km/h', 'Velocidade Máx.',
  'Tração', 'Suspensão Dianteira', 'Suspensão Traseira', 'Course Dianteiro', 'Course Traseiro',
  'Ângulo de Ataque', 'Comprimento', 'Largura', 'Altura', 'Entre-eixos', 'Capacidade de carga', 'Pneus',
]

async function search(body) {
  const { app } = await buildApp()
  const token = await login(app, 'viewer')
  return request(app).post('/api/specs/search').set('Authorization', `Bearer ${token}`).send(body)
}

test('Ranger Raptor: todas as especificações do slide vêm disponíveis', async () => {
  const res = await search({ marca: 'Ford', modelo: 'Ranger', versao: 'Raptor', atributos: RAPTOR_ATTRS })
  assert.equal(res.status, 200)
  assert.equal(res.body.encontrado, true)
  assert.equal(res.body.veiculo.id, 'ford-ranger-raptor-3-0-v6')
  assert.equal(res.body.naoDisponiveis, 0)
  assert.deepEqual(res.body.especificacoes.map((e) => e.atributo), RAPTOR_ATTRS)
  const power = res.body.especificacoes.find((e) => e.atributo === 'Potência')
  assert.deepEqual([power.valor, power.unidade], [397, 'cv'])
})

test('atributo inexistente fica explícito como NAO_DISPONIVEL, sem mudar o formato', async () => {
  const res = await search({ marca: 'ford', modelo: 'RANGER', versao: 'XLT 3.0L V6 AT 26MY', atributos: ['potencia', 'Teto Solar Elétrico', 'Autonomia em Marte'] })
  assert.equal(res.status, 200)
  const [potencia, teto, marte] = res.body.especificacoes
  assert.deepEqual(Object.keys(potencia), ['atributo', 'valor', 'unidade', 'categoria', 'status'])
  assert.equal(potencia.valor, 250)
  assert.equal(teto.valor, 'Não')
  assert.equal(teto.status, 'DISPONIVEL')
  assert.deepEqual([marte.valor, marte.status], [null, 'NAO_DISPONIVEL'])
})

test('veículo desconhecido devolve o mesmo formato com tudo NAO_DISPONIVEL', async () => {
  const res = await search({ marca: 'Ford', modelo: 'Maverick', versao: 'Lariat', atributos: ['Potência'] })
  assert.equal(res.status, 200)
  assert.equal(res.body.encontrado, false)
  assert.equal(res.body.especificacoes[0].status, 'NAO_DISPONIVEL')
})

test('validação de entrada rejeita payload malformado ou malicioso', async () => {
  const cases = [
    { marca: 'Ford', modelo: 'Ranger', versao: 'Raptor' },
    { marca: 'Ford', modelo: 'Ranger', versao: 'Raptor', atributos: [] },
    { marca: 'Ford', modelo: 'Ranger', versao: 'Raptor', atributos: Array.from({ length: 101 }, (_, i) => `a${i}`) },
    { marca: '<script>alert(1)</script>', modelo: 'Ranger', versao: 'Raptor', atributos: ['Potência'] },
    { marca: 'Ford', modelo: 'Ranger', versao: 'Raptor', atributos: ['Potência', 'potência'] },
    { marca: 'Ford', modelo: 'Ranger', versao: 'Raptor', atributos: ['Potência'], role: 'ADMIN' },
    { marca: { $ne: null }, modelo: 'Ranger', versao: 'Raptor', atributos: ['Potência'] },
  ]
  for (const body of cases) {
    const res = await search(body)
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.error, 'Dados inválidos')
  }
})

test('payload acima de 16kb é recusado com 413', async () => {
  const res = await search({ marca: 'Ford', modelo: 'Ranger', versao: 'x'.repeat(20_000), atributos: ['a'] })
  assert.equal(res.status, 413)
})
