import { readFileSync, existsSync } from 'node:fs'
import { z } from 'zod'
import { ALL_ROLES } from './roles.js'

const userSchema = z.object({
  id: z.string().min(1),
  email: z.email().toLowerCase(),
  name: z.string().min(1).max(80),
  role: z.enum(ALL_ROLES),
  // bcrypt: $2a/$2b + custo + 53 chars. Senha em texto puro é rejeitada no boot.
  passwordHash: z.string().regex(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/, 'passwordHash precisa ser bcrypt'),
  active: z.boolean().default(true),
})

export function createUserStore(users) {
  const list = z.array(userSchema).parse(users)
  const byEmail = new Map(list.map((u) => [u.email, u]))
  const byId = new Map(list.map((u) => [u.id, u]))
  return {
    findByEmail: (email) => byEmail.get(String(email).toLowerCase()),
    findById: (id) => byId.get(id),
    list: () => list.map(({ passwordHash: _omit, ...safe }) => safe),
  }
}

export function loadUserStore(file) {
  if (!existsSync(file)) {
    throw new Error(`Arquivo de usuários não encontrado (${file}). Rode "npm run seed:demo" ou "npm run create-user" (veja server/README.md).`)
  }
  return createUserStore(JSON.parse(readFileSync(file, 'utf8')))
}
