# syntax=docker/dockerfile:1.7
# API de especificações - imagem de produção endurecida.
#  - base alpine enxuta, fixada por digest (Dependabot atualiza)
#  - multi-stage: só dependências de produção vão para a imagem final
#  - sem npm/yarn no runtime (menos pacotes = menos CVEs no Trivy)
#  - usuário não-root, sistema de arquivos read-only no compose/k8s
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS runtime
LABEL org.opencontainers.image.title="ford-specs-api" \
      org.opencontainers.image.description="API de inteligência competitiva - Desafio 01 FIAP/Ford" \
      org.opencontainers.image.source="https://github.com/VictorMLCapp/Challenge_Mobile"
ENV NODE_ENV=production \
    PORT=3000 \
    METRICS_PORT=9464
RUN apk upgrade --no-cache \
 && addgroup -S -g 10001 app && adduser -S -D -H -u 10001 -G app app \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
           /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
COPY --from=deps --chown=root:root /app/node_modules ./node_modules
COPY --chown=root:root package.json ./
COPY --chown=root:root src ./src
COPY --chown=root:root data/catalog.json ./data/catalog.json
# Único diretório gravável: logs (volume lido pelo Alloy).
RUN mkdir -p /var/log/api && chown app:app /var/log/api
# Código pertence ao root e é só leitura para o processo; o app roda como uid 10001 (sem shell de login).
USER 10001:10001
EXPOSE 3000 9464
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "src/index.js"]
