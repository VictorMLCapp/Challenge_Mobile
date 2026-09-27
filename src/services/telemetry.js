import { Capacitor } from '@capacitor/core'
import { apiRequest } from './api'

const APP_VERSION = '1.0.0'

// Só eventos de uma lista fechada, sem dado pessoal nem localização (LGPD).
// Falha de envio é ignorada: telemetria nunca pode derrubar o app.
export function reportEvent(event, screen) {
  const body = { event, platform: Capacitor.getPlatform(), appVersion: APP_VERSION }
  if (screen) body.screen = screen
  apiRequest('/api/telemetry/events', { method: 'POST', body }).catch(() => {})
}
