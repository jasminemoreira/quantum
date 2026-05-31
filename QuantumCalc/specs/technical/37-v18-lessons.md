# v18 — Lições (condense de coeficientes simbólicos compostos no display)

Ciclo 19, conduzido pela metodologia Versus (P0→P7) em Opus, sessão única.
Escopo entregue: **1 frente** — condensação automática de coeficientes simbólicos compostos no
`SymExpr.format` (display do núcleo). `½+½·e^{iθ}`→`(1+e^{iθ})/2`, `(1/√2)±(1/√2)e^{iθ}`→`(1±e^{iθ})/√2`
e similares, renderizados como **fração vertical `\dfrac`** sem parênteses externos via 1 regra nova
no `toKatex`. Predicado de **7 condições** (mesmo c exato, g real positivo, denom limpo, phase-coef
guard) faz a regra disparar SÓ no padrão limpo. Suíte 411 (306 Node + 105 Playwright), 0 padrão/módulo
novo, +13 testes v18, 5 asserções migradas intencionalmente (v4×4 + ui.spec×2).

## L1 — Contrato bilateral exige a MESMA representação dos dois lados (o bug do `fmt` do denominador)

O predicado de `condense` verifica no passo (6) que `Algebra.format(den, 'rect').text` casa a regex de
denominador limpo `^(\d+√\d+|√\d+|\d+)$`. A primeira versão do `format()` então renderizou o den
**com o `fmt` do usuário** (`A.format(c.den, fmt)`). Em `exp` mode `A.format(√2, 'exp').text` cai p/
**numérico** `'1.41421'` (a mag>1 não cabe na forma exponencial unitária r·e^{iθ}). Saída: predicado
aceita, render mostra `(1 + e^{iθ})/1.41421` — bilateral quebrado silenciosamente.

**Lição:** quando dois lugares no código formam um contrato — o **predicado** que decide se a regra
dispara, e a **saída** que materializa o resultado — eles têm de usar a MESMA `fmt`/representação.
Caso contrário o predicado valida A e o renderizador emite B. Fixado: ambos usam `'rect'` para o
denominador (magnitude real exata). Pego em Fase 5 pelo unit test `v18-3` (caso `1/√2`), que rodou
em `'exp'` por acidente do helper — e foi exatamente isso que revelou o bug. **Sugestão p/ futuros
contratos bilaterais:** unit test deve exercitar TODAS as fmts uma vez, não apenas a default.

## L2 — Predicado preciso de 7 condições reproduziu o playbook v17-L4 (regressão = não-evento)

O 🔴 da Fase 2 (Migration: blast radius da troca da fonte única `SymExpr.format`) era genuíno — `format`
é lido por `diracSym`, `factoredSym`, `lambdaLabel`, e via toKatex pelo render LaTeX. Resolução: **não**
adicionar componentes (anti-AP2), mas APERTAR o predicado:

| # | Condição | Filtra |
|---|---|---|
| 1 | ≥2 monômios | todo coef de monômio único (caso concreto Bell/GHZ/Hadamard) |
| 2 | `.ex===true` p/ toda amp | approx (numérico) |
| 3 | g real positivo (toComplex.re>0 ∧ |im|<1e-12) | fator complexo (i/2) |
| 4 | amp_k ∈ {g, −g} via eqAmp exato | magnitudes diferentes, sinais relativos não-±1 |
| 5 | `1/g == 1` → null | integer-amp sums (1+λ), recursão (numExpr.amps∈{±1}⇒g=1) |
| 6 | `Algebra.format(den,'rect')` casa `(\d+√\d+|√\d+|\d+)` | denom complicados (raros) |
| 7 | phase coefD≠1 (e^{(n/d)…}) | numerador com parens aninhados que quebrariam `[^()]+` do toKatex |

Resultado prático: das 411 asserções, **exatamente 6 mudaram** (4 v4 simbólicos + 2 ui.spec); todas as
demais (incluindo as ~30 asserções concretas tipo `(1/√2)|00⟩ + (1/√2)|11⟩` que poderiam parecer
condensáveis) ficaram **byte-idênticas**. A razão: o caminho concreto `Render.dirac` usa
`Algebra.format` diretamente, não `SymExpr.format` — outra fronteira que protegeu o blast radius.

**Lição:** todo "rewrite rule sobre uma função de formato amplamente lida" deve nascer com um predicado
de 6-8 condições. Cada condição filtra um caso falso-positivo. Se você fica em 1-2 condições, está
pegando muito — voltar até estreitar.

## L3 — Reuso de sub-pattern via DRY informal (a denominator alternation)

A regra nova no `toKatex` (linha 2206) reusa a alternation **idêntica** ao da regra digit-fraction
(2207): `(\d+√\d+|√\d+|\d+)`. E o predicado de `condense` (passo 6) reusa a MESMA alternation como
regex `^(\d+√\d+|√\d+|\d+)$`. Três menções da mesma sequência. Hoje, três strings literais.

**Lição:** se a metodologia v18-style virar comum (rewrite rules + render boundary), vale extrair
`const DENOM_ALT = '(\\d+√\\d+|√\\d+|\\d+)'` como constante única no escopo do módulo Render e
construir os 3 regex a partir dela. Custo: 1 const + 3 substituições. Benefício: anti-drift garantido
quando a alternation evoluir (e.g., um futuro `int√int√int` para denominadores grau-4 conviria à
v6-Fase-3-revised). Não fiz no v18 porque o conjunto está estável e a inserção mínima passou; mas é
candidato natural a v19 se o conjunto crescer.

## L4 — Recursão prova-termina por INVARIANTE da forma reescrita

`format` chama `condense(expr)`; quando dispara, chama recursivamente `format(c.numExpr)`. Risco
teórico: loop infinito. Resolução: **o predicado é a terminação**. `numExpr = scaleAmp(expr, 1/g)`
faz toda amp ∈ {+1, −1}. Em `condense(numExpr)`: a0 = 1 → g = 1 → den = `DIV(ONE, 1)` = ONE → step
(5) retorna null. **Profundidade máxima: 1 nível**, demonstrado por `v18-10`.

**Lição (reusável):** quando uma reescrita PODE recursar, prove a terminação por um invariante da
forma pós-reescrita (aqui: amps viram ±1, e ±1's g é 1, que o guard pega). Sem contador de profundidade,
sem timeout, sem hack — a terminação é estrutural. O mesmo padrão suportou o `fold` do v17 (idempotência
por construção). Termo de arte: "fixed-point in one step".

## L5 — S6 disparou 2× em P5; cada vez root-caused, não loop heurístico

O safeguard S6 (loop detector) ativou duas vezes durante P5, cada uma com um problema distinto e
identificável: (a) test `v18-11` era integração especulativa de `SymEngine.apply` com `gate:'CU'`,
que gera o ket DECORADO `CU|ψ⟩` (sem aplicar λ) — não trivial de prever sem rodar; (b) bug
arquitetural do `fmt` do denominador (L1 acima). Documentado em decisão `d4a54f2c`. **A diferença
entre loop heurístico (que S6 visa pegar) e iteração legítima é: cada iteração diagnosticou um
root-cause distinto, registrado em testes/decisões.** S6 fired again em P6 antes do `advance_phase`
(o contador é por fase) — proceder p/ a próxima fase resetou o contador, que é o comportamento
desejado.

**Lição p/ a metodologia:** S6 é útil mas tem falso-positivo quando você está iterando
deliberadamente em testes (não em produção). Sugestão: o contador poderia ignorar `node --test`
quando a saída inclui `pass > 0` AND o fail count CAI entre execuções consecutivas — sinal de
convergência, não loop. (Apenas observação; sem ação no v18.)

## Carry-forward → v19 (não iniciado)
- `CU(λ)` ergonômico / kickback com autovetor arbitrário; **EV multi-qubit `⟨Z₀Z₁⟩`** (pendente
  desde v13/14/16/17/18 — agora 6 ciclos adiado, vira semente top-of-mind se for retomado).
- Extração da `DENOM_ALT` em constante única no Render (L3 acima) — só vale se outra regra com
  denominador limpo surgir.
- Fix do baseline das frações do KaTeX no Safari iOS (radar; bug upstream WebKit). Operadora ainda
  sem device para validar.
- Possível v19 (sugestão sem aprovação): **condensação de display CONCRETO** — `(1/√2)|00⟩+(1/√2)|11⟩`
  para Bell viraria `(|00⟩+|11⟩)/√2` (espelhando v18 no path concreto, via `Render.dirac` em vez de
  `SymExpr.format`). Útil se a operadora quiser a mesma estética nos estados concretos. **Não foi
  pedido**; é uma extensão natural não-escopada.
