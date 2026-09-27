// Trilha de auditoria das ações administrativas (não-repúdio). Vai para o log
// estruturado e fica num buffer consultável por ADMIN.
export function createAuditTrail(logger, size = 500) {
  const events = []
  return {
    record(req, action, details = {}) {
      const event = {
        timestamp: new Date().toISOString(),
        action,
        userId: req.user?.sub ?? null,
        role: req.user?.role ?? null,
        requestId: req.id,
        details,
      }
      events.push(event)
      if (events.length > size) events.shift()
      logger.info({ event: 'AUDIT', ...event }, `auditoria: ${action}`)
      return event
    },
    list: (limit = 100) => events.slice(-limit).reverse(),
  }
}
