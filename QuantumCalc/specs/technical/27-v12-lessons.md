# v12 — Lessons (keypad reorg + measure-no-popup + extensive PWA/mobile polish)

Cycle 13 · DELTA (UI-only) · 352 → 358 tests (261 Node + 97 Playwright). Engine untouched.
Published live throughout via the new SSH deploy (cache `qcalc-v12-15`).

## L1 — A "UI reorg" delta becomes a long human-AV polish loop (process)

What started as "keyboard reorg" expanded (operator-approved, S5) into ~20 incremental rounds: measure
popup, Bloch mobile (size→fonts→blur→label→outside-poles→gap), PWA standalone (title/buttons/step-history),
2nd-layer grid, I-removal, prompt shortening, turns indicator. The user validated EACH on the **live
installed PWA** and requested refinements. **Lesson:** mobile/PWA visual polish is intrinsically iterative
and human-AV-driven — it can't be fully pre-specified or auto-tested. Budget for many small deploy cycles,
and make the deploy frictionless (see L6/deploy).

## L2 — Canvas must be DPR-aware or it blurs on phones (stack)

The Bloch canvas (fixed 232² bitmap) blurred on the phone PWA. Two wrong tries: (a) CSS-downscale 232→104
shrank the fonts to ~5px; (b) native small bitmap (120²) blurred because a DPR-2/3 screen upscales it.
**Correct pattern:** `canvas.style.width = cssPx`, `canvas.width = cssPx × devicePixelRatio` (cap 3),
`ctx.setTransform(dpr,0,0,dpr,0,0)`, draw in **logical** coords. Crisp at any DPR; desktop dpr=1 → identical.
**Lesson:** every canvas needs bitmap = css × dpr to be crisp on mobile.

## L3 — Renaming a label moves its slug → audit ALL test files, not just *.spec.js (migration)

`renderKeypad` derives the `zone-<slug>` class from the block **label**, so renaming labels (dropping
"2nd · ", "entanglement / product"→"operations") rippled into every `.zone-*` CSS selector — the v10-L6
lesson recurred. Worse: the first consumer audit grepped only `*.spec.js` and **missed `v2.test.mjs`**
(a Node keymap test asserting `op:norm` in the primary), which then failed. **Lesson:** when a label/slug
changes, audit **`.mjs` AND `.spec.js`** + all CSS selectors for consumers.

## L4 — Some PWA/responsive behaviors are human-AV only (testability)

`@media (display-mode: standalone)` (the installed-PWA layout: hidden title, footer buttons, hidden Step
history) **cannot be emulated** by Playwright in this version (CDP `Emulation.setEmulatedMedia` with a
`display-mode` feature → `matches=false`; only a real `--app` launch flips it). **Lesson:** standalone +
exact-pixel + string-format tweaks are intrinsically manual-validated. Don't block the cycle on automating
them — verify the browser (non-standalone) path with the suite and let the operator validate standalone on
the device. Lightweight structural guards (CSS rule presence) are an option but low value.

## L5 — Math before didactics (correctness principle, cross-cycle)

Crystallized from the "show e^{iθ}|ψ⟩ instead of T|ψ⟩?" question: `T|ψ⟩ = e^{iθ}|ψ⟩` only if |ψ⟩ is an
eigenstate (never a pure phase for H/X/Y). The honest node `T|ψ⟩` stays until the user **declares** the
eigenvalue (the `=` path). **Never** auto-substitute an unsound but didactic display. Recorded as a
project-wide constraint (decision c331a472 + memory `math-before-didactics`). This gates v13: the symbolic
`⊗` must be algebraically correct → design + tests, not a mid-loop hack.

## L6 — Don't churn the full suite on every trivial tweak (process / safeguard)

Running the 358-test suite after each one-line CSS/string tweak tripped the S6 "loop detected" safeguard
(a false positive). **Lesson:** for test-neutral CSS/string/keymap tweaks, defer the full-suite run to the
cycle-close gate (advancing a phase resets the S6 counter and is the natural batch-verification point);
deploy the tweak (verified by static analysis + the operator's live check) and verify the suite at close.

## Deploy infrastructure change (this cycle)

The Windows `Z:` SSHFS mount dropped ~6× during the session (blocking deploys). Set up **SSH key auth**
(`~/.ssh/id_ed25519_qcalc` → `www-data@191.252.186.68`, alias `qcalc`) + **`deploy-ssh.sh`** (scp; the
server lacks rsync). WSL-native deploy, no Z: dependency. See memory `quantumcalc-deployment`.

## Carry-forward → v13 (next cycle)

**Symbolic memory + symbolic/mixed tensor product** (`M` and `⊗` over `|ψ⟩`, to build e.g. `TH|ψ⟩⊗|φ⟩`):
a real ENGINE feature on `SymState` (needs `SymState ⊗ SymState` and SymState↔concrete). Deferred from v12
(beyond keyboard reorg) to a focused v13 with Phase 0–4 design + **tensor-correctness tests** (per L5).
`SymState` has `_combine`/`terms`/`slots`/`layout` to build on. Other standing seeds unchanged.
