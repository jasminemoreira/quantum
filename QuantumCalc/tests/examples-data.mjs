// tests/examples-data.mjs — SINGLE SOURCE of the cookbook (Part II of manual.html), DOM-DRIVEN model.
// Each result declares the REAL button sequence (data-action) of the keypad. The Playwright test
// (examples.spec.js) replays the keys on the REAL interface and CAPTURES what appears on screen
// (#stateDisplay / #auxOutput / #statusLine) — the capture IS the documented result. So the cookbook
// shows exactly what the user sees (key→screen fidelity; it picks up the preparation basis, factored
// form, fmt, operation prefixes — things the engine path did not reveal).
//
// example = { id, tier, title, why, results: [ { label, keys, read, steps } ] }
//   keys  : readable string (shown as a chip in the doc)
//   read  : 'state' (#stateDisplay, KaTeX) | 'text' (#auxOutput, mono) | 'status' (#statusLine, calc)
//   steps : data-action[] clicked in order; 'page:1' = go to page 2 (carousel); 'eval' = '='; 'cmd:undo/redo' etc.
// Angle: after a parametric gate the keypad becomes calc → calc:π, calc:/, calc:8, eval (= π/8).
// Page-2 auto-return: applying a GATE slides back to page 1; after an OP, tap a page dot / arrow to return.

// v23 (Part III E6–E10) — step builders. The cards favour the FEWEST keys: they lean on the page-2
// PRESETS (Bell, QFT†) and the named multi-qubit gates instead of long hand sequences, so a human can
// actually reproduce them. The displayed key sequence is DERIVED from steps by examples-render.stepsToKeys.
// Page-2 keys (presets, SWAP) bracket with page:1 … page:0, mirroring E4/E5 (Playwright needs the page
// switch to click the carousel button; the FSM/engine ignore page tokens).
const _H = q => [`key:${q}`,'key:Q','gate:H'];
const _X = q => [`key:${q}`,'key:Q','gate:X'];
const _Z = q => [`key:${q}`,'key:Q','gate:Z'];
const _CN = (c,t) => [`key:${c}`,'key:CTRL',`key:${t}`,'key:Q','gate:CNOT'];
const _CZ = (c,t) => [`key:${c}`,'key:CTRL',`key:${t}`,'key:Q','gate:CZ'];
const _CP = (c,t,ang) => [`key:${c}`,'key:CTRL',`key:${t}`,'key:Q','gate:CP',...ang,'eval'];
const _SET = n => [`key:${n}`,'key:Q','key:SET'];
const _Bell = (a,b) => [`key:${a}`,'key:Q',`key:${b}`,'key:Q','page:1','preset:Bell','page:0'];
const _QFTinv = (a,b) => [`key:${a}`,'key:Q',`key:${b}`,'key:Q','page:1','preset:QFTinv','page:0'];
const _f = (...a) => a.flat();
// E8 — Shor N=15, a=11 (order r=2). The compiled controlled-(×11 mod 15) collapses to just TWO CNOTs:
// it only ever maps |0001⟩↔|1011⟩ (work register started in |1⟩), which differ in two bits. Since
// 11²≡1, U² controlled by the high counting qubit is the identity (omitted). 2 counting qubits + QFT†.
const _e8pre = _f(_SET(6), _X(5), _H(0), _H(1), _CN(1,2), _CN(1,4));   // H·H + controlled-×11 (ctrl = q1)
// E10 — teleportation via the deferred-measurement principle (controlled corrections → deterministic).
const _e10pre = _f(['ket:ψ','ket:0','ket:0','key:SET'], _Bell(1,2), _CN(0,1), _H(0));

export const examples = [
  // ===================== TIER 1 — BASIC =====================
  {
    id:'B1', tier:'basic', title:'Prepare the initial state (SET + the |T⟩ input key)',
    why:'The SET key materializes the initial state. Give a number (how many qubits, all in |0⟩), a bitstring (a basis state) or a ket-string (product of cardinals). In a ket-string the screen keeps each qubit in the basis it was prepared in — that is why |0⟩|+⟩|1⟩ shows factored, not expanded. The |T⟩ input key (page 2) is a one-tap macro H·T that prepares a fresh 1-qubit T-state, exact in ℤ[ζ₁₆] (no ≈).',
    results:[
      { label:'count: 3 → |000⟩', keys:'3 Q SET', read:'state', steps:['key:3','key:Q','key:SET'] },
      { label:'bitstring 010', keys:'0 1 0 SET', read:'state', steps:['key:0','key:1','key:0','key:SET'] },
      { label:'ket |0⟩|+⟩|1⟩', keys:'|0⟩ |+⟩ |1⟩ SET', read:'state', steps:['ket:0','ket:+','ket:1','key:SET'] },
      { label:'|T⟩ key (page 2 input) = H·T|0⟩', keys:'p2 |T⟩', read:'state', steps:['page:1','input:T'] },
    ]
  },
  {
    id:'B2', tier:'basic', title:'Pauli gates (X, Y) and Hadamard (H)',
    why:'X is the quantum NOT (|0⟩↔|1⟩); Y combines a flip with a phase i; H creates superposition (|0⟩→|+⟩), opening quantum parallelism. ALL applies the gate to every qubit at once.',
    results:[
      { label:'X|0⟩', keys:'1 Q SET · 0 Q X', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X'] },
      { label:'H|0⟩ = |+⟩', keys:'1 Q SET · 0 Q H', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:H'] },
      { label:'Y|0⟩', keys:'1 Q SET · 0 Q Y', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:Y'] },
      { label:'ALL H on |00⟩', keys:'2 Q SET · ALL H', read:'state', steps:['key:2','key:Q','key:SET','key:ALL','gate:H'] },
    ]
  },
  {
    id:'B3', tier:'basic', title:'Page-2 gates: phases (S, T, Z, inverses) and roots (√X, √Y)',
    why:'Diagonals that touch only |1⟩, multiplying it by e^{iφ}: T=e^{iπ/4}, S=e^{iπ/2}=i, Z=e^{iπ}=−1. The inverses T†/S† live in page 2. Chaining shows T·T=S. The square-root gates √X, √Y (also page 2) are exact in ℤ[ζ₁₆]: √X·√X = X, √Y·√Y = Y — handy half-rotations.',
    results:[
      { label:'T|1⟩', keys:'1 Q SET · 0 Q X · T', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','gate:T'] },
      { label:'S|1⟩', keys:'… · S', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','gate:S'] },
      { label:'Z|1⟩', keys:'… · Z', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','gate:Z'] },
      { label:'T†|1⟩', keys:'… · p2 T†', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','page:1','gate:Tdg'] },
      { label:'S†|1⟩', keys:'… · p2 S†', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','page:1','gate:Sdg'] },
      { label:'T·T|1⟩ = S|1⟩', keys:'… · T · T', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','gate:T','gate:T'] },
      { label:'√X|0⟩ = (1+i)/2|0⟩+(1−i)/2|1⟩', keys:'1 Q SET · p2 √X', read:'state', steps:['key:1','key:Q','key:SET','page:1','gate:SX'] },
      { label:'√X·√X|0⟩ = X|0⟩ = |1⟩ (exact)', keys:'1 Q SET · p2 √X · √X', read:'state', steps:['key:1','key:Q','key:SET','page:1','gate:SX','gate:SX'] },
    ]
  },
  {
    id:'B4', tier:'basic', title:'Three views: format (fmt) and basis',
    why:'The same amplitude reads three ways via fmt (exp / a+bi / polar) and the same superposition changes basis via basis. None of this alters the state — only how you see it. We use T|+⟩ (phase e^{iπ/4}) so the difference shows up.',
    results:[
      { label:'T|+⟩ — exp', keys:'1 Q SET · 0 Q H · T', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:H','gate:T'] },
      { label:'T|+⟩ — rect (fmt)', keys:'… · fmt', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:H','gate:T','fmtcycle'] },
      { label:'T|+⟩ — polar (fmt·fmt)', keys:'… · fmt · fmt', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:H','gate:T','fmtcycle','fmtcycle'] },
      { label:'|0⟩ in the {|+⟩,|−⟩} basis', keys:'1 Q SET · basis', read:'state', steps:['key:1','key:Q','key:SET','chbase'] },
    ]
  },
  {
    id:'B6', tier:'basic', title:'History: undo (↶) and redo (↷)',
    why:'Each gate pushes a step. ↶ goes back to the previous state and ↷ moves forward again — fixes a wrong click without redoing the whole circuit.',
    results:[
      { label:'initial |0⟩', keys:'1 Q SET', read:'state', steps:['key:1','key:Q','key:SET'] },
      { label:'after 0 Q X', keys:'0 Q X', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X'] },
      { label:'after ↶ undo', keys:'↶', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','cmd:undo'] },
      { label:'after ↷ redo', keys:'↷', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','cmd:undo','cmd:redo'] },
    ]
  },

  // ===================== TIER 2 — INTERMEDIATE =====================
  {
    id:'I1', tier:'intermediate', title:'The four Bell states',
    why:'H on the control + CNOT is the canonical entanglement generator → |Φ+⟩. Z on the control flips the sign (|Φ−⟩); X on the target flips the parity (|Ψ±⟩). The four form an orthonormal basis of 2 qubits.',
    results:[
      { label:'|Φ+⟩', keys:'2 Q SET · 0 Q H · 0 CTRL 1 Q CNOT', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT'] },
      { label:'|Φ−⟩ (+Z on q0)', keys:'… · 0 Q Z', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:Q','gate:Z'] },
      { label:'|Ψ+⟩ (+X on q1)', keys:'… · 1 Q X', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:1','key:Q','gate:X'] },
      { label:'|Ψ−⟩ (+X q1 +Z q0)', keys:'… · 1 Q X · 0 Q Z', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:1','key:Q','gate:X','key:0','key:Q','gate:Z'] },
    ]
  },
  {
    id:'I2', tier:'intermediate', title:'GHZ state of 3 qubits',
    why:'Extending the Bell recipe with a second CNOT, the entanglement spreads to all three qubits: (|000⟩+|111⟩)/√2. Measuring one qubit determines the other two.',
    results:[
      { label:'GHZ₃', keys:'3 Q SET · 0 Q H · 0 CTRL 1 Q CNOT · 0 CTRL 2 Q CNOT', read:'state', steps:['key:3','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:CTRL','key:2','key:Q','gate:CNOT'] },
    ]
  },
  {
    id:'I3', tier:'intermediate', title:'SWAP and Toffoli (CCX) — page 2',
    why:'SWAP (2 targets, no control) exchanges two qubits. The Toffoli CCX (2 controls, 1 target) flips the target only when both controls are 1 — the reversible AND. Both live in page 2.',
    results:[
      { label:'SWAP |01⟩ → |10⟩', keys:'2 Q SET · 1 Q X · 0 Q 1 Q p2 SWAP', read:'state', steps:['key:2','key:Q','key:SET','key:1','key:Q','gate:X','key:0','key:Q','key:1','key:Q','page:1','gate:SWAP'] },
      { label:'CCX |110⟩ → |111⟩', keys:'3 Q SET · 0 Q X · 1 Q X · 0 CTRL 1 CTRL 2 Q p2 CCX', read:'state', steps:['key:3','key:Q','key:SET','key:0','key:Q','gate:X','key:1','key:Q','gate:X','key:0','key:CTRL','key:1','key:CTRL','key:2','key:Q','page:1','gate:CCX'] },
      { label:'CCX |100⟩ → |100⟩ (only 1 control)', keys:'3 Q SET · 0 Q X · 0 CTRL 1 CTRL 2 Q p2 CCX', read:'state', steps:['key:3','key:Q','key:SET','key:0','key:Q','gate:X','key:0','key:CTRL','key:1','key:CTRL','key:2','key:Q','page:1','gate:CCX'] },
    ]
  },
  {
    id:'I4', tier:'intermediate', title:'Probabilities and the Bloch vector',
    why:'|+i⟩ has equal-magnitude amplitudes (P=½ each) and points to +y on the Bloch sphere (relative phase i). |r|=1 confirms a pure state.',
    results:[
      { label:'state |+i⟩', keys:'1 Q SET · 0 Q H · 0 Q S', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:Q','gate:S'] },
      { label:'prob (|amp|²)', keys:'… · prob', read:'text', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:Q','gate:S','op:prob'] },
      { label:'Bloch — readout (Q0)', keys:'… · 0 Q · Bloch', read:'bloch', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:Q','gate:S','key:0','key:Q','op:bloch'] },
    ]
  },
  {
    id:'I5', tier:'intermediate', title:'Measurement: branches and collapse',
    why:'Measurement first enumerates the branches with EXACT probability (here |00⟩ and |11⟩ with ½), then draws one (collapse). |01⟩ and |10⟩ have probability 0: the entanglement correlates the qubits.',
    results:[
      { label:'Bell — measure (branches)', keys:'2 Q SET · 0 Q H · 0 CTRL 1 Q CNOT · measure', read:'text', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','op:measure'] },
    ]
  },
  {
    id:'I6', tier:'intermediate', title:'Inner product ⟨φ|ψ⟩',
    why:'The inner product measures the overlap: 0 for orthogonal states (⟨0|1⟩). Save φ with M (memory, on the numpad), prepare ψ and ask for ⟨φ|ψ⟩ (operations). Here φ=|0⟩, ψ=|1⟩.',
    results:[
      { label:'⟨0|1⟩ (orthogonal)', keys:'1 Q SET · M · 0 Q X · ⟨φ|ψ⟩', read:'text', steps:['key:1','key:Q','key:SET','op:saveBra','key:0','key:Q','gate:X','op:inner'] },
    ]
  },
  {
    id:'I7', tier:'intermediate', title:'Change of basis and re-expression',
    why:'Changing the basis rewrites the same state: |0⟩ becomes (|+⟩+|−⟩)/√2, and the Bell state stays diagonal in {+,−}. It is a way to see why certain gates "simplify" in a given basis.',
    results:[
      { label:'|0⟩ in {|+⟩,|−⟩}', keys:'1 Q SET · basis', read:'state', steps:['key:1','key:Q','key:SET','chbase'] },
      { label:'|Φ+⟩ in {|+⟩,|−⟩}', keys:'Bell · basis', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','chbase'] },
      { label:'|+⟩ in {|+i⟩,|−i⟩}', keys:'1 Q SET · 0 Q H · basis · basis', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:H','chbase','chbase'] },
    ]
  },

  // ===================== TIER 3 — ADVANCED =====================
  {
    id:'A1', tier:'advanced', title:'Clifford+T and P(π/8)=√T — nested surd',
    why:'T=e^{iπ/4} is exact. Its root P(π/8)=√T (page 2) is exact in the ζ₁₆ core; in fmt=rect it reveals the nested surd √(2±√2)/2. Applying √T twice reconstructs T.',
    results:[
      { label:'T|1⟩ (exact)', keys:'1 Q SET · 0 Q X · T', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','gate:T'] },
      { label:'P(π/8)|1⟩ in rect (surd)', keys:'… · p2 P · π/8 = · fmt', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','page:1','gate:P','calc:π','calc:/','calc:8','eval','fmtcycle'] },
      { label:'P(π/8)·P(π/8)|1⟩ = T|1⟩', keys:'… · p2 P · π/8 = · p2 P · π/8 =', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','page:1','gate:P','calc:π','calc:/','calc:8','eval','page:1','gate:P','calc:π','calc:/','calc:8','eval'] },
    ]
  },
  {
    id:'A2', tier:'advanced', title:'Phase kickback and CP vs CRz',
    why:'When the target is an eigenstate (|1⟩), the controlled-gate phase returns to the control (kickback). CP(λ) puts e^{iλ} only on |11⟩; CRz(θ) distributes ∓θ/2 — which is why the eigenstate must be |1⟩.',
    results:[
      { label:'kickback: e^{iπ/4} on the control', keys:'2 Q SET · 1 Q X · 0 Q H · 0 CTRL 1 Q CP · π/4 =', read:'state', steps:['key:2','key:Q','key:SET','key:1','key:Q','gate:X','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CP','calc:π','calc:/','calc:4','eval'] },
      { label:'CP(π/2)|11⟩', keys:'2 Q SET · 0 Q X · 1 Q X · 0 CTRL 1 Q CP · π/2 =', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:X','key:1','key:Q','gate:X','key:0','key:CTRL','key:1','key:Q','gate:CP','calc:π','calc:/','calc:2','eval'] },
      { label:'CRz(π/2)|11⟩', keys:'2 Q SET · 0 Q X · 1 Q X · 0 CTRL 1 Q CRz · π/2 =', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:X','key:1','key:Q','gate:X','key:0','key:CTRL','key:1','key:Q','gate:CRz','calc:π','calc:/','calc:2','eval'] },
    ]
  },
  {
    id:'E1', part:'III', title:'Deutsch algorithm',
    motivation:'Given f:{0,1}→{0,1} promised constant or balanced, a classical test may need 2 evaluations of f. Deutsch decides with a SINGLE query by evaluating f on a superposition. The ancilla q1, prepared in |−⟩, turns the oracle into a phase kickback onto the input q0. It is the n=1 case of Deutsch–Jozsa.',
    results:[
      { label:'f constant (no oracle) → q0 = |0⟩', keys:'2 Q SET · 1 Q X · 0 Q H · 1 Q H · (no oracle) · 0 Q H', read:'state', steps:['key:2','key:Q','key:SET','key:1','key:Q','gate:X','key:0','key:Q','gate:H','key:1','key:Q','gate:H','key:0','key:Q','gate:H'] },
      { label:'f balanced (f=x) → q0 = |1⟩', keys:'2 Q SET · 1 Q X · 0 Q H · 1 Q H · 0 CTRL 1 Q CNOT · 0 Q H', read:'state', steps:['key:2','key:Q','key:SET','key:1','key:Q','gate:X','key:0','key:Q','gate:H','key:1','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:Q','gate:H'] },
    ],
    result:'Measure q0: |0⟩ ⇒ f is constant, |1⟩ ⇒ f is balanced — decided in ONE query instead of two. The ancilla stays in |−⟩ throughout (it only lends its phase).'
  },
  {
    id:'E2', part:'III', title:'Deutsch–Jozsa (n = 3)',
    motivation:'The n-bit generalization: f:{0,1}ⁿ→{0,1} is promised constant or balanced. Classically the worst case needs 2ⁿ⁻¹+1 queries; Deutsch–Jozsa decides with ONE. Here n=3 (inputs q0–q2, ancilla q3 in |−⟩). After the final H on every input, read the input register: |000⟩ ⇒ constant; any other string ⇒ balanced.',
    results:[
      { label:'constant f=0 (no oracle) → input |000⟩', keys:'4 Q SET · 3 Q X · ALL H · (no oracle) · 0 Q H · 1 Q H · 2 Q H', read:'state', steps:['key:4','key:Q','key:SET','key:3','key:Q','gate:X','key:ALL','gate:H','key:0','key:Q','gate:H','key:1','key:Q','gate:H','key:2','key:Q','gate:H'] },
      { label:'balanced f=x₀⊕x₁⊕x₂ → input |111⟩', keys:'4 Q SET · 3 Q X · ALL H · 0 CTRL 3 Q CNOT · 1 CTRL 3 Q CNOT · 2 CTRL 3 Q CNOT · 0 Q H · 1 Q H · 2 Q H', read:'state', steps:['key:4','key:Q','key:SET','key:3','key:Q','gate:X','key:ALL','gate:H','key:0','key:CTRL','key:3','key:Q','gate:CNOT','key:1','key:CTRL','key:3','key:Q','gate:CNOT','key:2','key:CTRL','key:3','key:Q','gate:CNOT','key:0','key:Q','gate:H','key:1','key:Q','gate:H','key:2','key:Q','gate:H'] },
    ],
    result:'A nonzero input register (here |111⟩) certifies balanced; |000⟩ certifies constant — one query versus up to 2ⁿ⁻¹+1 = 5 classical queries.'
  },
  {
    id:'E4', part:'III', title:'Grover search (n = 3, target |111⟩)',
    motivation:'Grover finds a marked item among N=2ⁿ in about (π/4)√N queries, versus N/2 on average classically. Here n=3 (N=8): the oracle flips the sign of |111⟩ — a CCZ, built as H·CCX·H on q2 — and the diffuser (the page-2 Grover preset = H·X·CCZ·X·H) reflects about the mean. The optimal number of iterations is ⌊(π/4)√8⌋ = 2.',
    results:[
      { label:'after 1 iteration → P(|111⟩)=25/32', keys:'3 Q SET · ALL H · 2 Q H · 0 CTRL 1 CTRL 2 Q CCX · 2 Q H · ALL p2 Grover', read:'state', steps:['key:3','key:Q','key:SET','key:ALL','gate:H','key:2','key:Q','gate:H','key:0','key:CTRL','key:1','key:CTRL','key:2','key:Q','page:1','gate:CCX','page:0','key:2','key:Q','gate:H','key:ALL','page:1','preset:Grover'] },
      { label:'after 2 iterations → P(|111⟩)=121/128', keys:'3 Q SET · ALL H · 2 Q H · 0 CTRL 1 CTRL 2 Q CCX · 2 Q H · ALL p2 Grover · 2 Q H · 0 CTRL 1 CTRL 2 Q CCX · 2 Q H · ALL p2 Grover', read:'state', steps:['key:3','key:Q','key:SET','key:ALL','gate:H','key:2','key:Q','gate:H','key:0','key:CTRL','key:1','key:CTRL','key:2','key:Q','page:1','gate:CCX','page:0','key:2','key:Q','gate:H','key:ALL','page:1','preset:Grover','page:0','key:2','key:Q','gate:H','key:0','key:CTRL','key:1','key:CTRL','key:2','key:Q','page:1','gate:CCX','page:0','key:2','key:Q','gate:H','key:ALL','page:1','preset:Grover'] },
    ],
    result:'Two queries amplify |111⟩ from probability 1/8 to 121/128 ≈ 95%; one more measurement returns the marked item. A classical search needs up to 7 lookups.'
  },
  {
    id:'A3', tier:'advanced', title:'Quantum Fourier Transform (3 qubits)',
    why:'The QFT is the heart of Shor and QPE. Two ways to run it, side by side: BY HAND — H on each qubit, CP(π/2ᵏ) controlled by the following ones, and the reversal SWAP at the end (this IS the QFT, so you see the structure); or in ONE KEY — page 2 → ALL QFT (the same exact gates, one atomic step). Both give the identical state (cross-checked). On |000⟩ → uniform superposition; on |001⟩ → the phases e^{2πik/8} in exact closed form (no approximation, ≤4 qubits). QFT† is the inverse: QFT · QFT† returns the register.',
    results:[
      { label:'QFT₃|000⟩ — by hand (H · CP · SWAP)', keys:'3 Q SET · 0 Q H · 1 CTRL 0 Q CP π/2 = · 2 CTRL 0 Q CP π/4 = · 1 Q H · 2 CTRL 1 Q CP π/2 = · 2 Q H · 0 Q 2 Q p2 SWAP', read:'state', steps:['key:3','key:Q','key:SET','key:0','key:Q','gate:H','key:1','key:CTRL','key:0','key:Q','gate:CP','calc:π','calc:/','calc:2','eval','key:2','key:CTRL','key:0','key:Q','gate:CP','calc:π','calc:/','calc:4','eval','key:1','key:Q','gate:H','key:2','key:CTRL','key:1','key:Q','gate:CP','calc:π','calc:/','calc:2','eval','key:2','key:Q','gate:H','key:0','key:Q','key:2','key:Q','page:1','gate:SWAP'] },
      { label:'QFT₃|000⟩ — one key: ALL QFT (same state)', keys:'3 Q SET · ALL p2 QFT', read:'state', steps:['key:3','key:Q','key:SET','key:ALL','page:1','preset:QFT'] },
      { label:'QFT₃|001⟩ — by hand (phases e^{2πik/8})', keys:'3 Q SET · 2 Q X · 0 Q H · 1 CTRL 0 Q CP π/2 = · 2 CTRL 0 Q CP π/4 = · 1 Q H · 2 CTRL 1 Q CP π/2 = · 2 Q H · 0 Q 2 Q p2 SWAP', read:'state', steps:['key:3','key:Q','key:SET','key:2','key:Q','gate:X','key:0','key:Q','gate:H','key:1','key:CTRL','key:0','key:Q','gate:CP','calc:π','calc:/','calc:2','eval','key:2','key:CTRL','key:0','key:Q','gate:CP','calc:π','calc:/','calc:4','eval','key:1','key:Q','gate:H','key:2','key:CTRL','key:1','key:Q','gate:CP','calc:π','calc:/','calc:2','eval','key:2','key:Q','gate:H','key:0','key:Q','key:2','key:Q','page:1','gate:SWAP'] },
      { label:'QFT₃|001⟩ — one key: 2 Q X · ALL QFT (same state)', keys:'3 Q SET · 2 Q X · ALL p2 QFT', read:'state', steps:['key:3','key:Q','key:SET','key:2','key:Q','gate:X','key:ALL','page:1','preset:QFT'] },
      { label:'QFT† is the inverse: QFT · QFT† → |001⟩ back', keys:'3 Q SET · 2 Q X · ALL p2 QFT · ALL p2 QFT†', read:'state', steps:['key:3','key:Q','key:SET','key:2','key:Q','gate:X','key:ALL','page:1','preset:QFT','key:ALL','page:1','preset:QFTinv'] },
    ]
  },
  {
    id:'E5', part:'III', title:'Phase estimation (QPE)',
    motivation:'QPE reads the eigenphase φ of U|u⟩=e^{2πiφ}|u⟩ into a counting register — the engine inside Shor and many quantum algorithms. Here U=T and |u⟩=|1⟩, so φ=1/8=0.001₂. Three counting qubits (q0–q2) + eigenstate |1⟩ (q3): the controlled-T^{2ʲ} (=CP π/4, π/2, π) write the phase, then the inverse QFT — one key, the QFT† preset on q0–q2 — reads it back. (Card A3 shows the QFT spelled out by hand, gate by gate.)',
    results:[
      { label:'count |001⟩ ⊗ |1⟩', read:'state', steps:[
        'key:4','key:Q','key:SET','key:3','key:Q','gate:X',
        'key:0','key:Q','gate:H','key:1','key:Q','gate:H','key:2','key:Q','gate:H',
        'key:2','key:CTRL','key:3','key:Q','gate:CP','calc:π','calc:/','calc:4','eval',
        'key:1','key:CTRL','key:3','key:Q','gate:CP','calc:π','calc:/','calc:2','eval',
        'key:0','key:CTRL','key:3','key:Q','gate:CP','calc:π','eval',
        'key:0','key:Q','key:2','key:Q','page:1','preset:QFTinv','page:0'
      ] },
    ],
    result:'The counting register collapses to |001⟩ = 0.001₂ = 1/8 — the exact phase, read in a single shot (no statistics needed because 1/8 fits in 3 bits). The inverse QFT is the QFT† preset (page 2), not 12 gates by hand.'
  },
  {
    id:'A4', tier:'advanced', title:'Quantum teleportation',
    why:'The state |ψ⟩ of q0 is transferred to q2 via a Bell pair + 2 classical bits. The pre-measurement state expands |ψ⟩=ψ₀|0⟩+ψ₁|1⟩ into 4 branches; the measured pair (q0,q1) indicates the Pauli correction on q2: 00→I · 01→X · 10→Z · 11→ZX. After the (random) measurement, apply that correction on q2 — e.g. q1=1 → 2 Q X, then q0=1 → 2 Q Z — and Q2 recovers |ψ⟩ (see §10 for the full walk-through). No cloning (no-cloning preserved).',
    results:[
      { label:'|ψ⟩|0⟩|0⟩ SET', keys:'|ψ⟩ |0⟩ |0⟩ SET', read:'state', steps:['ket:ψ','ket:0','ket:0','key:SET'] },
      { label:'pre-measurement (4 branches)', keys:'1 Q H · 1 CTRL 2 Q CNOT · 0 CTRL 1 Q CNOT · 0 Q H', read:'state', steps:['ket:ψ','ket:0','ket:0','key:SET','key:1','key:Q','gate:H','key:1','key:CTRL','key:2','key:Q','gate:CNOT','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:Q','gate:H'] },
      { label:'measure q0, q1 → collapse (one sampled outcome)', keys:'… · 0 Q measure · 1 Q measure', read:'text', steps:['ket:ψ','ket:0','ket:0','key:SET','key:1','key:Q','gate:H','key:1','key:CTRL','key:2','key:Q','gate:CNOT','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:Q','gate:H','key:0','key:Q','op:measure','key:1','key:Q','op:measure'] },
    ]
  },
  {
    id:'A5', tier:'advanced', title:'Superdense coding',
    why:'The dual of teleportation: Alice sends 2 classical bits by manipulating 1 qubit of a Bell pair (I/X/Z/ZX → 00/01/10/11); Bob undoes the Bell (CNOT+H) and reads the 2 bits. Here the message is "11".',
    results:[
      { label:"decode '00' → |00⟩", keys:'Bell · (I) · 0 CTRL 1 Q CNOT · 0 Q H', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:Q','gate:H'] },
      { label:"decode '11' → |11⟩", keys:'Bell · 0 Q Z · 0 Q X · 0 CTRL 1 Q CNOT · 0 Q H', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:Q','gate:Z','key:0','key:Q','gate:X','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:Q','gate:H'] },
    ]
  },
  {
    id:'A6', tier:'advanced', title:'Angle convention: rad ↔ turns',
    why:'The engine is the same; the rad/trn toggle only changes the label. In turns, T|1⟩ shows as e^{2πi·1/8} (not e^{iπ/4}) — recalling that 1/8 of a turn = π/4 (≠ π/8). P(π/8) then shows 1/16 of a turn.',
    results:[
      { label:'T|1⟩ in rad', keys:'1 Q SET · 0 Q X · T', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','gate:T'] },
      { label:'T|1⟩ in turns (rad/trn)', keys:'… · rad/trn', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','gate:T','angcycle'] },
      { label:'P(π/8)|1⟩ in turns (=1/16)', keys:'1 Q SET · 0 Q X · p2 P · π/8 = · rad/trn', read:'state', steps:['key:1','key:Q','key:SET','key:0','key:Q','gate:X','page:1','gate:P','calc:π','calc:/','calc:8','eval','angcycle'] },
    ]
  },
  {
    id:'A7', tier:'advanced', title:'Symbolic algebra: phase kickback with abstract |ψ⟩',
    why:'With an abstract ket |ψ⟩, a controlled gate (CP) with the control on |+⟩ returns the phase to the control. The abstract target opens the eigenvalue entry: = generates the symbolic phase e^{iθ}. This is the mechanism of QPE and the Hadamard test.',
    results:[
      { label:'|0⟩|ψ⟩ SET', keys:'|0⟩ |ψ⟩ SET', read:'state', steps:['ket:0','ket:ψ','key:SET'] },
      { label:'after 0 Q H', keys:'0 Q H', read:'state', steps:['ket:0','ket:ψ','key:SET','key:0','key:Q','gate:H'] },
      { label:'after 0 CTRL 1 Q CP, = (kickback)', keys:'0 CTRL 1 Q CP · =', read:'state', steps:['ket:0','ket:ψ','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CP','eval'] },
    ]
  },
  {
    id:'A8', tier:'advanced', title:'Entanglement diagnostics (page 2)',
    why:'Three measures confirm the same thing about Bell: concurrence C=1, Schmidt rank 2 and von Neumann entropy S=1 bit. The product state |00⟩ gives C=0 and S=0 — separable. All in page 2.',
    results:[
      { label:'Bell: concurrence C', keys:'Bell · p2 C', read:'text', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','page:1','op:concurrence'] },
      { label:'Bell: Schmidt', keys:'Bell · p2 Schmidt', read:'text', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','page:1','op:schmidt'] },
      { label:'Bell: von Neumann entropy', keys:'Bell · 0 Q · p2 S(ρ)', read:'text', steps:['key:2','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:CTRL','key:1','key:Q','gate:CNOT','key:0','key:Q','page:1','op:vonneumann'] },
      { label:'|00⟩: concurrence (separable)', keys:'2 Q SET · p2 C', read:'text', steps:['key:2','key:Q','key:SET','page:1','op:concurrence'] },
    ]
  },
  {
    id:'E3', part:'III', title:'Bernstein–Vazirani (n = 3)',
    motivation:'A hidden string s∈{0,1}ⁿ defines f(x)=s·x (mod 2). Classically you need n queries — one per bit. Bernstein–Vazirani recovers ALL of s with ONE query: with the input in |+⟩⊗ⁿ and the ancilla in |−⟩, the oracle (a CNOT from each input bit where sᵢ=1 to the ancilla) prints s onto the phases, and a final H on every input reads it out directly. Here s=101 (q0,q2 set; big-endian q0=MSB).',
    results:[
      { label:'final state = |s⟩|1⟩, s=101', keys:'4 Q SET · 3 Q X · ALL H · 0 CTRL 3 Q CNOT · 2 CTRL 3 Q CNOT · 0 Q H · 1 Q H · 2 Q H · 3 Q H', read:'state', steps:[
        'key:4','key:Q','key:SET','key:3','key:Q','gate:X','key:ALL','gate:H',
        'key:0','key:CTRL','key:3','key:Q','gate:CNOT','key:2','key:CTRL','key:3','key:Q','gate:CNOT',
        'key:0','key:Q','gate:H','key:1','key:Q','gate:H','key:2','key:Q','gate:H','key:3','key:Q','gate:H'
      ] },
    ],
    result:'The input register reads |101⟩ = s directly — the whole secret in ONE query instead of n=3. (The final H on the ancilla returns it to |1⟩ for a clean display.)'
  },
  {
    id:'A9', tier:'advanced', title:'Presets / macros (page 2): automated shortcuts',
    why:'The page 2 brings six ready-made blocks that assemble a known circuit in one key, from the SAME exact gates you would type by hand (cf. the manual forms in I1 Bell, I2 GHZ, E4 Grover, A3 QFT). Each preset is ONE atomic step in history — one ↶ undoes the whole block. Target: ALL (whole register) or "i Q j Q" (contiguous range). The Bell variant comes from the preparation of the 2 qubits. QFT/QFT† are exact for ≤4 qubits; W is always ≈approx (Ry with a non-notable angle).',
    results:[
      { label:'ALL QFT on |000⟩ (uniform)', keys:'3 Q SET · ALL p2 QFT', read:'state', steps:['key:3','key:Q','key:SET','key:ALL','page:1','preset:QFT'] },
      { label:'QFT†∘QFT = identity', keys:'3 Q SET · 0 1 0 (bits) · ALL p2 QFT · ALL p2 QFT†', read:'state', steps:['key:0','key:1','key:0','key:SET','key:ALL','page:1','preset:QFT','key:ALL','page:1','preset:QFTinv'] },
      { label:'Bell Φ⁺ from |00⟩', keys:'2 Q SET · 0 Q 1 Q p2 Bell', read:'state', steps:['key:2','key:Q','key:SET','key:0','key:Q','key:1','key:Q','page:1','preset:Bell'] },
      { label:'Bell Ψ⁺ from |01⟩ (variant via preparation)', keys:'2 Q SET · 1 Q X · 0 Q 1 Q p2 Bell', read:'state', steps:['key:2','key:Q','key:SET','key:1','key:Q','gate:X','key:0','key:Q','key:1','key:Q','page:1','preset:Bell'] },
      { label:'ALL GHZ (3 qubits)', keys:'3 Q SET · ALL p2 GHZ', read:'state', steps:['key:3','key:Q','key:SET','key:ALL','page:1','preset:GHZ'] },
      { label:'ALL Grover (diffuser) on |000⟩', keys:'3 Q SET · ALL p2 Grover', read:'state', steps:['key:3','key:Q','key:SET','key:ALL','page:1','preset:Grover'] },
      { label:'ALL W (3 qubits, ≈approx)', keys:'3 Q SET · ALL p2 W', read:'state', steps:['key:3','key:Q','key:SET','key:ALL','page:1','preset:W'] },
    ]
  },
  {
    id:'E6', part:'III', title:'Simon’s algorithm (n = 2, hidden string s = 11)',
    motivation:'Simon’s problem: a function f is promised 2-to-1 with a hidden period s, so f(x)=f(x⊕s). Classically you must query until you find a collision — exponentially many tries in the worst case. Simon finds s with only O(n) quantum queries. Here n=2, s=11: two input qubits (q0,q1) and two output qubits (q2,q3); the oracle writes f(x)=x₀⊕x₁ (invariant under x→x⊕11), then a final H⊗² on the input makes every measured y satisfy y·s=0 (mod 2).',
    results:[
      { label:'final state — input register ∈ {|00⟩,|11⟩}', read:'state', steps:_f(_SET(4), _H(0), _H(1), _CN(0,2), _CN(1,2), _CN(0,3), _CN(1,3), _H(0), _H(1)) },
    ],
    result:'The input register (the two high qubits) collapses to |00⟩ or |11⟩ — exactly the y with y·s = 0 (mod 2). Two such samples give a linear system whose solution is s = 11. Exact in ℤ[ζ₁₆] (only H and CNOT).'
  },
  {
    id:'E7', part:'III', title:'Superdense coding (2 classical bits in 1 qubit)',
    motivation:'The dual of teleportation (it expands card A5). Alice and Bob share a Bell pair (one Bell key on q0,q1). By acting on her single qubit with one of four Pauli gates — I, X, Z or ZX for the messages 00, 01, 10, 11 — Alice encodes TWO classical bits; she sends Bob her one qubit, he undoes the Bell (CNOT·H) and reads both bits. One transmitted qubit carries two bits, thanks to the pre-shared entanglement.',
    results:[
      { label:'message 00 (I) → |00⟩', read:'state', steps:_f(_SET(2), _Bell(0,1), _CN(0,1), _H(0)) },
      { label:'message 01 (X) → |01⟩', read:'state', steps:_f(_SET(2), _Bell(0,1), _X(0), _CN(0,1), _H(0)) },
      { label:'message 10 (Z) → |10⟩', read:'state', steps:_f(_SET(2), _Bell(0,1), _Z(0), _CN(0,1), _H(0)) },
      { label:'message 11 (ZX) → −|11⟩', read:'state', steps:_f(_SET(2), _Bell(0,1), _Z(0), _X(0), _CN(0,1), _H(0)) },
    ],
    result:'Bob reads the exact message in every case (the global −1 on the ZX branch is unobservable). Two bits delivered by manipulating and sending a single qubit. Exact in ℤ[ζ₁₆] (Bell preset, CNOT, Pauli).'
  },
  {
    id:'E8', part:'III', title:'Shor’s algorithm — factoring N = 15 (a = 11)',
    motivation:'Shor factors N by finding the period r of a↦aˣ mod N with phase estimation. The trick the calculator makes vivid: with a=11 the order is r=2 (11²≡1 mod 15), and the controlled multiplication by 11 — which only ever sends the work register |1⟩↔|11⟩=|1011⟩ — compiles to just TWO CNOTs (the two bits that flip). With 2 counting qubits the U² controlled by q0 is the identity, so the whole quantum core is: H on q0,q1 · two CNOTs · the QFT† preset. Exact in ℤ[ζ₁₆] (CNOT + QFT₂ = π/2 only).',
    results:[
      { label:'after the controlled ×11 mod 15 (work register holds |1⟩ or |11⟩)', read:'state', steps:_e8pre },
      { label:'after QFT† — counting register peaks at {0, 2}', read:'state', steps:_f(_e8pre, _QFTinv(0,1)) },
    ],
    result:'The counting register reads c ∈ {0, 2}, each with probability ½ → c/4 = s/r → r = 2; then gcd(11¹ ± 1, 15) = gcd(12,15)=3 and gcd(10,15)=5 — the factors of 15. The whole run is a handful of keys: SET · H · H · two CNOTs · QFT†.'
  },
  {
    id:'E10', part:'III', title:'Quantum teleportation (all four branches)',
    motivation:'Teleportation moves an unknown state |ψ⟩ from q0 to q2 using a Bell pair (one Bell key on q1,q2) and two classical bits. It expands card A4: instead of sampling one random measurement, the calculator carries |ψ⟩ symbolically and shows the pre-measurement state split across ALL FOUR branches of the (q0,q1) measurement, each demanding a Pauli correction on q2: 00→I, 01→X, 10→Z, 11→ZX. Applying those corrections as quantum-controlled gates (the deferred-measurement principle: CNOT for X, CZ for Z) disentangles q2 deterministically — so you SEE |ψ⟩ arrive on q2 in one exact state.',
    results:[
      { label:'|ψ⟩|0⟩|0⟩ SET', read:'state', steps:['ket:ψ','ket:0','ket:0','key:SET'] },
      { label:'pre-measurement: |ψ⟩ spread over the 4 (q0,q1) branches', read:'state', steps:_e10pre },
      { label:'deferred correction (CNOT · CZ) → q2 recovers |ψ⟩', read:'state', steps:_f(_e10pre, _CN(1,2), _CZ(0,2)) },
    ],
    result:'After the corrections q2 holds |ψ⟩ exactly, factored out of the now-separable (q0,q1) register: ((1/2)(|00⟩+|01⟩+|10⟩+|11⟩))⊗|ψ⟩. The four measurement outcomes map to I/X/Z/ZX; deferring the measurement makes the recovery one deterministic, exact symbolic state — no cloning (q0 is left in |+⟩, not |ψ⟩).'
  },
];
