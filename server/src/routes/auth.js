import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { validateBody } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'

const loginSchema = z.strictObject({
  email: z.email().max(120).toLowerCase(),
  password: z.string().min(8).max(128),
})

// Hash fixo para comparar quando o e-mail não existe: o tempo de resposta
// fica igual e não revela quais contas existem.
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 12)

export function authRoutes({ users, tokens, lockout, metrics, loginLimiter }) {
  const router = Router()

  router.post('/login', loginLimiter, validateBody(loginSchema), async (req, res) => {
    const { email, password } = req.body

    if (lockout.isLocked(email)) {
      metrics.logins.inc({ result: 'locked' })
      req.log.warn({ event: 'LOGIN_BLOCKED' }, 'conta temporariamente bloqueada')
      return res.status(423).json({ error: 'Conta temporariamente bloqueada. Tente mais tarde.' })
    }

    const user = users.findByEmail(email)
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
    if (!user || !user.active || !ok) {
      const locked = lockout.fail(email)
      metrics.logins.inc({ result: 'failure' })
      req.log.warn({ event: 'LOGIN_FAILURE', locked }, 'falha de login')
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    lockout.succeed(email)
    metrics.logins.inc({ result: 'success' })
    req.log.info({ event: 'LOGIN_SUCCESS', userId: user.id, role: user.role }, 'login ok')
    return res.json({
      accessToken: tokens.sign(user),
      tokenType: 'Bearer',
      expiresIn: tokens.ttl,
      user: { id: user.id, name: user.name, role: user.role },
    })
  })

  router.post('/logout', authenticate({ tokens, metrics }), (req, res) => {
    tokens.revoke(req.user)
    req.log.info({ event: 'LOGOUT' }, 'token revogado')
    res.status(204).end()
  })

  router.get('/me', authenticate({ tokens, metrics }), (req, res) => {
    res.json({ id: req.user.sub, name: req.user.name, role: req.user.role, expiresAt: new Date(req.user.exp * 1000).toISOString() })
  })

  return router
}
