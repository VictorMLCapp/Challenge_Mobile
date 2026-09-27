
export function authenticate({ tokens, metrics }) {
  return (req, res, next) => {
    const header = req.get('authorization') ?? ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) {
      metrics.authzDenied.inc({ reason: 'missing_token', route: req.baseUrl + (req.route?.path ?? '') })
      return res.status(401).json({ error: 'Autenticação necessária' })
    }
    try {
      req.user = tokens.verify(token)
      req.log = req.log.child({ userId: req.user.sub, role: req.user.role })
      return next()
    } catch {
      metrics.authzDenied.inc({ reason: 'invalid_token', route: req.baseUrl })
      req.log.warn({ event: 'AUTH_INVALID_TOKEN' }, 'token inválido ou expirado')
      return res.status(401).json({ error: 'Sessão inválida ou expirada' })
    }
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      req.app.locals.metrics.authzDenied.inc({ reason: 'forbidden_role', route: req.baseUrl + (req.route?.path ?? '') })
      req.log.warn({ event: 'AUTHZ_DENIED', route: req.originalUrl, required: roles }, 'acesso negado por perfil')
      return res.status(403).json({ error: 'Acesso não autorizado' })
    }
    return next()
  }
}
