import { Router } from 'express'
import { z } from 'zod'
import { authorize } from '../middleware/auth.js'
import { ROLES } from '../auth/roles.js'

export function adminRoutes({ users, audit }) {
  const router = Router()
  router.use(authorize(ROLES.ADMIN))

  // Base da auditoria mensal de permissões: quem tem qual perfil.
  router.get('/users', (req, res) => res.json({ usuarios: users.list() }))

  router.get('/audit-events', (req, res) => {
    const limit = z.coerce.number().int().min(1).max(500).catch(100).parse(req.query.limit)
    res.json({ eventos: audit.list(limit) })
  })

  return router
}
