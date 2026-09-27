import { Router } from 'express'
import { z } from 'zod'
import { validateBody, safeText } from '../middleware/validate.js'
import { authorize } from '../middleware/auth.js'
import { ROLES } from '../auth/roles.js'

export const searchSchema = z.strictObject({
  marca: safeText(40),
  modelo: safeText(60),
  versao: safeText(80),
  atributos: z.array(safeText(120)).min(1).max(100)
    .refine((list) => new Set(list.map((a) => a.toLowerCase())).size === list.length, 'atributos repetidos'),
})

const idParam = z.string().regex(/^[a-z0-9-]{3,80}$/)

const specValue = z.union([z.string().trim().max(200), z.number().finite(), z.boolean()])

const upsertSchema = z.strictObject({
  especificacoes: z.array(z.strictObject({
    atributo: safeText(120),
    valor: specValue,
    unidade: safeText(20).nullable().optional(),
    categoria: safeText(60).nullable().optional(),
  })).min(1).max(100),
})

const createSchema = z.strictObject({
  id: idParam,
  marca: safeText(40),
  modelo: safeText(60),
  versao: safeText(80),
  fonte: safeText(200),
})

export function specsRoutes({ catalog, metrics, audit }) {
  const router = Router()

  function readId(req, res) {
    const parsed = idParam.safeParse(req.params.id)
    if (!parsed.success) {
      res.status(400).json({ error: 'Identificador inválido' })
      return null
    }
    return parsed.data
  }

  // Todos os perfis autenticados consultam.
  router.get('/vehicles', (req, res) => res.json({ veiculos: catalog.list() }))

  router.get('/vehicles/:id/attributes', (req, res) => {
    const id = readId(req, res)
    if (!id) return undefined
    const attributes = catalog.attributes(id)
    if (!attributes) return res.status(404).json({ error: 'Veículo não encontrado' })
    return res.json({ id, atributos: attributes })
  })

  router.post('/specs/search', validateBody(searchSchema), (req, res) => {
    // Triagem Semgrep (regex_injection_dos): falso positivo. normalize() só aplica regex
    // fixas e lineares, e o schema já limitou cada campo a <=120 caracteres.
    const result = catalog.search(req.body) // nosemgrep
    metrics.specSearches.inc({ found: String(result.encontrado) })
    metrics.missingAttributes.inc(result.naoDisponiveis)
    req.log.info({
      event: 'SPEC_SEARCH',
      vehicle: result.veiculo?.id ?? null,
      requested: result.totalAtributos,
      missing: result.naoDisponiveis,
    }, 'pesquisa de especificações')
    res.json(result)
  })

  // ANALISTA mantém os dados de concorrentes; ADMIN também.
  router.put('/vehicles/:id/specs', authorize(ROLES.ANALISTA, ROLES.ADMIN), validateBody(upsertSchema), (req, res) => {
    const id = readId(req, res)
    if (!id) return undefined
    const updated = catalog.upsertSpecs(id, req.body.especificacoes)
    if (!updated) return res.status(404).json({ error: 'Veículo não encontrado' })
    metrics.adminChanges.inc({ action: 'upsert_specs' })
    audit.record(req, 'VEHICLE_SPECS_UPSERT', { vehicle: id, atributos: req.body.especificacoes.map((s) => s.atributo) })
    return res.json({ veiculo: updated })
  })

  // Criar e remover veículos do catálogo é só do ADMIN.
  router.post('/vehicles', authorize(ROLES.ADMIN), validateBody(createSchema), (req, res) => {
    const created = catalog.create(req.body)
    if (!created) return res.status(409).json({ error: 'Veículo já existe' })
    metrics.adminChanges.inc({ action: 'create_vehicle' })
    audit.record(req, 'VEHICLE_CREATE', { vehicle: created.id })
    return res.status(201).json({ veiculo: created })
  })

  router.delete('/vehicles/:id', authorize(ROLES.ADMIN), (req, res) => {
    const id = readId(req, res)
    if (!id) return undefined
    if (!catalog.remove(id)) return res.status(404).json({ error: 'Veículo não encontrado' })
    metrics.adminChanges.inc({ action: 'delete_vehicle' })
    audit.record(req, 'VEHICLE_DELETE', { vehicle: id })
    return res.status(204).end()
  })

  return router
}
