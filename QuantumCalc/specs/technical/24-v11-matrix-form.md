# v11 — Matrix / column-vector display form

**Cycle 12 · DELTA COMPLETE · Phase 0 (Opus) · brownfield over v10 (339 tests green)**

## 1. Goal

Add a new **state display form**: the 2^N×1 **column vector** of amplitudes,
rendered as a KaTeX matrix, alongside the existing Dirac (factored/expanded) forms.
Didactic value: connect the Dirac notation students already see to the
linear-algebra column-vector representation, in the **active basis**, with the
**same amplitude formatting** the rest of the calculator uses.

This is the matrix-form half of the v11 seed. The seed's second half
(*research/incorporate other operations/views*) is **de-scoped** to a future
cycle — no web research of new ops this cycle.

## 2. Requirement (Phase 0, user-confirmed)

| # | Decision | Value |
|---|----------|-------|
| 1 | Cell format | **Respect the `fmt` toggle** — each amplitude via `Algebra.format(amp, phaseFmt)` (exp/rect/polar). `a+bi` is just `rect`. Matrix = layout, fmt = scalar format (orthogonal, DRY). |
| 2 | Row labels | **Always** — each row annotated with its active-basis ket (`\|00⟩`, `\|01⟩`, …). |
| 3 | Invocation | **3rd value of the `form` key**: `factor → expand → matrix → factor`. Zero new keys (chrome-minimal). Supersedes the seed's "new fmt mode" phrasing — it lives in `viewForm`, not `fmt`. Form indicator (`vlabel`) shows `matrix`. |
| 4 | Large N | **Cap at 64 rows** (`MAX_TERMS`) with a `⋮` row + total-count note. Full up to N=6; N≥7 truncates the middle. Same cap as Dirac. |

### Fixed by the seed (confirmed, not re-asked)
- **Full 2^N state vector**, dense, **including zeros**. Selection `Q` does NOT
  reduce it (partial trace → reduced density matrix is out of scope).
- **Follows the active basis** — changes with the `basis` toggle (uses
  `Engine.viewPerQubit` for non-comp bases, same as Dirac).
- **Concrete state only** — abstract `\|ψ⟩` (`SymState`) → **Dirac fallback**
  (a column vector of symbolic kets is not meaningful here).

## 3. Feasibility — Tier 1 (no PoC, no new lib, engine untouched)

Reuses everything that already exists:
- **Amplitude enumeration**: `State.amplitudes()` is **sparse** (non-zero only,
  `quantum_calc.html:49`). The matrix needs a **dense** walk `i = 0 … 2^N−1`,
  looking up each index in the amps map (0 where absent). ~10-line helper.
- **Basis**: `Engine.viewPerQubit(state, qbasis)` already re-expresses per qubit;
  enumerate the view densely.
- **Cell formatting**: `Algebra.format(amp, phaseFmt)` — unchanged.
- **Render**: KaTeX supports `\begin{pmatrix}…\end{pmatrix}` and `\begin{array}`.
  Row labels via an adjacent `\begin{array}{c}` column (kets) next to the
  `pmatrix`, or `\begin{matrix}` with a label column. Goes through the existing
  `Render.toKatex` / `renderMath` path → falls back to plain text offline like
  every other form.

## 4. Touch map (anticipated; firmed up in Phase 1)

| Module | Change |
|--------|--------|
| M7 Render | New `matrixTex(state, fmt, qbasis)` (dense 2^N enumeration → pmatrix + ket-label array). `renderState` returns it / `refresh` dispatches when `viewForm==='matrix'`. |
| M11 UI | `viewForm` cycle gains `matrix` (3 states); `form` button highlight handles 3 states; `vlabel` shows `matrix`. |
| Engine | **Untouched.** Reuses `viewPerQubit` / `amplitudes`. |
| Algebra (ℤ[ζ₁₆]) | **Untouched.** |

Orthogonal toggles preserved: `fmt` (cell format), `basis` (per-qubit view),
`prob` (distribution bars — can still show below the matrix).
Matrix ignores `evidence` mode (always shows the full vector).
In symbolic mode, `form`'s `matrix` value falls back to Dirac.

## 5. Out of scope (v11)

- Researching/adding other operations or views (seed part 2 → future cycle).
- Reduced/partial-trace vector for a selected qubit (would be a density matrix).
- Matrix form for abstract `\|ψ⟩` (Dirac fallback).
- Operators-as-matrices / gate-matrix display (only the **state** vector).
- Editing the state by typing into the vector (display-only).
- Any engine, gate, or `fmt`/`basis` semantics change.

## 5b. Phase 2–3 refinements (adversarial critique → unified simplification)

Resolutions integrated into the design (reuse/CSS — no new module, AP2 honored):

- **Per-cell `toKatex` (was the under-specified part of the P1 contract).**
  `matrixTex` runs the **existing** `Render.toKatex` on each amplitude string
  (`Algebra.format` emits Unicode: `1/√2`, `e^{iπ/4}`, `√(2+√2)/2`) **and** each
  ket label (`|00⟩` → needs `\rangle`), then assembles the `array`+`pmatrix`
  scaffold. `renderMathTex(el, tex, plain)` renders the **finished** scaffold
  directly — it must NOT re-run `toKatex` (that would mangle `\begin{pmatrix}`).
- **Tall matrix vs fixed LCD (systemic UI/UX finding).** One CSS class
  `.matrix-view` on `#stateDisplay`: `max-height` + `overflow:auto`. Resolves
  overflow, layout-shift, and `prob` coexistence in one move (desktop + mobile).
  Cap=64 already bounds the worst case. No custom scroll mechanism.
- **`form` cycle 2→3 states is purely additive — verified zero test regression.**
  Existing `viewform` tests (`ui.spec.js:327,411`) press once (factor→expand) and
  assert `'expanded'`; none double-press expecting factor. So `factor → expand →
  matrix → factor` preserves the first press. No cycle test changes.
- **Dense accessor:** `const dense = Array(2**n).fill(Algebra.ZERO); for (const
  {index,amp} of view.amplitudes()) dense[index]=amp;` — `amplitudes()` is sparse.
- **Row-count parity:** labels and cells come from the **same** loop → structural
  parity between the `array` (labels) and the `pmatrix` (amplitudes).
- **approx:** aggregate `approx = OR` of cell flags → reuses the existing badge
  (no per-cell ≈ marker — avoids complexity).
- **Symbolic skip:** when state is symbolic (`cs.sym`), `form` cycles
  factor↔expand only (the symbolic render path is reached before the matrix
  dispatch, so matrix never renders for `|ψ⟩`; the cycle handler skips `matrix`).
- **Accepted as-is (tolerable / opt-in / bounded):** polar cells render as `(r,θ)`
  tuples; 64-row KaTeX render cost per keypress (matrix view is opt-in);
  `aria-live` (text alternative via `dataset.plain`); `refresh` branch count.
- **Doc:** update the `form` row in `examples-render.mjs` (manual.html) to mention
  the matrix form.

Structural change V(N)→V(N+1): **0%** (0/3 modules restructured). Criticals: **0/3
remaining**. LOC ≈ +50 / ~3000 (~1.7%).

## 6. Hard constraint

Do not regress the 339 tests (252 Node + 87 Playwright). New tests assert the
dense-vector enumeration (zeros included), the cap+`⋮`, basis-following, the
`fmt` respect, and `assertValidKatex` on the matrix string (KaTeX-offline blind
spot — recurring lesson v7 §L1 / v8).
