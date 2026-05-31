# v15 — Seed: sliding angle drawer (Phase 0 outcome)

Cycle 16. **Delta** (UI render-model only) over v14 (live `qcalc-v14-29`, 383 tests green). Delivery target:
**complete delta**. Domain unchanged (already in `specs/`); HSA Level 1 skipped; Levels 2–5 scope only the
drawer. Phase 0 score **94/100** (operator-confirmed).

## Problem
The angle/λ entry surface today **replaces** the whole keypad (`useMode` swap in `renderKeypad`). It is
abrupt and triggers a display **resize "susto"**: in the standalone PWA, `fitViewport` sizes the display as
`avail − chrome`, and `chrome` includes the keypad height; the lean angle pad is shorter than the quantum
keypad, so the display grows to fill. The v14-29 `_dispH` cache patched the symptom.

## Solution
The angle pad becomes a **bottom-sheet drawer** that **slides up over** the lower keypad zones
(operations / controlled / numeric), keeping the rest of the keypad visible (dimmed) and the display fully
visible above (showing `Rx · θ = ?` + the live buffer). On confirm (`=`) / cancel (`ESC`) it slides down.
**Structural win:** as a `position:absolute` overlay (out of document flow), the app height never changes →
`fitViewport` never recomputes → the susto is gone *by construction* (the `_dispH` cache can be reverted).

## Elements
- **`#angleSheet`** (new): opaque overlay hosting the **reused v14-27 lean pad** (`( ) ⌫ ESC` · digits ·
  `+ − × /` · `π` · `=`) — no key changes.
- **Quantum keypad** (fixed command + paged carousel): stays rendered, becomes `inert` + dimmed while the
  drawer is open.
- **Display + status**: stay visible above the drawer.
- **State**: a `sheet-open` flag/class driven by `angleEntry` / `lambdaEntry`.

## Use cases
- **UC1 (1 param):** `0 Q Rz` → drawer up → `π / 2 =` → applies → drawer down.
- **UC2 (multi-param U):** drawer **stays up** across the 3 angles (idx advances), slides down on the last.
- **UC3 (cancel):** `ESC` / physical Escape → down; on `|ψ⟩`, leaves the symbolic node `U|ψ⟩`.
- **UC4 (λ / kickback):** gate on `|ψ⟩` → drawer up asking λ → `=` → `e^{iθ}`.

## Invariants / failure modes (design focus — generation mode)
1. **No click-through:** the underneath keypad must be non-interactive → `inert` + dim; the opaque drawer is
   the only clickable surface. (Reuse the `inert` pattern from the v14 carousel.)
2. **No reflow:** drawer `position:absolute`, anchored to the keypad-container bottom, out of flow ⇒ app
   height stable ⇒ `fitViewport` untouched ⇒ no display susto.
3. **Gesture conflict:** the carousel swipe handler already returns early during `angleEntry`/`lambdaEntry`
   (`quantum_calc.html` ~L3273) — confirm it stays so; underneath is inert anyway.
4. **Animation feel:** slide up/down timing & easing — **human-AV only** (Playwright cannot emulate
   standalone/gesture; v12-L1/L4). Gated-on-feel (tunable/removable if it feels off).
5. **Height / fit:** drawer = the lean pad's natural height, anchored to the bottom, covering the lower
   zones; must fit under the `fitViewport` zoom on small screens.

## Tech feasibility
`position:absolute` overlay + `translateY` transition + `inert` are standard and **already used** in the
app (the carousel uses `translateX` + `inert`). Single-file, no build. **No blocker.**

## Success / acceptance criteria
(a) parametric gate / λ slides the pad up over the lower zones; (b) display stays visible with prompt +
buffer; (c) **zero** click-through; (d) `=` applies + retracts, `ESC` cancels + retracts, U keeps it up
across params; (e) display does **not** resize on open/close; (f) 383 tests stay green + new tests for the
drawer state (rendered-but-inert underneath, `sheet-open`) where automatable; (g) feel approved live.

## Out of scope (YAGNI)
Engine / FSM / grammar / **pad content** (v14-27 reused); the carousel mechanics (only made inert); desktop
behavior beyond what falls out naturally; `CU(λ)` / multi-qubit `⟨Z₀Z₁⟩` EV (future cycle); everything in
v14 not touched by this delta.

## Open for Phase 1 (resolved)
- Coverage/height: drawer anchored to the bottom of `#keypadArea`, height = the lean pad's natural height; the
  keypad behind is fully `inert` + dimmed (the bit that peeks above is just context). Page-independent.
- `_dispH` cache: **removed** (P1 decision) — the overlay introduces no reflow.

## As built (v15-1 → v15-3)
- **DOM:** `#keypadArea` (position:relative, `max-width:600px;margin:0 auto` to match the keypad) wraps `#keypad`.
  The drawer `#angleSheet` is a **sibling of `#keypad`**, inserted **before** it (so a `[data-action]` shared with
  the command block — `⌫`/`ESC`=`key:CLR`/`key:BKSP` — resolves to the drawer, not the inert command); it sits on
  top via `z-index`. The drawer exists in the DOM **only while open** (built on open, removed after the slide-out)
  → when closed there is no selector collision with the command block.
- **Open/close (`applySheet`):** open → `#keypad.inert=true`+dim, build the drawer (handle + reused v14-27 lean pad),
  `requestAnimationFrame` adds `.open` (slide up). Close → un-inert `#keypad` **immediately** (no inert window),
  `pointer-events:none` on the drawer, remove `.open` (slide **down**), remove the element on `transitionend`
  (+ 320 ms fallback). `renderKeypad` is a **no-op while `angleEntry||lambdaEntry`** (the buffer paints in `#display`,
  not the drawer) → no rebuild/replay per keystroke. Lifecycle: `startAngle/startLambda`→`applySheet(true)`;
  `doEval`(final param)/`cancelAngle`/`doLambda`→`applySheet(false)`.
- **Swipe-down = ESC (scope addition, operator-approved):** `initSheetSwipe` mirrors the v14 carousel tap-vs-swipe
  invariant — pointerdown records y; below a ~10 px threshold it stays a tap; axis-lock (horizontal → released);
  vertical-down follows the finger (`transform` + `.dragging` disables the transition) with `preventDefault`; on
  release, drag > 30 % of the sheet height commits → `cancelAngle`/`doLambda(true)` (ESC), else snaps back;
  `suppressClick` (80 ms) swallows the post-drag click so a tap on a key is never eaten. A grab `sheet-handle`
  gives the affordance.
- **Multi-param `U`:** the drawer stays open across the 3 angles (`idx` advances; `applySheet` not toggled) → no
  flicker; closes only on the last param.

## Tests (Phase 6)
Automated (Playwright, structural): drawer opens on a parametric gate (`#angleSheet` `.open`, `#keypad` inert = no
click-through, lean pad + handle present); `=` applies an exact angle then the drawer is removed and `#keypad` is
live; `ESC` leaves the symbolic node `Z|ψ⟩`, drawer removed, keypad live; idle = no `#angleSheet` (no collision).
Plus non-regression of the existing v2/v4/v7 inline-angle/λ tests (now flowing through the drawer). **386 green**
(286 Node + 100 Playwright). NOT automated (human-AV, Playwright emulates neither touch-swipe nor standalone —
v12-L1/L4): the slide-up/down feel, the swipe-down dismiss, and the no-resize on open/close — all confirmed live
by the operator ("Funcionou"), live `qcalc-v15-3`.
