import { loadConfig } from './config.js'
import { createLogger } from './logger.js'
import { createMetrics } from './metrics.js'
import { loadUserStore } from './auth/users.js'
import { loadCatalog } from './catalog/catalog.js'
import { createApp, createMetricsApp } from './app.js'

const config = loadConfig()
const logger = createLogger(config)
const metrics = createMetrics()

const app = createApp({
  config,
  logger,
  metrics,
  users: loadUserStore(config.USERS_FILE),
  catalog: loadCatalog(config.CATALOG_FILE),
})

const server = app.listen(config.PORT, () => {
  logger.info({ event: 'SERVER_START', port: config.PORT, env: config.NODE_ENV }, 'API no ar')
})
const metricsServer = createMetricsApp(metrics, logger).listen(config.METRICS_PORT, config.METRICS_HOST, () => {
  logger.info({ event: 'METRICS_START', host: config.METRICS_HOST, port: config.METRICS_PORT }, `métricas e painel em http://${config.METRICS_HOST}:${config.METRICS_PORT}/dashboard/`)
})

function shutdown(signal) {
  logger.info({ event: 'SERVER_STOP', signal }, 'encerrando')
  metricsServer.close()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
