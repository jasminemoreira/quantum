# v16 — Lessons (two-pane display: state | operation details)

Cycle 17. **Delta** (UI render-routing only) over v15. The display becomes a horizontal **two-pane** surface:
the **main** pane shows the state (clean) with the Bloch sphere inline; an operation's verbose readout
(`prob/measure/Schmidt/ρ/C/S(ρ)/⟨φ|ψ⟩/EV/…`) goes to a **detail** pane. Navigated by **tap** (+ dots), with
operations **auto-sliding** to the detail. Engine/`out()` untouched. Suite **390 green** (286 Node + 104
Playwright). Live `qcalc-v16-15`.

## L1 — Static panes in the HTML sidestep the carousel rebuild/replay (the v15 🔴 never recurred)
`#stateDisplay` and `#auxOutput`/`#blochInline` are **static elements in the HTML**, wrapped in two fixed
panes. `refresh()` updates their *content*; the carousel structure is never rebuilt. So the per-keystroke
re-render replay that bit v15 (the angle drawer) simply doesn't arise here. **Lesson:** when the animated
container can be authored as static markup (not rebuilt by the render loop), prefer that over a JS-built
element — it removes a whole class of replay bugs for free.

## L2 — Inline KaTeX does not wrap; a swipe on the same axis as content scroll always loses
Long symbolic states overflow because **inline KaTeX is one `nowrap` unit** (it spaces with kerns, not
breakable whitespace). `white-space:normal` did nothing; `displayMode:true` neither wrapped reliably nor
stayed left-aligned; the plain-text fallback "looked ugly." The real lesson was upstream: the **swipe**
to switch panes was on the **same (horizontal) axis** as the unavoidable content scroll of a long state —
they fundamentally compete. The fix was to stop fighting it: keep inline KaTeX (scrolls when long) and switch
the pane by **tap** (+ dots + auto-switch) instead of swipe. **Lesson:** never put a navigation swipe on the
same axis as content that must scroll; pick a non-conflicting trigger (tap).

## L3 — For novel interaction UX, P0/P1 decisions are hypotheses that human-AV rewrites
Three P1 decisions were **revised live**: Bloch → detail pane became **Bloch inline in main** (didactic: see
state + sphere together); "stay on main, affordance only" became **auto-switch** to the detail on an op; and
**swipe** became **tap**. Each was an operator call during hands-on use (S5), recorded as it happened.
**Lesson (echoes v15-L4):** for a new interaction model, the design phases set a reasonable starting point,
but only live use reveals the right feel — budget for in-cycle revisions and record each one.

## L4 — Percentage-height chains under flex collapse in mobile WebView; use absolute top/bottom:0
The "2nd pane blank" bug: `height:100%` on the strip/panes (children of a flex item) collapsed in the Android
PWA WebView even though it worked in desktop Chromium. The robust fix was an **absolutely-positioned strip**
(`top:0;bottom:0;left:0;width:200%`) — definite height from the positioned ancestor, panes stretch — plus
`touch-action:pan-y` + `setPointerCapture` (when the swipe still existed). **Lesson:** don't rely on `%`
height through a flex chain on mobile WebView; anchor with `position:absolute; top:0; bottom:0`.

## L5 — Opt-in detail needs the result to *come to you*: auto-switch beats a discreet affordance
The dots alone weren't discoverable (a user even reported "swipe but no second display" before realizing).
The discoverability win was **auto-switch** — an operation slides its result into view; the user taps/dots back
to the clean state. And the Bloch **stays inline** (it's part of "reading the state," not a separate analysis).
**Lesson:** "clean main + opt-in detail" is right, but the *primary* result should surface itself; manual
navigation (tap/dots) is the secondary path.

## L6 — A boundary surfaced: Bloch has no symbolic-concrete-qubit path (unlike prob/measure)
`0 Q Bloch` on `|0⟩⊗|ψ⟩` shows nothing: the Bloch refuses any `s.sym`, even when the selected qubit is
concrete and separable — whereas `prob`/`measure` DO have `symProb`/`symMeasure` for concrete qubits of a
symbolic state. Recorded as **v17 carry-forward** (`symBloch`): when the selected qubit is concrete/separable
in a `SymState`, extract its 1-qubit state and draw ⟨σ⟩.

## Carry-forward (v17, NOT started)
- **`symBloch`** — Bloch of a concrete, separable qubit inside a symbolic product state.
- **`CU(λ)`** ergonomics / arbitrary-eigenstate kickback; **multi-qubit `⟨Z₀Z₁⟩` EV** (long-standing, from
  v13/v14).
