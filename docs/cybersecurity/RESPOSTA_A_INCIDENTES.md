# Plano de Resposta a Incidentes — Ford Specs API + App

Fluxo: **Detecção → Análise → Contenção → Erradicação → Recuperação → Pós-incidente**

## Papéis

| Papel | Quem | Responsabilidade |
|---|---|---|
| Líder do incidente | Administrador de plantão | Declara o incidente, define severidade, decide contenção |
| Analista | Dev de plantão | Investiga logs/métricas, aplica correção |
| Comunicação | Líder do time | Avisa professor/Ford/usuários; em caso de dado pessoal, avalia comunicação à ANPD (LGPD art. 48) |

## Severidade

| Nível | Critério | Resposta |
|---|---|---|
| SEV1 | Segredo vazado, dado pessoal exposto, API fora | ≤ 15 min |
| SEV2 | Brute force ativo, escalação de privilégio, CVE crítica explorável | ≤ 1 h |
| SEV3 | Rate limit disparando, falha 3D em massa, CVE moderada | ≤ 1 dia útil |

## Fases

### 1. Detecção
- Alertas do Prometheus (`infra/prometheus/alerts.yml`) e painel **Ford Specs API - Security Monitoring** no Grafana.
- Falha de gate no pipeline (Gitleaks, Semgrep, Trivy, npm audit) ou PR do Dependabot marcado como segurança.
- Relato de usuário. O `X-Request-Id` da resposta identifica a requisição exata.

### 2. Análise
- No Grafana/Loki: `{job="ford-specs-api"} | json | req_id="<id>"` para a requisição, e `{job="ford-specs-api", event=~"LOGIN_FAILURE|AUTHZ_DENIED|RATE_LIMITED"}` para o padrão.
- Perguntas: qual rota? qual `userId`/`role`? desde quando? houve `AUDIT` (alteração de dados)? algum dado pessoal envolvido?
- Registrar linha do tempo (hora UTC dos logs).

### 3. Contenção
| Situação | Ação |
|---|---|
| Token de um usuário comprometido | `POST /api/auth/logout` com o token (revoga o `jti`) e `active: false` no `users.json` |
| Todos os tokens suspeitos / `JWT_SECRET` vazado | Gerar novo `JWT_SECRET` e reiniciar a API: todas as sessões caem na hora |
| Brute force de uma origem | Rate limit e lockout já seguram; bloquear o IP no proxy/WAF; reduzir `LOGIN_RATE_LIMIT_MAX` |
| Rota vulnerável | Desligar a rota (feature flag/deploy) ou colocar `authorize(ROLES.ADMIN)` temporário |
| Imagem com CVE crítica | Voltar para a última imagem aprovada no pipeline |

### 4. Erradicação
- Corrigir o código e **adicionar um teste** que reproduz o ataque (`server/test/`).
- Atualizar a dependência (PR do Dependabot ou `npm audit fix`).
- Segredo commitado: **girar primeiro**, depois remover do histórico (`git filter-repo`) e confirmar com Gitleaks que sumiu.
- Se o padrão puder voltar, criar uma regra em `.semgrep/ford-rules.yml`.

### 5. Recuperação
- Deploy **somente pelo pipeline** (todos os gates verdes).
- Restaurar dados do backup se houve alteração indevida (a trilha `AUDIT` mostra o que mudou).
- Monitorar por 24 h os painéis de segurança e erros.

### Pós-incidente (até 5 dias úteis)
- Análise de causa raiz (5 porquês), sem culpados.
- Atualizar a tabela STRIDE (`SPRINT3_CYBERSECURITY.md`, seção 4.1) e este plano.
- Registrar as lições aprendidas e as ações com dono e prazo.

## Playbook 1 - Brute force
Alerta `BruteForceSuspeito` (> 20 falhas em 5 min).
1. Grafana → painel “Logins por resultado” + logs `LOGIN_FAILURE`/`LOGIN_BLOCKED`.
2. Um IP só? O rate limit já devolve 429. Vários IPs na mesma conta? O lockout bloqueia a conta.
3. Se alguma conta atacada teve `LOGIN_SUCCESS` no período, tratar como conta comprometida: revogar e trocar a senha (`npm run create-user`).
4. Bloquear as origens no proxy e manter a observação por 24 h.

## Playbook 2 - Escalação de privilégio
Alerta `TentativaDeEscalacaoDePrivilegio` (> 10 `AUTHZ_DENIED` em 10 min).
1. Logs `AUTHZ_DENIED`: qual `userId` e quais rotas?
2. Conferir se houve `AUDIT` do mesmo usuário (alguma escrita passou?).
3. Revogar os tokens do usuário e desativar a conta até esclarecer.
4. Revisar se alguma rota nova ficou sem `authorize()` (regra Semgrep `ford-route-without-authorize`).

## Playbook 3 - Segredo vazado no repositório
Gate do Gitleaks falhou ou alguém avisou.
1. **Girar o segredo imediatamente** (novo `JWT_SECRET`, nova senha).
2. Reiniciar a API (sessões antigas caem).
3. Remover do histórico e forçar a atualização dos clones.
4. Conferir nos logs se o segredo foi usado entre o vazamento e a rotação.
