import { z } from 'zod'

// Valida req.body contra um schema zod. Campos desconhecidos são rejeitados
// pelos schemas (strictObject), então o handler só vê dados conhecidos.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      req.app.locals.metrics.validationErrors.inc({ route: req.baseUrl + (req.route?.path ?? '') })
      req.log.info({ event: 'VALIDATION_FAILED', route: req.originalUrl, issues: result.error.issues.length }, 'payload rejeitado')
      return res.status(400).json({
        error: 'Dados inválidos',
        detalhes: result.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
      })
    }
    req.body = result.data
    return next()
  }
}

// Texto livre curto: sem caracteres de controle, espaços normalizados.
export const safeText = (max) => z.string()
  .trim()
  .min(1)
  .max(max)
  .regex(/^[^\p{C}<>]+$/u, 'caracteres não permitidos')
  .transform((s) => s.replace(/\s+/g, ' '))
