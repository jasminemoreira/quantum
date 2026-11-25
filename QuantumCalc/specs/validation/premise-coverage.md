# Premise coverage — Cycle 29 · PLAY no manual

Premissas numeradas de `specs/technical/architecture.md` (V(3)). Para cada uma: o teste que FALHARIA
se ela deixasse de valer, ou o motivo de não haver.

| premissa | teste que falha se ela quebrar | observação |
|---|---|---|
| A-1 `routeAction(step)` == clique real | `tests/v29.spec.js` v29-PW2 | O manual é capturado por CLIQUES reais (examples.spec); o PW2 toca via routeAction e compara os 92 visores. |
| A-2 file:// = iframe cross-origin → só postMessage | v29-PW2..PW9 (rodam em file://) | Se a premissa deixar de valer (acesso direto liberado), nada quebra — o postMessage continua funcionando. Sem teste de falha necessário. |
| A-3 recarregar = estado limpo | v29-PW4 | ↻ após ■ parcial deve chegar EXATAMENTE ao estado final documentado. |
| A-4 app sem pai inalterado | v29-PW8 + `tests/ui.spec.js` (suíte de UI inteira, sem pai) | |
| A-5 destaque antes do routeAction, apagado pelo re-render | v29-PW3 (`.demo-hit` visível durante a demo) | |
| A-6 ops pesadas adiadas → esperar `busyPending` | v29-PW2 com `ms:0` | Sem a espera, o `if (busyPending) return` engoliria teclas dos exemplos pesados (densidade, QFT) e a fidelidade falharia. |
| A-7 todo passo tem `[data-action]` visível | — | Verificado no PoC (dups.mjs: 0 faltando, 0 ocultos). Se quebrar, a demo continua (passo sem destaque) e o PW2 não falha; regressão só seria visual (human-AV). |
| A-8 app cabe no iframe | v29-PW11 (viewport 390×844) | + human-AV no Motorola (2026-11-25, ok). |
| A-9 `measure` é amostrado | — | Comportamento correto do app real; o PW2 exclui esses passos da comparação literal. |
| A-10 CSS standalone vale dentro do iframe no PWA | — | Playwright não emula `display-mode: standalone`; coberto pelo human-AV no PWA do Motorola (ok). |
| A-11 `busyPending` é o único adiamento que muda o visor | v29-PW2 | Um adiamento novo não esperado faria o visor final divergir. |
| A-12 identidade do WindowProxy entre recargas | v29-PW4 (↻) + v29-PW9 | SUPERADA na Fase 5: o iframe é RECRIADO a cada play e o filtro usa o iframe corrente; o PW9 garante que mensagens de outra origem/runId são ignoradas. |

Críticos (🔴): nenhum nas iterações 30 e 31 → sem `critical-coverage.md`.
