import { Router } from 'express'
import { z } from 'zod'
import { validateBody } from '../middleware/validate.js'

// Eventos que o app mobile pode reportar. Lista fechada: nada de texto livre,
// nada de dado pessoal (LGPD), nada de localização.
const EVENTS = ['APP_START', 'MODEL_LOAD_FAILURE', 'API_ERROR', 'SESSION_EXPIRED']

const eventSchema = z.strictObject({
  event: z.enum(EVENTS),
  platform: z.enum(['android', 'ios', 'web']),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  screen: z.enum(['home', 'specs', 'report', 'login', 'search']).optional(),
})

export function telemetryRoutes({ metrics, limiter }) {
  const router = Router()
  router.post('/events', limiter, validateBody(eventSchema), (req, res) => {
    const { event, platform, appVersion, screen } = req.body
    metrics.clientEvents.inc({ event, platform })
    const level = event === 'MODEL_LOAD_FAILURE' || event === 'API_ERROR' ? 'error' : 'info'
    req.log[level]({ event: `MOBILE_${event}`, platform, appVersion, screen }, 'evento do app')
    res.status(202).end()
  })
  return router
}
