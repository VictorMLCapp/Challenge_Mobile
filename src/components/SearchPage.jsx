import { useEffect, useState } from 'react'
import { api, ApiError } from '../services/api'
import { toCsv } from '../services/csv'
import styles from './Intel.module.css'

// Ficha da Ranger Raptor usada como critério de validação do Desafio 01.
const RAPTOR_PRESET = {
  marca: 'Ford',
  modelo: 'Ranger',
  versao: 'Raptor',
  atributos: [
    'Motor', 'Potência', 'Torque', 'Câmbio', '0-100 km/h', 'Velocidade Máx.',
    'Tração', 'Suspensão Dianteira', 'Suspensão Traseira', 'Course Dianteiro', 'Course Traseiro',
    'Ângulo de Ataque', 'Comprimento', 'Largura', 'Altura', 'Entre-eixos', 'Capacidade de carga', 'Pneus',
  ],
}

const ROLE_LABEL = { VIEWER: 'Consulta', ANALISTA: 'Analista', ADMIN: 'Administrador' }
const CONTROL_CHARS = /[\p{C}<>]/u

function parseAttributes(text) {
  return [...new Set(text.split(/[\n;]+/).map((a) => a.trim().replace(/\s+/g, ' ')).filter(Boolean))]
}

function validate({ marca, modelo, versao, atributos }) {
  const problems = []
  for (const [label, value, max] of [['Marca', marca, 40], ['Modelo', modelo, 60], ['Versão', versao, 80]]) {
    if (!value.trim()) problems.push(`${label} é obrigatória.`)
    else if (value.length > max) problems.push(`${label} aceita até ${max} caracteres.`)
    else if (CONTROL_CHARS.test(value)) problems.push(`${label} tem caracteres não permitidos.`)
  }
  if (atributos.length === 0) problems.push('Informe pelo menos um atributo.')
  if (atributos.length > 100) problems.push('No máximo 100 atributos por pesquisa.')
  if (atributos.some((a) => a.length > 120 || CONTROL_CHARS.test(a))) problems.push('Algum atributo é longo demais ou tem caracteres não permitidos.')
  return problems
}

function formatValue(spec) {
  if (spec.status === 'NAO_DISPONIVEL') return 'Não disponível'
  return spec.unidade ? `${spec.valor} ${spec.unidade}` : String(spec.valor)
}

function downloadCsv(result) {
  const rows = [
    ['Marca', 'Modelo', 'Versão', 'Atributo', 'Valor', 'Unidade', 'Status'],
    ...result.especificacoes.map((s) => [
      result.consulta.marca, result.consulta.modelo, result.consulta.versao,
      s.atributo, s.valor ?? 'Não disponível', s.unidade ?? '', s.status,
    ]),
  ]
  const blob = new Blob([`\uFEFF${toCsv(rows)}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'especificacoes-concorrencia.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function SearchPage({ session, onBack, onLogout, onSessionExpired }) {
  const [form, setForm] = useState({ marca: '', modelo: '', versao: '', atributos: '' })
  const [vehicles, setVehicles] = useState([])
  const [result, setResult] = useState(null)
  const [problems, setProblems] = useState([])
  const [busy, setBusy] = useState(false)
  const [auditEvents, setAuditEvents] = useState(null)
  const { accessToken, user } = session

  function handleApiError(err) {
    if (err instanceof ApiError && err.status === 401) return onSessionExpired()
    if (err instanceof ApiError && err.details?.length) return setProblems(err.details.map((d) => `${d.campo}: ${d.mensagem}`))
    return setProblems([err.message])
  }

  useEffect(() => {
    api.vehicles(accessToken).then((data) => setVehicles(data.veiculos)).catch(handleApiError)
    if (user.role === 'ADMIN') api.auditEvents(accessToken).then((data) => setAuditEvents(data.eventos)).catch(handleApiError)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user.role])

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))

  function loadPreset() {
    setForm({ ...RAPTOR_PRESET, atributos: RAPTOR_PRESET.atributos.join('\n') })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const query = { marca: form.marca.trim(), modelo: form.modelo.trim(), versao: form.versao.trim(), atributos: parseAttributes(form.atributos) }
    const found = validate(query)
    setProblems(found)
    if (found.length) return
    setBusy(true)
    try {
      setResult(await api.searchSpecs(accessToken, query))
    } catch (err) {
      handleApiError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={onBack}>← Voltar</button>
        <span className={styles.roleBadge}>{user.name} · {ROLE_LABEL[user.role] ?? user.role}</span>
        <button type="button" className={styles.ghostBtn} onClick={onLogout}>Sair</button>
      </header>

      <main className={styles.container}>
        <p className={styles.eyebrow}>Desafio 01 · Inteligência competitiva</p>
        <h1 className={styles.title}>Pesquisa de especificações</h1>
        <p className={styles.lead}>
          Informe marca, modelo e versão e a lista de atributos que quer comparar, um por linha.
          A resposta vem sempre no mesmo formato. O que não existe no catálogo aparece como “Não disponível”.
        </p>

        <form className={`${styles.card} ${styles.form}`} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Marca</span>
              <input className={styles.input} list="marcas" maxLength={40} value={form.marca} onChange={update('marca')} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Modelo</span>
              <input className={styles.input} list="modelos" maxLength={60} value={form.modelo} onChange={update('modelo')} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Versão</span>
              <input className={styles.input} list="versoes" maxLength={80} value={form.versao} onChange={update('versao')} />
            </label>
          </div>
          <datalist id="marcas">{[...new Set(vehicles.map((v) => v.marca))].map((m) => <option key={m} value={m} />)}</datalist>
          <datalist id="modelos">{[...new Set(vehicles.map((v) => v.modelo))].map((m) => <option key={m} value={m} />)}</datalist>
          <datalist id="versoes">{vehicles.map((v) => <option key={v.id} value={v.versao} />)}</datalist>

          <label className={styles.field}>
            <span className={styles.label}>Atributos (um por linha)</span>
            <textarea className={styles.textarea} value={form.atributos} onChange={update('atributos')}
              placeholder={'Potência\nTorque\nAirbag (cada)'} />
            <span className={styles.hint}>{parseAttributes(form.atributos).length}/100 atributos</span>
          </label>

          {problems.length > 0 && (
            <div className={styles.error} role="alert">
              Corrija antes de pesquisar:
              <ul>{problems.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}

          <div className={styles.actions}>
            <button type="submit" className={styles.btnPrimary} disabled={busy}>{busy ? 'Pesquisando…' : 'Pesquisar'}</button>
            <button type="button" className={styles.ghostBtn} onClick={loadPreset}>Usar ficha da Ranger Raptor</button>
          </div>
        </form>

        {result && (
          <section className={styles.card} aria-live="polite">
            <p className={styles.eyebrow}>
              {result.encontrado ? `${result.veiculo.marca} ${result.veiculo.modelo} ${result.veiculo.versao}` : 'Veículo não encontrado no catálogo'}
            </p>
            <div className={styles.summary}>
              <div><span className={styles.summaryValue}>{result.totalAtributos}</span><span className={styles.summaryLabel}>Pedidos</span></div>
              <div><span className={styles.summaryValue}>{result.disponiveis}</span><span className={styles.summaryLabel}>Disponíveis</span></div>
              <div><span className={styles.summaryValue}>{result.naoDisponiveis}</span><span className={styles.summaryLabel}>Não disponíveis</span></div>
            </div>
            {!result.encontrado && result.candidatos.length > 0 && (
              <p className={styles.hint}>Versões conhecidas: {result.candidatos.map((c) => c.versao).join(' · ')}</p>
            )}
            <table className={styles.table}>
              <thead><tr><th>Atributo</th><th>Valor</th><th>Status</th></tr></thead>
              <tbody>
                {result.especificacoes.map((spec) => (
                  <tr key={spec.atributo}>
                    <td>{spec.atributo}</td>
                    <td className={spec.status === 'NAO_DISPONIVEL' ? styles.muted : undefined}>{formatValue(spec)}</td>
                    <td className={spec.status === 'DISPONIVEL' ? styles.ok : styles.missing}>
                      {spec.status === 'DISPONIVEL' ? 'Disponível' : 'Não disponível'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.veiculo && <p className={styles.hint}>Fonte: {result.veiculo.fonte}</p>}
            <div className={styles.actions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.ghostBtn} onClick={() => downloadCsv(result)}>Exportar CSV</button>
            </div>
          </section>
        )}

        {auditEvents && (
          <section className={styles.card}>
            <p className={styles.eyebrow}>Auditoria (somente Administrador)</p>
            {auditEvents.length === 0 && <p className={styles.hint}>Nenhuma alteração administrativa registrada.</p>}
            <ul className={styles.audit}>
              {auditEvents.map((e) => (
                <li key={`${e.requestId}-${e.action}`}>
                  <span className={styles.muted}>{new Date(e.timestamp).toLocaleString('pt-BR')}</span> · {e.action} · {e.role}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
