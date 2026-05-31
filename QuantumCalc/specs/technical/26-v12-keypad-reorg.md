# v12 — Keypad reorganization (M memory · operations swap · 2nd titles)

Cycle 13 · DELTA COMPLETE · UI-only (M14 Keymap + zone CSS). Engine M1–M5 untouched. 352 tests baseline.

## Goal

Reorganize the single keypad for ergonomics/didactics. **No engine, gate, action, or behavior
change** — only key labels, key positions, and block titles. Every `data-action` stays identical.

## Changes (user-confirmed)

| # | Change | From | To |
|---|--------|------|----|
| 1 | **M (memory)** — rename + relocate | `['op:saveBra','save φ','op']` in 2nd entanglement/product block | `['op:saveBra','M','...']` in the **numeric** block (`Q_RIGHT`), the free `SP` slot next to `1/√2` → row `[π, 1/√2, M]`. `Q_RIGHT` persists in primary **and** 2nd ⇒ M available in both layers (quantum mode; absent in calc, which uses `C_RIGHT` — correct, it's a state op). Behavior **unchanged**: stores current state in `savedState` (read by `⟨φ|ψ⟩` and `⊗`). |
| 2 | **Rename 2nd block** | `'2nd · entanglement / product'` | `'operations'` (matches the primary block name; both read "operations" on their respective layers — intentional) |
| 3 | **Didactic swap** | primary `operations` = {prob, measure, **‖ψ‖**, Bloch, **factor**}; 2nd block has **⟨φ\|ψ⟩**, **⊗** | `⊗` (op:tensor) + `⟨φ\|ψ⟩` (op:inner) → **primary**; `factor` (evidence) + `‖ψ‖` (op:norm) → **2nd**. Result: primary `operations` = {prob, measure, Bloch, ⟨φ\|ψ⟩, ⊗}; 2nd `operations` = {ρ, ρ_A, Schmidt, S(ρ), C, phase, ‖ψ‖, factor} (+SP). Exact key order = Phase 1. |
| 4 | **Strip "2nd · " from 2nd titles** | `'2nd · gate variants'`, `'2nd · 2 qubits +'`, `'2nd · entanglement / product'`, `'2nd · presets / blocks'` | `'gate variants'`, `'2 qubits +'`, `'operations'`, `'presets / blocks'` |

## Feasibility — Tier 1 (no PoC, engine untouched)

Declarative edits to `Keymap` (`Q_RIGHT` numeric, `Q_LEFT_1` operations, `Q_LEFT_2` blocks/titles) + zone CSS.

## Migration risk (Phase 1/2 — the real work beyond the edits)

- **Slug derivation:** `renderKeypad` derives `zone-<slug>` from the block **label**. Renaming labels
  **changes slugs** (`zone-2nd-gate-variants`→`zone-gate-variants`, …, `zone-2nd-entanglement-product`
  →`zone-operations`). The 2nd "operations" slug **collides** with the primary operations block. All
  `@media(max-width:600px)` rules targeting `.zone-2nd-*` and the `.zone-operations` collision must be
  updated/disambiguated (primary via `.mode-quantum:not(.layer2)` vs 2nd via `.layer2`, or give
  `renderKeypad` a layer-aware slug). Lesson v10 round-7: renaming a label moves its slug.
- **Tests by `data-action` are SAFE** (actions unchanged). Tests that break (move of ‖ψ‖/factor to 2nd):
  - `ui.spec.js:50` asserts `op:norm` visible in primary → now in 2nd (update assertion; assert `op:inner`/`op:tensor` visible in primary instead).
  - `ui.spec.js:81` (`op:norm`), `:447` (`op:norm` symbolic), `:311` (`evidence`/factor) → add `shift` before the click (now on 2nd layer).
  - No ui.spec test presses `op:inner`/`op:tensor`/`op:saveBra` → no shift-removal needed; ADD coverage for them in primary + M in numpad (both layers).

## Out of scope

- Recall/MR of M (store-only; `⟨φ|ψ⟩`/`⊗` are the readers).
- Any engine / gate / action / behavior change; M in calc mode.
- Reordering blocks beyond the specified key moves; touching `Q_STRIP`, kets, gates, command.

## Phase 3 — complete consumer audit (the unified mitigation)

Exhaustive map of every consumer of the old labels/slugs/positions (the systemic Migration risk):

1. **`quantum_calc.html` Keymap (data):** M→numeric (`Q_RIGHT`, SP slot → `[π,1/√2,M]`); primary `operations` swap (out: ‖ψ‖/factor; in: ⟨φ|ψ⟩/⊗); 2nd block contents (out: inner/saveBra/tensor; in: norm/evidence) + rename `operations`; strip "2nd · " from the 4 titles.
2. **`quantum_calc.html` CSS** (slugify = `label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')`):
   - `.zone-2nd-gate-variants` → `.zone-gate-variants` (lines 176, 183, 187)
   - `.zone-2nd-2-qubits` → `.zone-2-qubits` (176, 184, 188)
   - `.zone-2nd-entanglement-product` → `.zone-operations` (177, 186, 189, 193, 199) **+ collides** with primary
   - `.zone-2nd-presets-blocks` → `.zone-presets-blocks` (177)
   - primary `.zone-operations` (174, 179) → scope `.mode-quantum:not(.layer2) .zone-operations`; 2nd ones are already `.mode-quantum.layer2 .zone-operations` (layer-scoped, correct). **Include the dense-block font rules (193 `11.5px`, 199 `10.5px`)** under the new layer-scoped `.zone-operations`.
3. **`tests/ui.spec.js`** (4): `:50` op:norm visible-in-primary → assert op:inner/op:tensor visible instead (op:norm now 2nd); `:81`, `:447` (op:norm click) + `:311` (evidence click) → add `shift` before.
4. **`tests/examples-data.mjs`** (only **I6**, line 125): steps `[…,'shift','op:saveBra','shift',…,'shift','op:inner']` → `[…,'op:saveBra',…,'op:inner']` (M in numpad, ⟨φ|ψ⟩ in primary — drop the 3 shifts); `keys` string `'… · 2nd save φ · … · 2nd ⟨φ|ψ⟩'` → `'… · M · … · ⟨φ|ψ⟩'`; `why` mentions "save φ (2nd)"/"⟨φ|ψ⟩ (2nd)" → "M"/"⟨φ|ψ⟩ (primary)". No other example uses inner/tensor/saveBra/norm/evidence.
5. **`tests/examples-render.mjs`** static doc: §7 operations table (lines ~131-138) + "2nd re-maps…" sentence (line ~62) → reflect the new layout (primary: prob/measure/Bloch/⟨φ|ψ⟩/⊗; 2nd "operations": ρ/ρ_A/Schmidt/S(ρ)/C/phase/‖ψ‖/factor; M on the numpad). `manual.html` regenerates from these via `examples.spec.js`.

NOT consumers (verified): no Playwright test reads `.zone-*` classes or block-title order; no test asserts the `save φ` label; `op:saveBra`/`op:inner`/`op:tensor` have no ui.spec coverage (ADD some in Phase 6). M cls in numpad = decide (`k` constant-style vs `op`); add `title` tooltip for discoverability.

Structural change V(N)→V(N+1): **0%** (0/3 modules restructured; slug collision solved by CSS layer-scoping, no schema change). Criticals: **0/2 remaining** (both = comprehensive audit, now mapped).

## Scope expansion (operator-requested mid-Phase-5, S5) — measure without confirm

Remove the `window.confirm('Collapse to a sampled branch?')` from the **concrete** `measure` handler
(`quantum_calc.html` ~2704). New behavior: clicking **measure** enumerates the branch probabilities
(deterministic, still shown) **and collapses immediately** to a sampled branch (∝ probability) — one
click, no popup ("if they clicked, they want to measure"). `out` combines branches + `Collapsed to
|X⟩` in one text. The non-collapsing distribution stays on the **`prob`** toggle. Engine/`Ops.measure`
untouched. Symbolic `symMeasure` never used a confirm (teleport test seeds `Math.random` — unaffected).
Cookbook **I5** now shows branches **and** collapse (matches its title; `examples.spec` only asserts
`_out` truthy → no failure; `manual.html` regenerates with a sampled outcome). §7 doc line updated.

## Hard constraint

Do not regress the 352 tests (260 Node + 92 Playwright) — adjusting the 4 coupled ui.spec assertions
is part of the delta, not a regression.
