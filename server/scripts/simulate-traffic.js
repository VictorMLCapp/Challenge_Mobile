// Gera tráfego realista (logins ok/falhos, pesquisas, 403, 429, eventos mobile)
// para popular logs e dashboards. Uso:
//   API_URL=http://localhost:3000 DEMO_EMAIL=analista@ford-demo.test DEMO_PASSWORD=... npm run simulate
const API = process.env.API_URL ?? 'http://localhost:3000'
const { DEMO_EMAIL, DEMO_PASSWORD } = process.env
const ROUNDS = Number(process.env.ROUNDS ?? 5)

if (!DEMO_EMAIL || !DEMO_PASSWORD) {
  console.error('Defina DEMO_EMAIL e DEMO_PASSWORD (use as credenciais geradas por npm run seed:demo).')
  process.exit(1)
}

const post = (path, body, token) => fetch(`${API}${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
})

const tally = {}
const count = (label, res) => { tally[`${label} ${res.status}`] = (tally[`${label} ${res.status}`] ?? 0) + 1 }

for (let round = 0; round < ROUNDS; round += 1) {
  const auth = await post('/api/auth/login', { email: DEMO_EMAIL, password: DEMO_PASSWORD })
  count('login', auth)
  const { accessToken } = await auth.json()

  count('search', await post('/api/specs/search', {
    marca: 'Ford', modelo: 'Ranger', versao: 'Raptor',
    atributos: ['Motor', 'Potência', 'Torque', 'Câmbio', '0-100 km/h', 'Teto Solar Elétrico'],
  }, accessToken))
  count('search', await post('/api/specs/search', {
    marca: 'Toyota', modelo: 'Hilux', versao: 'GR-S', atributos: ['Potência', 'Torque', 'Airbag (cada)'],
  }, accessToken))
  count('invalid', await post('/api/specs/search', { marca: '<script>', atributos: [] }, accessToken))
  count('forbidden', await post('/api/vehicles', { id: 'x-y-z', marca: 'a', modelo: 'b', versao: 'c', fonte: 'd' }, accessToken))
  count('bad-login', await post('/api/auth/login', { email: 'intruso@ford-demo.test', password: 'senha-errada-1' }))
  count('mobile', await post('/api/telemetry/events', { event: 'APP_START', platform: 'android', appVersion: '1.0.0' }))
  if (round % 2 === 0) count('mobile', await post('/api/telemetry/events', { event: 'MODEL_LOAD_FAILURE', platform: 'android', screen: 'home' }))
  count('no-token', await fetch(`${API}/api/vehicles`))
}

// Rajada para disparar o rate limit do login (simula brute force).
for (let i = 0; i < 12; i += 1) count('brute-force', await post('/api/auth/login', { email: 'admin@ford-demo.test', password: `tentativa-${i}-xyz` }))

console.table(tally)
