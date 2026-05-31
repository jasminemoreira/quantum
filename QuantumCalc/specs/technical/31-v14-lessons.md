# v14 — Lessons (sliding/paginated keypad)

Cycle 15. Delta = keypad interaction-model redesign (UI-only; engine/grammar/FSM untouched). Sliding
carousel replaces the `2nd` modifier: fixed command block (with `M`), page 1 = palette + numeric,
page 2 = long-tail full-width (no digits); switch by swipe / page-dots / arrow keys / mouse-drag.
Suite **383 green** (286 Node + 97 Playwright), 0 regression over v13's 369. The keypad delta shipped at
`qcalc-v14-9`; a Phase-7 series of *avulsos* (PWA layout + the lean angle pad, see L6) took the live build
to `qcalc-v14-29`.

## L1 — Carousel breaks the "hidden = absent" test model (Playwright visibility)
In the old `2nd` model the inactive layer was REMOVED from the DOM (`toHaveCount(0)` worked). In the
carousel **both pages live in the DOM always** (translated off-screen + `inert`). Playwright's
`toBeVisible()` returns **true** for an off-screen `translateX` element (non-empty box, not `display:none`),
so visibility assertions can't distinguish the active page. **Fix:** detect the active page via the
`inert` attribute — `.kp-page:not([inert])` — not via visibility/count. ~4 layer-visibility tests rewritten
this way; ~20 `act('shift')` → `act('page:1')`; auto-return checks use `expect.poll(activePage)` (the rAF
return is async). Reflected boolean property `el.inert = !active` → `[inert]` attribute selector works.

## L2 — Tap-vs-swipe is THE risk on a keypad (C1); one invariant resolves it
Every keypress is a tap, so a swipe handler that eats taps breaks the *whole* keypad. The fix is a single
invariant: **tap is the default, swipe is the exception.** Pointer handler on the stable `#keypad`;
do nothing until movement crosses an axis-lock threshold (~10px); only then, if horizontal, capture +
`preventDefault` + follow the finger; on release, if never locked → it was a tap (let the click fire), else
commit/snap. `page` is the single source of truth — `transform` is always reconciled to `-page*50%` on
release (kills drift). Suppress the post-swipe click with a short-lived flag. This ONE rule resolved C1 +
gesture-drift + pointermove perf together (AP2: simplify, don't add components).

## L3 — Live dogfooding surfaced a latent unit bug the tests never caught (turns↔λ)
While developing a **symbolic phase-kickback** live, the operator found that entering the eigenvalue λ as
`1/8` in **turns** mode produced `e^{i·0.125 rad}` (≈approx) instead of `2π·1/8 = π/4` (exact `e^{iπ/4}`).
Root cause (pre-existing v7/v4): the turns `×2π` conversion was applied to the **gate-angle** entry
(~line 2999) but NOT to the **v4 eigenvalue-λ** entry (`doLambda`) — the code comment even admitted
*"λ simbólico do v4 não passa aqui"*. **Lesson:** when a UI convention (turns) is added, audit **every**
entry boundary, not just the obvious one. Fixed as a scoped *avulso* patch (outside the v14 UI delta,
recorded via record_decision, S5/AP9): `doLambda` applies `×2π` when `angleMode==='turns' && !rr.isPi`.

## L4 — The calc exposes the eigenstate assumption (math-before-didactics, echoes v3/v6/v7)
Asked to develop a kickback with `controlled-T` on target `|+⟩`, the engine correctly **entangles** —
because `|+⟩` is NOT an eigenstate of `T` (`T|+⟩ ≠ e^{iπ/4}|+⟩`). The "clean kickback" the textbook/GPT
shows is valid only for an **eigenstate** target; for `T` that is `|1⟩` (eigenvalue `e^{iπ/4}`). The exact
core refuses to fake the clean factorization, exposing the hidden assumption. The elegant in-app form of
the abstract kickback is the **symbolic state `|ψ⟩` + declared eigenvalue λ** (= the `U|ψ⟩=e^{iλ}|ψ⟩`
abstraction). Reinforces the recurring P0-working insight: the calculator teaches by being exact.

## L5 — Label collisions and a 2-state highlight on a 3-state cycle (UI papercuts found live)
`fmt` vs `form` shared a stem (both read "format") → disambiguated to `fmt` vs **`view`**. The `form`/`view`
button had a binary `.on` highlight designed for 2 states (factor/expand) that was **ambiguous for 3**
(expand and matrix both lit) → removed the highlight (the active view already shows in `#selection`,
consistent with `basis`/`fmt`). `∠` was cryptic → `rad/trn` (compact) + the active convention now always
shows in the status line (rad was previously silent). The operator drove all of these from live use —
human-AV catches UX papercuts that pass every automated test.

## L6 — A UI-only delta attracts a flurry of adjacent live-polish requests; keep them scoped
During the P5/P6 human-AV passes the operator requested several small fixes (`÷`→`/`, `form`→`view`,
`∠`→`rad/trn` + rad indicator, drop the `form` highlight, the turns↔λ bugfix). Several were **outside** the
locked v14 delta (pre-existing v4/v7/v11 behavior). Each was handled as a separate scoped change with its
own `record_decision` and a cache bump (`v14-3`…`v14-9`) — **not** silently folded into the delta (S5/AP9).
Lesson: live dogfooding is the best bug-finder, but it blurs the cycle boundary; record adjacent fixes
explicitly so the delta stays honest. The pattern continued **into Phase 7**: with the keypad approved,
the operator drove a run of PWA-layout fixes from the installed app — full-bleed portrait
(`@media display-mode:standalone and orientation:portrait` → no card chrome, `100dvh`), actions moved
under the display, top-padding tweak, and a `fitViewport()` shrink-to-fit (`#app.style.zoom = avail/natural`,
gated to standalone-or-≤600px so desktop/Playwright stay intact, shrink-only — the operator wanted the
keys *fixed*, not elastic). Each was CSS/JS-only, test-neutral, recorded as its own decision with a cache
bump (`v14-10`…`v14-26`). Same rule held: scoped avulsos, never folded into the locked keypad delta.
The largest of these (`v14-27`) trimmed the **inline angle/λ pad**: the scientific-function row
(`sin cos tan ln log exp conj abs re √ ^` + `1/√2 e i`) was vestigial from the retired calc mode (v13) and
YAGNI for entering an angle — a real number, a rational multiple of π or turns `k/16`. The lean pad keeps
digits, π, `( )`, `+ − × /` (unary minus covers negative angles) and `=`. Same dogfooding-honesty thread
as L3/L5: the `CLR` key in that pad never *cleared* — it *cancelled* the entry (= the physical `Escape`),
so it was relabelled `ESC` (the quantum-mode command-block `CLR` stays a real clear). Label matches
behavior; the `key:CLR` action is unchanged (tests click by action, not label).

## L7 — Unify the layout instead of maintaining two (echoes v12-L6)
The first v14 desktop layout (full-width command + 2-column pages) regressed vs the PWA (wide buttons,
"huge gaps" on page 2). The operator preferred the PWA's packed grid. **Unifying to ONE layout** — the
same 4-col packed grid at all widths, capped + centered on desktop — fixed the desktop AND simplified
(removed the desktop-specific rules and the entire `.layer2` dual-selector hack). Echoes v12-L6
(single-column zones coupled by key count): the page-track makes each page a self-contained grid, so
alignment no longer depends on cross-zone key counts.

## Carry-forward (candidates, NOT started)
- **`CU(λ)` ergonomics / arbitrary-eigenstate kickback:** today the standard kickback works with
  `CP(λ)` + eigenstate `|1⟩`; a friendlier `CU(λ)` (1-param) or a kickback with an arbitrary eigenstate
  (e.g. `|+⟩` via a gate diagonal in the X-basis) was discussed and **deferred** (the operator chose not to
  seed it). Multi-qubit Pauli `⟨Z₀Z₁⟩` EV remains the v13 carry-forward (value the Bloch sphere can't show).
- Page-2 discoverability (dots-only, no peek) is accepted but monitor live; reconsider a "peek" only if a
  new user can't find page 2.
