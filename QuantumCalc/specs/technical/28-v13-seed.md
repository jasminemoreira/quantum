# v13 — Symbolic memory + ⊗, and quantum-mode EV / retire scientific calc (seed + architecture)

> Cycle 14 (v13). DELTA over v12 (358 tests green, published `qcalc-v12-15`). Two fronts, one cycle.
> Patterns INHERITED (no new pattern). Engine ζ₁₆ / gates / fmt / basis / measure UNTOUCHED.
> Gate: **math-before-didactics** — the symbolic ⊗ must be algebraically correct → tensor-correctness tests (Phase 6).

## 0. Problem (why)
- The symbolic engine can build `T·H|ψ⟩` but cannot **save** (`M`) or **tensor** (`⊗`) it: in symbolic
  mode `onOp` short-circuits to only `prob`/`measure` (~line 2689). So `(TH|ψ⟩)⊗|φ⟩` is unbuildable.
- The genuinely-quantum "over-the-state" queries live in the **wrong place** — inside the standalone
  scientific-calc mode, whose general arithmetic dilutes the tool's DNA. **EV** (expected value of a
  Pauli) is the only one with no home outside calc; `amp[]`/`P()` are already covered by matrix-form +
  the `prob` toggle; `norm`/‖ψ‖ already exists as a quantum-mode op.

## 1. FRENTE A — Symbolic memory (`M`) + symbolic/mixed tensor (`⊗`)

### M16 SymState (pure, extend)
- `tensor(other) → SymState` — `this ⊗ other`, big-endian (this = saved = high/left subsystems,
  matching `Ops.tensor(savedState, s)` = "φ ⊗ ψ"). Implementation: cartesian product of terms
  `{coef: SymExpr.mul(ta.coef, tb.coef), slots: ta.slots.concat(tb.slots)}`, then `_combine`
  (combineLikeTerms). `layout = this.layout.concat(other.layout)`.
- `static fromConcrete(state) → SymState` — promote a concrete `State` to symbolic. `layout` all `'c'`;
  for each `[idx, amp]` in `state.amps`: term `{ coef: SymExpr.fromAmp(amp) (exists, ~1358), slots:
  bits(idx) big-endian (n bits) }`. Lossless (ℤ[ζ₁₆]).
- **Shared-label rule (decision):** `tensor` REJECTS when both operands use the same abstract label
  (e.g. both `|ψ⟩`) → `throw 'rename — both states use |ψ⟩'`. Forces distinct labels {ψ,φ,χ};
  avoids ambiguous rule application (`U|ψ⟩=λ|ψ⟩` would hit both subsystems).

### M11 UI / onOp (DOM only, extend)
- Symbolic short-circuit (~2689) also handles:
  - `saveBra` → `savedState = s` (M is type-agnostic — holds `State` OR `SymState`).
  - `tensor` → promote the concrete operand via `fromConcrete` so a SymState is on both sides;
    `result = savedSym.tensor(curSym)`; `History.init(result, 'φ ⊗ ψ (n qubits)', { kind:'prepare',
    sym:true, label:'φ⊗ψ' })`; `Parser.clear(); refresh(); out('Result φ⊗ψ became the current state.')`.
    `History.init` RESETS (φ⊗ψ is a fresh prepared state — mirrors the concrete `⊗` at ~2705).
- `⟨φ|ψ⟩` (inner) stays **concrete-only**: still errors if either operand is symbolic
  (no orthonormality assumption — v4 A2, math-before-didactics).

### Anchor use case
`|ψ⟩ SET` → `H` → `T` (builds `T·H|ψ⟩`) → `M` → `|φ⟩ SET` → `⊗` → display `(TH|ψ⟩)⊗|φ⟩`.
Mixed: saved symbolic ⊗ current concrete (or vice-versa) → promote concrete→SymState, tensor.

## 2. FRENTE B — retire scientific calc (EV migration REVERTED mid-Phase-5)

> **REVISION (Phase 5, operator decision):** the EV (`⟨O⟩`) migration below was implemented and then
> **removed entirely**. Reason: a single-qubit Pauli `⟨ψ|O_q|ψ⟩` equals that qubit's Bloch-vector
> component, which the **Bloch** key already shows (`⟨σx⟩,⟨σy⟩,⟨σz⟩,|r|`) — so `⟨O⟩` was redundant
> (chrome-minimal). Extending to multi-qubit Pauli strings (`⟨Z₀Z₁⟩`, real value Bloch can't show) was
> declined. Net FRENTE B = **only retire the scientific calc**; `Bloch` stays in the PRIMARY operations
> zone (`prob/measure/Bloch/⟨φ|ψ⟩/⊗`, identical to v12). The `⟨O⟩`/evEntry/EV_PICK text below is
> historical. Critical **C3 (EV picker render) is moot**. (decision ad81456d)

### EV (⟨O⟩) as a first-class quantum-mode op
- New key `op:ev` labelled `⟨O⟩`, in the **primary operations zone** (Q_LEFT_1, alongside
  `prob`/`measure`/`Bloch`/`⟨φ|ψ⟩`/`⊗`).
- New inline-entry `evEntry = { q }` (sibling of `angleEntry`/`lambdaEntry`): pressing `⟨O⟩` with a
  selected qubit (`n Q`) enters `evEntry`; a small inline picker offers **X / Y / Z**; on pick →
  `amp = Ops.expectation(s, O, q)` (exact ℤ[ω], already exists ~1332) → `out('⟨' + O + '_' + q + '⟩ = ' +
  Algebra.format(amp, phaseFmt).text …')`.
- **Decisions:** require `n Q` — `ALL → error` (per-qubit, like measure). **Concrete-only** — EV errors
  in symbolic mode (consistent with `⟨φ|ψ⟩` and v4 negative scope).

### Retire the scientific calc (scope confirmed)
- **Remove:** the `mode` toggle key (`→ calc`/`→ quantum`) from `Q_STRIP` (~2379) and `C_STRIP`;
  `toggleMode` (~2881); the `op:mode` routing (~3061); the **C_LEFT "over the state" block**
  (`amp[]`/`P()`/`EV()`/`norm` as calc keys, ~2386-2387).
- **Keep:** the shunting-yard evaluator `Calc.evaluate` (M12) — REQUIRED for inline angle (`P(π/4)`, `Rz`)
  and eigenvalue λ entry. Keep the **C_LEFT "functions"** + **C_RIGHT "numeric"** blocks — `renderKeypad`
  uses `useMode = (angleEntry||lambdaEntry||evEntry) ? 'calc' : mode` (~3004), so that layout survives as
  the inline-entry keypad; it just has no free-toggle entry point anymore. `stateCtx` wiring drops from
  `doEval` (no standalone calc). Queries become one-shot ops; **no** free-expression composition; **no**
  general scientific calculator.

### Migration care (lesson v12-L3)
Renaming/removing zones moves `zone-<slug>` classes → audit **`.mjs` AND `.spec.js`** + all CSS selectors.
Touch: `ui.spec.js` (calc-mode tests, `mode-calc` CSS, `shot-calc-*`, `shot-u-calc`, `shot-v10-calc`,
`shot-redesign-calc`), `v2.test.mjs` (keymap), any test that toggles mode. Update `manual.html`.

## 3. Patterns (inherited — reused, no new)
Layered + Pure-core/DOM-only-UI (tensor/fromConcrete pure; onOp & `⟨O⟩` DOM-only) · Command (symbolic ⊗
= atomic prepare; EV = read-only) · Composite + Term Rewriting (tensor = cartesian product of terms/slots) ·
Strategy (angle/λ/ev share one inline-entry keypad) · Immutable State (tensor returns new SymState) ·
Interpreter reused (Calc.evaluate drives angle/λ entry). KISS/YAGNI/SOLID/single-threaded inherited.

## 4. Negative scope (delta)
Symbolic `⟨φ|ψ⟩`; `amp`/`P` as first-class ops (matrix-form + `prob` already cover); general scientific
calc + free-expression composition; EV over abstract kets / in symbolic mode; entangling tensor between two
abstract factors; tensor of two states sharing an abstract label (rejected); ρ/density; everything in v12
not touched by this delta.

## 5. Feasibility
Tier 1/2, no PoC. `tensor`/`fromConcrete` port `fromKets`'s combine logic over existing `SymExpr`
primitives (`mul`/`fromAmp`/`ONE`/`add`/`isZero`). EV reuses `Ops.expectation`. Evaluator/keypad survive by
construction. No external deps, single-file/offline preserved. HARD CONSTRAINT: don't regress 358; engine
ζ₁₆/gates/fmt/basis/measure untouched.
