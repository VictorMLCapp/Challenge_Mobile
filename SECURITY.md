# Política de Segurança

## Reportar uma vulnerabilidade
Não abra issue pública. Envie para os integrantes do time (README) com a descrição, os passos para reproduzir e o impacto. Resposta em até 2 dias úteis.

## Controles do projeto
A documentação completa da Sprint 3 (DevSecOps, controles de código e infraestrutura, observabilidade, STRIDE, OWASP ASVS/API/Mobile, LGPD e checklist) está em
[`docs/cybersecurity/SPRINT3_CYBERSECURITY.md`](docs/cybersecurity/SPRINT3_CYBERSECURITY.md).
O plano de resposta a incidentes está em [`docs/cybersecurity/RESPOSTA_A_INCIDENTES.md`](docs/cybersecurity/RESPOSTA_A_INCIDENTES.md).

## Regras para quem contribui
- Nunca commitar `.env`, `server/data/users.json`, chaves (`*.pem`, `*.key`, `*.jks`) ou tokens. O Gitleaks bloqueia o pipeline.
- Toda rota que altera dados precisa de `authorize(...)` e de um schema zod `strictObject`.
- Token e dados sensíveis no app só via `src/services/secureStore.js`.
- PR só entra com o workflow **DevSecOps** verde.
