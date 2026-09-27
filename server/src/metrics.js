import client from 'prom-client'

export function createMetrics() {
  const registry = new client.Registry()
  registry.setDefaultLabels({ service: 'ford-specs-api' })
  client.collectDefaultMetrics({ register: registry })

  const counter = (name, help, labelNames = []) => new client.Counter({ name, help, labelNames, registers: [registry] })

  return {
    registry,
    httpRequests: counter('http_requests_total', 'Requisições HTTP por rota e status', ['method', 'route', 'status']),
    httpDuration: new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Latência das requisições HTTP',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [registry],
    }),
    logins: counter('auth_login_total', 'Tentativas de login por resultado', ['result']),
    authzDenied: counter('authz_denied_total', 'Requisições bloqueadas por autenticação/autorização', ['reason', 'route']),
    rateLimited: counter('rate_limit_hits_total', 'Requisições barradas pelo rate limit', ['limiter']),
    validationErrors: counter('validation_errors_total', 'Payloads rejeitados pela validação de entrada', ['route']),
    specSearches: counter('spec_search_total', 'Pesquisas de especificação', ['found']),
    missingAttributes: counter('spec_attributes_missing_total', 'Atributos pedidos e não disponíveis no catálogo'),
    adminChanges: counter('admin_changes_total', 'Alterações administrativas no catálogo', ['action']),
    clientEvents: counter('mobile_client_events_total', 'Eventos reportados pelo app mobile', ['event', 'platform']),
  }
}
