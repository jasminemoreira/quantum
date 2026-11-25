# Architecture — Cycle 29 · PLAY no manual

Escopo: `specs/technical/52-cycle29-manual-play.md`. Arquiteturas de ciclos anteriores:
`22-v10-architecture.md`, `specs/design/v3-architecture.md` (app single-file; motor ℤ[ζ₁₆] INTOCADO
aqui). Este documento cobre APENAS os módulos do delta do ciclo 29.

## V(1)

| id   | module          | responsibility | interface | depends-on |
|------|-----------------|----------------|-----------|------------|
| M-01 | play-data       | Embutir no HTML gerado, por `res-block`, os `steps` reais e o mapa passo→grupo (chip) | `stepsToGroups(steps) -> {groups: string[], stepGroup: number[]}`; `resultBlock(r)` emite `data-steps='[...]'` (JSON) + `data-step-group='[...]'` + chips com `data-g=i` + `<button class="play">` | examples-data (fonte única), stepsToKeys (refatorado sobre stepsToGroups) |
| M-02 | play-overlay    | UI do manual: abrir/fechar a sobreposição com o app num `<iframe>`, enviar a sequência, botões ▶/■/↻, acender o chip do grupo corrente | DOM: `.play` click → `open(block)`; fecha por ×, ESC, swipe-down, backdrop. Mensagens enviadas: `qc-play{steps, groups}`, `qc-stop`. Recebidas: `qc-ready`, `qc-step{i, g}`, `qc-done{ok}` | M-01 (atributos do bloco), M-03 (protocolo) |
| M-03 | play-protocol   | Contrato de mensagens manual↔app (postMessage) | manual→app: `{type:'qc-play', steps:string[], groups:number[]}` · `{type:'qc-stop'}`. app→manual: `{type:'qc-ready'}` · `{type:'qc-step', i, g}` · `{type:'qc-done', stopped:boolean}`. Aceita só `e.source === window.parent` (app) / `e.source === iframe.contentWindow` (manual); targetOrigin `'*'` (file:// = origem opaca) | — |
| M-04 | demo-runner     | No app (`UI.init`): receber `qc-play`, resetar a estado limpo, tocar cada passo com destaque → espera → `routeAction`, pausa por grupo, respeitar `busyPending`, emitir `qc-step`/`qc-done`; `qc-stop` interrompe | `startDemo(steps, groups)`, `stopDemo()`; flag `demoActive`; timings `KEY_MS≈350`, `HILITE_MS≈200`, `GROUP_MS≈600` | routeAction / busyPending (existentes), M-03, M-05 |
| M-05 | demo-visual     | No app: destaque da tecla (afundar + anel) e bloqueio de toque durante a demo | CSS `.demo-hit` (sobre `[data-action]`) + classe `body.demo-active` (`pointer-events:none` no teclado/visor) ; `hilite(el)` | — |
| M-06 | demo-reset      | No app: levar a estado LIMPO equivalente a uma carga nova (`page.goto` do spec) antes de cada play | `resetToFresh()` = `location.reload()` do iframe controlado pelo manual (recarregar o `src`) — ver A-3 | — |
| M-07 | play-tests      | Verificar: botão em todo res-block com steps; overlay abre; estado final == resultado capturado; ■ interrompe; teclado interativo ao fim; app sem pai inalterado | Playwright `tests/v29.spec.js` + Node `tests/v29.test.mjs` (stepsToGroups) | M-01..M-06 |

### Dependências

```
examples-data ──► M-01 play-data ──► (manual.html gerado) ──► M-02 play-overlay
                                                                   │ M-03 protocol (postMessage)
                                                                   ▼
                                      app: M-04 demo-runner ──► routeAction (existente)
                                                 │
                                                 └──► M-05 demo-visual
M-06 demo-reset: M-02 recarrega o iframe antes de cada play (↻ idem).
M-07 testa todos.
```

Nenhum módulo do motor (Algebra/State/Engine/SymEngine/Ops/Parser) é tocado.

### Premissas (numeradas — cada uma vira um teste na Fase 6)

- **A-1** Tocar `routeAction(step)` produz o MESMO visor que o clique real (verificado 92/92 no PoC).
- **A-2** `file://` torna o iframe cross-origin → postMessage é o único canal (verificado: SecurityError).
- **A-3** Recarregar o iframe dá estado equivalente à carga fresca do spec (o app não persiste estado:
  sem localStorage/sessionStorage — verificado por grep).
- **A-4** O app sem pai (`window.parent === window`) se comporta exatamente como hoje: o receptor
  ignora mensagens que não sejam `qc-*` vindas do parent; `qc-ready` só é enviado se houver parent.
- **A-5** O teclado é re-renderizado a cada ação → o destaque deve ser aplicado ANTES do
  `routeAction` e vale só até o re-render (verificado: 4/14 destaques sobreviveram ao aplicar junto).
- **A-6** Ops pesadas adiam a execução (double-rAF) → o runner espera `busyPending === false`.
- **A-7** Todo step tem um `[data-action]` visível no momento em que é tocado (as teclas da 2ª camada
  aparecem após `key:2nd`; as teclas `calc:` após abrir a gaveta). Step sem elemento → toca mesmo
  assim (sem destaque) — não falha a demo.
- **A-8** O app dentro de iframe (inclusive com o manual aberto no PWA standalone) se ajusta ao
  tamanho do iframe (fitViewport mede o viewport do próprio documento). A verificar visualmente.
- **A-9** Passos `measure` são amostrados → o resultado da demo pode diferir do capturado; isto é
  correto (é o app real), não um defeito.

### Escopo negativo

Sem controles de velocidade/passo/timeline; sem play na Part I nem no `examples.html` legado; sem
narração; sem persistência/transferência de estado; motor intocado; sem novo arquivo de app (o iframe
carrega o próprio `quantum_calc.html`).

## V(2) — após a Fase 3 (iteração 30)

Simplificação: `demo-reset` fundido em `play-overlay` (AR-01) e `demo-visual` fundido em
`demo-runner` (AR-02) → 7 → 5 módulos. `play-overlay` ganha uma máquina de estados explícita como
espinha (PW-01), que absorve os achados concentrados nele; `demo-runner` vira um loop async com
esperas explícitas (MEC-01).

| id   | module        | responsibility | interface | depends-on |
|------|---------------|----------------|-----------|------------|
| M-01 | play-data     | Embutir por `res-block` os steps reais e o mapa passo→chip; botão ▶ | `stepsToGroups(steps) -> {groups: string[], stepGroup: number[]}` (todo passo em exatamente 1 grupo; `page:0` → grupo seguinte — L-01); `stepsToKeys(steps) = groups.join(' · ')` BYTE-IDÊNTICO ao atual (AR-03); `resultBlock` emite `data-steps` e `data-groups` (JSON, via `att()` — SEC-02) + `<button class="play" aria-label="Play this example">` (inglês — MIG-01) | examples-data |
| M-02 | play-overlay  | Sobreposição ÚNICA (criada no 1º ▶ — P-01) com barra de controles FORA do iframe (UX-02): cópia dos chips do bloco com o grupo corrente aceso (UX-01), ▶/■/↻, ×. Máquina de estados + recarga do iframe (ex-demo-reset) | Estados `idle → loading → playing → done\|stopped → (interactive)`; `loading` tem timeout 5 s → mensagem + link "open in the calculator" (RES-01, MIG-02); fechar de qualquer estado = `qc-stop` + `iframe.src='about:blank'` + restaurar foco/scroll no ▶ (PW-01, UX-03, R-01); ↻ de qualquer estado = recarregar e tocar de novo; ESC fecha | M-01, M-03 |
| M-03 | play-protocol | Contrato manual↔app | manual→app `{type:'qc-play', runId, steps, groups, ms?}` (`ms` = ritmo só p/ teste — I-01) · `{type:'qc-stop', runId}`. app→manual `{type:'qc-ready'}` · `{type:'qc-step', runId, i, g}` · `{type:'qc-done', runId, stopped, error?}` (L-02). Filtro: app aceita só `e.source === window.parent`; manual aceita só `e.source === iframe.contentWindow` E `runId` corrente (PW-02, SEC-01). targetOrigin `'*'` (file:// opaco) | — |
| M-04 | demo-runner   | No app, só se `window.parent !== window` (MIG-03): enviar `qc-ready`; tocar a sequência; destaque visual; bloqueio de toque E de teclado físico (PW-03); esconder o "?" embutido (AS-01) | `async runDemo({runId, steps, groups, ms})`: p/ cada passo → `await idle()` (espera `busyPending === false` — MEC-01) → `hilite(el)` (classe `.demo-hit`, removida por timeout também — MEC-02) → `await sleep(HILITE)` → `routeAction(step)` → `qc-step` → `await sleep(KEY)` (+`GROUP` na troca de grupo). `try/catch` → para, desbloqueia, `qc-done{error}` (RES-02). `qc-stop` → flag de cancelamento checada a cada espera. Ao fim: remove `body.demo-active` (teclado interativo). Constantes nomeadas `KEY_MS=350, HILITE_MS=200, GROUP_MS=600` (S-01). `body.qc-embedded` oculta o link "?" | routeAction, busyPending (existentes), M-03 |
| M-05 | play-tests    | Verificar contrato, fidelidade, estados e regressão | Node `tests/v29.test.mjs`: `stepsToGroups` (cobertura, page:0, calc merge) + `stepsToKeys` byte-idêntico para os 92 resultados. PW `tests/v29.spec.js` (ritmo `ms:0`): ▶ em todo res-block com steps; estado final == LCD capturado (exceto measure — AS-03); ■ para no meio; ↻ após ■; ×  mata timers; teclado interativo ao fim; keydown bloqueado durante; runId velho ignorado; app sem pai sem `qc-embedded`/sem receptor ativo; timeout de loading; layout no iframe em viewport de celular e com emulação standalone (AS-02) | M-01..M-04 |

### Respostas por achado (iteração 30)

| achado | resposta |
|---|---|
| AS-01 | `body.qc-embedded` oculta o "?" no app embutido; o About já abre o LinkedIn em `_blank`. |
| AS-02 | Teste PW do layout embutido em viewport de celular, com e sem `display-mode: standalone` emulado; human-AV no Motorola (PWA). |
| AS-03 | Aceito (é o app real). Sem aviso extra (chrome mínimo). |
| AR-01 / AR-02 | Fundidos (V(2) tem 5 módulos). |
| AR-03 | `stepsToKeys` reescrito sobre `stepsToGroups`, com teste byte-idêntico dos 92. |
| I-01 | `ms` opcional no `qc-play`, só usado pelos testes. |
| S-01 | Constantes nomeadas; ajuste no human-AV. |
| SEC-01 / SEC-02 | Filtro por `e.source`; atributo escapado por `att()`. |
| P-01 / P-02 | Iframe único e preguiçoso; recarga por play aceita. |
| R-01 | ■, ESC, `<button>`, foco devolvido. |
| RES-01 / MIG-02 | Timeout 5 s no `loading` + link de fallback; bump do CACHE do SW. |
| RES-02 | `try/catch` no runner → `qc-done{error}`, desbloqueia. |
| UX-01 / UX-02 / UX-03 | Barra fora do iframe com cópia dos chips; foco/scroll restaurados. |
| MIG-01 / MIG-03 | Textos em inglês, asserts de contagem atualizados de propósito; receptor só com pai. |
| PW-01 / PW-02 / PW-03 | Máquina de estados; `runId`; keydown bloqueado. |
| L-01 / L-02 | `stepGroup` definido só em play-data; semântica de `qc-done` fixada. |
| MEC-01 / MEC-02 | `await idle()` antes de cada passo; destaque com timeout. |

### Premissas V(2)

A-1..A-9 mantidas (A-7 VERIFICADA na Fase 2: todo passo dos 92 resultados tem um `[data-action]`
visível e não-inerte no momento em que é tocado; a 1ª ocorrência é sempre a visível).
- **A-10** O PWA embute o app com o CSS de `display-mode: standalone` (100dvh do iframe) — o layout
  deve caber no iframe nos dois modos (verificar: AS-02).
- **A-11** `busyPending` é o único adiamento assíncrono de uma ação; nenhuma outra ação agenda
  trabalho que mude o visor depois de retornar (exceto animações CSS, que não afetam o estado).

## V(3) — após a Fase 3 (iteração 31) — CORRENTE

Mesmos 5 módulos da V(2) (nenhum adicionado/removido); ajustes de contrato e de comportamento.

| id   | module        | responsibility | interface | depends-on |
|------|---------------|----------------|-----------|------------|
| M-01 | play-data     | Embutir por `res-block` os steps reais e o mapa passo→chip; botão ▶ | `stepsToGroups(steps) -> {groups: string[], stepGroup: number[]}`; `stepsToKeys = groups.join(' · ')` byte-idêntico; `resultBlock` emite `data-steps` + `data-step-group` (JSON via `att()`), chips `<code data-g=i>`, `<button class="play" aria-label="Play this example">▶</button>`. SEM `data-groups` (AR-04) | examples-data |
| M-02 | play-overlay  | Sobreposição única e preguiçosa; barra FORA do iframe com CLONE dos chips do bloco (grupo corrente aceso), botão único ■/↻ (UX-05) e ×; máquina de estados; recarga do iframe | Função real `manualPlay()` em examples-render.mjs, injetada como `(${manualPlay.toString()})()` (I-02). Estados `idle → loading → playing → done\|stopped`. `loading`: `iframe.src = 'quantum_calc.html#qc-run=' + runId` (L-03); aos 5 s mostra link "open in the calculator" SEM cancelar (RES-03). Fechar (×, ESC, swipe-down NA BARRA — UX-04, backdrop) de qualquer estado = `qc-stop` + `src='about:blank'` + destrava scroll + foco/scroll de volta ao ▶. Abrir trava scroll do body (UX-06). ■ → `qc-stop`; ↻ → nova recarga com novo runId | M-01, M-03 |
| M-03 | play-protocol | Contrato manual↔app (tabela abaixo) | ver "Protocolo" | — |
| M-04 | demo-runner   | No app embutido: `qc-ready`, tocar, destacar, bloquear toque/teclado, esconder "?" | Ativo só se `window.parent !== window`. Lê `runId` de `location.hash` (`/^#qc-run=(\d+)$/`, SEC-03). `async runDemo({runId, steps, stepGroup, ms})` com `await idle()` (busyPending) → `hilite` → `sleep(HILITE)` → `routeAction` → `qc-step` → `sleep(KEY [+GROUP])`; cancelamento checado a cada espera; `try/catch` → `qc-done{error}`; fim → remove `body.demo-active`. `body.qc-embedded` oculta o "?" | routeAction, busyPending, M-03 |
| M-05 | play-tests    | Contrato, fidelidade, estados, regressão | Como V(2) + casos: ↻↻ rápido termina numa demo completa (L-03); `qc-ready` só com o runId do hash; fallback aparece aos 5 s sem cancelar (RES-03); scroll do body travado/destravado | M-01..M-04 |

### Protocolo (tabela fechada — M-03)

| mensagem | direção | campos | quando |
|---|---|---|---|
| `qc-ready` | app → manual | `runId` (do hash) | fim do `init()` do app embutido |
| `qc-play` | manual → app | `runId, steps: string[], stepGroup: number[], ms?: number` | ao receber `qc-ready` com o runId corrente |
| `qc-step` | app → manual | `runId, i, g` (= `stepGroup[i]`) | logo após `routeAction(steps[i])` |
| `qc-stop` | manual → app | `runId` | ■ ou fechar |
| `qc-done` | app → manual | `runId, stopped: boolean, error?: string` | fim, parada ou exceção |

Regras: app aceita só `e.source === window.parent` e `runId` == o do seu hash; manual aceita só
`e.source === iframe.contentWindow` e `runId` corrente; `targetOrigin '*'`; mensagens com outro
`type` são ignoradas. `ms` (opcional) substitui KEY/HILITE/GROUP — usado só pelos testes.

### Respostas por achado (iteração 31)

| achado | resposta |
|---|---|
| L-03 | `runId` no hash do iframe + eco no `qc-ready`. |
| L-04 | Campo renomeado `stepGroup` (protocolo e `data-step-group`). |
| RES-03 | Fallback aos 5 s sem cancelar. |
| UX-04 | Swipe-down só na barra. |
| UX-05 | Botão único ■/↻. |
| UX-06 | Scroll do body travado enquanto aberta. |
| AR-04 | Barra clona os chips do bloco; sem `data-groups`. |
| I-02 | `manualPlay.toString()` injetado. |
| AS-04 / SEC-03 / MEC-03 / MIG-04 | Aceitos/cobertos por teste, como descrito na matriz. |

Premissas: A-1..A-11 mantidas. **A-12** O WindowProxy do iframe mantém identidade entre recargas
(filtro por `e.source` continua válido após ↻) — coberto por teste.

### Padrões

Modular monolith single-file (como o app inteiro); KISS+YAGNI; event-driven single-threaded
(postMessage + setTimeout); GoF Command (cada step é um comando já existente do `routeAction`) e
Observer (eventos `qc-step` para o manual). Sem camada de dados (Fowler N/A).
