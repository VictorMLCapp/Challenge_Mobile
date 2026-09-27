// Cria/atualiza um usuário em data/users.json com senha em bcrypt (custo 12).
// Uso: node scripts/create-user.js <email> <nome> <VIEWER|ANALISTA|ADMIN>
// A senha é lida de NEW_USER_PASSWORD ou digitada (sem eco no terminal).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline'
import bcrypt from 'bcryptjs'
import { ALL_ROLES } from '../src/auth/roles.js'

const file = process.env.USERS_FILE ?? 'data/users.json'
const [email, name, role] = process.argv.slice(2)

if (!email || !name || !ALL_ROLES.includes(role)) {
  console.error(`Uso: node scripts/create-user.js <email> <nome> <${ALL_ROLES.join('|')}>`)
  process.exit(1)
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s) }
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer) })
  })
}

const password = process.env.NEW_USER_PASSWORD ?? await askHidden('Senha (mín. 12 caracteres): ')
if (password.length < 12) {
  console.error('Senha muito curta.')
  process.exit(1)
}

const users = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
const entry = { id: randomUUID(), email: email.toLowerCase(), name, role, passwordHash: await bcrypt.hash(password, 12), active: true }
const index = users.findIndex((u) => u.email === entry.email)
if (index >= 0) users[index] = { ...entry, id: users[index].id }
else users.push(entry)
writeFileSync(file, JSON.stringify(users, null, 2) + '\n', { mode: 0o600 })
console.log(`Usuário ${entry.email} (${role}) salvo em ${file}`)
