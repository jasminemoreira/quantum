# v13 — Lessons (symbolic memory + ⊗ · scientific calc retired)

Cycle 14 · DELTA · 358 → **369 tests** (275 Node + 94 Playwright). Engine ζ₁₆/gates untouched.
Live: `qcalc-v13-4`. FRENTE A = symbolic `M` + `⊗`; FRENTE B (revised) = retire the scientific calc.

## L1 — A fully-built feature can be REVERTED when live use reveals redundancy (process)
EV (`⟨O⟩`) was designed (P0–P3), implemented, tested and **deployed**, then **removed entirely** mid-P5
when the operator saw that a single-qubit Pauli `⟨ψ|O_q|ψ⟩` equals that qubit's Bloch-vector component —
which the `Bloch` key already shows (`⟨σx⟩,⟨σy⟩,⟨σz⟩`). **Lesson:** "implement-then-feel" surfaces
redundancy that paper design misses; honor it (no sunk-cost). The honest call came from *generation-mode*
questioning ("how does ⟨O⟩ overlap Bloch?") rather than validation theater. The genuinely-new value would
have been **multi-qubit Pauli strings** (`⟨Z₀Z₁⟩`, which Bloch can't show) — a candidate for a future cycle.

## L2 — Reaching into another module's encoded symbols: parse, don't assume the literal prefix (correctness)
The tensor disjointness guard (C1) must reject not just identical coefficient symbols but the **same
parameter with a different multiplier** (`e^{iθ}` ⊗ `e^{2iθ}` — both are θ). SymExpr encodes phase atoms as
`␁ph:coefN/coefD/hasPi/SYM` with a **`\x01` (SOH) sentinel prefix** (invisible in editors). A naïve
`name.startsWith('ph:')` silently failed; the fix parses the structure via regex and captures the `SYM`
field. **Lesson:** when an outside module inspects encoded names, parse by structure (capture the field),
never by an assumed literal prefix — and verify with a smoke test (the bug only showed via `console.log`
revealing `\x01ph:…`).

## L3 — Binary ops over a promotable type must dispatch on BOTH operands (architecture)
C2: the symbolic short-circuit fired on `if (s.sym)` = **current** state only, so a **saved-symbolic +
current-concrete** `⊗` fell into the concrete `Ops.tensor` → crash. Fix: route to the symbolic path when
`savedState.sym || current.sym`, promoting the concrete operand via `fromConcrete`. **Lesson:** an
operation consuming two operands of a promotable hierarchy (concrete→SymState) must dispatch on the **join**
of the operand types, not on one. Pulled M/⟨φ|ψ⟩/⊗ out of the `s.sym` gate into a type-aware block.

## L4 — Not every "calc" reference is the retired feature (migration, refines v12-L3)
Retiring the calc **mode** rippled into `ui.spec.js` (8 standalone-calc tests using `act('mode')`) but
**not** `v2.test.mjs` — its `calc:` references are the **surviving inline angle/λ evaluator**, not the
removed toggle. The grep over-counted (`calc:` matches both); reading the actual usage disambiguated
(`act('mode')` = the retired standalone mode; `calc:π` during `angleEntry` = the kept evaluator).
**Lesson:** when removing a feature whose tokens are shared with a surviving one, classify by *usage
pattern*, not by substring count.

## L5 — A two-part FRENTE can shed a part cleanly if the parts are decoupled (scope)
FRENTE B was "migrate EV + retire calc"; it shrank to just "retire calc". This stayed coherent because the
calc-retirement (remove mode toggle / standalone calc / over-the-state keys; keep the evaluator for inline
angle/λ) was **independent** of where EV lives. **Lesson:** decoupled sub-scopes let you drop one without
unravelling the other; entangled ones wouldn't.

## L6 — Side-by-side single-column zones must keep equal key counts (UI layout)
Adding `⟨O⟩` made the primary `operations` zone 6 keys; it's rendered as a forced 1-column stack beside the
`controlled` zone (5 keys, also 1-column) → misaligned ("layout quebrou"). Removing EV / moving Bloch
restored 5≡5. **Lesson:** two zones laid out as adjacent single columns are visually coupled by row count;
adding a key needs a paired removal or a re-layout (this also motivated the v14 sliding-keypad idea).

## Carry-forward → v14 (cycle 15)
**Sliding/paginated keypad for PWA** — replace the `2nd` modifier with a swipe carousel, `M` into the freed
command slot, no numeric on page 2 (operands typed on page 1, buffer persists). Seed:
`specs/technical/29-v14-seed-sliding-keypad.md`. Its own Phase 0–4; heavily human-AV (gesture feel, v12-L1).
Other standing seeds unchanged (π/16 ζ₃₂, indexed λ_k=f(k), trig simplification, localStorage persistence,
symbolic ⟨φ|ψ⟩, multi-qubit Pauli ⟨O⟩ strings).
