# v15 — Lessons (sliding angle/λ drawer)

Cycle 16. Delta = the inline angle/λ entry surface stops **replacing** the keypad and becomes a **bottom-sheet
drawer** that slides up over it (operations/controlled/numeric), retracts on `=`/`ESC`, and dismisses on
**swipe-down**. UI-only (engine/FSM/grammar/pad-content untouched; the v14-27 lean pad is reused). Suite
**386 green** (286 Node + 100 Playwright). Live `qcalc-v15-3`.

## L1 — An overlay kills the resize "susto" by construction (removes a v14 hack)
The full-surface **swap** made the keypad shorter during angle entry, so `fitViewport` (PWA) recomputed the
display height → the display jumped. v14-29 patched the *symptom* with a cached height (`_dispH`). v15 removed
the *cause*: a `position:absolute` overlay is **out of document flow**, so the app height never changes and
`fitViewport` never recomputes. The `_dispH` cache was deleted. **Lesson:** when a transient UI changes layout
height, an out-of-flow overlay is structurally cleaner than swapping + compensating for the reflow.

## L2 — An overlay that duplicates the actions behind it breaks `.first()` selectors
The drawer reuses `key:CLR`(ESC) and `key:BKSP`(⌫) — actions the fixed command block also has. With the keypad
behind kept in the DOM (inert), `[data-action="key:CLR"].first()` resolved to the **inert command button** →
Playwright click timed out (it never becomes actionable). Tried: make the drawer the first child of `#keypad`
(so `.first()` hits the drawer). Final, cleaner: the drawer is a **sibling inserted *before* `#keypad`** and is
**removed from the DOM on close** — so when closed there is *no* duplicate at all, and while open the drawer wins
`.first()`. **Lesson:** an overlay sharing data-actions with the surface behind it must either order before it
*and* leave the DOM when closed — otherwise generic `.first()` selectors grab the wrong (inert) element.

## L3 — Per-keystroke re-render forbids building the animated element in that path (echoes v14-L1/L2)
`refresh()` calls `renderKeypad()` on **every** keystroke. If the animated drawer were rebuilt there, its
slide transition would replay (or vanish) on each digit. Same fix as the carousel: **re-render only on a state
transition.** `renderKeypad` is a **no-op while `angleEntry||lambdaEntry`** (the buffer paints in `#display`,
not the drawer); the drawer is a **stable** sibling whose slide is a class toggle (`.open`). **Lesson:** any
surface re-rendered per keystroke cannot host the animated element — make it stable and reconcile by class.

## L4 — A close animation must not hold the surface behind it inert
First cut shipped **instant** close (rebuild on `=`) to dodge an inert window + Playwright flakiness (a test
clicking a keypad button during a ~250 ms inert close-animation would stall). The operator wanted the
slide-**down** ("é show"). The robust slide-down **decouples** the two: on close, **un-inert `#keypad`
immediately** (keypad live, no window) and let the sliding drawer animate out with `pointer-events:none` (clicks
pass through to the live keypad), removing it on `transitionend` (+ a 320 ms fallback for reduced-motion).
**Lesson:** reactivating the underlying surface (instant) and animating the overlay out (async, with a fallback)
are separate concerns — never gate the surface on the exit animation.

## L5 — An operator-added gesture that maps onto a proven invariant is absorbed in-phase
**Swipe-down = ESC** arrived mid-Phase-5. Per S5 (scope is the operator's) it is a legitimate addition, not AP9
creep — recorded via `record_decision(scope)`. It reused the **v14 carousel tap-vs-swipe invariant verbatim**
(threshold + axis-lock + follow-the-finger + `suppressClick`), only on the vertical axis with a 30 %-height
commit. Because it maps onto an already-validated pattern and the domain is unchanged, it did **not** need a new
Phase 0–4 loop. **Lesson:** an operator-approved interaction that reuses a proven invariant can be folded into the
current phase (record it, reuse the invariant) rather than re-derived from scratch.

## Carry-forward (candidates, NOT started)
- **`CU(λ)` ergonomics / arbitrary-eigenstate kickback** and **multi-qubit Pauli `⟨Z₀Z₁⟩` EV** (the v13/v14
  carry-forward) remain. The slide-**out** animation, once deferred, is now delivered.
- Consider a Playwright touch-emulation pass for the swipe (currently human-AV only) if the gesture logic grows.
