# v16 — Seed: two-pane display, swipe-left for operation details (Phase 0 outcome)

Cycle 17. **Delta** (UI render-routing only) over v15 (live `qcalc-v15-4`, 386 tests). Delivery target:
**complete delta**. Domain unchanged (in `specs/`); HSA Level 1 skipped. Phase 0 score **93/100**
(operator-confirmed).

## Problem
The display today carries two roles that clash: the **result** (the state vector — what matters) and the
**explanation** (verbose readouts of `prob/measure/Bloch/Schmidt/ρ/C/S(ρ)/‖ψ‖/⟨φ|ψ⟩/EV`). For an experienced
user the explanation is clutter. (Reinforces the operator's standing minimalism preference: the display is for
*results*, not for explaining them.)

## Solution
The display becomes a **horizontal two-pane** surface:
- **Main pane (default):** the state only — `#stateDisplay` + `#selection` + `#statusLine`.
- **Swipe-left → detail pane:** the last operation's readout — `#auxOutput` + the Bloch sphere `#blochInline`.
Swipe-right returns. The detail is **opt-in** → the main display stays clean and direct.

## Enabling fact
`out(text)` already writes to a **separate** element `#auxOutput` ([quantum_calc.html] ~L2516), cleared when the
state changes (~L2571). So the delta is **routing where it appears** (a horizontal carousel of `.disp-body` +
a swipe-left gesture + an affordance), with the engine, ops and `out()` **untouched** (UI-only, Tier 1).

## Elements
- Main pane: `#stateDisplay`, `#selection`, `#statusLine`.
- Detail pane: `#auxOutput`, `#blochInline`.
- **Affordance:** a discreet indicator (chevron/dot) shown **only when there is detail** (`#auxOutput` non-empty
  / Bloch active).
- **Gesture:** swipe-left/right on `.disp-body`, mirroring the v15/carousel invariant (threshold + axis-lock +
  suppress-click), with **vertical = scroll** (long state / long readout) and **horizontal = pane switch**.

## Use cases
- UC1 `0 Q Bloch` → readout to the detail pane; main keeps the state; affordance lights → swipe-left shows the
  ⟨σ⟩ + sphere; swipe-right returns.
- UC2 `measure`/`prob`/`Schmidt`/`⟨φ|ψ⟩`/`EV` → text in the detail pane (same).
- UC3 apply a gate (no readout) → `#auxOutput` cleared → affordance hidden → display fully clean.
- UC4 angle/λ entry (the v15 drawer) → prompt stays in the **main** pane (input feedback, not a readout); no
  conflict with the drawer.

## Invariants / failure modes (design focus)
1. **Discoverability:** swipe-left is invisible → conditional affordance (only when detail exists).
2. **Axis-lock:** horizontal = pane switch; vertical = scroll (the display already scrolls). Reuse v15 invariant.
3. **Sync:** when the state changes, `#auxOutput` clears → the pane must return to main + the affordance hides
   (never stuck on a stale detail).
4. **Bloch:** today inline in `.disp-body`; moves to the detail pane (consistent: visualization is opt-in).

## Tech feasibility
`translateX` + transition + the Pointer-Events gesture invariant are already in the app (v14 carousel, v15
drawer). Single-file, no build. **No blocker.** Tier 1.

## Success / acceptance criteria
(a) after an op, the readout goes to the detail pane and the main keeps only the state; (b) swipe-left reveals /
swipe-right returns; (c) the affordance appears only when there is detail; (d) changing the state clears the
detail + returns to main; (e) key taps and vertical scroll intact (axis-lock); (f) 386 tests stay green + new
tests for the routing; (g) feel approved live.

## Out of scope (YAGNI)
Changing the readouts' content/format (only *where* they appear); engine/ops/`out()`; `CU(λ)` / multi-qubit
`⟨Z₀Z₁⟩` EV (future cycle); everything in v15 not touched by this delta.

## Open for Phase 1
- Exact affordance (chevron/dot, position) and whether an op **auto-switches** to the detail pane or **stays** on
  main (inclination: stays — keeps it opt-in/clean).
- Final home of the Bloch sphere (detail pane vs stays inline).
