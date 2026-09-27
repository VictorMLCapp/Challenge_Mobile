// Perfis do app (menor privilégio). Equivalência com a rubrica:
// VIEWER ≈ Brigadista (operação/consulta), ANALISTA ≈ Gestor, ADMIN ≈ Administrador.
export const ROLES = Object.freeze({
  VIEWER: 'VIEWER',
  ANALISTA: 'ANALISTA',
  ADMIN: 'ADMIN',
})

export const ALL_ROLES = Object.values(ROLES)
