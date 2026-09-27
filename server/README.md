# API de especificações (Desafio 01)

API Node 22 + Express 5 que recebe **marca, modelo, versão e uma lista livre de atributos** e devolve uma lista padronizada de especificações. O que não existe no catálogo vem como `NAO_DISPONIVEL`. O app mobile consome esta API na tela **Pesquisar concorrência**.

Os controles de segurança estão descritos em [`../docs/cybersecurity/SPRINT3_CYBERSECURITY.md`](../docs/cybersecurity/SPRINT3_CYBERSECURITY.md).

## Rodar

```bash
npm ci
cp .env.example .env        # gere o JWT_SECRET com o comando do próprio arquivo
npm run seed:demo           # cria viewer/analista/admin com senhas aleatórias (mostradas uma vez)
npm run dev                 # http://localhost:3000 (métricas em :9464/metrics)
npm test                    # 20 testes de segurança
```

Para criar um usuário real: `npm run create-user -- email@dominio "Nome" ANALISTA` (a senha é pedida sem eco, mínimo 12 caracteres).

O catálogo (`data/catalog.json`) é gerado a partir da planilha oficial e da ficha da Raptor do app:

```bash
python3 scripts/build_catalog.py   # rodar da raiz do repositório
```

## Rotas

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | público (rate limit 10/15 min) | `{ email, password }` → JWT de 15 min |
| POST | `/api/auth/logout` | autenticado | Revoga o token |
| GET | `/api/auth/me` | autenticado | Dados da sessão |
| GET | `/api/vehicles` | todos | Catálogo (marca/modelo/versão) |
| GET | `/api/vehicles/:id/attributes` | todos | Atributos conhecidos de um veículo |
| POST | `/api/specs/search` | todos | **Desafio 01**: `{ marca, modelo, versao, atributos[] }` |
| PUT | `/api/vehicles/:id/specs` | ANALISTA, ADMIN | Atualiza specs de um veículo (auditado) |
| POST | `/api/vehicles` | ADMIN | Cria veículo (auditado) |
| DELETE | `/api/vehicles/:id` | ADMIN | Remove veículo (auditado) |
| GET | `/api/admin/users` | ADMIN | Usuários e perfis (sem hash) |
| GET | `/api/admin/audit-events` | ADMIN | Trilha de auditoria |
| POST | `/api/telemetry/events` | público (rate limit 60/15 min) | Eventos do app (lista fechada) |
| GET | `/healthz` | público | Health check |
| GET | `:9464/metrics` | rede interna | Métricas Prometheus |

Exemplo:

```bash
curl -s localhost:3000/api/specs/search \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"marca":"Ford","modelo":"Ranger","versao":"Raptor","atributos":["Potência","Torque","Teto Solar Elétrico"]}'
```

## Docker

```bash
docker build -t ford-specs-api .
# stack completa com Prometheus/Loki/Grafana: ver ../infra/docker-compose.yml
```
