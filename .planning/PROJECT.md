# Ford Ranger Raptor — entrega do desafio

## What This Is

Aplicação de vitrine da Ford Ranger Raptor para a banca do desafio FIAP-Ford. O app que já existe é uma SPA em React + Vite: início com o modelo 3D, especificações e relatório comparativo. Esta entrega embrulha esse app num APK Android (Capacitor) que a banca instala no celular ou no emulador, com as três telas consistentes e os dados do veículo vindos de um único JSON.

## Core Value

A banca instala o APK e percorre início, especificações e relatório sem erro, vendo os mesmos dados e a mesma identidade visual nas três telas.

## Requirements

### Validated

- ✓ A pessoa abre o início, vê o loader e orbita o modelo 3D da Ranger Raptor — existing (`src/components/CarViewer.jsx`, `src/components/HeroUI.jsx`, `src/components/LoaderUI.jsx`)
- ✓ A pessoa abre as especificações, troca de câmera, de aba e de componente — existing (`src/components/SpecsPage.jsx`)
- ✓ A pessoa abre o relatório, compara concorrentes e exporta CSV/TXT ou imprime — existing (`src/components/ReportPage.jsx`)
- ✓ A pessoa navega entre início, especificações e relatório — existing (`src/App.jsx`)
- ✓ O app roda no navegador como SPA, sem servidor e sem login — existing

### Active

- [ ] A banca instala um APK Android e executa os três fluxos num celular ou emulador
- [ ] Início, especificações e relatório usam as mesmas cores, tipografia e componentes
- [ ] Potência, torque, concorrentes e demais fatos do veículo vêm de um único JSON empacotado no app
- [ ] O código está apresentável: nomes alinhados ao produto, dados fora dos componentes de tela, scripts de oficina fora do caminho de execução
- [ ] O README explica como rodar, como gerar o APK e mostra as três telas

### Out of Scope

- Publicação na Play Store — a banca instala o APK direto; ficha de loja, políticas e assinatura de publicação ficam de fora
- Reescrita em Expo ou React Native — o visualizador WebGL atual precisa continuar
- Redesenho visual — a identidade de hoje é unificada, não substituída
- API, banco ou planilha lida em tempo de execução — o JSON entra no APK e funciona sem internet
- Telas novas além de início, especificações e relatório — o desafio escolhido já está nesses três fluxos

## Context

O repositório já contém o app `ford-ranger-raptor-app`. Mapa do código em `.planning/codebase/`.

- Stack atual: React 19, Vite 8, `@react-three/fiber`, `@react-three/drei`, Three.js, Recharts. Sem TypeScript, sem testes, sem router.
- Navegação: um `useState` em `src/App.jsx` com `'home' | 'specs' | 'report'`.
- O modelo é `public/ford_ranger.glb`, pintado em `src/components/FordRangerRaptor.jsx`. O componente ainda se chama `FordF150`.
- Os fatos do veículo estão copiados em `src/components/HeroUI.jsx`, `src/components/SpecsPage.jsx` e `src/components/ReportPage.jsx`. A planilha `FIAP-Ford - Data sheet_Desafio_01_v02.xlsx` não é lida pelo app. O rodapé do relatório admite dados mockados.
- Cada tela tem o próprio CSS Module. Há scripts de oficina na raiz (`capture_meshes.cjs`, `split_glb.py`, `replace_colors*.ps1`) que não fazem parte do runtime.
- O README ainda é o template do Vite.

## Constraints

- **Tech stack**: Manter React + Vite + react-three-fiber. O APK vem de um wrapper Capacitor em cima do build web. Sem Expo.
- **Entrega**: APK instalável em dispositivo físico ou emulador, para a banca. Sem loja.
- **Dados**: Um JSON no app (por exemplo `src/data/ranger.json`). As três telas importam só essa fonte. Offline.
- **Visual**: Unificar cores, tipografia e componentes já existentes. Sem sistema visual novo.
- **Compatibilidade**: O 3D precisa continuar funcionando dentro da WebView do APK.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Embrulhar o app web com Capacitor em vez de reescrever em Expo | O desafio pede APK; a stack 3D atual é WebGL no browser e não passa direto para React Native | — Pending |
| APK só para sideload da banca, sem Play Store | A entrega pedida é instalar e executar no celular ou emulador | — Pending |
| Unificar a identidade atual, sem redesenho | Consistência entre telas, não uma cara nova de produto | — Pending |
| Um JSON empacotado no app como única fonte de dados | Simples, funciona sem internet no dia da apresentação, e tira os números duplicados das telas | — Pending |
| Escopo limitado às três telas já existentes | Início, especificações e relatório são o fluxo do desafio escolhido | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-27 after initialization*
