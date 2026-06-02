# v26 — Teclado único + tecla 2nd (fim do carrossel) + polish — Lições

Ciclo 27 do Versus. Delta brownfield UI/DOC: TECLADO + CSS + DOCS + TESTES. Motor ℤ[ζ₁₆]/applyN/Gate.META/Presets/FSM **intocado**. Suíte 100% verde: 397 Node + 151 Playwright. Live: qcalc-v26-13.

## O que foi entregue
- **Carrossel de 2 páginas ELIMINADO** → página única com tecla **`2nd`** (toggle/trava global; revival do shift pré-v14). Cada bloco com `keys2?` (2ª camada in-place).
- gates: 1q (H X Y Z S T Rx Ry Rz P U) + **Bell** primário; 2ª camada = S†/T†/√X/√Y + SWAP/iSWAP + presets (QFT/QFT†/GHZ/Grover/W).
- operations: 8 primárias (prob measure Bloch ⟨φ|ψ⟩ ⊗ ‖ψ‖ ⟨ZZ⟩ factor) + 2ª camada (phase ρ ρ_A Schmidt S(ρ) C); altura constante (spacers).
- kets: + input (|T⟩/rand/amp). numpad: + M e ⌫, − (. ± π 1/√2). Comando reordenado (CTRL Q SET 2^j 2nd / ALL ESC ↶ ↷ CLR).
- **Q-omissão** nos cards e na referência (`0 H` em vez de `0 Q H`); controle/SET-contagem/multi-alvo mantêm Q.
- Manual revisado: explicação ANTES das teclas/resultado; Part I reescrita p/ v26; circuitos E3 (H final em q3) e E10 (correções controladas) corrigidos.
- Polish PWA/CSS: largura cheia + altura fixa; fontes brancas (ocre/verde/numérico); contraste da Bloch por tema; verde do visor no escuro.

## Lições

### L1 — `margin:auto` num flex-coluna QUEBRA o stretch (bug de largura do PWA)
O `#keypadArea{margin:0 auto}` num `#app{display:flex;flex-direction:column}` faz o filho ter largura de CONTEÚDO (centralizado), NÃO 100% — `align-items:stretch` é cancelado por margem lateral auto. Sintoma: teclado mais estreito que a tela, e MAIS estreito ao expandir (conteúdo encolhe). Fix: `width:100%` explícito no #keypadArea. Lição: em flex-coluna, `margin:auto` lateral ≠ centralizar-mantendo-largura; ou usa `align-self` + sem width, ou `width:100%` (não as duas coisas).

### L2 — CSS puro (dvh+flex) > JS de zoom para preencher a tela
O `fitViewport` (JS: media clientHeight, seta altura do display, zoom-to-fit) era frágil no PWA (clientHeight stale → sobra no rodapé; zoom<1 → encolhe largura). Trocado por CSS: `#app{height:100dvh;display:flex}` + `.display{flex:1}`. O display cresce sozinho (inclusive no expand, quando zonas do teclado somem) sem JS. O JS fica só p/ navegador. Lição (capitaliza a da operadora): quando o layout é "preencher a tela", CSS (dvh+flex) é mais robusto que medir-e-ajustar via JS. O `100dvh` do Chromium/Android (que motivou o JS no v14) já é estável o suficiente em 2026.

### L3 — Altura fixa no PWA = descontar a margem + travar o scroll do documento
`#app{height:100dvh}` + `margin:6px` = 100dvh+12px → o documento rola ("pull"). Fix: `height:calc(100dvh - 12px)` (desconta 2×margem) + `html,body{height:100dvh;overflow:hidden}`. Lição: altura fixa exige contabilizar TODA a caixa (margem inclusa) E bloquear o overflow do documento.

### L4 — Toggle latching (2nd) tem footgun de paridade no REPLAY
Com `2nd` travado, as teclas primárias somem. Nos cards, sequências de 2ª camada precisam de bracket `2nd … 2nd`; um `2nd` órfão (ex.: ex-`page:0` após algo que virou primário — SWAP/Bell) inverte a paridade e esconde a próxima primária. O examples.spec recarrega por result (reseta o toggle), mas DENTRO de um result a paridade importa. Lição: ao converter `page:1/page:0`→`2nd`, conferir cada result; o que virou primário (SWAP→2nd? não — Bell→primário) NÃO leva toggle.

### L5 — Q-omissão depende da aridade; o replay (runSteps) precisa replicar o app
`n Q gate` → `n gate` só vale p/ 1-alvo único (CTRL/SET-contagem/multi-alvo mantêm Q). O `runSteps` do v21 (replay anti-AP7 em Node) NÃO dobrava o dígito solto em alvo — foi preciso espelhar o applyGate do app (`if(num!=='') targets.push(num)`), inclusive ANTES de porta paramétrica (pending). Lição: réplicas de FSM em teste devem espelhar TODAS as conveniências do parser real, senão a omissão quebra o pino.

### L6 — Diagramas de circuito são HAND-AUTHORED → divergem dos steps; auditar
Os SVGs (CIRCUITS) são separados dos `steps`. Após v25/v26, E3 (faltava H final na ancilla q3) e E10 (mostrava medição+clássico em vez das correções controladas da medição-adiada) divergiram. Lição: a cada mudança de gramática/cards, AUDITAR os diagramas extraindo a sequência real de portas dos steps e comparando; abstrações (Uf/enc/Oracle/G) são legítimas, mas portas literais (BV, teleporte) têm de bater.

### L7 — Comentário em PT vaza p/ o manual gerado (no-pt-leak)
Comentário CSS em português dentro de uma string que vira `<style>` do manual.html é pego pelo guard no-pt-leak (scan do arquivo INTEIRO). Lição: comentários em strings que compõem o OUTPUT (CSS/HTML do render) devem ser em inglês; comentários de código JS (não-output) podem ser PT.

### L8 — Reverter arquitetura (carrossel→2nd) é seguro se os handlers degradam
O `initSwipe`/`applyPageView` só agem se `#viewport`/`#pageStrip` existem; parando de renderizá-los, auto-desativam. Usei um wrapper `.kp-viewport` SEM o id (`closest('#viewport')` não casa → click normal, sem swipe). Lição: handlers guardados por `closest(seletor)` degradam graciosamente quando o DOM-alvo some — reverter é remover a renderização, não cirurgia nos listeners.

## Decisões de design notáveis
- **`0123 X` (lista de índices por dígitos) DESCARTADO**: colide com índices de 2 dígitos (q10–q12); gramática dependente de contexto. Lista = `n Q n Q gate` (inequívoca). E o broadcast/seleção-múltipla foi descartado: `0 H 1 H 2 H` (Q-omisso) já cobre, mais curto.
- 2nd = TRAVA (não one-shot) — escolha da operadora p/ encadear teclas da 2ª camada ao testar.
- Cor do 2nd = Pale Banana (paleta) + borda marrom Pantone 19-1116 Coffee.

## Resíduo
- DEPLOY feito (qcalc-v26-13, live). Suíte verde. Sem pendências funcionais.
