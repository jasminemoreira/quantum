# v14 (seed) — Sliding/paginated keypad for PWA (replace the `2nd` modifier with a swipe)

> Cycle 15 candidate (v14). Captured during v13 Phase 5 (operator idea). DO NOT start before v13 is
> closed (Phase 6 test migration + Phase 7). Run its own Phase 0–4. Heavily human-AV (mobile gesture feel
> — lesson v12-L1). Delta = keypad **interaction-model redesign** (UI-only; engine/grammar untouched).

## Vision (operator)
On mobile/PWA, replace the `2nd` key with a **swipeable keypad carousel**: keep the **command block fixed**,
swipe horizontally to swap **everything below it** (the left palette + the numeric zone) in one finger move.
Put **`M`** in the slot the `2nd` key vacates (command block); this also frees `M` from being buried at the
end of the numeric zone. Eliminating the numeric keypad from page 2 **gains vertical space** for the
long-tail (gate variants / 2-qubit / operations-2nd / presets), which is cramped on mobile today.

## Decisions already taken (operator, v13 P5)
- **Timing:** v14 = its own cycle, AFTER closing v13 Phase 6 (don't entangle the two deltas).
- **Digits on page 2:** **NONE** — page 2 is the long-tail at full width, no numeric. Operands are typed on
  page 1 (`0 Q 3 Q`), then **swipe → tap preset**; the command buffer **persists** across the swipe (same as
  the `2nd` toggle today). Parametric gates (P/U/CP/CRz) open the inline angle pad automatically, so page 2
  needs no standing digits. (Conservative fallback if the live feel is awkward: keep digits fixed too, swipe
  only the left palette — but that gains less space.)

## Current layout (baseline to redesign)
- **Q_RIGHT (fixed both layers):** `command` zone [ALL, CTRL, Q, SET, **2nd**, CLR, ↶, ↷, RST, ⌫] +
  `numeric` zone [7-9 / 4-6 / 1-3 / 0 . ± / π 1/√2 **M**].
- **Left palette:** `2nd` (shift) swaps Q_LEFT_1 (gates/kets/controlled/operations) ↔ Q_LEFT_2
  (gate-variants/2-qubit/operations-2nd/presets). `shift` toggles `shifted`; `renderKeypad` re-renders.
- Target model: **fixed** = command block (with `M` replacing `2nd`); **page 1** = left palette + numeric;
  **page 2** = long-tail at full width (no numeric); swipe (or page-dots) switches pages.

## Open design questions for v14 Phase 0/1 (the 3 real risks — generation mode)
1. **Discoverability:** no `2nd` button → page 2 is invisible. Need an affordance: **page dots `• ○`**
   (clickable) and/or a "peek" of page 2's edge. #1 risk.
2. **Desktop / no-touch:** swipe doesn't exist on `file://`/desktop. Page-dots must be **clickable**
   (and/or arrow keys / horizontal scroll). Two interaction paths to design.
3. **Gesture conflicts:** horizontal swipe vs vertical display scroll vs button tap. Need touch handlers
   with a movement **threshold + axis lock**, `touch-action: pan-y` on the keypad container, tap-vs-swipe
   disambiguation. The "feel" is live-only (Playwright can't emulate the gesture or display-mode:standalone
   — lessons v12-L1/L4); unit-test the page-state var + switch fn, validate gesture live.

## Scope notes
- UI-only: engine (ℤ[ζ₁₆]/portas/simbólico), the operands-first grammar, and the command FSM are UNTOUCHED.
- Touches: Keymap (page model instead of `shifted`), renderKeypad (carousel + transform/translateX slide),
  CSS (page container + dots + responsive), touch event handlers, and the `shift`/`2nd` removal.
- Migration (v12-L3): removing the `2nd` key + relocating `M` ripples to ui.spec/v2.test keymap assertions
  and any zone-slug CSS. Audit `.mjs` AND `.spec.js`.
- Animation (the "incrível" slide) = CSS `transform: translateX` + transition; nice-to-have, gate on feel.

---

## Phase 0 outcome (cycle 15 — locked, score 97/100)

**Delivery Target:** DELTA COMPLETO (whole keypad interaction redesign in one cycle, UI-only).

**Locked design decisions (operator, AskUserQuestion):**
- **Page-switch affordances (REQUIRED for acceptance):** (1) clickable page-dots `•○`, (2) physical arrow
  keys `←/→` (desktop a11y — needs keypad-container focus management), (3) mouse horizontal drag (pointer
  events unify touch+mouse → one handler). **OUT:** horizontal scroll / mouse wheel (rejected — conflicts
  with the display's vertical scroll; ambiguous gesture). Touch swipe is the primary mobile path.
- **Discoverability of page 2:** page-dots ONLY — **NO "peek"** (chrome-minimal preference). Residual risk
  (discoverability = seed risk #1) mitigated only by dots → validate live (human-AV Phase 6); if not
  findable, reconsider peek in a *future* cycle (do not reopen now).
- **Pages:** exactly **2** (1:1 map to today's primary/2nd layers). Page 1 = left palette + numeric;
  Page 2 = long-tail (gate-variants / 2-qubit / operations-2nd / presets) at full width, **0 digits**.
- **Command block:** FIXED (outside the sliding region, visible on both pages); `M` takes the slot the
  `2nd` key vacates; command buffer PERSISTS across the page switch; auto-return to page 1 after applying
  a long-tail gate (preserves today's auto-unshift, quantum_calc.html:2536).

**Grounded baseline (quantum_calc.html):** `Keymap.layout(mode, shifted)` → replace `shifted` bool with
`page` (0/1); `Q_RIGHT` (command+numeric) split so command becomes fixed and numeric stays page-1 only;
remove the `['shift','2nd','sh']` key (Q_RIGHT command row) and the `M` key from the numeric tail
(`['op:saveBra','M','op']`); `renderKeypad` (~3046) renders both pages + translateX; `routeAction` `shift`
branch (~3104) and auto-unshift (~2536) become page-state logic. CSS `.mode-quantum.layer2` (~178-204)
→ page-container model.

**Tech feasibility (VERIFIED, not assumed):** Pointer Events, `transform: translateX` + transition,
`touch-action: pan-y`, keydown focus — all supported on installed PWA + `file://`, no build step. No
essential capability absent → NO BLOCKER.

**Implementation feasibility (Tier):** Tier 1 — native browser APIs only (PointerEvent + CSS transform);
no library, no documented-algorithm port, no Tier-3 PoC needed. Single-file vanilla JS, consistent with
the whole project.

**Out of scope (YAGNI):** digits on page 2; "peek"; horizontal scroll/wheel; 3+ pages; ANY engine /
operands-first grammar / command-FSM change (UI-only); the Q_STRIP view bar (basis/fmt/∠/form stays above
the keypad, does not paginate); calc mode / EV (retired in v13); everything in v13 not touched by this delta.
