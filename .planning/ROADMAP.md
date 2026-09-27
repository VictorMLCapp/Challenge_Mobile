# Roadmap: Ford Ranger Raptor — entrega do desafio

## Overview

A banca instala um APK e percorre início, especificações e relatório sem rede, com os mesmos fatos e a mesma identidade visual. O app web já faz esse percurso. A primeira fase deixa as três telas coerentes no navegador. A segunda prova o mesmo percurso numa janela de celular, com a rede desligada, ainda no navegador — modelo, luz e fontes locais, ficha fora do explorador. A terceira empacota esse build num APK de debug, confirma os três fluxos offline no celular ou no emulador e entrega o README.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Vitrine coerente no navegador** - Início, especificações e relatório mostram a mesma Ranger, com a identidade que já existe (completed 2026-09-27)
- [ ] **Phase 2: Percurso sem rede na largura do celular** - Os três fluxos fecham sem internet numa janela de celular, com modelo, luz e fontes locais
- [ ] **Phase 3: APK da banca** - A banca instala o APK de debug e repete os três fluxos offline, com o README

## Phase Details

### Phase 1: Vitrine coerente no navegador

**Goal:** Uma pessoa percorre início, especificações e relatório no navegador e vê uma só Ranger Raptor: os mesmos fatos, as cores e a tipografia que já existem, e o nome do produto.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, VIS-01, VIS-02, CODE-01
**Success Criteria** (what must be TRUE):

  1. Em início, especificações e relatório, potência, combustível, concorrentes e notas são os mesmos.
  2. Esses fatos são os de `src/data/ranger.json`; as três telas mostram as mesmas cifras.
  3. As três telas usam as cores e a tipografia já definidas em `src/index.css`.
  4. O cabeçalho não oferece Modelos, Configurar, Dealer nem Solicitar Proposta.
  5. O nome do app, o componente do modelo e os arquivos exportados identificam a Ranger Raptor.

**Plans:** 2/2 plans complete
**UI hint**: yes

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — As três telas leem só src/data/ranger.json, e o nome do app, do modelo e dos arquivos exportados identifica a Ranger Raptor

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Cores, tipografia e cabeçalho das três telas seguem src/index.css, sem ações sem destino

### Phase 2: Percurso sem rede na largura do celular

**Goal:** Uma pessoa completa início, especificações e relatório numa janela da largura de um celular, com a rede desligada, no navegador. O loader termina, a ficha deixa o explorador visível e os gráficos aparecem. O modelo, o mapa de luz e as fontes vêm do próprio app. A Fase 3 instala esse build.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: FLOW-01, FLOW-02, FLOW-03, OFF-01
**Success Criteria** (what must be TRUE):

  1. Com a rede desligada, a pessoa abre o início, o loader termina e ela orbita o modelo 3D da Ranger Raptor.
  2. Com a rede desligada, na largura de um celular, a pessoa abre especificações, troca a câmera, a aba e o componente, e a ficha não cobre o explorador.
  3. Com a rede desligada, a pessoa abre o relatório e vê os gráficos comparativos.
  4. O modelo 3D, o mapa de luz e as fontes Inter e Bebas Neue carregam de dentro do app, com a rede desligada.

**Plans**: 2
**UI hint**: yes

Plans:

- [ ] 02-01: No navegador, sem rede, o loader termina e a pessoa orbita a Ranger com mapa de luz e fontes locais
- [ ] 02-02: Na largura de um celular, especificações e o relatório fecham o percurso junto com o início

### Phase 3: APK da banca

**Goal:** A banca instala um APK de debug, gerado de um `dist` recém-construído, e percorre início, especificações e relatório sem rede no celular ou no emulador. O README explica como rodar, gerar e instalar.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: APK-01, APK-02, CODE-02, DOC-01, DOC-02
**Success Criteria** (what must be TRUE):

  1. Uma pessoa instala um APK de debug, gerado a partir de um `dist` recém-construído, num celular ou emulador Android.
  2. O APK instalado abre o app empacotado e não aponta para o computador de desenvolvimento.
  3. Nesse app, com a rede desligada, a pessoa completa início (o loader termina e ela orbita o modelo), especificações (câmera, aba, componente, ficha fora do explorador) e relatório (gráficos), e o modelo, o mapa de luz e as fontes carregam de dentro do APK.
  4. Scripts de oficina e assets que o app não usa não entram no pacote do APK.
  5. O README explica os pré-requisitos, como rodar no navegador, como gerar o APK e como instalar, e mostra uma imagem do início, uma das especificações e uma do relatório.

**Plans**: 3
**UI hint**: yes

Plans:

- [ ] 03-01: APK de debug a partir de um `dist` novo, abrindo o app empacotado no celular ou no emulador
- [ ] 03-02: Com a rede desligada, os três fluxos fecham nesse APK e o pacote fica sem scripts de oficina nem assets ociosos
- [ ] 03-03: README com pré-requisitos, execução no navegador, geração, instalação e uma imagem de cada tela

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Vitrine coerente no navegador | 2/2 | Complete    | 2026-09-27 |
| 2. Percurso sem rede na largura do celular | 0/2 | Not started | - |
| 3. APK da banca | 0/3 | Not started | - |
