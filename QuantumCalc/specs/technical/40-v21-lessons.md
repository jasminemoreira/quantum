# v21 — Lições aprendidas (ciclo 22)

Tema: **Part III · Classic Algorithms** no `manual.html`. 5 cards (Deutsch, Deutsch–Jozsa n=3,
Bernstein–Vazirani, Grover n=3, Phase Estimation), cada um com 4 seções consistentes
(Motivation / Circuit-key sequence / State at key points / Result). Delta de DOCUMENTAÇÃO — motor
ℤ[ζ₁₆]/portas/FSM intocados; oráculos como **sequências literais de portas concretas**.

Suite final: **462 testes** (345 Node + 117 Playwright). +17 v21 Node (8 estados anti-AP7 + 9
keys↔steps + guardas). 0 regressão de v21 sobre os 445 do v20 (1 PW pré-existente v20-UI-8 fora de
escopo, deferido p/ device). Zero módulo/padrão novo.

---

## v21-L0 — Pre-audit da capacidade do motor ANTES de escrever o card (anti-AP7 + S6)

A hipótese P0 era modelar oráculos via `SymRules.declare`. Investigação no código mostrou que
`SymRules.declare(gate,sig,label,λ)` modela autovalor de **qubit abstrato único** (U\|ψ⟩=λ\|ψ⟩, padrão
v4) — **insuficiente** para oráculos f(x)-dependentes U_f\|x⟩=(−1)^{f(x)}\|x⟩ sobre estados de base.
**Decisão:** todo oráculo = sequência de portas concretas (CNOT/CCX/CZ) que já existem e são exatas.
Verificar a capacidade real (quais portas são botões tipáveis; multi-controle) ANTES de autorar evitou
um caminho errado. Descoberta-chave: o caminho do teclado (`applyGate`) **exige aridade estrita** — Z
não aceita 2 controles; CCZ\|111⟩ tem de ser construído como **H·CCX·H** (CCX/Toffoli É botão), e o
difusor reusa o **preset Grover** (que aplica MCZ via `Engine.applyN` internamente).

## v21-L1 — Validar TODO estado contra o motor em Node (loadQC) antes de autorar

Antes de escrever qualquer card, um harness `loadQC()` (mesmo mecanismo do `manual.test.mjs`) computou
o dirac exato de cada circuito. Isso fixou os estados-alvo (Deutsch q0=\|0⟩/\|1⟩; DJ input \|000⟩/\|111⟩;
BV \|1011⟩; Grover P=25/32→121/128; QPE \|0011⟩) ANTES da prosa — nunca um resultado inventado. O teste
`v21.test.mjs` reimplementa um interpretador mínimo de `steps[]` e re-deriva cada estado, travando-os.
Detalhe bonito: a captura da UI mostra a forma **fatorada** (`\|111⟩⊗((1/√2)\|0⟩−(1/√2)\|1⟩)`) — mais
didática que o dirac cru, e matematicamente idêntica.

## v21-L2 — `keys`↔`steps` é um CONTRATO; abreviar com "…" quebra a reprodutibilidade

O card só ensina se o que está escrito (`keys`) reproduz o estado validado (`steps`). O teste de
consistência por subsequência pegou exatamente isto: o Grover iter-2 usava "… · oráculo · difusor"
elidindo a 1ª iteração — o estudante não conseguiria reproduzir digitando `keys`. **Fix:** mostrar a
sequência COMPLETA (que ainda por cima ensina "repita o bloco oráculo+difusor 2×"). Lição: nada de
"…" em sequências didáticas; o teste keys↔steps é a trava.

## v21-L3 — Human-AV pega o que o automated não pega (7ª recorrência)

Os testes automatizados estavam 100% verdes e a operadora aprovou os cards — mas o human-AV no device
revelou DUAS questões que nenhum teste capturava: (1) reusar ids A3/A4/A6/A12 na Part III ficou
confuso e o move deixou buracos na sequência A; (2) a navegação manual→calculadora deixava um header
com × preso no topo no PWA Android. Ambas corrigidas in-loop. Confirmação do padrão: adequação de
índice e fluxo de navegação são julgamento humano, não formalizáveis.

## v21-L4 — `target="_blank"` num PWA standalone abre Custom Tab (header + × preso)

No Android, abrir um link com `target="_blank"` a partir de um PWA **standalone** abre o destino numa
**Custom Tab** (navegador in-app) com barra superior + × de fechar. Navegar de volta DENTRO dela mantém
o header — só o × o remove. **Fix:** remover `target="_blank"` do link `?`→manual no `quantum_calc.html`;
como manual e calculadora estão ambos no escopo/precache do SW, a navegação acontece **na mesma janela**
do PWA, sem Custom Tab. Regra: dentro de um PWA, navegação entre páginas do próprio escopo deve ser
**same-window**; `target="_blank"` é para sair do app.

## v21-L5 — Renumeração de índice: prefixo próprio por seção + fechar buracos do move

Ao promover 4 cards do tier Advanced (A) para uma nova Part III, (a) dar à nova seção um **prefixo
próprio** (E1–E5) evita a ambiguidade de reusar A-ids; (b) o move deixa **buracos** na sequência de
origem (A3/A4/A6/A12 vazios) que precisam ser **fechados explicitamente** (renumerar Advanced→A1–A9);
(c) referências cruzadas em prosa (ex.: "A4 Grover, A5 QFT") ficam stale com o move e precisam ser
caçadas (grep) e corrigidas. Single-source-of-truth + ALGO_ORDER no render isolaram a ordem pedagógica
da ordem física no array.

---

## Carry-forward → v22

**Part III — completar o catálogo** (os 5 ADIADOS no v21): Simon's Algorithm, Superdense Coding
(card expandido), Shor compilado (N=15, a=11), Quantum Counting, Teleportation (card expandido).
Reusar exatamente o mesmo padrão de card E (motivation/keys/state/result) + harness de validação
loadQC + teste keys↔steps. Próximos ids: E6…E10.

Radar herdado: CU(λ)/EV multi-qubit (⟨Z₀Z₁⟩) — 9 ciclos adiado; iOS KaTeX baseline (bug upstream
WebKit, sem device); persistência localStorage de _expanded; FLIP animation polish.

---

## Pós-P7 — Série de polimento da Bloch ↔ expandir (live qcalc-v21-1 → v21-11)

Após encerrar o v21 (Part III), a operadora pediu uma sequência de refinamentos de UX da esfera de
Bloch no modo expandir/retrair. Todos UI-only, **motor intocado** (CSS + render + toggleExpand). Cada um
deployado e validado ao vivo (human-AV). Documentados aqui porque viram material de carry-forward (o
mesmo padrão de animação pode reaparecer):

- **v21-1 (re-render + affordance):** `toggleExpand` agenda `renderBloch()` após a transição assentar
  (a esfera dimensiona pela altura do `.disp-body`); `applyExpand` inclui `|| blochOn` → a esfera ativa
  habilita a seta ▼ de expandir; `showBloch` chama `applyExpand`.
- **v21-2 (zoom suave):** `transition: width/height .28s` no `#blochCanvas`; 1º dimensionamento suprimido
  via flag `_blochSized` (evita animar a partir do default 300px do canvas); `prefers-reduced-motion`.
- **v21-3 (collapse invertido):** expand = display→esfera; collapse = esfera encolhe PRIMEIRO (anima ao
  tamanho colapsado guardado `_preExpandBlochCss`) e o display colapsa 300ms depois (`collapseDisplay`).
- **v21-4 (layout empilhado ao expandir):** `body.display-expanded #dispMain{flex-direction:column}` —
  esfera centralizada em cima, estado em largura cheia embaixo (fim do texto espremido ao lado).
- **v21-5 (FLIP horizontal):** `flex-direction` row↔column não transiciona → a esfera saltava
  direita↔centro; `blochRect()`/`playBlochSlide()` medem o left antes/depois e animam `translateX`.
- **v21-6 (FLIP diagonal no collapse):** o salto vertical (topo-coluna → centro-linha) virava "pulo para
  baixo"; collapse passou a animar `translate(dx,dy)` (diagonal). Expand fica X-only ("perfeito").
- **v21-7 (lockstep de curva):** **LIÇÃO** — ao animar um elemento cuja posição de FLOW também é animada
  por outra transição (aqui o Y da esfera é arrastado pela altura do `.display`), o `transform` do FLIP
  DEVE usar a MESMA curva/duração da transição do flow (`.25s cubic-bezier(.4,0,.2,1)`). Curvas
  diferentes deixam uma cauda residual = micro-pulo.

**Resíduo aceito pela operadora ("já está bom"):** o `renderBloch` final (em `collapseDisplay`, ~+600ms)
recomputa o tamanho exato na geometria colapsada e pode dar um micro-acerto de tamanho via a transição
de zoom — imperceptível na prática; não perseguido (anti-AP8 / S2: parada é decisão da operadora).

**Padrão recorrente confirmado:** human-AV ao vivo é insubstituível p/ *feel* de animação — 7 iterações
de ajuste fino que nenhum teste automatizado capturaria (Playwright não julga suavidade percebida).
