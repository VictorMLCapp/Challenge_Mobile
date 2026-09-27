import record from './ranger.json' with { type: 'json' }

export const CSV_FILENAME = 'ford-ranger-raptor-relatorio.csv'
export const TXT_FILENAME = 'ford-ranger-raptor-relatorio.txt'
export const EMPTY_HEADING = 'Ficha da Ranger Raptor indisponível'
export const EMPTY_BODY = 'Os fatos do veículo não estão em src/data/ranger.json. Confira o arquivo e recarregue a página.'
export const ERROR_MESSAGE = 'Não foi possível mostrar a Ranger Raptor. Recarregue a página.'
export const SCORE_DISCLAIMER = 'Dados mockados para demonstração'

const SPEC_LABELS = ['Motor', 'Potência', 'Torque', 'Tração', '0-100 km/h']
const HIGHLIGHT_LABELS = ['Potência', 'Torque', '0-100 km/h']
const RAPTOR_ENGINE_CELLS = {
  'Potência (cv)': 'power',
  'Torque (Nm)': 'torque',
  '0-100 (s)': 'zero',
  'Course (mm)': 'course',
  'Carga (kg)': 'payload',
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function readArray(value) {
  return Array.isArray(value) ? value : []
}

function groupThousands(value) {
  const digits = String(Math.trunc(Math.abs(value)))
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return value < 0 ? `-${grouped}` : grouped
}

function decimalComma(value) {
  return String(value).replace('.', ',')
}

function formatEngine(vehicle) {
  return `${vehicle.engine.layout} ${vehicle.engine.fuel}`
}

export function formatPower(cv, atRpm) {
  return `${cv} cv @ ${groupThousands(atRpm)} rpm`
}

function formatTorque(vehicle) {
  const min = groupThousands(vehicle.torque.rpmMin)
  const max = groupThousands(vehicle.torque.rpmMax)
  return `${vehicle.torque.nm} Nm @ ${min}-${max} rpm`
}

function formatZeroToHundred(vehicle) {
  return `${decimalComma(vehicle.zeroToHundred.seconds)} ${vehicle.zeroToHundred.unit}`
}

function resolveStatus(vehicle) {
  if (!isPlainObject(vehicle)) return 'empty'
  const engine = vehicle.engine
  const power = vehicle.power
  const torque = vehicle.torque
  const competitors = vehicle.competitors
  if (!isPlainObject(engine) || !isNonEmptyString(engine.layout) || !isNonEmptyString(engine.fuel)) return 'empty'
  if (!isNonEmptyString(vehicle.drivetrain)) return 'empty'
  if (!Array.isArray(competitors) || competitors.length === 0) return 'empty'
  if (!isPlainObject(power) || !isFiniteNumber(power.cv)) return 'empty'
  if (!isPlainObject(torque) || !isFiniteNumber(torque.nm)) return 'empty'
  if (!isFiniteNumber(power.atRpm)) return 'error'
  if (!isFiniteNumber(torque.rpmMin) || !isFiniteNumber(torque.rpmMax)) return 'error'
  if (!isPlainObject(vehicle.zeroToHundred) || !isFiniteNumber(vehicle.zeroToHundred.seconds)) return 'error'
  const missingName = competitors.some((competitor) => (
    !isPlainObject(competitor) || !isNonEmptyString(competitor.id) || !isNonEmptyString(competitor.name)
  ))
  if (missingName) return 'error'
  return 'ok'
}

function specValue(vehicle, label) {
  if (label === 'Motor') return formatEngine(vehicle)
  if (label === 'Potência') return formatPower(vehicle.power.cv, vehicle.power.atRpm)
  if (label === 'Torque') return formatTorque(vehicle)
  if (label === 'Tração') return vehicle.drivetrain
  if (label === '0-100 km/h') return formatZeroToHundred(vehicle)
  return undefined
}

function buildSpecSections(vehicle) {
  return readArray(vehicle.specSections).map((section) => ({
    section: section.section,
    items: readArray(section.items).map((item) => {
      if (!SPEC_LABELS.includes(item.label)) return item
      return { ...item, value: specValue(vehicle, item.label) }
    }),
  }))
}

function fillMotorDescription(template, vehicle) {
  return template
    .replaceAll('{fuel}', vehicle.engine.fuel.toLowerCase())
    .replaceAll('{powerCv}', String(vehicle.power.cv))
    .replaceAll('{torqueNm}', String(vehicle.torque.nm))
}

function buildComparisons(vehicle, scores) {
  return vehicle.competitors
    .filter((competitor) => isFiniteNumber(scores[competitor.id]))
    .map((competitor) => ({
      id: competitor.id,
      name: competitor.name,
      value: scores[competitor.id],
    }))
}

function buildComponents(vehicle) {
  return readArray(vehicle.components).map((component) => {
    const { scores = {}, ...rest } = component
    const comparisons = buildComparisons(vehicle, scores)
    if (component.id !== 'motor') return { ...rest, comparisons }
    return {
      ...rest,
      title: `Motor ${vehicle.engine.layout}`,
      description: fillMotorDescription(component.description ?? '', vehicle),
      specs: [
        { label: 'Potência', value: formatPower(vehicle.power.cv, vehicle.power.atRpm) },
        { label: 'Torque', value: formatTorque(vehicle) },
        { label: '0–100 km/h', value: formatZeroToHundred(vehicle) },
      ],
      comparisons,
    }
  })
}

function buildHighlights(vehicle) {
  return readArray(vehicle.highlights).map((highlight) => {
    if (!HIGHLIGHT_LABELS.includes(highlight.label)) return highlight
    return { ...highlight, value: specValue(vehicle, highlight.label) }
  })
}

function raptorEngineCell(vehicle, spec) {
  const kind = RAPTOR_ENGINE_CELLS[spec]
  if (kind === 'power') return vehicle.power.cv
  if (kind === 'torque') return vehicle.torque.nm
  if (kind === 'zero') return vehicle.zeroToHundred.seconds
  if (kind === 'course') return vehicle.suspensionFrontMm
  if (kind === 'payload') return vehicle.payloadKg
  return undefined
}

function buildEngineData(vehicle) {
  return readArray(vehicle.engineComparison).map((row) => ({
    ...row,
    raptor: raptorEngineCell(vehicle, row.spec),
  }))
}

function buildCompetitorSummary(vehicle) {
  const names = vehicle.competitors
    .filter((competitor) => competitor.id !== 'raptor')
    .map((competitor) => competitor.name)
  if (names.length === 0) return 'Comparativo de desempenho contra '
  if (names.length === 1) return `Comparativo de desempenho contra ${names[0]}`
  const lead = names.slice(0, -1).join(', ')
  return `Comparativo de desempenho contra ${lead} e ${names[names.length - 1]}`
}

const source = isPlainObject(record) ? record : {}

export const status = resolveStatus(record)
export const competitors = readArray(source.competitors)
export const radarData = readArray(source.radar)
export const overallScores = readArray(source.overallScores)
export const featuresComparison = readArray(source.features)
export const categoryGrades = readArray(source.categoryGrades)
export const upgradeRecommendations = readArray(source.upgrades)

const ready = status === 'ok'

export const homeFacts = ready
  ? [
      { label: 'Motor', value: formatEngine(record) },
      { label: 'Potência', value: formatPower(record.power.cv, record.power.atRpm) },
      { label: 'Torque', value: formatTorque(record) },
      { label: 'Tração', value: record.drivetrain },
    ]
  : []

export const specSections = ready ? buildSpecSections(record) : []
export const components = ready ? buildComponents(record) : []
export const highlights = ready ? buildHighlights(record) : []
export const engineData = ready ? buildEngineData(record) : []
export const competitorSummary = ready ? buildCompetitorSummary(record) : ''
