# Cycle 28 — Symbolic angle on concrete states (diagonal phases)

Versus cycle 28. Baseline estável: tag `qcalc-v26-33` (live qcalc-v26-33).

## Problema (descoberta da operadora)

Hoje o exponencial simbólico com ângulo livre (e^{iθ}) só nasce do **autovalor de um
autoestado abstrato** |ψ⟩ (o kickback: `0 CTRL 1 Q U` + ângulo `t` → ((1±e^{it})/2)⊗|ψ⟩).
**Não existe** (e nunca existiu) aplicar uma fase com ângulo **simbólico** a um estado
**puramente concreto**. Verificado: `onGate` concreto vai sempre para `startAngleEntry`
(numérico); o pré-v24 era idêntico — não houve regressão, é recurso novo.

Caso de uso âncora: mostrar as fases controladas da **QFT/QPE simbolicamente** num
registro concreto, ex.: `(1/2)(|00⟩+|01⟩+|10⟩+e^{iθ}|11⟩)`.

## Escopo (operadora confirmou)

DENTRO:
- `P(φ)` e `CTRL P` (=CP) com ângulo SIMBÓLICO (símbolo livre θ, 2πθ, …) sobre estado concreto.
- `Rz(φ)` simbólico = STRETCH, incluir só se `phaseAtom` aceitar meio-ângulo (denom 2) limpo.
- Resultado: SymState de layout concreto com coeficientes simbólicos (e^{iθ}).

FORA (erro guiado):
- `Rx`, `Ry`, `U` com ângulo simbólico — exigiriam cos/sin simbólicos (trig simbólica).

CONTRATO preservado:
- Ângulo CONCRETO segue 100% pelo caminho numérico ℤ[ζ₁₆] (render `e^{iπ/4}`).
- O caminho do `phaseAtom` dispara SÓ para símbolo livre.
- Consistência: θ→valor concreto deve bater com a aplicação numérica.

## Feasibility — PROVADA (protótipo de risco, Fase 0)

Reusa infra existente: `SymState.fromConcrete` (lift), `SymExpr.phaseAtom` (e^{iφ}),
`SymExpr.mul(coef, phaseAtom)` nos termos onde controles+alvo=1 — espelho EXATO do
caminho abstrato em `applyOne` (~linha 2000). Renderizador já mostra coef simbólico
sobre layout concreto (`isPureConcrete`/`renderSym`). Protótipo confirmou:
- `P(θ)|+⟩` → `(1/√2)|0⟩ + (1/√2·e^{iθ})|1⟩`
- `CP(θ)|++⟩` → `(1/2)(|00⟩+|01⟩+|10⟩+e^{iθ}|11⟩)`
- consistência θ→π/4 == `CP(π/4)` numérico (mesmo valor e^{iπ/4}).

## Design da implementação (delta aditivo; não altera caminhos existentes)

1. **Motor (`SymEngine`)**: nova função `applyDiagPhaseSym(sym, {controls, target, desc})`
   que multiplica `coef` por `SymExpr.phaseAtom(desc)` nos termos onde controles+alvo=1.
   Restrita a portas DIAGONAIS (P/Rz). NÃO toca `applyOne`/`applyN` existentes.
2. **FSM (entrada de ângulo)**: em estado CONCRETO + porta paramétrica diagonal, se o
   `doEval` detectar SÍMBOLO LIVRE (reusar `parsePhaseAngle`/`parsePhaseLambda`), em vez
   de avaliar p/ número: promover `State→SymState` (`fromConcrete`) e chamar o apply simbólico.
   Número/π → caminho numérico de hoje, intacto.
3. **UX de entrada do símbolo (reusa o λ)**: na gaveta de ângulo concreta, "=" vazio (ou
   tecla θ) → e^{iθ}; promove a simbólico. Idêntico ao mecanismo do λ abstrato → funciona
   no touch sem teclado físico.
4. **Guarda não-diagonal**: Rx/Ry/U com símbolo livre → erro guiado ("symbolic angle only
   for diagonal phase gates P/Rz").

## Plano de testes (anti-AP7)

- Node: `applyDiagPhaseSym` em P/CP; consistência θ→π/4 == numérico (replay).
- Playwright: `P` + "=" (θ) sobre concreto → e^{iθ}; `CTRL P` + θ → caso âncora;
  ângulo concreto ainda numérico (e^{iπ/4}, sem regressão); Rx + símbolo → erro.

## Riscos / lições antecipadas

- L: `phaseAtom` meio-ângulo (Rz) — verificar denom 2 antes de prometer Rz.
- L: promoção concreto→simbólico mid-circuito — garantir que ops subsequentes (prob/measure)
  se comportam (|e^{iθ}|=1 → prob bem definida).
- L: manter o caminho numérico INTOCADO (aditivo) — o contrato exato ℤ[ζ₁₆] não pode regredir.

## Implementação (Fase 5 — CONCLUÍDA)

Delta em `quantum_calc.html` (4 pontos), todo aditivo:
1. `SymEngine.applyDiagPhaseSym(sym, {gate, target, controls, desc})` — após `apply`, exportado.
   Espelha o caminho abstrato de `applyOne` (`coef × phaseAtom`) sobre slots CONCRETOS onde
   controles+alvo=1. P → e^{iφ} só no |1⟩. Rz → AMBOS os ramos (e^{∓iφ/2}, `coefD` dobrado).
   Asserção defensiva C1: `gate ∈ {P, Rz}` senão `throw`.
2. `doEval` (ramo `angleEntry`): símbolo livre (`parsePhaseAngle`/`parsePhaseLambda`) ou `=` vazio
   → `θ`, SÓ para a whitelist diagonal `{P, Rz}` → comando `applyDiagSym`. Rx/Ry/U + símbolo →
   `showError` guiado. Número/π → caminho numérico de hoje, INTOCADO.
3. Teclado físico: símbolo habilitado durante `angleEntry` (`lambdaEntry || angleEntry`).
   Afordância touch = `=` vazio → `θ` (reusa o mecanismo do λ; sem tecla nova).
4. `execute`: kind `applyDiagSym` promove `State → SymState` (`fromConcrete`) e aplica.
   `phaseLabel`: guard `coefD≠1` emite o denominador APÓS o símbolo (`e^{−iθ/2}`); o `toKatex`
   já renderiza inline (a regra n/d exige DÍGITO antes de `/`). `coefD≠1` nunca nasce do λ.

Testes: `tests/v28.test.mjs` (Node) + grupo `v28` em `tests/ui.spec.js` (PW).
Caminho numérico/λ sem regressão.

## v28b — alocação de símbolo FRESCO (achado de human-AV)

**Problema (operadora, testando live):** aplicar `P(θ)` e depois `Rz(θ)` dava o MESMO nome `θ`
aos dois ângulos → leva a crer que são iguais. Pior: duas `P(θ)` no mesmo qubit davam `e^{2iθ}`
(afirma igualdade); se o usuário quis ângulos distintos, está errado. Princípio
[[math-before-didactics]]: reusar um nome AFIRMA igualdade (a alegação mais forte); o default
honesto é INDEPENDÊNCIA.

**Correção (delta aditivo):**
- `freshPhaseSym(state)` — aloca o próximo símbolo NÃO usado no estado atual: `θ`, `θ₂`, `θ₃`…
  (deriva de `SymState.symbolIds()` → reset automático no SET, robusto a undo/redo; o esquema
  `θ→θ₂` dribla o strip de `₀/₁` do `symbolIds`). Unificado nos DOIS caminhos: concreto diagonal
  (`startAngleEntry` guarda `defaultSym`) e λ abstrato (`startLambdaEntry`) — corrige o λ de quebra.
- `doEval`/`doLambda`: `=` vazio usa o `defaultSym` fresco (não mais `θ` hardcoded).
- **Reuso intencional** preservado: digitar um símbolo explícito (`θ`/`t`/`φ`) casa de propósito;
  o motor ainda compõe `e^{2iθ}` quando recebe o MESMO símbolo 2× (QPE `U^{2ʲ}`).
- **Transparência (toque):** o prompt da gaveta revela o símbolo fresco (ex.: `Rz · θ = ?  ·  = → θ₂`).

Testes v28b: 2 Node (engine: distintos compõem `e^{iθ}·e^{iθ₂}`, não conflam; mesmo símbolo 2×
ainda `e^{2iθ}`) + 3 PW (FSM: P/Rz distintos → θ/θ₂; reuso por digitação; prompt revela θ₂).
1 teste existente (REG v4, 2ª aplicação de λ) atualizado p/ `e^{iθ₂}` (mudança intencional).

## Resultado (Fases 6–7 — CONCLUÍDAS, 2026-11-25)

- Suíte: **411 Node + 169 Playwright, 100% verde**, zero regressão nos caminhos numérico ℤ[ζ₁₆] e λ.
- Deploy live: `qcalc-v28-2`.
- Human-AV da operadora (visual, live): CTRL P simbólico → `(1/2)(|00⟩+|01⟩+|10⟩+e^{iθ}|11⟩)` com
  KaTeX correto; 2º gate simbólico → `θ₂` distinto; Rz → `e^{∓iθ/2}` inline; ângulo concreto segue
  numérico; Rx + símbolo → erro guiado com estado intocado. **Aprovado.**
- Lições: `51-v28-lessons.md` (índice cumulativo em `specs/references/lessons.md`).
