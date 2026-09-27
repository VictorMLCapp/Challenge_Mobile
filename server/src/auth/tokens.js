import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'

// JWT HS256 com expiração curta, issuer/audience fixos e denylist de jti
// (logout e contenção de incidente invalidam o token antes de expirar).
export function createTokenService(config) {
  const revoked = new Map() // jti -> exp (segundos)
  const options = { algorithm: 'HS256', expiresIn: config.JWT_TTL, issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE }

  function purge() {
    const now = Math.floor(Date.now() / 1000)
    for (const [jti, exp] of revoked) if (exp < now) revoked.delete(jti)
  }

  return {
    ttl: config.JWT_TTL,
    sign(user) {
      return jwt.sign({ sub: user.id, role: user.role, name: user.name }, config.JWT_SECRET, { ...options, jwtid: randomUUID() })
    },
    verify(token) {
      const payload = jwt.verify(token, config.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
      })
      if (revoked.has(payload.jti)) throw new jwt.JsonWebTokenError('token revogado')
      return payload
    },
    revoke(payload) {
      purge()
      revoked.set(payload.jti, payload.exp)
    },
  }
}
