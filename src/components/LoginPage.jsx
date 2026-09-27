import { useState } from 'react'
import { api, ApiError } from '../services/api'
import { saveSession } from '../services/session'
import styles from './Intel.module.css'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage({ onBack, onLoggedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    // Mesmas regras do servidor, só para dar retorno rápido. Quem decide é a API.
    if (!EMAIL.test(email) || email.length > 120) return setError('Informe um e-mail válido.')
    if (password.length < 8 || password.length > 128) return setError('A senha precisa ter entre 8 e 128 caracteres.')
    setBusy(true)
    try {
      const result = await api.login(email.trim(), password)
      setPassword('')
      onLoggedIn(await saveSession(result))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha inesperada no login.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={onBack}>← Voltar</button>
        <span className={styles.navTitle}>Ford Vision · Acesso</span>
      </header>
      <main className={styles.container}>
        <p className={styles.eyebrow}>Inteligência competitiva</p>
        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.lead}>
          A pesquisa de especificações da concorrência exige login. A sessão expira em 15 minutos
          e o token fica cifrado no aparelho.
        </p>
        <form className={`${styles.card} ${styles.form}`} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            <span className={styles.label}>E-mail</span>
            <input className={styles.input} type="email" autoComplete="username" inputMode="email"
              maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Senha</span>
            <input className={styles.input} type="password" autoComplete="current-password"
              maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actions}>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
          </div>
        </form>
      </main>
    </div>
  )
}
