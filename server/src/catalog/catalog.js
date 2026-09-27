import { readFileSync } from 'node:fs'

export const STATUS = Object.freeze({ DISPONIVEL: 'DISPONIVEL', NAO_DISPONIVEL: 'NAO_DISPONIVEL' })

// "Potência", "potencia" e " POTÊNCIA " são o mesmo atributo.
export function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function describe(vehicle) {
  const { id, marca, modelo, versao, fonte } = vehicle
  return { id, marca, modelo, versao, fonte }
}

export function createCatalog(data) {
  const vehicles = new Map(data.veiculos.map((v) => [v.id, structuredClone(v)]))

  function findVehicle({ marca, modelo, versao }) {
    const sameModel = [...vehicles.values()].filter((v) => (
      normalize(v.marca) === normalize(marca) && normalize(v.modelo) === normalize(modelo)
    ))
    const wanted = normalize(versao)
    const exact = sameModel.find((v) => normalize(v.versao) === wanted)
    if (exact) return { vehicle: exact, candidates: [] }
    const partial = sameModel.filter((v) => normalize(v.versao).includes(wanted))
    if (partial.length === 1) return { vehicle: partial[0], candidates: [] }
    return { vehicle: null, candidates: (partial.length ? partial : sameModel).map(describe) }
  }

  return {
    list: () => [...vehicles.values()].map((v) => ({ ...describe(v), totalAtributos: Object.keys(v.specs).length })),
    get: (id) => vehicles.get(id),
    attributes(id) {
      const v = vehicles.get(id)
      return v ? Object.keys(v.specs) : null
    },

    // Núcleo do Desafio 01: a saída tem SEMPRE o mesmo formato, na ordem pedida,
    // e o que não existe vem explícito como NAO_DISPONIVEL.
    search(query) {
      const { vehicle, candidates } = findVehicle(query)
      const index = new Map(Object.entries(vehicle?.specs ?? {}).map(([name, spec]) => [normalize(name), { name, ...spec }]))
      const especificacoes = query.atributos.map((atributo) => {
        const hit = index.get(normalize(atributo))
        if (!hit) return { atributo, valor: null, unidade: null, categoria: null, status: STATUS.NAO_DISPONIVEL }
        return { atributo, valor: hit.valor, unidade: hit.unidade ?? null, categoria: hit.categoria ?? null, status: STATUS.DISPONIVEL }
      })
      const disponiveis = especificacoes.filter((e) => e.status === STATUS.DISPONIVEL).length
      return {
        consulta: { marca: query.marca, modelo: query.modelo, versao: query.versao },
        encontrado: Boolean(vehicle),
        veiculo: vehicle ? describe(vehicle) : null,
        candidatos: candidates,
        totalAtributos: especificacoes.length,
        disponiveis,
        naoDisponiveis: especificacoes.length - disponiveis,
        geradoEm: new Date().toISOString(),
        especificacoes,
      }
    },

    upsertSpecs(id, specs) {
      const v = vehicles.get(id)
      if (!v) return null
      for (const spec of specs) {
        v.specs[spec.atributo] = { valor: spec.valor, unidade: spec.unidade ?? null, categoria: spec.categoria ?? null }
      }
      return describe(v)
    },
    create(vehicle) {
      if (vehicles.has(vehicle.id)) return null
      vehicles.set(vehicle.id, { ...vehicle, specs: {} })
      return describe(vehicles.get(vehicle.id))
    },
    remove: (id) => vehicles.delete(id),
  }
}

export function loadCatalog(file) {
  return createCatalog(JSON.parse(readFileSync(file, 'utf8')))
}
