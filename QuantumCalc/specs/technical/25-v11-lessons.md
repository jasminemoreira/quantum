# v11 — Lessons (matrix / column-vector display form)

Cycle 12 · DELTA render-only · 339 → 352 tests (260 Node + 92 Playwright). Engine untouched.

## L1 — "Bypass toKatex" was the wrong boundary; per-cell conversion is mandatory (stack/KaTeX)

The P1 contract said *"`renderMathTex` does not run `toKatex` (matrixTex already emits LaTeX)"*. The
Phase-2 Architectural/Scientific lens caught the gap: `Algebra.format(amp,fmt)` returns **Unicode**
(`1/√2`, `e^{iπ/4}`, `√(2+√2)/2`) and `ketLabel` returns `|00⟩` — none of which render in a `pmatrix`
without `toKatex` (frac→`\dfrac`, `√`→`\sqrt`, `⟩`→`\rangle`). The correct boundary: **`matrixTex`
runs `toKatex` per cell and per ket-label**, assembles the `array`+`pmatrix` scaffold, and *only the
finished scaffold* bypasses `toKatex` (re-running it would mangle `\begin{pmatrix}`). 
**Lesson:** when emitting LaTeX directly, name explicitly which substrings are *raw Unicode needing
conversion* vs *finished scaffold*. This is the 4th recurrence of the KaTeX-offline blind-spot family
(v6 §L, v7 §L1, v8) — `assertValidKatex` on the matrix string is the guard.

## L2 — The Dirac path is sparse by design; a "full vector" view must densify (stack/data model)

`State.amplitudes()` returns **non-zero amplitudes only** (sparse Map). A column vector must show all
2^N rows *including zeros*, so the new primitive is `Array(2**n).fill(Algebra.ZERO)` filled from the
sparse list. A naive reuse of `amplitudes()` would have silently dropped every zero row — a wrong but
plausible-looking result. **Lesson:** any "complete enumeration" view over a sparse store needs an
explicit densify step; the absence of a row is data (a zero), not nothing.

## L3 — The seed's wording is a label, not an architecture (architecture/orthogonality)

The seed said *"new `fmt` mode"*. Putting matrix on **`form`** (a `viewForm` value) instead of `fmt`
was correct because it preserves **orthogonality**: matrix × {exp/rect/polar} are all combinable, and
the user's own choice *"cells respect fmt"* logically *requires* matrix ∉ fmt. The user re-questioned
this at P5 ("why form and not fmt?"); the resolution was to re-explain the **coupling between two of
their own decisions**, not to re-assert. **Lesson:** when a chosen design surprises the operator
later, surface the constraint that forces it (here: respect-fmt ⟹ matrix is a layout, not a format),
rather than defending the choice.

## L4 — The mature codebase already had the systemic fix (architecture/UI)

Phase-2 concentration-by-lens flagged the real systemic risk: a column vector is intrinsically
**taller** than a Dirac line, and the display assumed short content. But the fix was trivial — the
fixed-height LCD already wraps `#stateDisplay` in `.disp-scroll{overflow:auto}`. The only new CSS was
`#stateDisplay.matrix-view{line-height:1.25}` (vs the 3.4 tuned for `\dfrac` spacing). **Lesson:** the
adversarial critique correctly named the systemic axis; mapping it onto existing infrastructure (the
scroll wrapper) avoided inventing a scroll mechanism (AP2). Identify the risk fully, then check what
the codebase already absorbs.

## L5 — Render-only deltas have few genuine negatives → push them to boundaries (process)

The negative-test ratio fell to ~1:3 (vs the 1:2 guideline) because a pure display feature has few
real failure *inputs*. The meaningful negatives are **mode/boundary exclusions**: cap fires at exactly
64 (N=6 must *not* truncate), exact-vs-approx flag, concrete-vs-symbolic (`form` skips matrix for
`|ψ⟩`). **Lesson:** for format/display deltas, don't manufacture artificial bad inputs to hit a ratio —
target the boundaries and the mode-exclusions, and justify the ratio in the coverage report.

## Carry-forward (still de-scoped)

The seed's part 2 — *research & incorporate other operations/views* — is deferred to its own future
cycle (the user scoped v11 to matrix-only). Other standing seeds unchanged: π/16 (ζ₃₂); indexed family
λ_k=f(k); symbolic norm/⟨φ|ψ⟩; trig recognition/simplification; ↓↑ notation; localStorage persistence.
