# Critérios de Aceitação & Validação — Quantum Calculator

> Fonte da verdade para a Fase 6 (testes). Critérios mensuráveis/verificáveis.
> Ground truth de cálculo: specs/examples/worked-examples.md.

## Critérios de Sucesso (da Fase 0)
- **SC-1 Correção de circuitos:** Bell, GHZ, teleporte, QFT pequena produzem o
  estado **exato correto** (conferir contra E1–E8 e literatura).
- **SC-2 Exatidão simbólica:** amplitudes Clifford+T exibidas como `1/√2`,
  `e^{iπ/4}` etc., **nunca** decimais.
- **SC-3 Bases e formatos:** 3 formatos de fase (exp/ret/polar) e 3 bases
  comutam corretamente, sem perda de exatidão.
- **SC-4 Entrada:** `n Q gate`, `ALL gate`, `c CTRL t Q GATE`, bitstring/contagem
  funcionam conforme a FSM (specs/design/ui-layout.md).
- **SC-5 Fallback numérico:** ângulo arbitrário → amplitude numérica **sinalizada**
  como `approx`; ângulo notável (π/2^m) permanece exato.
- **SC-6 Operações/Export:** probabilidades de medição exibidas como **frações
  exatas**; export LaTeX/Dirac e Qiskit gera saída válida (Qiskit com endianness
  revertido — teste de ida-e-volta).

## Critérios técnicos (restrições verificáveis)
- **T-1:** núcleo ℤ[ω] satisfaz ω²=i, ω⁴=−1, conj(a,b,c,d)=(a,−d,−c,−b),
  √2=(0,1,0,−1) (testes unitários de aritmética).
- **T-2:** big-endian interno; só o export Qiskit reverte a ordem.
- **T-3:** N≤8–12 qubits; acima → recusa/aviso (sem travar).
- **T-4:** ops de emaranhamento via ρ reduzida (sem materializar 4^N); vista da ρ
  completa só p/ N≤5.
- **T-5:** convenção U(θ,φ,λ) = OpenQASM 3.0/Qiskit, exibida na UI.
- **T-6:** `recognize()` com tolerância fixa; nenhum falso "exato" para valores
  fora do conjunto-alvo referenciado.
- **T-7:** State imutável; undo/redo restaura estados idênticos; histórico bounded.
- **T-8:** render por textContent (sem XSS); comando inválido → erro claro, sem aplicar.

## Cobertura de testes mínima (Fase 6)
- Cada UC da Fase 0 → ≥1 teste positivo + ≥1 negativo.
- Cada SC → ≥1 teste que verifica o critério EXATO (não um proxy).
- Aritmética ℤ[ω] → testes contra E1–E8 (ground truth).
- Razão mínima: 1 teste negativo p/ cada 2 positivos.

## RESULTADOS (Fase 6/7 — ciclo v1) — esperado vs obtido
> Suítes em `tests/`: `node --test core.test.mjs` (39) + `npx playwright test` (16) = **55/55 PASS**.
> Ground truth: `specs/datasets/ground-truth.json` (E1–E8 + presets).

| Critério | Esperado | Obtido | Status |
|---|---|---|---|
| SC-1 circuitos | Bell/GHZ/QFT/teleporte exatos == E3/E7/lit | idem (testes `t_bell/ghz/qft3`) | ✅ |
| SC-2 exatidão | `1/√2`,`e^{iπ/4}`, nunca decimal p/ Clifford+T | idem; NEG sem `\d.\d` | ✅ |
| SC-3 bases/formatos | 3 fmts + 3 bases comutam exato | idem; `|0⟩`→`(|+⟩+|−⟩)/√2`, roundtrip | ✅ |
| SC-4 entrada FSM | `n Q g`/`ALL g`/`c CTRL t Q G`/SET | idem; NEG aridade/SET inválido | ✅ |
| SC-5 fallback | arbitrário→approx; notável→exato | Rx(π/2) exato, Rx(0.3) approx; recognize(1/3) numérico | ✅ |
| SC-6 ops/export | prob fração exata; Qiskit endianness | `1/2`; `qc.cx(1,0)` (q0→n-1) | ✅ |
| T-1..T-8 | ver 01–03 | ℤ[ω], big-endian, cap N≤12, ρ reduzida, U=OpenQASM3, recognize tol, imutável/undo, no-XSS | ✅ |

**Ajuste em ground-truth durante a validação:** `|0⟩` na base Hadamard exibe-se como
`(1/√2)|+⟩ + (1/√2)|−⟩` (re-expressão do estado), não `|+⟩` — o estado que se exibe
como `|+⟩` é `H|0⟩`. Era erro do dataset/teste, não da implementação.

**Teste manual humano:** especialista validou os casos de uso da Fase 0 e a correção
algébrica; refinamento visual/comportamento aprovado (rodada 1). 1 achado de UX
(resultado de operação obsoleto) corrigido + regressão.

## RESULTADOS (Fase 6/7 — ciclo v2) — esperado vs obtido
> Suítes em `tests/`: `node --test core.test.mjs` (37) + `node --test v2.test.mjs` (55) +
> `npx playwright test` (24) = **116/116 PASS**. Núcleo, portas e ops do v1 preservados.

| Critério | Esperado | Obtido | Status |
|---|---|---|---|
| SC-1 circuitos | Bell/GHZ/QFT exatos (montados via portas, sem presets) | idem; QFT→1/√8 uniforme | ✅ |
| SC-2 exatidão | Clifford+T nunca decimal | idem; NEG sem decimais | ✅ |
| SC-3 bases/formatos | 3 bases + 3 formatos comutam exato | idem; `fmt` cicla + indicador no display | ✅ |
| SC-4 entrada FSM | n Q g / ALL g / c CTRL t Q G / SET | idem; NEG aridade/SET | ✅ |
| SC-5 fallback | arbitrário→approx; notável→exato | idem; Rx(π/2) exato, Rx(0.3) approx | ✅ |
| SC-6 (re-baseline) | prob como fração exata | `1/2` (core+calc) | ✅ |
| SC-6 export | ~~LaTeX/Dirac/Qiskit~~ | **REMOVIDO do v2** (decisão de escopo do usuário) | ⊘ |
| T-1..T-8 | restrições do núcleo | ℤ[ω], big-endian, N≤12, ρ reduzida, U=OQASM3, recognize tol, imutável/undo, no-XSS | ✅ |
| v2 Calc (M12) | avaliador científico + sobre-estado | precedência, √ unário, π/√2 simbólicos, amp/P/EV/norm | ✅ |
| v2 fase | π simbólico + reconhecimento de fase | PiAngle (2π/8→π/4); e^{±iπ/8} no display | ✅ |
| v2 portas | fases controladas | CP(λ)=CU1, CRz, C-U | ✅ |
| v2 render | LaTeX via KaTeX (online) + fallback offline | `stateTex`→KaTeX; `data-plain` Unicode | ✅ |
| v2 teclado | grade plana reconfigurável, sem abas/2nd | grade 10-col; faixa única de controles no topo | ✅ |

**Mudanças de escopo no v2 (decisões do usuário, S5):**
- REMOVIDOS: presets (M10), export Dirac/LaTeX/Qiskit (M9), op "fatorar" (Ops.factor).
- ADICIONADOS: calc científica + sobre-estado (M12), π/√2 simbólicos, reconhecimento de
  fase (recognizeAngle/matchSurd), CP/CRz/C-U, esfera de Bloch (M13), render KaTeX,
  teclado único reconfigurável em grade plana (M14).

**Teste manual humano (v2):** especialista validou a UI fim-a-fim AO VIVO em múltiplas
rodadas (cada refinamento dirigido por inspeção/feedback no navegador); achados de UX
corrigidos a cada rodada (Bloch sem vetor, avisos redundantes, layout saltitante,
precedência do √, fase decimal→simbólica). UI aprovada no fechamento.

## RESULTADOS (Fase 6/7 — ciclo v3) — manipulação algébrica de estado CONCRETO
> Suítes: core.test.mjs (37) + v2.test.mjs (55) + v3.test.mjs (36) + ui.spec.js (34) = **162/162 PASS**.

| Critério v3 | Esperado | Obtido | Status |
|---|---|---|---|
| Preparação por ket-string | `\|0⟩\|+⟩\|1⟩`+SET → estado-produto exato | idem (State.fromKets, ℤ[ω]) | ✅ |
| Base por qubit mantida | cada qubit na sua base, persiste nas portas | viewPerQubit; n Q+base / ALL+base; ⊗ p/ bases diferentes | ✅ |
| Forma fatorada (não distribui) | produto/parênteses por padrão; toggle expandir | Render.factored + botão `forma` | ✅ |
| Evidenciar — qubit todo | os 2 kets da base, posicional | `n Q`+`evidenciar` (Render.evidence) | ✅ |
| Evidenciar — ket específico | fatora o ket onde aparece; resto fica | `n Q`+botão de ket (Render.evidenceKet) | ✅ |
| Sem regressão v1/v2 | 116 testes seguem verdes | idem | ✅ |

**Validação humana (v3):** especialista reproduziu **phase kickback / teste de Hadamard**
ao vivo; confirmou correção — inclusive a calculadora EXPÕE o descasamento autoestado↔autovalor
(`\|+⟩` não é autoestado de Rz/T → emaranha; kickback limpo só com o autoestado certo, ex. `\|1⟩`).

**Escopo v4 (semente):** ket genérico/abstrato `\|ψ⟩` (álgebra SIMBÓLICA de autoestados,
`U\|ψ⟩=λ\|ψ⟩`) — fora do v3 (motor concreto), decisão registrada → ciclo v4.

## Critérios de Aceitação — v4 (motor simbólico de autoestados)
| Critério v4 | Esperado | Obtido | Status |
|---|---|---|---|
| V4-1 Ket abstrato + preparação | `\|+⟩\|ψ⟩`+SET → SymState misto concreto+abstrato | SymState.fromKets; paleta {ψ,φ,χ} | ✅ |
| V4-2 Porta sem regra → nó | `Z\|ψ⟩` sem regra → nó não-avaliado `Z\|ψ⟩` | SymEngine decora nodes[] | ✅ |
| V4-3 Regra de autovalor (inline) | `U\|ψ⟩=λ\|ψ⟩` declarada inline → coef×=λ | SymRules + entrada λ inline | ✅ |
| V4-4 Kickback simbólico | `\|+⟩\|ψ⟩`,cU(λ),H → `(1/2±1/2·λ)\|0/1⟩⊗\|ψ⟩` | split-kickback (concreto e simbólico) | ✅ |
| V4-5 Kickback concreto | λ=−1 → colapsa controle a `\|1⟩⊗\|ψ⟩` (exato) | combineLikeTerms exato ℤ[ω] | ✅ |
| V4-6 λ = fase estruturada | `e^{iφ}`/`e^{2πiθ}`; QPE U²→`e^{4πiθ}` | SymExpr.phaseAtom (dobra expoente) | ✅ |
| V4-7 Simplificação MÍNIMA | só combina termos idênticos + regras | combineLikeTerms; sem auto-fatorar | ✅ |
| V4-8 Não regride v1–v3 | motor separado; 162 testes seguem verdes | SymState distinto; despacho por tipo | ✅ |
| V4-9 NEG: controle abstrato | lança (não suportado) | SymEngine valida | ✅ |
| V4-10 NEG: alvo concreto+abstrato | lança (use controlada) | SymEngine valida | ✅ |
| V4-11 Forma fatorada simbólica | isola o ket comum `\|ψ⟩`; toggle expandir | Render.factoredSym + botão forma | ✅ |
| V4-12 Prob dos qubits concretos | `\|ψ⟩` comum → P(bits)=\|coef\|² exato (kickback π/4 → (2±√2)/4) | UI.symProb (botão prob) | ✅ |
| V4-13 NEG: prob com φ simbólico | coef soma → prob SIMBÓLICA, pede φ concreto | symProb sinaliza | ✅ |
| V4-14 Controle abstrato (TELETRANSPORTE, extensão P5) | `\|ψ⟩` como controle → expande `ψ₀\|0⟩+ψ₁\|1⟩`; `\|ψ⟩⊗\|00⟩`→H,CNOTs,H = teletransporte (Pauli por ramo) | SymState.expandAbstract + SymEngine; ψ₀/ψ₁ propagam | ✅ |
| V4-15 NEG: controle abstrato decorado por nó | `Z\|ψ⟩` (nó) como controle → erro claro, não expande | SymState.expandAbstract valida | ✅ |
| V4-16 Medida parcial (TELETRANSPORTE, extensão P5) | `n Q` + medir → sorteia, colapsa o qubit concreto e renormaliza (1/√P exato); + X/Z recupera `\|ψ⟩` | UI.symMeasure; teletransporte ponta a ponta | ✅ |

**Validação humana (v4): CONCLUÍDA** (Fase 6, ui_runnable ✅). A especialista do domínio executou
ao vivo: kickback abstrato (`|+⟩|ψ⟩`→cU(λ)→H), teste de Hadamard (conferiu a álgebra
`((½+½e^{iθ})|0⟩+(½−½e^{iθ})|1⟩)⊗|ψ⟩` como correta), TELETRANSPORTE completo (controle abstrato
→ medida parcial amostrada → correção Pauli X/Z recupera `|ψ⟩`), modo calc, temas, render LaTeX.
Encontrou e reportou 5 bugs reais (corrigidos): prob/medir no simbólico, buffer da calc pós-`=`,
reaplicação silenciosa de regra de λ, ordem de qubits na forma fatorada, KaTeX caindo com `⊗`.
Suíte automatizada: **218/218** (164 Node + 54 Playwright). Confirmação: "muito lindo podemos fechar".

> Ciclo v4 = motor de álgebra simbólica de autoestados + extensões P5 (controle abstrato/teletransporte,
> medida parcial) + redesenho de UI (zonas+2nd, LCD fixo embutindo Bloch, tema Pantone claro/escuro,
> card, render KaTeX unificado com fração vertical, idioma inglês, manual.html).

---

## v5 — Critérios de aceitação (delta PURAMENTE ESTÉTICO)

Delta cosmético no display/LCD do `quantum_calc.html`. Não toca no motor (ℤ[ω], simbólico, portas, medição). HARD CONSTRAINT: não regredir os 218 testes do v4.

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V5-1 Buffer maior | fonte do `#statusLine` (canto inf. esq.) ~50% maior: 12.5px → 18.75px; `min-height` 18→27px | inspeção de CSS computado / screenshot | ✅ |
| V5-2 Frações sem sobreposição | estado de N qubits com frações `\dfrac` quebrando em ≥2 linhas NÃO colide (line-height 1.6→3.4 no `#stateDisplay`) | screenshot KaTeX online (4q uniforme → ¼ em 3 linhas separadas) | ✅ |
| V5-3 Bloch sem legenda redundante | removidos: caption "esfera de Bloch ·", botão ✕, e readout `\|r\|` desenhado no canvas | DOM/screenshot; ids `#blochInline/#blochCanvas/#blochLabel` preservados | ✅ |
| V5-4 Rótulo do qubit no canto sup. direito | `#blochLabel` (`Q{n}`) reposicionado no QUADRANTE SUPERIOR DIREITO (ao lado da esfera, absolute), seguindo a seleção | screenshot; ui.spec.js (label segue qubit) | ✅ |
| V5-5 Valor do qubit no fmt | abaixo do label, o estado de 1 qubit `α\|0⟩+β\|1⟩` no fmt atual (exp/rect/polar); puro ⇒ ket, `\|r\|<0.999` ⇒ `mixed · \|r\|=…` | Render.blochReadout (Node): \|0⟩,\|1⟩,\|±⟩,\|i⟩ exatos via recognize; Bell→mixed | ✅ |
| V5-6 Não regride v4 | 218/218 verdes; `#blochInline/#blochCanvas/#blochLabel`+toggle intactos; `Bloch.render` não lança em canvas falso | suíte Node+Playwright | ✅ |

**Mecanismo:** `Render.blochReadout(v,fmt)` — puro; reconstrói o estado via parametrização da esfera de Bloch (Nielsen & Chuang §1.2): `|ψ⟩=cos(θ/2)|0⟩+e^{iφ}sin(θ/2)|1⟩`, `θ=acos(z)`, `φ=atan2(y,x)`. Leitura numérica consistente com a seta; reusa `Algebra.recognize` (exatidão p/ casos notáveis), `Algebra.format(amp,fmt)` (formato do display) e `Render.dirac` (drop de termo zero via `isZeroAmp` + coef "1" → ket nu). `mixed` usa o mesmo limiar 0.999 de `Bloch.render`.

---

## v6 — Critérios de aceitação (núcleo exato ζ₁₆, π/8)

Delta de MOTOR: substitui `Zomega`(4 BigInt)→`Zeta16`(8 BigInt), ζ=e^{iπ/8}, ζ⁸=−1. Embedding ω=ζ² ⇒ valores ζ₈ embarcam em coeficientes de índice par. HARD CONSTRAINT: não regredir os 233 testes (v1–v5). Fronteira P3: rect = soma exata grau-4 {1,√2,√(2±√2)}; exp/polar exato só p/ monômio c·e^{ikπ/8}; matchNestedSurd só no `recognize` (entrada numérica), fora do display.

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V6-1 P(π/8) exato | `P(π/8)\|+⟩` → `\|1⟩` coef = ζ/√2 (`ex===true`); exp `1/√2·e^{iπ/8}`, `approx===false` | core.test v6-1 | ✅ |
| V6-2 kickback rect exato | `H·P(π/8)·H\|0⟩` → rect `(1/2+√(2+√2)/4+√(2−√2)i/4)`, `approx===false`; valor numérico confere | core.test v6-2 | ✅ |
| V6-3 Ry(π/4) exato | `cos(π/8)\|0⟩+sin(π/8)\|1⟩` → `√(2+√2)/2`, `√(2−√2)/2` | core.test v6-3 | ✅ |
| V6-4 R₄=CP(π/8) exato | `CP(π/8)\|11⟩=ζ\|11⟩`; QFT-4 de `\|0001⟩` → 16 amplitudes TODAS exatas com ζ ímpar (π/8) | core.test v6-4, v6-4b | ✅ |
| V6-5 prob nested surd exata | `P(0)` do kickback = `1/2+√(2+√2)/4` (`norm2.exact && deg4`) | core.test v6-5 | ✅ |
| V6-6 NEG fronteira exp | exp do kickback é ζ₃₂ (mag/fase π/16) → `approx===true` (exato só no rect) | core.test v6-6 | ✅ |
| V6-7 não-regressão | `H\|0⟩=1/√2` (rect & exp) idêntico; `T\|+⟩:\|1⟩=ζ²/√2`; 233 originais verdes | core.test v6-7; suíte completa | ✅ |
| V6-8 NEG fora de ζ₁₆ | π/5 NÃO ring-exato (`!ex`); 0.37 → `approx===true` no display | core.test v6-8 | ✅ |
| T-1 (reescrito) | ω=ζ², ω²=i=ζ⁴, ω⁴=ζ⁸=−1, conj(ω)=ζ¹⁴, √2=ζ²−ζ⁶ na base de 8 comps | core.test T-1 | ✅ |
| T-1b (novo) | ζ⁸=−1, 2cos(π/8)=ζ−ζ⁷=√(2+√2), 2sin(π/8)=ζ³−ζ⁵=√(2−√2), conj(ζ)=−ζ⁷, embedding ω=ζ² | core.test T-1b | ✅ |
| V6-9 NEG render (toKatex) | surdo aninhado √(…) → `\sqrt{…}` / `\dfrac{\sqrt{…}}{n}` VÁLIDO (não `\sqrt \left`, chaves balanceadas) — bug pego na validação humana | core.test v6-9 | ✅ |
| V6-UI (DOM real) | P(π/8)|+⟩ exp `1/√2·e^{iπ/8}` sem ≈; rect `√(4+2√2)`; kickback rect `√(2+√2)` exato + exp ≈; 0.37→≈; undo desfaz P(π/8) | ui.spec v6-UI (5) | ✅ |
| V6-UX 2nd one-shot | aplicar porta da camada 2nd (P/U/…) volta ao teclado primário (constraint "2nd one-shot"; fix em execute()) | ui.spec v6-UI one-shot | ✅ |

**Mecanismo (spec 12-v6 §8):** `Zeta16` (mul = convolução mod x⁸+1, ζ^{8+r}=−ζ^r; conj(u)₀=a₀, conj(u)_k=−a_{8−k}). `expI(α)` exato p/ α múltiplo de π/8 via `angleIndex16`→`zpow16`. `norm2` devolve coords reais (p,rA,q,rB) no subcorpo grau-4 — `deg4=false` ⟺ ℤ[√2] (contrato v5 preservado). `exactReIm` devolve coords grau-4 (P=k+2); `degree4ToStr`/`nestedSurdStr` renderizam a soma; `sqrtSurdStr` dá a magnitude exata de monômio (inclui √(2±√2)). 4 call-sites migrados (OMEGA7, NEG_INV_R2, wpow, surdToAmp). `toKatex` estendido p/ `√(…)`→`\sqrt{…}` (bug de render pego na validação humana — KaTeX não carrega no Playwright offline). `execute()`: 2nd one-shot (volta ao primário após porta da 2nd). Suíte: **250/250** (184 Node + 66 Playwright).

---

## v7 — Critérios de aceitação (toggle de convenção de ângulo rad↔turns + nota CP/CRz)

Delta de UI/display: toggle ∠ (rad↔turns) afetando ENTRADA (×2π no boundary) + DISPLAY de fase (e^{2πi·k/16}) + rótulos, em todas as portas paramétricas; default rad (não regride); motor ζ₁₆/portas/simbólico v4 INTOCADO. + nota CP/CRz no manual.html (S2). HARD CONSTRAINT: 250 testes do v6 verdes em modo rad.

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V7-1 turns render | P(π/4)\|+⟩ → \|1⟩ coef `e^{2πi·1/8}` (rad: `e^{iπ/4}`) | v7.test v7-1 | ✅ |
| V7-2 turns π/8 + T | P(π/8)→`e^{2πi·1/16}`; T\|1⟩→`e^{2πi·1/8}` | v7.test v7-2 | ✅ |
| V7-3 turns NEG sinal | T†\|1⟩ → `e^{-2πi·1/8}` (turns assina; rad normaliza p/ 7π/4) | v7.test v7-3 | ✅ |
| V7-4 turns polar | T\|1⟩ polar → `(1, 1/8)` (rad: `(1, π/4)`) | v7.test v7-4 | ✅ |
| V7-5 turns kickback | kickback usa notação de turns (mag/fase ζ₃₂ → ≈) | v7.test v7-5 | ✅ |
| V7-6 NEG não-regressão | default rad idêntico ao v6 (H\|0⟩=1/√2, T\|1⟩=e^{iπ/4}); 250 testes verdes | v7.test v7-6 + suíte | ✅ |
| V7-7 turnsFrac unit | π/4→1/8, π/8→1/16, 3π/8→3/16, π→1/2, 0→0, π/5→null | v7.test v7-7 | ✅ |
| V7-UI toggle | indicador "turns" aparece/some no #selection ao clicar ∠ | ui.spec v7-UI | ✅ |
| V7-UI render | T\|1⟩ exibe e^{2πi·1/8} (turns) / e^{iπ/4} (rad) | ui.spec v7-UI | ✅ |
| V7-UI entrada ×2π | digitar `1/8` em turns aplica P(π/4) (×2π); approx OFF (exato) | ui.spec v7-UI | ✅ |
| V7-UI rad inalterado | digitar `π/4` em rad → e^{iπ/4} | ui.spec v7-UI | ✅ |
| V7-S2 doc | nota CP vs CRz + atalhos (c-T/c-S/c-Z) + lembrete de autoestado + nota rad/turns no manual.html; §12 atualizado p/ ζ₁₆/π/8 | inspeção manual.html | ✅ |
| V7-8 toKatex turns | expoente usa `\tfrac` (não `\dfrac` no sobrescrito); magnitude segue `\dfrac` — bug de render pego na validação humana | v7.test v7-8 | ✅ |
| V7-9 turns simbólico | fase livre `e^{iθ}`→`e^{2πiθ}` em turns; `2πθ` não duplica (guard hasPi) — refina P1 a pedido da usuária | v7.test v7-9 | ✅ |
| V7-10 prob toggle | `prob` vira toggle (liga→distribuição persistente + 'on'; desliga→limpa); botão `bars` removido (consolidação pedida pela usuária) | ui.spec v7-UI prob | ✅ |
| V7-11 prob base de exibição | distribuição segue a base ativa (Bell em {+,−} → P(\|++⟩)/P(\|−−⟩)) | ui.spec v7-UI prob base | ✅ |
| V7-tweaks layout | Q↔CTRL invertidos (ordem do FSM c CTRL t Q); 2nd↔⌫ invertidos | ui.spec (data-action, sem regressão) | ✅ |

**Mecanismo:** Algebra ganha `ANGLE_MODE` (estado de exibição não-DOM, default rad) + `setAngleMode`/`getAngleMode` + `turnsFrac(θ)=θ/2π→k/16` + `turnsExp`. `format` exp/polar tem short-circuit de turns (rad intocado ⇒ não-regressão). UI: estado `angleMode`, toggle `cycleAngle` (Q_STRIP `∠`), indicador `· turns` (só quando ativo), ×2π no boundary do `doEval` (só ângulo CONCRETO de porta). `phaseLabel` (simbólico) relabela e^{iθ}→e^{2πiθ} em turns (guard hasPi). `toKatex`: expoente de turns com `\tfrac` (concreto) — fases simbólicas e^{2πiθ} sem fração não disparam \dfrac. **2 bugs de render pegos na validação humana** (\dfrac no sobrescrito; e^{iθ} simbólico). Suíte: **263/263** (193 Node + 70 Playwright).

## v8 — Cookbook `examples.html` (delta de documentação)

> Delta SÓ de doc + testes; motor/portas/UI INTOCADOS. **Padrão-ouro de fidelidade: a TELA é a fonte de verdade.** Fonte única `tests/examples-data.mjs` → 25 exemplos em 3 tiers, cada resultado declara a sequência REAL de botões (`steps`/data-action). O `examples.spec.js` reproduz as teclas na interface real, CAPTURA o que aparece (`#stateDisplay`/`#auxOutput`/`#statusLine`/`#blochValue`) e GERA o `examples.html` da captura (via `examples-render.mjs`). KaTeX VENDORIZADO (`vendor/katex/`) → render real offline. Pega a base de preparação, forma fatorada, fmt e prefixos de operação — coisas que o caminho do motor não revelava.

| ID | Critério | Teste | Status |
|----|----------|-------|--------|
| V8-tela | Cada exemplo: as teclas reais reproduzidas na UI produzem o resultado mostrado no doc (captura = tela; não-vazio) | examples.spec captura ×72 | ✅ |
| V8-katex | `toKatex` de cada estado capturado é KaTeX válido (`assertValidKatex` via `renderToString` vendorizado) + guarda \dfrac-no-expoente | examples.spec captura | ✅ |
| V8-offline | KaTeX vendorizado renderiza em `file://` (Playwright offline): `.ket .katex` = nº de kets (não degrada) | examples.spec offline-KaTeX | ✅ |
| V8-estrutura | 25 cards, 3 tiers, TOC, links cruzados examples↔manual↔calc | examples.spec estrutura | ✅ |
| V8-shots | Screenshots `shot-ex-*.png` (cookbook + cards-chave) com KaTeX real, tema claro | examples.spec screenshots | ✅ |
| V8-manual | Fidelidade do manual.html: 22 arities (CTRL×Q) + sequências §6/§8/§11 reproduzidas no motor + negativos (SWAP c/ ctrl e CSWAP c/ 3 alvos falham) | manual.test (35) | ✅ |
| V8-nao-regressao | 184 Node + 72 Playwright do v7 verdes (motor intocado) | suíte completa | ✅ |

**Tiers:** Básico (B1–B6) · Intermediário (I1–I7) · Avançado (A1–A12: Clifford+T/√T surdo, kickback/CP vs CRz, Deutsch, Grover, QFT, QPE, teleporte, superdense, ∠ rad↔turns, simbólico kickback, emaranhamento, Bernstein–Vazirani). **Mecanismo:** `examples.html` estático offline (vendored KaTeX + script de render de 6 linhas, ZERO JS de motor); resultado = `<span class="ket" data-dirac data-tex>` (estado, KaTeX, capturado da tela) ou `<pre data-out>` (texto). Suíte v8: **+35 Node (manual.test) + 4 Playwright (examples.spec captura+valida)**; total **219 Node + 76 Playwright = 295**. Substituiu o `examples.test.mjs` baseado em `compute` do motor (a captura de tela é fiel onde o motor divergia: B1 ket, A1 surdo via fmt, A10 fatorado).

## v10 — Organização + consolidação de docs + tradução EN + PWA (resultados)

> 4 frentes entregues num ciclo. Motor ζ₁₆/portas/presets/simbólico INTOCADO. Lições: [23-v10-lessons](../technical/23-v10-lessons.md). Publicado: https://jasminemoreira.com.br/quantum/.

| ID | Critério | Teste | Status |
|----|----------|-------|--------|
| V10-F1 | Colapsável "Help" removido do `quantum_calc.html`; "Step history" mantido; link `📖 manual ↗` mantido | grep estrutural + ui.spec 'Step history' | ✅ |
| V10-F2 | `manual.html` CONSOLIDADO e gerado: Parte I Referência (§1–13) + Parte II Cookbook (26 cards, 3 tiers, TOC unificado); `examples.html` removido; links reconciliados (calc→manual) | examples.spec estrutura (#part-reference/#gates/#exactness/#part-cookbook, 26 .ex) | ✅ |
| V10-F2b | `manual.html` renderiza KaTeX offline (vendorizado), não degrada | examples.spec KaTeX offline | ✅ |
| V10-F3 | Produto 100% EN: `lang="en"` + TODAS as strings user-facing (erros/status/outputs/labels de History/calc) PT→EN | `no-pt-leak.test.mjs` (calc strip + manual.html + catch-all de acento) ×2 | ✅ |
| V10-F3b | Mensagens de erro EN funcionais | v9.test `/control/`, v4.test `/decorated/`, ui.spec 'Bell requires exactly 2 qubits' | ✅ |
| V10-F4 | PWA: `manifest.webmanifest` válido (start_url/scope `./`, standalone, ícone SVG maskable) | `pwa.spec` manifest | ✅ |
| V10-F4b | Service worker registra (guardado por `location.protocol`), ativa, serve OFFLINE na 2ª carga (App Shell, cache versionado `qcalc-v10-N`) | `pwa.spec` SW+offline | ✅ |
| V10-mobile | Layout responsivo mobile (≤600px): display ~metade, grade reordenada por prioridade (command·kets|gates·numeric|operations|controlled), camada 2nd e calc consistentes, alvos ≥44px, 0 truncamento @360–412 — **8 rodadas de teste manual** | Playwright clip-check + screenshots | ✅ |
| V10-render | `Render.toKatex`: coeficiente `i/d` → `\dfrac` vertical (consistente com `1/d`) — bug pego em teste manual | toKatex sanity + examples.spec | ✅ |
| V10-nao-regressao | 335 testes do v9 verdes + 4 novos (2 no-pt-leak + 2 pwa) = **339** (252 Node + 87 Playwright) | suíte completa | ✅ |

**Entrega:** `index.html` (redirect→app), `quantum_calc.html`, `manual.html`, `manifest.webmanifest`, `sw.js`, `icons/icon.svg`, `vendor/katex/`, `README.md`. Hospedagem da usuária (SSHFS → /var/www/html/quantum; servir por https). **Pendência → v11:** forma matricial no `fmt` + outras operações/views (feature nova, deferida).

---

## v11 — Forma matricial / vetor-coluna (resultados)

> Delta render-only. Escopo = SÓ a forma matricial (pesquisa de outras ops/views deferida p/ ciclo futuro). Motor ζ₁₆/portas/fmt/basis INTOCADO. Spec: [24-v11-matrix-form](../technical/24-v11-matrix-form.md). Lições: [25-v11-lessons](../technical/25-v11-lessons.md).

| ID | Critério | Teste | Status |
|----|----------|-------|--------|
| V11-1 | `form`→matrix mostra o vetor-coluna **denso 2^N com zeros** (esparso→denso) | v11-1 (Node) + v11-UI matrix (PW) | ✅ |
| V11-2 | **Segue a base ativa** (muda com `basis`, via viewPerQubit) | v11-2 (\|+⟩ comp vs had) + v11-UI fmt+base | ✅ |
| V11-3 | Células **respeitam o `fmt`** (exp/rect/polar) | v11-3 (exp≠rect) + v11-UI | ✅ |
| V11-4 | **Cap em 64** (MAX_TERMS) + `⋮` + nota do total p/ N≥7 | v11-4 (N=7→128) + v11-UI cap | ✅ |
| V11-5 | Cap NÃO dispara em N≤6 (boundary) | v11-5 (N=6, neg) | ✅ |
| V11-6 | **KaTeX válido** (`array`+`pmatrix`+`\vdots`) em todos os fmt + truncado | v11-6 assertValidKatex + v11-UI `.mtable` (navegador real) | ✅ |
| V11-7 | **Rótulos de ket** corretos por linha na base ativa | v11-1/2/7 (plain) + v11-UI | ✅ |
| V11-8 | Flag **approx agregado** (exato=false / numérico=true) | v11-8 (Bell vs Ry 1 rad) | ✅ |
| V11-9 | **Ciclo `form` 3 estados** factor→expand→matrix→factor | v11-UI ciclo | ✅ |
| V11-10 | **Concreto-only**: `\|ψ⟩` abstrato → fallback Dirac, `form` pula matrix no simbólico | v11-UI simbólico (neg) | ✅ |
| V11-nao-regressao | 339 do v10 + 13 novos (8 `v11.test.mjs` + 5 v11-UI) = **352** (260 Node + 92 Playwright) | suíte completa | ✅ |

**Manual (human-AV):** usuária confirmou "já testei" no app real (estado → `form` até `matrix` → vetor-coluna com rótulos). **Entrega:** `quantum_calc.html` (M7 `matrixTex`/`renderMathTex` + M11 ciclo/CSS `.matrix-view`), `manual.html` (doc da matriz, regenerado), `tests/v11.test.mjs`, bloco v11-UI em `tests/ui.spec.js`. **Não publicado** (deploy = decisão da usuária; exige bump `sw.js` qcalc-v10-10→v11).

---

## v12 — Reorg de teclado + measure sem popup + polimento PWA/mobile (resultados)

> Delta UI-only (motor INTOCADO). Escopo expandido pela usuária (S5) ao longo de ~20 rodadas de validação ao vivo no PWA. Specs: [26-v12-keypad-reorg](../technical/26-v12-keypad-reorg.md). Lições: [27-v12-lessons](../technical/27-v12-lessons.md). PUBLICADO live (cache `qcalc-v12-15`) via novo deploy SSH (`./deploy-ssh.sh`).

| ID | Critério | Teste / Validação | Status |
|----|----------|-------|--------|
| V12-1 | **M (memory)** no numpad (ao lado do 1/√2), nas 2 camadas; renome de 'save φ'; comportamento intacto | v2 keymap (op:saveBra em ambas) + v12-UI keypad/M | ✅ |
| V12-2 | **Swap**: ⊗ e ⟨φ\|ψ⟩ → primário; factor e ‖ψ‖ → 2nd | v2 keymap (op:inner/tensor primário; op:norm/evidence só 2nd) + v12-UI | ✅ |
| V12-3 | Bloco 2nd → **"operations"**; títulos do 2nd **sem "2nd ·"** | v12-UI keypad (labels) | ✅ |
| V12-4 | **measure sem popup** — colapsa direto (ramos + Collapsed); `prob` = distribuição sem colapso | v12-UI measure (dialog=false) | ✅ |
| V12-5 | **Bloch mobile** DPR-aware (nítida, ~130px) + valor oculto + rótulo Q (inf-dir) + \|0⟩/\|1⟩ fora da esfera (6px, 10px) | v12-UI Bloch (DPR=3) + human-AV | ✅ |
| V12-6 | **reset → RST**; **undo/redo** fonte 21px | smoke + human-AV | ✅ |
| V12-7 | **PWA standalone** (`display-mode`): título oculto + manual/tema no rodapé + **Step history oculto** | human-AV (PWA real; Playwright/CDP não emula display-mode) | ✅ |
| V12-8 | **Botão I removido** do teclado (porta no catálogo) | v2 keymap (sem gate:I) | ✅ |
| V12-9 | **2nd segue o padrão do primário** (operations meia-largura + presets abaixo; sem 4ª linha vazia/SP) | layout query + human-AV | ✅ |
| V12-10 | Prompt de λ **encurtado** (cabe no LCD); indicador **turns no simbólico** (antes de factored) | v12-UI turns + human-AV | ✅ |
| V12-nao-regressao | 352 do v11 + novos = **358** (261 Node + 97 Playwright) | suíte completa | ✅ |

**Manual (human-AV):** validação extensa da usuária no PWA instalado (~20 rodadas), incl. os itens não-auto-testáveis (standalone, pixels, layout). **Infra:** deploy migrado de `Z:`/PowerShell p/ `./deploy-ssh.sh` (chave SSH, scp). **Pendência → v13:** memória/`⊗` simbólico (`TH\|ψ⟩⊗\|φ⟩`) — feature de motor, design + testes de correção do tensor.

## v13 — memória/⊗ simbólico (FRENTE A) · calc científica aposentada (FRENTE B)

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V13-1 | `SymState.fromConcrete` (promove concreto→simbólico, layout 'c', drop amp-zero) | v13-1/2/3 (Node) | ✅ |
| V13-2 | `SymState.tensor` big-endian saved⊗current; `\|ψ⟩⊗\|φ⟩` | v13-4/8 + v13-UI M+⊗ | ✅ |
| V13-3 | ⊗ misto concreto/simbólico (promove o operando concreto) | v13-5 + v13-UI mixed | ✅ |
| V13-4 | **Tensor-correctness** (math-before-didactics): `SymState.tensor`(2 concretos) == `Ops.tensor`; ordem importa | v13-7/8 (Node) | ✅ |
| V13-5 | Âncora `(T·H\|ψ⟩)⊗\|φ⟩` → `TH\|ψ⟩⊗\|φ⟩` | v13-6 + v13-UI ANCHOR | ✅ |
| V13-6 | Guard de disjunção: `\|ψ⟩⊗\|ψ⟩` e `e^{iθ}⊗e^{2iθ}` (mesmo param) → 'rename'; θ vs ω permitido | v13-9/10/11/12 + v13-UI NEG | ✅ |
| V13-7 | `M` type-agnostic (concreto ou simbólico); `⟨φ|ψ⟩` concrete-only (erro no simbólico) | onOp type-aware + v4-50 | ✅ |
| V13-8 | N≤12 cap no tensor | v13-13 | ✅ |
| V13-9 | **Calc científica aposentada**: sem tecla `→ calc`/toggle; avaliador + keypad de ângulo/λ mantidos | v13-UI calc RETIRED | ✅ |
| V13-10 | **Manual revisado** (calc §10 removida, §8d memória/⊗, 25 receitas, renumerado) | examples.spec (4/4) + human-AV | ✅ |
| V13-nao-regressao | 358 do v12 + novos = **369** (275 Node + 94 Playwright) | suíte completa | ✅ |

**Manual (human-AV):** usuária validou ao vivo no PWA (`qcalc-v13-4`): ⊗ anchor `TH\|ψ⟩⊗\|φ⟩`, guard 'rename', calc retirada + ângulo inline, layout das operações alinhado. **REVISÃO mid-P5 (S5):** EV (`⟨O⟩`) implementado e depois REMOVIDO (redundante com a Bloch p/ 1 qubit); FRENTE B = só aposentar a calc; Bloch de volta no primário. **Lições:** `specs/technical/30-v13-lessons.md`. **Pendência → v14:** teclado deslizante no PWA (semente `29-v14-seed-sliding-keypad.md`).

## v14 — teclado deslizante paginado (UI-only)

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V14-1 | **page-model**: `Keymap.layout(mode,page)` → `{strip, command, pages:[2]}` (quantum); `{cols}` (calc) | v14-1/2/3 + v2.test | ✅ |
| V14-2 | **Comando FIXO** com `M` no slot do `2nd`; tecla `2nd`/`shift` REMOVIDA; `M` fora do numérico | v14-4/5/8/9 + ui.spec | ✅ |
| V14-3 | **Pág.2 full-width** (R=null), cauda-longa, **0 dígitos** | v14-6 + v2.test | ✅ |
| V14-4 | **Troca de página**: swipe (touch) · page-dots · setas ←/→ · arrastar mouse | ui.spec dot/seta + activePage via `[inert]` | ✅ |
| V14-5 | **Tap não engolido pelo swipe** (C1): threshold+axis-lock; `page`=fonte da verdade, reconcilia no release | human-AV ('perfeito') + ui.spec | ✅ |
| V14-6 | **Auto-return animado** à pág.1 após porta/preset da cauda-longa | ui.spec auto-return (poll) + v14-UI preset | ✅ |
| V14-7 | **Layout unificado** web↔PWA (grade 4-col packed, capada+centralizada no desktop; remove `.layer2`) | human-AV + ui.spec | ✅ |
| V14-8 | **Relabels** (desambiguação): `∠`→`rad/trn` (+indicador rad no #selection), `form`→`view` (sem realce), `÷`→`/` | v14-10/11 + ui.spec | ✅ |
| V14-9 | **BUGFIX avulso turns↔λ** (fora do delta): `1/8` turn no autovalor → `π/4` exato (`e^{iπ/4}`), não `0.125` rad approx | v14-UI λ em turns + Algebra.recognize | ✅ |
| V14-10 | **Manual regenerado** p/ o carrossel (§3 fixa+deslizantes, §9 views, §11 presets pág.2; 0 refs órfãs a `2nd`/`∠`) | examples.spec (4/4) + grep | ✅ |
| V14-nao-regressao | 369 do v13 + novos = **383** (286 Node + 97 Playwright) | suíte completa | ✅ |

**Manual (human-AV):** operadora validou ao vivo no PWA (`qcalc-v14-9`): "teclado deslizante está perfeito" + polimentos verificados ao vivo (`/`, `view`, `rad/trn`+indicador, `form` sem realce, λ-turns exato) + circuitos didáticos (kickback de fase, HYZH=−iZ). **Escopo:** UI-only (motor ζ₁₆/portas/gramática/FSM INTOCADOS); o bugfix turns↔λ foi um *avulso* (v4/v7) registrado à parte. **Lições:** `specs/technical/31-v14-lessons.md`. **Carry-forward → v15 (não iniciado):** `CU(λ)` ergonômico / kickback com autovetor arbitrário; EV multi-qubit `⟨Z₀Z₁⟩` (do v13).

## v15 — gaveta (drawer) de ângulo/λ deslizante (UI-only)

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V15-1 | **Gaveta sobe na entrada**: porta paramétrica (Rx/Ry/Rz/P/U/CP/CRz/CU) ou λ em `\|ψ⟩` → `#angleSheet` desliza por cima da parte inferior do teclado | v15-UI gaveta abre (`.open`) + human-AV | ✅ |
| V15-2 | **Zero click-through**: `#keypad` fica `inert`+dim; a gaveta (opaca) é a única superfície clicável | v15-UI (`#keypad.inert==true`) | ✅ |
| V15-3 | **Display visível na entrada**: prompt (`Rz · θ = ?`) + buffer no `#display` (a gaveta cobre só o teclado) | v15-UI (`#statusLine` 'Rz') | ✅ |
| V15-4 | **`=` aplica e RECOLHE**: aplica o ângulo (exato) + slide-down + `#keypad` volta vivo + gaveta removida do DOM | v15-UI = recolhe (count 0 + inert false) | ✅ |
| V15-5 | **ESC / swipe-down = cancelar**: ESC (tecla) ou arrastar a gaveta p/ baixo (>30%) cancela; em `\|ψ⟩` deixa o nó `U\|ψ⟩` | v15-UI ESC (nó) + human-AV (swipe) | ✅ |
| V15-6 | **Sem reflow / sem susto**: overlay `absolute` fora do fluxo ⇒ a altura do app não muda ⇒ `fitViewport` não redimensiona o display; `_dispH` (v14-29) REMOVIDO | human-AV (standalone) + construção | ✅ |
| V15-7 | **Tap não engolido pelo arrasto** (C1 vertical): threshold+axis-lock+suppress-click (espelha o invariante do carrossel v14) | human-AV ('Funcionou') | ✅ |
| V15-8 | **Sem replay por tecla**: `renderKeypad` no-op durante a entrada; gaveta = elemento estável (slide 1× por toggle) | v15-UI (digitação não reconstrói) + human-AV | ✅ |
| V15-nao-regressao | 383 do v14 + 3 v15-UI = **386** (286 Node + 100 Playwright); entrada de ângulo/λ flui pela gaveta sem regressão (v2/v4/v7/v14 verdes) | suíte completa | ✅ |

**Manual (human-AV):** operadora validou ao vivo no PWA (`qcalc-v15-3`): "Funcionou" — gaveta abre deslizando, `=` aplica e desliza p/ baixo, swipe-down cancela, tap não engolido, sem click-through, sem susto no display. **Escopo:** UI-only (motor/FSM/gramática/conteúdo do pad INTOCADOS; reusa o pad enxuto do v14-27). **Adição de escopo da operadora (S5):** swipe-down = ESC. **Lições:** `specs/technical/33-v15-lessons.md`. **Carry-forward → v16 (não iniciado):** `CU(λ)` ergonômico / kickback com autovetor arbitrário; EV multi-qubit `⟨Z₀Z₁⟩` (do v13); slide-out animado já entregue.

## v16 — visor de 2 painéis: estado | detalhe (UI-only)

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V16-1 | **Visor de 2 painéis**: principal = estado (+ Bloch inline); detalhe = readouts de texto (prob/measure/Schmidt/ρ/C/S(ρ)/⟨φ\|ψ⟩/EV) | v16-UI idle (`#stateDisplay`/`#blochInline`∈`#dispMain`, `#auxOutput`∈`#dispDetail`) | ✅ |
| V16-2 | **Affordance condicional**: dots aparecem só quando há detalhe; somem ao mudar o estado | v16-UI idle (dots hidden) + auto-switch | ✅ |
| V16-3 | **Auto-switch**: op de readout rola sozinha p/ o detalhe (animado); porta volta ao principal | v16-UI auto-switch (painel ativo via `[inert]`) | ✅ |
| V16-4 | **Troca por TAP** (+ dots) — swipe descartado (brigava com a rolagem horizontal do estado longo) | v16-UI auto-switch (`dispPane:0` volta) + human-AV (tap) | ✅ |
| V16-5 | **Bloch inline no principal** (didático: estado+esfera juntos), NÃO auto-rola; orientação dos livros (y rebatido, +20°, rótulos) | v16-UI bloch-inline + human-AV (orientação) | ✅ |
| V16-6 | **Estado longo legível**: KaTeX inline (rola na horizontal, sem corte); sem reflow do display | human-AV ('tudo certo') | ✅ |
| V16-7 | **Pad de ângulo 5×4**: sem tecla ESC (cancela por swipe-down/Esc físico), π ao lado do `.`, operadores `/ × − + =` na coluna direita | v14-2 (keys) + human-AV | ✅ |
| V16-8 | **Modo rad/turns na entrada**: chip tocável no `#selection` mostra o modo E alterna DURANTE a entrada (angcycle antes era engolido) | v16-UI angle-mode + ui.spec | ✅ |
| V16-nao-regressao | 386 do v15 + 4 v16-UI = **390** (286 Node + 104 Playwright); migração key:CLR→Esc físico verde | suíte completa | ✅ |

**Manual (human-AV):** operadora validou ao vivo (v16-1→15, "tudo certo"): visor de 2 painéis (tap/dots/auto-switch), Bloch inline com orientação dos livros, estado longo legível, pad 5×4, chip rad/turns. **Escopo:** UI-only (motor/`out()`/FSM INTOCADOS; `#auxOutput`/`#blochInline` reusados). **Revisões de UX ao vivo (S5):** Bloch→principal (era detalhe), auto-switch (era ficar no principal), tap (era swipe). **Lições:** `specs/technical/35-v16-lessons.md`. **Carry-forward → v17:** `symBloch` (Bloch de qubit concreto em estado simbólico); `CU(λ)`/EV multi-qubit `⟨Z₀Z₁⟩`.

## v17 — symBloch + fold automático ψ₀|0⟩+ψ₁|1⟩→|ψ⟩ (MOTOR/simbólico)

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V17-1 | **fold (clímax do teleporte)**: um qubit isolado/separável `ψ₀|0⟩+ψ₁|1⟩` re-dobra em `|ψ⟩` | `v17 fold round-trip` (Node) + `ui.spec TELETRANSPORTE` (e2e → `\|00⟩⊗\|ψ⟩`) | ✅ |
| V17-2 | **fold → ket abstrato de MOTOR** (reutilizável como controle / regras v4) | `v17 fold round-trip` (`layout='a'`, `labelAt='ψ'`) | ✅ |
| V17-3 | **fold embutido**: só o qubit separável dobra (`\|0⟩⊗(ψ₀\|0⟩+ψ₁\|1⟩)`→`\|0⟩⊗\|ψ⟩`) | `v17 fold embutido` (Node) | ✅ |
| V17-4 | **fold como normalização no Engine** (após cada `apply`/`measure`); idempotente | `v17 fold via apply (X·X)` + `v17 fold idempotente` | ✅ |
| V17-5 | **fold NÃO dispara** em emaranhado (`ψ₀\|00⟩+ψ₁\|11⟩`), sinal relativo (`Z\|ψ⟩`) ou numérico (`\|+⟩⊗\|ψ⟩`) | 3 testes NEG (Node) | ✅ |
| V17-6 | **symBloch**: qubit concreto separável (`\|0⟩⊗\|ψ⟩`, Q0) → esfera `+z`, readout `\|0⟩`; `H` → `+x` | `ui.spec 'v17 symBloch'` (visível + pixels verdes + readout) | ✅ |
| V17-7 | **symBloch recusa** qubit abstrato/emaranhado/amplitude simbólica (mensagem, não silêncio); re-check no refresh | `ui.spec 'v17 symBloch'` (Q1 abstrato → oculto) + human-AV | ✅ |
| V17-nao-regressao | 390 do v16 + 7 fold (Node) + 1 symBloch (UI) = **398** (293 Node + 105 Playwright); 1 asserção do teleporte ATUALIZADA p/ `\|00⟩⊗\|ψ⟩` (entrega da feature, não regressão) | suíte completa | ✅ |

**Manual (human-AV):** operadora validou ao vivo (`qcalc-v17-1`): "fold no teleporte ok" e (após fix) symBloch "ok, funcionando" (esfera +z/+x, recusa do qubit abstrato). **Bug pego no human-AV** que o automated não pegou: `routeAction` barrava `s.sym` antes do `showBloch` → fix (delegar ao `showBloch`) + teste de UI dedicado (L1). **Escopo:** 2 frentes de motor (`SymState.fold` + `reducedOneQubit`), 0 padrão/módulo novo; **3ª frente (KaTeX iOS) DESCOPADA pela operadora na P3** (radar). **Lições:** `specs/technical/36-v17-lessons.md`. **Carry-forward → v18:** `CU(λ)`/EV multi-qubit `⟨Z₀Z₁⟩`; baseline KaTeX iOS (com device).

## v18 — condense de coeficientes simbólicos compostos (display do núcleo)

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V18-1 | **Kickback racional**: `½±½·e^{iθ}` renderiza como `(1±e^{iθ})/2` (Q1 fator racional 1/2^k) | `v18-1`, `v18-2`, `v4 KICKBACK line 105` (Node) + `ui.spec 415` (PW) | ✅ |
| V18-2 | **Pós-Hadamard / surdo √2**: `(1/√2)±(1/√2)·e^{iθ}` → `(1±e^{iθ})/√2` (Q1 surdo √2/ζ) | `v18-3` (Node) + `v18-13` toKatex `\dfrac{…}{\sqrt{2}}` | ✅ |
| V18-3 | **Átomo livre**: `½+½·λ` → `(1+λ)/2` (sem ser phase atom) | `v18-4` + `v4 scaleAmp line 35` (Node) | ✅ |
| V18-4 | **Magnitudes IGUAIS apenas** (Q2): `½ + ¼·λ` permanece inalterado (`1/2 + 1/4·λ`) | `v18-6` (Node) | ✅ |
| V18-5 | **Single monomial inalterado** (compound:false já cobre): `½·e^{iθ}` não condensa | `v18-5` (Node) | ✅ |
| V18-6 | **Fator complexo recusado** (g deve ser real positivo): `i/2 + i/2·λ` não condensa | `v18-7` (Node) | ✅ |
| V18-7 | **Guard 1/g==1** (sem `/1` espúrio + termina recursão em 1 nível): `1 + λ` permanece composto | `v18-8`, `v18-10` (Node) | ✅ |
| V18-8 | **Phase-coef guard** (numerador com `e^{(n/d)…}` quebraria `[^()]+` do toKatex) → condense recusa | `v18-9` (Node) | ✅ |
| V18-9 | **Vertical fraction `\dfrac` sem outer parens** (toKatex regra v18): `(num)/d` → `\dfrac{num}{d}` | `v18-11` + integração render LaTeX | ✅ |
| V18-10 | **Sem over-match** em strings compostas sem `/d` após o paren (regressão v4-204 protegida) | `v18-12` (Node) | ✅ |
| V18-11 | **factoredSym preserva condense interno**: `((1+λ)/2|0⟩ + (1-λ)/2|1⟩)⊗|ψ⟩` | `v4 factoredSym line 147` (Node) | ✅ |
| V18-12 | **Não-regressão concreta**: Bell/GHZ/Hadamard `(1/√2)|00⟩+(1/√2)|11⟩` byte-idêntico (concrete `Render.dirac` ≠ `SymExpr.format`) | suíte completa, ~30 asserções concretas verdes | ✅ |
| V18-nao-regressao | 398 do v17 + 13 v18 (Node) + 0 PW (5 asserções migradas inline em v4×4 + ui.spec×2) = **411** (306 Node + 105 Playwright) | suíte completa | ✅ |

**Manual (human-AV):** operadora validou ao vivo localmente (decisão `a7d0dbd8`): screenshot do kickback c/ `factor global phase` em turns mode renderizou limpo `((1/√2)·e^{2πi·(1/8)}|0⟩ + (1/√2)·e^{−2πi·(1/8)}|1⟩)⊗|ψ⟩`, com `\dfrac{1}{\sqrt{2}}` vertical (regra digit-fraction existente). Veredito: "seems to work". Path EXPLICIT-condensável é coberto pelas asserções `ui.spec 415/430` em real Playwright browser. **Bug arquitetural pego em P5** (L1 das lições): predicado verifica `fmt='rect'` mas render inicial usava o `fmt` do usuário → `√2` em `exp` mode caía p/ `1.41421` numérico. Fix: denominador SEMPRE em `rect`. **Escopo:** 1 frente de display no núcleo (`SymExpr.condense`+`format`) + 1 regra `toKatex`; 0 padrão/módulo novo. **Lições:** `specs/technical/37-v18-lessons.md`. **Carry-forward → v19:** `CU(λ)`/EV multi-qubit `⟨Z₀Z₁⟩` (6 ciclos adiado); extração de `DENOM_ALT` em constante (se mais regras de denom limpo surgirem); KaTeX iOS (com device); possível condensação CONCRETA (`Render.dirac`) espelhando v18 no path concreto, se a operadora pedir.

## v19 — Condense concreto + DENOM_ALT + UX expand display (3 frentes)

| ID | Critério | Verificação | Status |
|----|----------|-------------|--------|
| V19-1 | **F1 Condense concreto Bell**: `(1/√2)\|00⟩+(1/√2)\|11⟩` → `(\|00⟩+\|11⟩)/√2` (espelha v18 simbólico) | `v19-1`, core SC-1, ui.spec :46 | ✅ |
| V19-2 | **F1 GHZ**: `(\|000⟩+\|111⟩)/√2` (escalável a N qubits) | `v19-2`, ui.spec :683 | ✅ |
| V19-3 | **F1 sinal relativo \|Φ−⟩**: `(\|00⟩−\|11⟩)/√2` (g real positivo) | `v19-3`, core :271 | ✅ |
| V19-4 | **F1 4 termos kickback** `\|+⟩\|−⟩`: `(\|00⟩−\|01⟩+\|10⟩−\|11⟩)/2` (no limite do threshold) | `v19-4` | ✅ |
| V19-5 | **F1 threshold ≤4 termos** (lição v19-L1): 8 termos NÃO condensam → forma expandida | `v19-9b` | ✅ |
| V19-6 | **F1 magnitudes mistas**: `⅓+½·λ` → INALTERADO | `v19-6` | ✅ |
| V19-7 | **F1 g complexo (i/2)** → null | `v19-7` | ✅ |
| V19-8 | **F1 guard 1/g==1** → null | `v19-8` | ✅ |
| V19-9 | **F1 approx amp** → null | `v19-9` | ✅ |
| V19-10 | **F1 factored** `((\|+⟩+\|−⟩)/√2)⊗\|ψ⟩` | `v19-13` | ✅ |
| V19-11 | **F1 toKatex** `(\|00⟩+\|11⟩)/√2` → `\dfrac{\|00\rangle +\|11\rangle }{\sqrt{2}}` (regra v18 reusada) | `v19-10` | ✅ |
| V19-12 | **F2 DENOM_ALT byte-idêntico**: digit-frac 1/2 ainda funciona | `v19-11` | ✅ |
| V19-13 | **F3a edge zones laterais**: ◀▶ substituem dots, visíveis ⇔ hasDetail() | `v19-UI F3a #1, #2` (Playwright) + human-AV | ✅ |
| V19-14 | **F3a tap edge → switchDisplayPane**: setas roteiam para a pane oposta | `v19-UI F3a #2` | ✅ |
| V19-15 | **F3b botão expand**: ▼ visível ⇔ overflow OU expanded; ▲ quando expanded | `v19-UI F3b` (DOM) + human-AV | ✅ |
| V19-16 | **F3b oculta zones**: kets+gates+gate-variants+2-qubits com `height:0 !important` (anim sincronizada) | human-AV (operadora validou ao vivo: "perfeição") | ✅ |
| V19-17 | **F3b display fluid em qualquer modo**: fitViewport ungated (lição v19-L21); full-HD não fica pequena | human-AV ("perfeito") | ✅ |
| V19-nao-regressao | 411 do v18 + 14 v19 (Node) + 3 v19-UI (PW) = **428** (320 Node + 108 Playwright); 5 asserções migradas inline (v4/v9/manual/v7/core); 1 v16-UI atualizada (#dispDots → #dispEdgeLeft) | suíte completa | ✅ |

**Manual (human-AV) — 16 deploys live com a operadora**: primeira validação (ALL H em 4 qubits) pegou bug v19-L1 — F1 condensou 16 termos num numerador horizontal de `\dfrac` que não quebra linha. Fix: threshold ≤4 termos. Polish iterativo F3b descobriu **16 lições** (L1-L21 em `38-v19-lessons.md`), incluindo: `transition: max-height` é fundamentalmente quebrado para layout sync (L7 → fix com height real); `ResizeObserver` deve observar o scroll container (L6); `applyExpand` vs `toggleExpand` separação para evitar reentry do observer (L8); `fitViewport` resetava height durante animação (L9); `_preExpandDispH` para preservar fitViewport-dynamic value no PWA (L11); scrollbar da página oculta elimina jump (L16); botão SVG border-trick precisa wrapper clicável (L5); `display height` fixo é DELIBERADO p/ bug Chromium 100dvh (L4); pré-cálculo no load PIOROU vs medição inline-toggle (L13). **Estado final v19-16**: fitViewport ungated → display fills viewport em qualquer modo (PWA, mobile, desktop browser). Veredito: "perfeito". **Bug arquitetural pego em P5**: test helper Node bypassava `Render.renderState` (`dirac` direto sem amps), fix moveu condense para dentro de `Render.dirac` (backward compat via check `t.amp`). **Escopo:** F1 confinado a Render.dirac/factored (1 helper + integração); F2 const + 4 substituições; F3a CSS + handlers (delegação data-action reusada); F3b state machine + ResizeObserver + 16 polish-fixes. Zero padrão/módulo novo. **Lições:** `specs/technical/38-v19-lessons.md`. **Carry-forward → v20:** `CU(λ)`/EV multi-qubit (7 ciclos adiado); KaTeX iOS (com device); FLIP-based animation se quisermos sub-pixel perfeito; persistência localStorage de `_expanded`.

## v20 (cycle 21) — PER-QUBIT INSPECTOR

| Critério | Especificação | Teste | Status |
|---|---|---|---|
| V20-1 | **M1 Ops.probQ marginal Bell**: P(Q0=0)=1/2 EXATO em ℤ[ζ₁₆] (Born rule N&C §2.2.3) | `v20-1` | ✅ |
| V20-2 | **M1 marginal kickback** `\|+⟩\|−⟩`: P(Q1=0)=1/2 (kickback não afeta marginal de Q1) | `v20-2` | ✅ |
| V20-3 | **M1 SymState abstrato → erro** (consistente bloch/measure simbólicos) | `v20-3` | ✅ |
| V20-4 | **M1 q inválido**: rejeita [-1, n, 0.5, 'a'] (typeof + Number.isInteger + range) | `v20-4` | ✅ |
| V20-5 | **AS2 cross-check geometric↔algebraic**: P0_num ≈ (1+v.z)/2 em Bell/GHZ/H\|0⟩ | `v20-5` | ✅ |
| V20-6 | **M1 estado puro \|0⟩**: P(Q0=0)=1, P(Q0=1)=0 | `v20-6` | ✅ |
| V20-7 | **AS7 Algebra.format Amp real sem `+0i`**: `format(½, 'rect')='1/2'` | `v20-8` | ✅ |
| V20-8 | **M1 Σ P0+P1 = 1 EXATO** em Bell, H\|0⟩ | `v20-9` | ✅ |
| V20-9 | **M1 marginal sobre superposição não-uniforme** (ALL H 3q): P(Q0=0)=1/2 | `v20-10` | ✅ |
| V20-10 | **Não-regressão Ops.probabilities** (full dist intocada) | `v20-11` | ✅ |
| V20-11 | **M2 ALL prob → distribuição plena** (regressão v7 + migração v7-UI: key:ALL explícito) | `v20-UI-1` + v7-UI | ✅ |
| V20-12 | **M2 n Q prob → marginal P(Qn=0)/P(Qn=1)** em Bell | `v20-UI-2` | ✅ |
| V20-13 | **M2 toggle off com mesma seleção** | `v20-UI-3` | ✅ |
| V20-14 | **M2 switch entre seleções sem desligar** (`0 Q prob`→`1 Q prob` direto) | `v20-UI-4` | ✅ |
| V20-15 | **M3 fita Z-axis dentro da esfera SEMPRE** (lição v20-L1: zTop=P0, zBot=P0-1) | human-AV (estado P=0.146 confirmado) | ✅ |
| V20-16 | **M4 ring oculto em 1 qubit** (tap seria no-op) | `v20-UI-5a` | ✅ |
| V20-17 | **M4 ring visível em Bell** (2 qubits cicláveis) | `v20-UI-5b` | ✅ |
| V20-18 | **M4 tap centro cicla local SEM mexer FSM** (view-only confirmado) | `v20-UI-6` | ✅ |
| V20-19 | **M4 state change reseta _blochViewQ** (AS4) | `v20-UI-7` | ✅ |
| V20-20 | **M4 tap fora do raio não cicla** | `v20-UI-8` | ✅ |
| V20-21 | **HIG mobile**: tap-zone = max(R/2, 44px) | cálculo verificado em P3 | ✅ |
| V20-22 | **PWA Android resume restaura fitViewport** (lição v20-L3: visibilitychange+focus) | human-AV ao vivo | ✅ |
| V20-nao-regressao | **445 testes** (328 Node + 117 Playwright) = 425 v19 + 11 v20 Node + 9 v20-UI; 1 migração intencional v7-UI absorvida; 0 regressão | suíte completa | ✅ |

**Manual (human-AV) — 7 deploys live com a operadora (v20-1 → v20-7)**: validação revelou 3 bugs em sequência, todos corrigidos in-loop: (1) v20-L1 fita saía da esfera com P<0.5 (zBot ia abaixo de -1); (2) v20-L2 renderBloch subtraía 19px do Q label que é absolute-positioned (sphere encolhia sem razão); (3) v20-L3 PWA Android resume não restaurava fitViewport (pageshow insuficiente em standalone). Polish: fita 2× mais grossa (R*0.04→R*0.08), alpha 0.28→0.18, cap mobile 160→220, floor 110→90. **Estado final v20-7**: per-qubit inspector entregue com 3 surfaces — fita geométrica no eixo Z + tap-cycle view-only + `n Q prob` marginal exata. Veredito operadora: "vamos encerrar V20, parece que está tudo ok". **Escopo**: M1 Ops.probQ nova função (sem overload — pre-audit grep simplificou, lição v20-L0); M2 dispatch op:prob por seleção (lição v20-L4 toggle paramétrico exige snapshot); M3 Bloch.render flag probBar (UI confinada, ZERO mudança motor); M4 _blochViewQ local widget state + canvas listener + ring CSS+DOM. Zero padrão/módulo novo. **Lições:** `specs/technical/39-v20-lessons.md` (6 lições L0-L5). **Carry-forward → v21:** **Part III Classic Algorithms** no manual (Deutsch/DJ/BV/Simon/Grover c/ oráculo/PE/Superdense/Shor compilado N=15/Quantum Counting); investigar `SymRules.declare` para modelar oracles `U|x⟩=f(x)|x⟩`. + CU(λ)/EV multi-qubit (8 ciclos adiado); iOS KaTeX (radar).

---

## §v21 — Part III · Classic Algorithms (ciclo 22)

Delta de DOCUMENTAÇÃO: nova **Part III** no `manual.html` com 5 cards de algoritmos clássicos, cada um
com 4 seções (Motivation / Circuit-key sequence / State at key points / Result). Oráculos como
**sequências literais de portas concretas** (sem `SymRules`, sem preset novo). Motor ℤ[ζ₁₆]/portas/FSM
**intocados** (exceto 1 fix de chrome: link `?`→manual same-window).

| # | Critério | Teste | Status |
|---|---|---|---|
| V21-1 | **E1 Deutsch** const → q0=\|0⟩ (`\|0⟩⊗\|−⟩`) | `v21 state E1/f constant` | ✅ |
| V21-2 | **E1 Deutsch** balanced (f=x) → q0=\|1⟩ (`\|1⟩⊗\|−⟩`) | `v21 state E1/f balanced` | ✅ |
| V21-3 | **E2 Deutsch–Jozsa n=3** constant f=0 → input \|000⟩ | `v21 state E2/constant` | ✅ |
| V21-4 | **E2 Deutsch–Jozsa n=3** balanced f=x₀⊕x₁⊕x₂ → input \|111⟩ | `v21 state E2/balanced` | ✅ |
| V21-5 | **E3 Bernstein–Vazirani** s=101 → input \|101⟩ (`\|1011⟩`) | `v21 state E3` | ✅ |
| V21-6 | **E4 Grover n=3 \|111⟩** após 1 iter → P=25/32 | `v21 state E4/iter1` | ✅ |
| V21-7 | **E4 Grover n=3 \|111⟩** após 2 iter → P=121/128 (⌊π/4·√8⌋=2) | `v21 state E4/iter2` | ✅ |
| V21-8 | **E5 Phase Estimation** φ=1/8 → count \|001⟩ (`\|0011⟩`) | `v21 state E5` | ✅ |
| V21-9 | **anti-AP7**: todo estado de card é gerado pelo motor (loadQC), nunca inventado | `v21.test.mjs` (8 estados) | ✅ |
| V21-10 | **F2 keys↔steps**: toda op em `steps` aparece, em ordem, em `keys` (card não "mente") | `v21 keys↔steps` ×9 | ✅ |
| V21-11 | **Part III = exatamente os 5 MVP** (ids E1–E5, motivation+result presentes) | `v21 Part III has exactly the 5` | ✅ |
| V21-12 | **Estrutura**: Part III 5 cards + `#part-algorithms` + Part II 21 cookbook (.ex:not(.algo)) | `examples.spec structure` | ✅ |
| V21-13 | **Índice renumerado**: Advanced A1–A9 contíguo + Part III E1–E5 (sem buracos) | human-AV + structure | ✅ |
| V21-14 | **Menu flutuante**: ☰ index→#toc + ← calc→quantum_calc.html, fixo | `examples.spec` (.floatnav) | ✅ |
| V21-15 | **Nav PWA**: manual↔calculadora same-window (sem Custom Tab × header) | human-AV device | ✅ |
| V21-16 | **KaTeX offline** renderiza os cards | `examples.spec` (vendored KaTeX) | ✅ |
| V21-nao-regressao | **462 testes** (345 Node + 117 PW) = 445 v20 + 17 v21 Node; 0 regressão v21 | suíte completa | ✅ |

**Manual (human-AV) — operadora no device (live qcalc-v21-1 → v21-4)**: aprovou os 5 cards e o índice;
human-AV pegou 2 questões que o automated não pega (7ª recorrência): (1) renumeração do índice
(Part III → E1–E5 + Advanced → A1–A9 contíguo, fechando os buracos do move); (2) header/× preso ao
voltar do manual no PWA Android — causado por `target="_blank"` abrindo Custom Tab; corrigido p/
navegação same-window. **Veredito operadora: "tudo ok".** Lições: `specs/technical/40-v21-lessons.md`
(L0–L5). **Escopo entregue**: 5 cards (Deutsch/DJ/BV/Grover/QPE) com oráculos literais; renderAlgorithms
dedicado; menu flutuante; renumeração de índice. **Carry-forward → v22**: completar a Part III
(Simon, Superdense expandido, Shor N=15, Quantum Counting, Teleportation expandido → E6–E10).
