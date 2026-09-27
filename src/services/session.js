import { getSecureItem, setSecureItem, removeSecureItem } from './secureStore'

const KEY = 'session'

export async function saveSession({ accessToken, user, expiresIn }) {
  const minutes = Number.parseInt(expiresIn, 10) || 15
  const session = { accessToken, user, expiresAt: Date.now() + minutes * 60_000 }
  await setSecureItem(KEY, session)
  return session
}

export async function loadSession() {
  const session = await getSecureItem(KEY)
  if (!session || session.expiresAt <= Date.now()) {
    removeSecureItem(KEY)
    return null
  }
  return session
}

export function clearSession() {
  removeSecureItem(KEY)
}
