# Requirements: Ford Ranger Raptor — entrega do desafio

**Defined:** 2026-09-27
**Core Value:** A banca instala o APK e percorre início, especificações e relatório sem erro, vendo os mesmos dados e a mesma identidade visual nas três telas.

## v1 Requirements

Requisitos da entrega para a banca. Cada um entra no roadmap.

### Instalação

- [ ] **APK-01**: A banca instala um APK de debug, gerado a partir de um `dist` recém-construído, num celular ou emulador Android.
- [ ] **APK-02**: O APK instalado abre o app empacotado e não aponta para o computador de desenvolvimento.

### Fluxos

- [ ] **FLOW-01**: No APK, a pessoa abre o início, o loader termina e ela orbita o modelo 3D da Ranger Raptor.
- [ ] **FLOW-02**: No APK, a pessoa abre especificações, troca a câmera, a aba e o componente, e a ficha não cobre o explorador numa largura de celular.
- [ ] **FLOW-03**: No APK, a pessoa abre o relatório e vê os gráficos comparativos.

### Offline

- [ ] **OFF-01**: O modelo 3D, o mapa de luz e as fontes Inter e Bebas Neue carregam de dentro do APK, sem rede.

### Identidade

- [ ] **VIS-01**: Início, especificações e relatório usam as cores e a tipografia já definidas em `src/index.css`.
- [ ] **VIS-02**: O cabeçalho não mostra ações sem destino (Modelos, Configurar, Dealer, Solicitar Proposta).

### Dados

- [ ] **DATA-01**: Início, especificações e relatório leem os fatos do veículo somente de `src/data/ranger.json`.
- [ ] **DATA-02**: Potência, combustível, concorrentes e notas são os mesmos nas três telas.

### Código

- [ ] **CODE-01**: O nome do app, o componente do modelo e os arquivos exportados identificam a Ranger Raptor.
- [ ] **CODE-02**: Scripts de oficina e assets que o app não usa não entram no pacote do APK.

### Documentação

- [ ] **DOC-01**: O README explica os pré-requisitos, como rodar no navegador, como gerar o APK e como instalar.
- [ ] **DOC-02**: O README mostra uma imagem do início, uma das especificações e uma do relatório.

## v2 Requirements

Nenhum item essencial ficou de fora da v1. Diferenciais adiados estão em Out of Scope, não numa v2 desta entrega.

## Out of Scope

Excluído de propósito. Motivo ao lado, para não voltar ao escopo.

| Feature | Reason |
|---------|--------|
| Compartilhar CSV/TXT pela folha de compartilhamento do Android | O download de navegador basta para a v1; a folha nativa só se prova no aparelho e não bloqueia a banca |
| CSV com BOM e impressão com as cores da tela | Depende de um arquivo que saia do celular; a v1 não promete esse handoff |
| Voltar do relatório para a tela que o abriu | Hoje o voltar cai em especificações; corrigir o alvo não é necessário para percorrer os três fluxos |
| Splash e ícone na cor de fundo do app | O primeiro frame branco não impede os fluxos; a v1 não redesenha a abertura |
| Um único palco 3D para início e especificações | As duas cenas já funcionam; unificá-las é consistência extra, não a identidade visual pedida |
| Capturas do README feitas no emulador | A v1 pede uma imagem de cada tela; a origem desktop ou emulador não muda o critério |
| Publicação na Play Store, AAB e políticas | A banca instala o APK direto |
| Contas, API, analytics, push | O app não tem servidor e o APK precisa funcionar offline |
| Ler a planilha xlsx em tempo de execução | A fonte única é o JSON empacotado |
| Telas novas (Modelos, Configurar, Dealer, Solicitar Proposta) | O desafio escolhido são os três fluxos que já existem |
| Redesenho ou biblioteca de componentes | A identidade atual é unificada, não substituída |
| Reescrita em Expo ou React Native | O visualizador WebGL precisa continuar |
| Alvo iOS, PWA, deep links, atualização in-app, motor de PDF, i18n, suíte E2E em device farm | Cada um duplica ou substitui um caminho que esta entrega já tem |

## Traceability

Quais fases cobrem quais requisitos. Preenchido na criação do roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| APK-01 | Phase 3 | Pending |
| APK-02 | Phase 3 | Pending |
| FLOW-01 | Phase 2 | Pending |
| FLOW-02 | Phase 2 | Pending |
| FLOW-03 | Phase 2 | Pending |
| OFF-01 | Phase 2 | Pending |
| VIS-01 | Phase 1 | Pending |
| VIS-02 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| CODE-01 | Phase 1 | Pending |
| CODE-02 | Phase 3 | Pending |
| DOC-01 | Phase 3 | Pending |
| DOC-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-09-27*
*Last updated: 2026-09-27 after roadmap creation*
