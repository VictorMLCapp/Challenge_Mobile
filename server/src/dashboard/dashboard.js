// Painel de monitoramento de segurança: lê /metrics (formato Prometheus) e
// /security-events a cada 3 s e calcula as mesmas expressões dos alertas do
// Prometheus (infra/prometheus/alerts.yml) sobre uma janela deslizante de 5 min.
const POLL_MS = 3000
const WINDOW_MS = 5 * 60 * 1000
const history = [] // { t, m: Map<serie, valor> }

const COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)']

function parseMetrics(text) {
  const map = new Map()
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const i = line.lastIndexOf(' ')
    map.set(line.slice(0, i), Number(line.slice(i + 1)))
  }
  return map
}

function labelsOf(key) {
  const out = {}
  const m = key.match(/\{(.*)\}/)
  if (!m) return out
  for (const part of m[1].matchAll(/(\w+)="([^"]*)"/g)) out[part[1]] = part[2]
  return out
}

// Soma as séries de uma métrica que passam no filtro de labels.
function sum(m, name, filter = () => true) {
  let total = 0
  for (const [key, v] of m) {
    const base = key.split('{')[0]
    if (base === name && filter(labelsOf(key))) total += v
  }
  return total
}

function sampleAgo(ms) {
  const target = Date.now() - ms
  return history.find((h) => h.t >= target) ?? history[0]
}

// Equivalente ao increase(métrica[janela]) do PromQL.
function increase(name, filter, windowMs = WINDOW_MS) {
  if (history.length < 2) return 0
  const now = history[history.length - 1]
  const old = sampleAgo(windowMs)
  return Math.max(0, sum(now.m, name, filter) - sum(old.m, name, filter))
}

function p95(windowMs = WINDOW_MS) {
  if (history.length < 2) return null
  const now = history[history.length - 1].m
  const old = sampleAgo(windowMs).m
  const buckets = new Map()
  for (const [key, v] of now) {
    if (!key.startsWith('http_request_duration_seconds_bucket')) continue
    const le = labelsOf(key).le
    buckets.set(le, (buckets.get(le) ?? 0) + v - (old.get(key) ?? 0))
  }
  const sorted = [...buckets].map(([le, c]) => [le === '+Inf' ? Infinity : Number(le), c]).sort((a, b) => a[0] - b[0])
  const total = sorted.at(-1)?.[1] ?? 0
  if (!total) return null
  const target = total * 0.95
  let prevLe = 0
  let prevCount = 0
  for (const [le, count] of sorted) {
    if (count >= target) {
      if (le === Infinity) return prevLe
      return prevLe + (le - prevLe) * ((target - prevCount) / Math.max(count - prevCount, 1e-9))
    }
    prevLe = le
    prevCount = count
  }
  return null
}

function rate(name, filter, windowMs = 30_000) {
  if (history.length < 2) return 0
  const now = history[history.length - 1]
  const old = sampleAgo(windowMs)
  const dt = (now.t - old.t) / 1000
  return dt > 0 ? Math.max(0, sum(now.m, name, filter) - sum(old.m, name, filter)) / dt : 0
}

const fmt = {
  int: (v) => Math.round(v).toLocaleString('pt-BR'),
  pct: (v) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
  ms: (v) => (v === null ? '–' : `${Math.round(v * 1000)} ms`),
  mb: (v) => `${(v / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} MB`,
}

// Série temporal por intervalo de coleta (delta entre amostras consecutivas).
function deltaSeries(name, filter) {
  const pts = []
  for (let i = 1; i < history.length; i += 1) {
    pts.push({ t: history[i].t, v: Math.max(0, sum(history[i].m, name, filter) - sum(history[i - 1].m, name, filter)) })
  }
  return pts
}

function lineChart(el, series) {
  const W = el.clientWidth || 500
  const H = 160
  const pad = { l: 34, r: 8, t: 8, b: 22 }
  const all = series.flatMap((s) => s.points)
  const max = Math.max(1, ...all.map((p) => p.v))
  const t0 = Date.now() - WINDOW_MS
  const x = (t) => pad.l + ((t - t0) / WINDOW_MS) * (W - pad.l - pad.r)
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const ticks = [0, max / 2, max]
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img">`
  for (const tv of ticks) {
    svg += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(tv)}" y2="${y(tv)}" stroke="var(--grid)" stroke-width="1"/>`
    svg += `<text x="${pad.l - 6}" y="${y(tv) + 4}" fill="var(--muted)" font-size="10" text-anchor="end">${Math.round(tv)}</text>`
  }
  for (const m of [5, 4, 3, 2, 1, 0]) {
    svg += `<text x="${x(Date.now() - m * 60000)}" y="${H - 6}" fill="var(--muted)" font-size="10" text-anchor="middle">${m ? `-${m}m` : 'agora'}</text>`
  }
  series.forEach((s, i) => {
    const pts = s.points.filter((p) => p.t >= t0)
    if (pts.length < 2) return
    const d = pts.map((p, j) => `${j ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('')
    svg += `<path d="${d}" fill="none" stroke="${COLORS[i]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
  })
  svg += `<line class="xh" y1="${pad.t}" y2="${H - pad.b}" stroke="var(--axis)" stroke-width="1" visibility="hidden"/></svg>`
  svg += `<div class="legend">${series.map((s, i) => `<span><i style="background:${COLORS[i]}"></i>${s.name}</span>`).join('')}</div>`
  el.innerHTML = svg
  el.onmousemove = (ev) => {
    const rect = el.querySelector('svg').getBoundingClientRect()
    const t = t0 + ((ev.clientX - rect.left) / rect.width * W - pad.l) / (W - pad.l - pad.r) * WINDOW_MS
    const near = series[0]?.points.reduce((a, p) => (Math.abs(p.t - t) < Math.abs(a.t - t) ? p : a), { t: Infinity })
    if (!near || !Number.isFinite(near.t)) return
    const xh = el.querySelector('.xh')
    xh.setAttribute('x1', x(near.t)); xh.setAttribute('x2', x(near.t)); xh.setAttribute('visibility', 'visible')
    const tip = document.getElementById('tip')
    tip.innerHTML = `<b>${new Date(near.t).toLocaleTimeString('pt-BR')}</b>` + series.map((s, i) => {
      const p = s.points.find((q) => q.t === near.t)
      return `<div><i style="background:${COLORS[i]}"></i>${s.name}: ${p ? p.v : 0}</div>`
    }).join('')
    tip.hidden = false
    tip.style.left = `${ev.clientX + 14}px`
    tip.style.top = `${ev.clientY + 14}px`
  }
  el.onmouseleave = () => {
    document.getElementById('tip').hidden = true
    el.querySelector('.xh')?.setAttribute('visibility', 'hidden')
  }
}

function bars(el, rows) {
  const max = Math.max(1, ...rows.map((r) => r.v))
  el.innerHTML = rows.map((r) => `
    <div class="bar-row" title="${r.name}: ${r.v}">
      <span>${r.name}</span>
      <div class="bar-track"><div class="bar" style="width:${(r.v / max) * 100}%"></div></div>
      <span class="bar-val">${fmt.int(r.v)}</span>
    </div>`).join('')
}

const RULES = [
  { name: 'BruteForceSuspeito', sev: 'critical', rule: 'falhas de login > 20 em 5 min', value: () => increase('auth_login_total', (l) => l.result === 'failure' || l.result === 'locked'), limit: 20 },
  { name: 'RateLimitDisparando', sev: 'warning', rule: 'bloqueios por rate limit > 10 em 5 min', value: () => increase('rate_limit_hits_total'), limit: 10 },
  { name: 'TentativaDeEscalacaoDePrivilegio', sev: 'critical', rule: '403 por perfil > 10 em 10 min', value: () => increase('authz_denied_total', (l) => l.reason === 'forbidden_role', 10 * 60 * 1000), limit: 10 },
  { name: 'TokensInvalidosEmMassa', sev: 'warning', rule: 'JWT inválido > 30 em 10 min', value: () => increase('authz_denied_total', (l) => l.reason === 'invalid_token', 10 * 60 * 1000), limit: 30 },
  { name: 'AlteracaoAdministrativa', sev: 'info', rule: 'qualquer alteração no catálogo (5 min)', value: () => increase('admin_changes_total'), limit: 0 },
  { name: 'TaxaDeErro5xxAlta', sev: 'critical', rule: '5xx > 5% das requisições', value: () => { const all = increase('http_requests_total'); return all ? increase('http_requests_total', (l) => l.status.startsWith('5')) / all : 0 }, limit: 0.05, fmt: fmt.pct },
  { name: 'LatenciaP95Alta', sev: 'warning', rule: 'p95 > 500 ms', value: () => p95() ?? 0, limit: 0.5, fmt: fmt.ms },
  { name: 'CpuAlta', sev: 'warning', rule: 'CPU do processo > 80%', value: () => rate('process_cpu_seconds_total', undefined, 60_000), limit: 0.8, fmt: fmt.pct },
  { name: 'FalhaCarregamentoModelo3D', sev: 'warning', rule: 'MODEL_LOAD_FAILURE > 5 em 15 min', value: () => increase('mobile_client_events_total', (l) => l.event === 'MODEL_LOAD_FAILURE', 15 * 60 * 1000), limit: 5 },
]

const SEV_UI = {
  critical: { icon: '▲', label: 'CRÍTICO', color: 'var(--critical)', cls: '' },
  warning: { icon: '!', label: 'ATENÇÃO', color: 'var(--warning)', cls: 'warn' },
  info: { icon: 'i', label: 'INFO', color: 'var(--s1)', cls: 'info' },
}

function renderAlerts() {
  const el = document.getElementById('alerts')
  el.innerHTML = RULES.map((r) => {
    const v = r.value()
    const firing = v > r.limit
    const ui = SEV_UI[r.sev]
    const shown = (r.fmt ?? fmt.int)(v)
    return `<li class="${firing ? `firing ${ui.cls}` : ''}">
      <span class="icon" style="color:${firing ? ui.color : 'var(--good)'}">${firing ? ui.icon : '✓'}</span>
      <div><div class="name">${r.name}</div><div class="rule">${r.rule} · atual: ${shown}</div></div>
      <span class="state" style="color:${firing ? ui.color : 'var(--good)'}">${firing ? `DISPARADO · ${ui.label}` : 'OK'}</span>
    </li>`
  }).join('')
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function renderEvents(events) {
  document.getElementById('events').innerHTML = events.map((e) => {
    const detail = e.action ?? e.route ?? e.req?.url ?? ''
    return `<tr>
      <td>${escapeHtml(new Date(e.timestamp).toLocaleTimeString('pt-BR'))}</td>
      <td class="lvl-${escapeHtml(e.level)}">${escapeHtml(e.level)}</td>
      <td class="ev">${escapeHtml(e.event === 'AUDIT' ? `AUDIT · ${e.action}` : e.event)}</td>
      <td>${escapeHtml(e.role ?? '–')}</td>
      <td>${escapeHtml(detail)}</td>
      <td>${escapeHtml(e.ip ?? '–')}</td>
      <td>${escapeHtml((e.req?.id ?? e.requestId ?? '').slice(0, 8))}</td>
    </tr>`
  }).join('')
}

function render() {
  const now = history.at(-1).m
  const all = increase('http_requests_total')
  document.getElementById('t-rpm').textContent = fmt.int(rate('http_requests_total', undefined, 60_000) * 60)
  document.getElementById('t-5xx').textContent = fmt.pct(all ? increase('http_requests_total', (l) => l.status.startsWith('5')) / all : 0)
  document.getElementById('t-fail').textContent = fmt.int(increase('auth_login_total', (l) => l.result !== 'success'))
  document.getElementById('t-p95').textContent = fmt.ms(p95())
  document.getElementById('t-cpu').textContent = fmt.pct(rate('process_cpu_seconds_total', undefined, 15_000))
  document.getElementById('t-mem').textContent = fmt.mb(sum(now, 'process_resident_memory_bytes'))

  lineChart(document.getElementById('c-logins'), ['success', 'failure', 'locked'].map((r) => ({
    name: { success: 'sucesso', failure: 'falha', locked: 'conta bloqueada' }[r],
    points: deltaSeries('auth_login_total', (l) => l.result === r),
  })))
  lineChart(document.getElementById('c-denied'), [
    { name: 'sem token (401)', points: deltaSeries('authz_denied_total', (l) => l.reason === 'missing_token') },
    { name: 'token inválido (401)', points: deltaSeries('authz_denied_total', (l) => l.reason === 'invalid_token') },
    { name: 'perfil sem permissão (403)', points: deltaSeries('authz_denied_total', (l) => l.reason === 'forbidden_role') },
    { name: 'rate limit (429)', points: deltaSeries('rate_limit_hits_total') },
    { name: 'payload inválido (400)', points: deltaSeries('validation_errors_total') },
  ])
  lineChart(document.getElementById('c-status'), ['2', '4', '5'].map((c) => ({
    name: `${c}xx`,
    points: deltaSeries('http_requests_total', (l) => l.status.startsWith(c)),
  })))
  bars(document.getElementById('c-mobile'), [
    { name: 'APP_START (mobile)', v: sum(now, 'mobile_client_events_total', (l) => l.event === 'APP_START') },
    { name: 'MODEL_LOAD_FAILURE (mobile)', v: sum(now, 'mobile_client_events_total', (l) => l.event === 'MODEL_LOAD_FAILURE') },
    { name: 'SESSION_EXPIRED (mobile)', v: sum(now, 'mobile_client_events_total', (l) => l.event === 'SESSION_EXPIRED') },
    { name: 'Pesquisas de specs', v: sum(now, 'spec_search_total') },
    { name: 'Atributos não disponíveis', v: sum(now, 'spec_attributes_missing_total') },
    { name: 'Alterações administrativas', v: sum(now, 'admin_changes_total') },
  ])
  renderAlerts()
}

async function tick() {
  const status = document.getElementById('status')
  try {
    const [metricsText, events] = await Promise.all([
      fetch('/metrics').then((r) => r.text()),
      fetch('/security-events').then((r) => r.json()),
    ])
    history.push({ t: Date.now(), m: parseMetrics(metricsText) })
    while (history.length && history[0].t < Date.now() - 15 * 60 * 1000) history.shift()
    render()
    renderEvents(events.eventos)
    status.textContent = `API online · ${new Date().toLocaleTimeString('pt-BR')}`
    status.className = 'pill ok'
  } catch {
    status.textContent = 'API indisponível'
    status.className = 'pill err'
  }
}

tick()
setInterval(tick, POLL_MS)
