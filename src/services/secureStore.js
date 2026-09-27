// Criptografia local (OWASP Mobile M9 – armazenamento inseguro).
// O token de sessão nunca fica em texto puro no localStorage da WebView:
// é cifrado com AES-GCM 256. A chave é gerada no aparelho como CryptoKey
// NÃO extraível e guardada no IndexedDB: o JavaScript usa a chave, mas não
// consegue ler os bytes dela, nem um dump do localStorage revela o token.
const DB_NAME = 'ford-secure-store'
const KEY_STORE = 'keys'
const KEY_ID = 'session-key-v1'
const PREFIX = 'ford.sec.'

let keyPromise

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(KEY_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idb(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, mode)
    const req = fn(tx.objectStore(KEY_STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadKey() {
  const db = await openDb()
  const existing = await idb(db, 'readonly', (s) => s.get(KEY_ID))
  if (existing) return existing
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  await idb(db, 'readwrite', (s) => s.put(key, KEY_ID))
  return key
}

function getKey() {
  keyPromise ??= loadKey().catch((err) => {
    keyPromise = undefined
    throw err
  })
  return keyPromise
}

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

export async function setSecureItem(name, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plain = new TextEncoder().encode(JSON.stringify(value))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await getKey(), plain)
  localStorage.setItem(PREFIX + name, JSON.stringify({ v: 1, iv: toB64(iv), ct: toB64(cipher) }))
}

export async function getSecureItem(name) {
  const raw = localStorage.getItem(PREFIX + name)
  if (!raw) return null
  try {
    const { iv, ct } = JSON.parse(raw)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, await getKey(), fromB64(ct))
    return JSON.parse(new TextDecoder().decode(plain))
  } catch {
    // Dado adulterado ou chave trocada: o GCM falha na autenticação e o item é descartado.
    localStorage.removeItem(PREFIX + name)
    return null
  }
}

export function removeSecureItem(name) {
  localStorage.removeItem(PREFIX + name)
}
