// Bloqueio de conta após N falhas seguidas (defesa contra brute force
// distribuído, que o rate limit por IP sozinho não pega).
export function createLockout({ maxFailures, lockMs, now = () => Date.now() }) {
  const state = new Map() // email -> { failures, lockedUntil }

  return {
    isLocked(email) {
      const entry = state.get(email)
      return Boolean(entry && entry.lockedUntil > now())
    },
    fail(email) {
      const entry = state.get(email) ?? { failures: 0, lockedUntil: 0 }
      entry.failures += 1
      if (entry.failures >= maxFailures) {
        entry.lockedUntil = now() + lockMs
        entry.failures = 0
      }
      state.set(email, entry)
      return entry.lockedUntil > now()
    },
    succeed(email) {
      state.delete(email)
    },
  }
}
