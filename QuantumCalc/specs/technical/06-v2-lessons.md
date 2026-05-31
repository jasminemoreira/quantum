# Lições do projeto — ciclo v2 (Fase 7)

> Insights específicos DESTE projeto (não da metodologia), capturados no pós-review v2.
> Entrada valiosa para um eventual v3 via start_new_cycle.

## 1. Domínio: precedência de operadores é semântica, não cosmética
O `√` foi inicialmente modelado como FUNÇÃO no avaliador (shunting-yard), o que fez
`√2/2` ser lido como `√(2/2)=1` e `√2+1` como `√3`. A correção foi tratá-lo como
**operador unário prefixo de alta precedência** (PREC 5, right-assoc), ligando-se ao
operando imediato. Lição: em calculadoras simbólicas, a escolha função-vs-operador para
prefixos como `√` muda o RESULTADO, não só a digitação. Validar com `√2/2`, `√2*√2`,
`√2+1`, `√8` antes de considerar pronto.

## 2. Domínio: "exato" no display ≠ "exato" no núcleo
O núcleo ℤ[ω] (ζ₈) é exato só para fases múltiplas de π/4. Ângulos como CRz(π/4) sobre
estados em superposição produzem fases π/8, que NÃO fecham em ζ₈ → caíam para decimal
(0.3927). Solução: `recognizeAngle(θ)` reconhece a fase como múltiplo racional de π
(p/q, q≤24) e a magnitude via `matchSurd`, exibindo `e^{±iπ/8}` SEM estender a exatidão
do núcleo. Lição: separar "exatidão de representação interna" de "exatidão de exibição" —
um reconhecedor numérico→simbólico na borda de render dá exatidão visual sem inchar o
núcleo. Marcar `approx=false` só quando magnitude E fase são reconhecidas.

## 3. Domínio: ângulo simbólico exige um tipo próprio que colapsa na mistura
Manter `2*π/8 → π/4` simbólico exigiu um tipo `PiAngle {n,d}` propagado por +,−,*,/ e
menos unário, que COLAPSA para numérico ao misturar com não-π (`π+1`) ou ao passar por
função transcendente. Lição: π-simbólico é viável e barato SEM um CAS, desde que se
aceite o colapso explícito na mistura — tentar manter simbólico além disso vira CAS
(fora de escopo P0).

## 4. Stack: `[hidden]` perde para `display` inline em painéis
O atributo `hidden` foi sobreposto por `display:inline-block`/`flex` nos painéis
(Bloch/overlay), deixando-os visíveis quando deveriam sumir. Correção: regra CSS
explícita `.painel[hidden]{display:none}`. Lição: em HTML/CSS puro, sempre que um
elemento tem `display` não-default, o `[hidden]` precisa de regra explícita para vencer.

## 5. Stack: Canvas devolve objetos do domínio, não números
`Ops.blochVector` retorna x,y,z como `Amp` (objetos ℤ[ω]/numéricos); o render do Canvas
os usou como números → `NaN` → `lineTo(NaN)` desenha nada (falha silenciosa). Lição: na
fronteira núcleo→Canvas, converter explicitamente (`Algebra.toComplex(a).re`) — bugs de
tipo em Canvas não dão erro, só não desenham. Testar contando pixels da cor do vetor.

## 6. Padrão que funcionou: keymap declarativo desacoplado do render
O teclado é dirigido por dados (`Q_ROWS`/`C_ROWS` → `layout(mode)` → `renderKeypad`).
Isso permitiu reorganizações radicais de UI (remover 2nd, condensar formatos, mudar de
grade 5-col para 10-col com `span` por tecla) SEM tocar na lógica de roteamento — só
editando arrays e uma linha de `grid-column`. Lição: para UIs que vão iterar muito sob
feedback do usuário, manter o layout 100% declarativo (incl. spans/classes) paga-se rápido.

## 7. Premissa P0 que mudou: offline-puro e os deliverables de export
A restrição P1 "offline puro (file://)" e os deliverables de export (Qiskit/LaTeX/Dirac)
e presets foram **revistos pelo usuário** no v2: KaTeX via CDN (degrada offline) entrou;
export e presets saíram. Lição: deliverables do P0 não são imutáveis — o operador pode
re-baselinar (S5); o importante é registrar a decisão (não deferir em silêncio, AP10) e
reescrever os testes que dependiam do que saiu (presets eram usados para montar estados
nos testes → reescritos com construção manual via portas).
