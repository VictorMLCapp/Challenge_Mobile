// Gera os 3 usuários de demonstração com senhas aleatórias fortes.
// As senhas aparecem UMA vez no terminal e não ficam em nenhum arquivo do repo:
// data/users.json guarda só o hash bcrypt e está no .gitignore.
import { writeFileSync } from 'node:fs'
import { randomUUID, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

const file = process.env.USERS_FILE ?? 'data/users.json'
const demo = [
  { email: 'viewer@ford-demo.test', name: 'Consulta', role: 'VIEWER' },
  { email: 'analista@ford-demo.test', name: 'Analista de Mercado', role: 'ANALISTA' },
  { email: 'admin@ford-demo.test', name: 'Administrador', role: 'ADMIN' },
]

const users = []
console.log('Usuários de demonstração (anote as senhas; elas não são salvas):\n')
for (const u of demo) {
  const password = randomBytes(12).toString('base64url')
  users.push({ id: randomUUID(), ...u, passwordHash: await bcrypt.hash(password, 12), active: true })
  console.log(`  ${u.role.padEnd(8)} ${u.email.padEnd(26)} ${password}`)
}
writeFileSync(file, JSON.stringify(users, null, 2) + '\n', { mode: 0o600 })
console.log(`\nHashes salvos em ${file}`)
