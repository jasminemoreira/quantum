# Semente do ciclo v10 — organização, consolidação de docs, tradução e plataforma (PWA vs nativo)

> Pedido da usuária no fim do v9. Quatro frentes; conduzir como ciclo v10 (Versus), Fase 0 lê este
> arquivo como baseline. Itens 1–3 são deltas concretos de UI/doc; o item 4 é uma decisão estratégica
> de PLATAFORMA (research + decisão na Fase 0; a implementação pode virar seu próprio ciclo se for grande).

## 1. Limpeza — remover o colapsável "Help" da calculadora
`quantum_calc.html` tem dois `<details>` no rodapé: **"Step history"** (funcional — historyOut, MANTÉM) e
**"Help — input grammar"** (linhas ~202–225) que **duplica** o manual (gramática FSM, SET, simbólico, views).
REMOVER o `<details>` de Help. O link do cabeçalho `📖 manual ↗` (linha 172) permanece como porta de entrada
ao manual. Alinha com a preferência de chrome mínimo da usuária ([[ui-minimalism-preference]]).

## 2. Consolidar manual + exemplos em UM documento
Hoje: `manual.html` (referência, **lang=en**) ↔ `examples.html` (cookbook, **lang=pt-BR**, GERADO pelo
pipeline `examples.spec.js` → `examples-render.mjs` a partir de `examples-data.mjs`).
PLANO da usuária: mover o conteúdo RELEVANTE do `manual.html` para o `examples.html` e depois **renomear
`examples.html` → `manual.html`** — assim o link da interface (calculadora → `manual.html`, linhas 172/203)
é PRESERVADO. Resultado: UM doc chamado `manual.html` = referência + exemplos (básico→avançado).
CONSEQUÊNCIA ARQUITETURAL: o pipeline gerador (`examples-render.mjs`) deve emitir o doc consolidado como
`manual.html` (as seções de referência hoje escritas à mão no `manual.html` passam a ser parte do template
do render, ou prepended). Decidir na Fase 1: referência = seções estáticas no render + exemplos capturados.
Remover o `examples.html` antigo (nenhum link da interface aponta direto p/ ele; só o manual apontava).

## 3. Traduzir o documento consolidado para INGLÊS
O `manual.html` já é EN; o conteúdo dos exemplos (`examples-data.mjs`: campos `why`, `title`, `label`,
`tier-intro`, e strings de `examples-render.mjs`) é **pt-BR**. Traduzir tudo p/ EN; `lang="en"`. Manter a
fidelidade DOM-driven (as strings de ESTADO capturadas da tela não mudam — só os textos didáticos).

## 4. Plataforma: PWA vs app nativo Android/iOS  (DECISÃO DE FASE 0 — research)
TENSÃO CENTRAL com o DNA de v1–v9: **arquivo único HTML, offline via `file://`, sem build/toolchain**.
- **PWA**: + `manifest.webmanifest` + service worker + ícones; continua web/JS (reusa 100% do código);
  instalável e offline em Android/iOS via "Adicionar à tela inicial". **PORÉM** service worker **não roda
  em `file://`** → exige servir por **http/https** (muda o modelo atual "abrir o arquivo direto"). Esforço
  baixo; preserva a filosofia web. Quebra parcial do "single file" (poucos arquivos extras).
- **Nativo Android/iOS**: wrapper (Capacitor/Cordova do HTML existente) ou reescrita (React Native/
  Swift/Kotlin). Distribuição por app store; toolchain de build; afasta-se totalmente do single-file/
  no-build. Esforço alto. Capacitor é o caminho de menor atrito (embrulha o HTML), mas ainda adiciona
  build + assinatura + lojas.
PESQUISAR na Fase 0 (e decidir com a usuária via AskUserQuestion): qual plataforma, e se a
implementação da plataforma entra NESTE ciclo ou vira um ciclo próprio (provável split: itens 1–3 num
ciclo de "organização"; plataforma noutro, dado o tamanho). Considerar manter o `file://` puro como modo
"compartilhar com alunos" mesmo se adotar PWA (duplo modo).

## Não-regressão
Não regredir os 335 testes (250 Node + 85 Playwright). Se `examples.html`→`manual.html`, atualizar
`examples.spec.js` (path de saída + asserções de estrutura) e os links nos 3 documentos.

## Handoff
Estado mostrará v9 fechado (Fase 7) → `start_new_cycle` (v10) → Fase 0 lê este arquivo. Fase 0 (design)
pede o modelo mais capaz (Opus). Sessão longa → considerar chat novo + 'retomar Versus'.
