import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from 'recharts'
import {
  status,
  competitors,
  competitorSummary,
  highlights,
  engineData,
  radarData,
  overallScores,
  featuresComparison,
  categoryGrades,
  upgradeRecommendations,
  CSV_FILENAME,
  TXT_FILENAME,
  EMPTY_HEADING,
  EMPTY_BODY,
  ERROR_MESSAGE,
  SCORE_DISCLAIMER,
} from '../data/ranger'
import styles from './ReportPage.module.css'
import fordLogo from '../assets/Ford-Logo-PNG-Isolated-Image.webp'

// ── COMPETITORS ─────────────────────────────────────────────────────────────
const PRINT_COMPETITOR_COLORS = {
  raptor: '#f54b2e',
  hilux: '#ef4444',
  amarok: '#3b82f6',
  s10: '#eab308',
  l200: '#8b5cf6',
}

const SCREEN_COMPETITOR_COLORS = {
  raptor: '#f54b2e',
  hilux: '#6b4d4d',
  amarok: '#4d5d7d',
  s10: '#5e5a46',
  l200: '#4a4d63',
}


// ── EXPORT HELPERS ───────────────────────────────────────────────────────────
function buildCSVContent() {
  const header = ['Especificação', ...competitors.map(c => c.name)]
  const rows = [header]
  rows.push(['--- Motor & Performance ---', ...competitors.map(() => '')])
  engineData.forEach(row => {
    rows.push([row.spec, row.raptor, row.hilux, row.amarok, row.s10, row.l200])
  })
  rows.push(['--- Score Geral ---', ...competitors.map(() => '')])
  overallScores.forEach(s => {
    const vals = competitors.map(c => s.name.includes(c.name.split(' ')[0]) || s.name === c.name ? s.value : '')
    rows.push(['Score', ...vals])
  })
  return rows.map(r => r.join(',')).join('\n')
}

function buildTXTContent() {
  const competitorLines = competitors
    .map(c => `  • ${c.name}${c.id === 'raptor' ? ' (referência)' : ''}`)
    .join('\n')
  return `FORD VISION - RELATÓRIO COMPARATIVO
${'='.repeat(60)}
Gerado em: ${new Date().toLocaleString('pt-BR')}
Análise: Ford Vision vs principais concorrentes do segmento

CONCORRENTES ANALISADOS
${'─'.repeat(60)}
${competitorLines}

SCORE GERAL
${'─'.repeat(60)}
${overallScores.map((s, i) => `  ${i + 1}º  ${s.name.padEnd(22)} ${s.value}/100`).join('\n')}

NOTAS POR CATEGORIA — RANGER RAPTOR
${'─'.repeat(60)}
${categoryGrades.map(g => `  ${g.category.padEnd(26)} ${g.grade}  (${g.score}/100) — ${g.rank}º de ${g.total}`).join('\n')}

UPGRADES RECOMENDADOS
${'─'.repeat(60)}
${upgradeRecommendations.map((u, i) => `  ${i + 1}. [${u.priority.toUpperCase()}] ${u.title} (${u.impact})\n     ${u.description}`).join('\n\n')}

${'='.repeat(60)}
Ford Motor Company - ${SCORE_DISCLAIMER}
`
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(8,10,14,0.95)',
  border: '1px solid rgba(245, 75, 46,0.3)',
  borderRadius: '4px',
  color: '#e8e2d6',
  fontSize: '0.75rem',
  fontFamily: 'Inter, sans-serif',
}

function gradeClass(grade) {
  if (grade.startsWith('A')) return styles.gradeA
  if (grade.startsWith('B')) return styles.gradeB
  if (grade.startsWith('C')) return styles.gradeC
  return styles.gradeD
}

function priorityClass(priority) {
  if (priority === 'alta') return styles.priorityAlta
  if (priority === 'média') return styles.priorityMedia
  return styles.priorityBaixa
}

function statusLabel(status) {
  if (status === 'lider') return 'Líder'
  if (status === 'competitivo') return 'Competitivo'
  if (status === 'melhorar') return 'A melhorar'
  return 'Trade-off'
}

export default function ReportPage({ onBack, onHome }) {
  const [activeCategory, setActiveCategory] = useState(0)
  const [exporting, setExporting] = useState(null)
  const [isPrintingReport, setIsPrintingReport] = useState(false)

  function exportCSV() {
    if (status !== 'ok') return
    setExporting('csv')
    const content = buildCSVContent()
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = CSV_FILENAME
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setExporting(null), 1200)
  }

  function exportTXT() {
    if (status !== 'ok') return
    setExporting('txt')
    const content = buildTXTContent()
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = TXT_FILENAME
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setExporting(null), 1200)
  }

  function exportPDF() {
    setExporting('pdf')
    setIsPrintingReport(true)
    window.print()
    setTimeout(() => {
      setIsPrintingReport(false)
      setExporting(null)
    }, 2000)
  }

  const isVisualPrintMode = exporting === 'pdf' || isPrintingReport
  const palette = isVisualPrintMode ? PRINT_COMPETITOR_COLORS : SCREEN_COMPETITOR_COLORS
  const competitorPalette = competitors.map(c => ({ ...c, color: c.id === 'raptor' ? palette.raptor : palette[c.id] }))
  const rankedScores = overallScores.map(score => ({ ...score, fill: score.name.includes('Ranger') ? palette.raptor : palette[score.name.includes('Amarok') ? 'amarok' : score.name.includes('S10') ? 's10' : score.name.includes('Hilux') ? 'hilux' : 'l200'] }))
  const competitorNames = competitors.map(c => c.short)
  const cat = featuresComparison[activeCategory]
  const projectedScore = Math.min(
    99,
    91 + upgradeRecommendations.reduce((sum, u) => sum + (parseInt(u.impact, 10) || 0), 0),
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.logoBtn} onClick={onHome} aria-label="Home">
            <img src={fordLogo} alt="Ford" className={styles.logoImg} />
          </button>
          <div className={styles.headerTitle}>
            <span className={styles.headerSub}>FORD VISION</span>
            <span className={styles.headerMain}>Relatório Comparativo</span>
          </div>
        </div>
        <nav className={styles.headerRight}>
          <div className={styles.exportGroup}>
            <button
              className={`${styles.exportBtn} ${exporting === 'csv' ? styles.exportBtnActive : ''}`}
              onClick={exportCSV}
            >
              <span className={styles.exportIcon}>⬇</span>
              CSV
            </button>
            <button
              className={`${styles.exportBtn} ${exporting === 'txt' ? styles.exportBtnActive : ''}`}
              onClick={exportTXT}
            >
              <span className={styles.exportIcon}>⬇</span>
              TXT
            </button>
            <button
              className={`${styles.exportBtn} ${styles.exportBtnPdf} ${exporting === 'pdf' ? styles.exportBtnActive : ''}`}
              onClick={exportPDF}
            >
              <span className={styles.exportIcon}>⬇</span>
              PDF
            </button>
          </div>
          <button className={styles.backBtn} onClick={onBack}>← Voltar</button>
        </nav>
      </header>

      <div className={styles.scroll}>
        {status === 'empty' && (
          <>
            <h2 className="emptyHeading">{EMPTY_HEADING}</h2>
            <p className="emptyBody">{EMPTY_BODY}</p>
          </>
        )}
        {status === 'error' && (
          <p className="emptyBody">{ERROR_MESSAGE}</p>
        )}
        {status === 'ok' && (
        <>
        <section className={styles.heroStrip}>
          <div className={styles.heroLabel}>
            <span className={styles.heroEyebrow}>Análise Competitiva · Segmento Pickup Premium</span>
            <h1 className={styles.heroTitle}>RANGER <span>RAPTOR</span></h1>
            <p className={styles.heroDesc}>{competitorSummary}</p>
          </div>
          <div className={styles.heroGrid}>
            {highlights.map(h => (
              <div key={h.label} className={styles.heroCard}>
                <span className={styles.heroCardIcon}>{h.icon}</span>
                <span className={styles.heroCardValue}>{h.value}</span>
                <span className={styles.heroCardLabel}>{h.label}</span>
                <span className={styles.heroCardSub}>{h.sub}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.competitorLegend}>
          {competitorPalette.map(c => (
            <div key={c.id} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: c.color }} />
              <span className={styles.legendName}>{c.name}</span>
              {c.id === 'raptor' && <span className={styles.legendBadge}>Referência</span>}
            </div>
          ))}
        </section>

        <section className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <div className={styles.chartCardHeader}>
              <span className={styles.chartCardTitle}>Score por Dimensão</span>
              <span className={styles.chartCardSub}>Raptor vs 4 concorrentes diretos</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#5a6478', fontSize: 10, fontFamily: 'Inter' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Raptor" dataKey="Raptor" stroke={palette.raptor} fill={palette.raptor} fillOpacity={0.2} strokeWidth={2.5} />
                <Radar name="Hilux" dataKey="Hilux" stroke={palette.hilux} fill={palette.hilux} fillOpacity={0.08} strokeWidth={1.5} />
                <Radar name="Amarok" dataKey="Amarok" stroke={palette.amarok} fill={palette.amarok} fillOpacity={0.08} strokeWidth={1.5} />
                <Radar name="S10" dataKey="S10" stroke={palette.s10} fill={palette.s10} fillOpacity={0.05} strokeWidth={1.5} />
                <Radar name="L200" dataKey="L200" stroke={palette.l200} fill={palette.l200} fillOpacity={0.05} strokeWidth={1.5} />
                <Legend wrapperStyle={{ fontSize: '0.65rem', color: '#5a6478', fontFamily: 'Inter' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartCardHeader}>
              <span className={styles.chartCardTitle}>Especificações Técnicas</span>
              <span className={styles.chartCardSub}>Valores absolutos por modelo</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="spec" tick={{ fill: '#5a6478', fontSize: 9, fontFamily: 'Inter' }} />
                <YAxis tick={{ fill: '#5a6478', fontSize: 9, fontFamily: 'Inter' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '0.65rem', color: '#5a6478', fontFamily: 'Inter' }} />
                <Bar dataKey="raptor" name="Raptor" fill={palette.raptor} radius={[2, 2, 0, 0]} />
                <Bar dataKey="hilux" name="Hilux" fill={palette.hilux} radius={[2, 2, 0, 0]} />
                <Bar dataKey="amarok" name="Amarok" fill={palette.amarok} radius={[2, 2, 0, 0]} />
                <Bar dataKey="s10" name="S10" fill={palette.s10} radius={[2, 2, 0, 0]} />
                <Bar dataKey="l200" name="L200" fill={palette.l200} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartCardHeader}>
              <span className={styles.chartCardTitle}>Ranking Geral</span>
              <span className={styles.chartCardSub}>Score consolidado do segmento</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart
                innerRadius="25%"
                outerRadius="90%"
                data={rankedScores}
                startAngle={180}
                endAngle={-180}
              >
                <RadialBar
                  minAngle={15}
                  background={{ fill: 'rgba(255,255,255,0.03)' }}
                  dataKey="value"
                  label={{ fill: '#e8e2d6', fontSize: 10, fontFamily: 'Inter' }}
                  cornerRadius={8}
                  clockWise
                />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '0.68rem', color: '#5a6478', fontFamily: 'Inter' }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}/100`, 'Score']} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={styles.featuresSection}>
          <div className={styles.featuresSectionHeader}>
            <h2 className={styles.featuresSectionTitle}>Equipamentos vs Concorrentes</h2>
            <div className={styles.featuresTabs}>
              {featuresComparison.map((c, i) => (
                <button
                  key={i}
                  className={`${styles.featuresTab} ${activeCategory === i ? styles.featuresTabActive : ''}`}
                  onClick={() => setActiveCategory(i)}
                >
                  {c.icon} {c.category}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.featuresTable}>
            <div className={`${styles.featuresTableHead} ${styles.featuresTableHeadWide}`}>
              <div className={styles.featuresCol}>EQUIPAMENTO</div>
              {competitorNames.map(v => (
                <div key={v} className={styles.featuresColVar}>{v}</div>
              ))}
            </div>
            {cat.items.map((item, i) => (
              <div key={i} className={`${styles.featuresRow} ${styles.featuresRowWide} ${i % 2 === 0 ? styles.featuresRowAlt : ''}`}>
                <div className={styles.featuresItemName}>{item.name}</div>
                {item.values ? (
                  item.values.map((v, vi) => (
                    <div key={vi} className={styles.featuresItemCell}>
                      <span className={`${styles.featuresValue} ${vi === 0 ? styles.featuresValueHighlight : ''}`}>{v}</span>
                    </div>
                  ))
                ) : (
                  [item.raptor, item.hilux, item.amarok, item.s10, item.l200].map((has, vi) => (
                    <div key={vi} className={styles.featuresItemCell}>
                      {has
                        ? <span className={`${styles.checkYes} ${vi === 0 ? styles.checkYesHighlight : ''}`}>✓</span>
                        : <span className={styles.checkNo}>—</span>}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.gradesSection}>
          <div className={styles.gradesSectionHeader}>
            <div>
              <h2 className={styles.gradesSectionTitle}>Notas & Diagnóstico</h2>
              <p className={styles.gradesSectionSub}>
                Avaliação do Ranger Raptor em cada categoria contra o segmento
              </p>
            </div>
            <div className={styles.overallGradeCard}>
              <span className={styles.overallGradeLabel}>NOTA GERAL</span>
              <span className={styles.overallGradeValue}>A</span>
              <span className={styles.overallGradeScore}>91/100 · 1º lugar</span>
            </div>
          </div>

          <div className={styles.gradesGrid}>
            {categoryGrades.map(g => (
              <div key={g.category} className={styles.gradeCard}>
                <div className={styles.gradeCardTop}>
                  <span className={`${styles.gradeLetter} ${gradeClass(g.grade)}`}>{g.grade}</span>
                  <span className={`${styles.gradeStatus} ${styles[`status_${g.status}`]}`}>
                    {statusLabel(g.status)}
                  </span>
                </div>
                <h3 className={styles.gradeCardTitle}>{g.category}</h3>
                <div className={styles.gradeCardMeta}>
                  <span className={styles.gradeCardScore}>{g.score}/100</span>
                  <span className={styles.gradeCardRank}>{g.rank}º de {g.total}</span>
                </div>
                <div className={styles.gradeBar}>
                  <div className={styles.gradeBarFill} style={{ width: `${g.score}%` }} />
                </div>
                {g.gap && (
                  <p className={styles.gradeGap}>{g.gap}</p>
                )}
                {!g.gap && (
                  <p className={styles.gradeGapLeader}>Líder absoluto do segmento</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.upgradeSection}>
          <div className={styles.upgradeSectionHeader}>
            <div>
              <h2 className={styles.upgradeSectionTitle}>Upgrades Recomendados</h2>
              <p className={styles.upgradeSectionSub}>
                Melhorias sugeridas para elevar a competitividade do Ranger Raptor
              </p>
            </div>
            <div className={styles.projectedScore}>
              <span className={styles.projectedLabel}>SCORE PROJETADO</span>
              <span className={styles.projectedValue}>{projectedScore}/100</span>
              <span className={styles.projectedDelta}>+{projectedScore - 91} pts com todos os upgrades</span>
            </div>
          </div>

          <div className={styles.upgradeList}>
            {upgradeRecommendations.map((u, i) => (
              <article key={i} className={styles.upgradeCard}>
                <div className={styles.upgradeCardHeader}>
                  <span className={`${styles.upgradePriority} ${priorityClass(u.priority)}`}>
                    {u.priority}
                  </span>
                  <span className={styles.upgradeImpact}>{u.impact}</span>
                  <span className={styles.upgradeCategory}>{u.category}</span>
                </div>
                <h3 className={styles.upgradeTitle}>{u.title}</h3>
                <p className={styles.upgradeDesc}>{u.description}</p>
                <ul className={styles.upgradeItems}>
                  {u.items.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className={styles.upgradeRef}>
                  <span>Ref:</span> {u.competitorRef}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className={styles.reportFooter}>
          <span>Análise comparativa · {SCORE_DISCLAIMER}</span>
          <span>{competitors.map(c => c.name).join(' · ')}</span>
          <span>© {new Date().getFullYear()} Ford Motor Company</span>
        </footer>
        </>
        )}
      </div>
    </div>
  )
}
