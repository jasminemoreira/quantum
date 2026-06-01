// tests/examples-render.mjs — v10: gera o CONSOLIDADO manual.html (tema CLARO da calculadora).
// Parte I = REFERÊNCIA (seções estáticas, ex-manual.html §1–13, em inglês — são prosa, não capturas).
// Parte II = COOKBOOK (26 exemplos, 3 tiers) montado a partir das CAPTURAS de tela feitas pelo
// examples.spec.js: cada resultado já traz _plain/_tex (estado) ou _out (texto), lidos da interface
// real. Aqui só montamos o HTML estático (sem motor). TOC unificado (referência → cookbook).
// SEQUÊNCIA C1 (specs/technical/22 §Resolução Fase 3): a referência é embutida AQUI antes da geração,
// nunca derivada de um manual.html já sobrescrito.
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const att = s => String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const TIERS = [
  { key:'basic', label:'Basic', n:'1',
    intro:'Start here: <b>prepare the initial state</b>, apply gates and read the result three ways. Step 1 is always the preparation.' },
  { key:'intermediate', label:'Intermediate', n:'2',
    intro:'The circuits and measurements of every course: Bell, GHZ, SWAP/Toffoli, probabilities, measurement, inner product and change of basis.' },
  { key:'advanced', label:'Advanced', n:'3',
    intro:'Where the <b>exact</b> engine shines: Clifford+T and the π/8 surd, QFT, QPE, teleportation, superdense coding, symbolic algebra and entanglement.' },
];

// ---- Parte I — REFERÊNCIA (§1–13). Conteúdo EN, herdado do manual.html hand-authored (preservado
//      integralmente para resolver C1). Renderizado como HTML estático no tema claro do cookbook. ----
const REFERENCE_TOC = [
  ['display',    '1', 'The display (LCD)'],
  ['modes',      '2', 'Modes and theme'],
  ['keypad',     '3', 'The keypad: fixed command + sliding pages'],
  ['grammar',    '4', '“Paper keys” grammar'],
  ['prepare',    '5', 'Preparing the state (SET)'],
  ['gates',      '6', 'Gates'],
  ['operations', '7', 'Operations'],
  ['symbolic',   '8', 'Symbolic engine |ψ⟩'],
  ['views',      '9', 'Views (basis/fmt/rad·turns/view)'],
  ['examples',  '10', 'Guided examples'],
  ['presets',   '11', 'Presets / macros (page 2)'],
  ['exactness', '12', 'Exactness & conventions'],
];

const REFERENCE_HTML = `
  <h2 id="display"><span class="n">1</span>The display (LCD)</h2>
  <p>Green panel with <b>fixed height</b> (calculator-LCD style):</p>
  <ul>
    <li><b>Status line</b> (top, right): active selection (<code>ALL</code> or <code>Q3</code>) · basis · format · rad/trn · view.</li>
    <li><b>Body — two panes</b>: the <b>main</b> pane shows the state vector (Dirac), kept clean; an operation's <b>result</b> (prob, ρ, measurement, Schmidt…) goes to a <b>detail</b> pane. An operation <b>auto-slides</b> to the detail; tap the <b>◀</b> / <b>▶</b> arrows on the display sides to switch state ↔ detail; applying a gate returns to the state. The state scrolls (long superpositions); plain Dirac wraps.</li>
    <li><b>Expand button</b> (▼ on the footer, center): when the state is too long for the display, a small triangle appears — tap to <b>expand the LCD</b> (hides the kets/gates blocks of the keypad, displaying more of the state); tap again (now ▲) to restore.</li>
    <li><b>Tap the state</b> to toggle a <b>smaller font</b> — fits long superpositions without scrolling; tap again to restore.</li>
    <li><b>Bloch sphere</b> (main pane, beside the state when enabled): shows the selected qubit and <b>evolves</b> with the state — you watch the state and the sphere together as you apply gates (textbook orientation).</li>
    <li><b>Footer</b> (<code>buffer:</code>): the FSM input being built, errors, the angle/λ prompt and the rules count.</li>
    <li>The <code>≈ approximate</code> badge lights up when there is a numeric amplitude (arbitrary angle).</li>
  </ul>

  <h2 id="modes"><span class="n">2</span>Theme &amp; inline entry</h2>
  <ul>
    <li><span class="key">☾</span> / <span class="key">☀</span> — toggles the <b>theme</b>; <span class="key">?</span> opens the manual/help (new tab). Both are icon buttons below the display, right-aligned. The LCD and the Bloch sphere follow along.</li>
    <li><b>Inline angle / eigenvalue entry (drawer):</b> a parametric gate (<code>Rx, Ry, Rz, P, U, CP, CRz, C‑U</code>) or a gate on an abstract <code>|ψ⟩</code> slides a small numeric/expression <b>drawer</b> up over the keypad — type the angle (or eigenvalue) and <span class="key">=</span> (see §6, §8). Quick-angle keys <span class="key">π/8</span> <span class="key">π/4</span> <span class="key">π/2</span> fill the field in one tap. It is exact when possible (fractions, √2, π) and falls back to numeric (<code>≈</code>) otherwise. Cancel by <b>swiping the drawer down</b> (or pressing <span class="key">Esc</span> on a keyboard); on a gate over <code>|ψ⟩</code>, cancelling leaves the symbolic node <code>U|ψ⟩</code>.</li>
    <li><b>Amplitude entry (drawer):</b> the <span class="key">amp</span> key (page 2, input) opens a <b>scientific drawer</b> (√, sin, cos, exp, 1/√2, i, π) to type the amplitudes α, β as complex expressions — same keyboard idiom, normalized on confirm (see §5).</li>
  </ul>

  <h2 id="keypad"><span class="n">3</span>The keypad: fixed command + sliding pages</h2>
  <p>A <b>fixed command block</b> on top, and below it a <b>carousel of two pages</b> that slide horizontally. Groups by color (Pantone palette of the year):</p>
  <ul>
    <li><b>Command block (fixed, always visible):</b> <span class="sw" style="background:#C47E4F"></span>ALL/CTRL/Q/SET/<span class="key">M</span> (memory — see §7) · CLR/⌫/undo/redo/reset.</li>
    <li><b>Page 1 (frequent):</b> <span class="sw" style="background:#93B4D7"></span>gates · 1 qubit · <span class="sw" style="background:#EAB5C5"></span>kets · <span class="sw" style="background:#7E9B76"></span>controlled · <span class="sw" style="background:#8E6BA8"></span>operations (prob, measure, Bloch, ⟨φ|ψ⟩, ⊗) · and the <span class="sw" style="background:#AB97A1"></span>numeric keypad (digits, π, 1/√2).</li>
    <li><b>Page 2 (long tail, two columns):</b> <i>left</i> — <span class="sw" style="background:#EAB5C5"></span><b>input</b> (|T⟩, rand, amp — see §5), <span class="sw" style="background:#8E6BA8"></span><b>measure &amp; view</b> (⟨ZZ⟩, ‖ψ‖, phase, factor) and <b>density &amp; entanglement</b> (ρ, ρ_A, Schmidt, S(ρ), C); <i>right</i> — <span class="sw" style="background:#93B4D7"></span><b>gate variants</b> S†, T†, P, U, √X, √Y, <span class="sw" style="background:#7E9B76"></span>2 qubits SWAP, iSWAP, CCX, CSWAP, and the <b>presets</b> QFT, QFT†, Bell, GHZ, Grover, W (see §11). No digits on page 2.</li>
    <li><b>Views strip</b> (below the display): basis · fmt · rad/trn · view.</li>
  </ul>
  <p>Tap the bottom arrow <code>▼</code> to <b>expand the display</b> (the input/gate zones collapse to give the state more room); tap <code>▲</code> to restore.</p>
  <p>To reach page 2: <b>swipe</b> left/right (touch), click the <b>page dots</b> <code>•○</code>, press the <b>arrow keys</b> <code>←/→</code>, or drag with the mouse. The command block stays put and the typed buffer persists across the swipe. The keypad <b>stays on the current page</b> after applying a gate/preset — so you can chain several page-2 gates in a row; swipe back to page 1 when you're done.</p>

  <h2 id="grammar"><span class="n">4</span>“Paper keys” grammar (FSM)</h2>
  <p>Commands are assembled without spaces, using explicit tokens:</p>
  <ul>
    <li><b>digits</b> accumulate a number;</li>
    <li><span class="key">Q</span> closes the number as the <b>target / selected qubit</b>;</li>
    <li><span class="key">CTRL</span> marks the number as a <b>control</b>;</li>
    <li>the <b>gate</b> ends the command and applies it (validates the arity);</li>
    <li><span class="key">ALL</span> + gate applies to all; <span class="key">CLR</span> resets the buffer; <span class="key">⌫</span> deletes 1 token.</li>
  </ul>
  <div class="note"><b>Q is optional for a single qubit.</b> Before a <b>1-qubit</b> gate or operation, a bare digit already
     means “that qubit” — <code>0 H</code> ≡ <code>0 Q H</code>, <code>2 prob</code> ≡ <code>2 Q prob</code>. You only
     need <span class="key">Q</span> to <b>separate operands</b>: multiple targets, a control, or a range
     (<code>0 Q 1 Q SWAP</code>, <code>0 CTRL 1 Q CNOT</code>, <code>0 Q 2 Q ⟨ZZ⟩</code>). With no digit at all, a
     1-qubit gate uses the <b>current selection</b> (or all of them when it shows <code>ALL</code>).</div>
  <pre><b>ALL H</b>                 <span class="c">→ H on all qubits</span>
<b>0 H</b>                   <span class="c">→ H on Q0  (the Q is optional for one qubit)</span>
<b>0 Q H</b>                 <span class="c">→ same — explicit Q</span>
<b>1 0 Q H</b>               <span class="c">→ H on Q10 (multi-digit; Q closes the number)</span>
<b>0 CTRL 1 Q CNOT</b>       <span class="c">→ control Q0, target Q1</span>
<b>0 CTRL 1 CTRL 2 Q CCX</b> <span class="c">→ Toffoli (2 controls, target Q2)</span>
<b>0 CTRL 1 Q 2 Q CSWAP</b>  <span class="c">→ Fredkin (control Q0, swaps Q1↔Q2)</span></pre>
  <div class="note">Incomplete command or wrong arity → clear error in the footer, <b>nothing applied</b>.</div>

  <h2 id="prepare"><span class="n">5</span>Preparing the state (SET)</h2>
  <table>
    <tr><th>Input</th><th>Result</th></tr>
    <tr><td><code>01000010</code> <span class="key">SET</span></td><td>basis state <code>|01000010⟩</code> (bitstring → N qubits)</td></tr>
    <tr><td><code>8</code> <span class="key">Q</span> <span class="key">SET</span></td><td>8 qubits in <code>|0…0⟩</code> (the number is the <b>count</b>)</td></tr>
    <tr><td><code>|0⟩ |+⟩ |1⟩</code> <span class="key">SET</span></td><td>product state from kets, each qubit in its own basis</td></tr>
    <tr><td><code>|ψ⟩ |0⟩ |0⟩</code> <span class="key">SET</span></td><td><b>symbolic</b> state: abstract ket + concrete qubits</td></tr>
  </table>
  <p>Cardinal kets available: <code>|0⟩ |1⟩ |+⟩ |−⟩ |i⟩ |−i⟩</code>. Abstract kets: <code>|ψ⟩ |φ⟩ |χ⟩</code>.
     Mixing a digit and a ket in the same input is an error. Big-endian ordering: the 1st ket is Q0.</p>

  <h3>Input keys (page 2) — single-qubit composition</h3>
  <p>The <b>input</b> group on page 2 prepares a <b>fresh 1-qubit state</b> (like SET — it replaces the register, one undo step):</p>
  <table>
    <tr><th>Key</th><th>Result</th></tr>
    <tr><td><span class="key">|T⟩</span></td><td><b>exact</b> macro H·T on |0⟩ → <code>(|0⟩ + e^{iπ/4}|1⟩)/√2</code> (the “magic” T-state). In ℤ[ζ₁₆], so <b>no ≈</b>.</td></tr>
    <tr><td><span class="key">rand</span></td><td>a <b>random</b> 1-qubit state, sampled <b>uniformly on the Bloch sphere</b> (Haar): θ = acos(1−2u), φ = 2πv. Always normalized; numeric, so marked <code>≈</code>. Tap again for another.</td></tr>
    <tr><td><span class="key">amp</span></td><td>type the amplitudes <b>α, β directly</b>. Opens a <b>scientific drawer</b> (√, sin, cos, exp, 1/√2, i, π, digits): enter α as one complex expression and <span class="key">=</span>, then β and <span class="key">=</span>. For a phase use <code>exp(i·θ)</code> (not <code>e^…</code>). Accepts rectangular <code>(√3+i)/2</code>, polar/exponential <code>exp(i·π/3)</code>, fractions, etc. The state is <b>normalized</b> on confirm (the ratio α:β and the relative phase are preserved); <code>α=β=0</code> is rejected (null vector). Numeric → <code>≈</code> unless the value lands exactly in ℤ[ζ₁₆] (e.g. <code>1</code>,<code>1</code> → <code>1/√2</code> each, shown exact). <b>Swipe the drawer down</b> to cancel.</td></tr>
  </table>
  <div class="note">Why normalize? |α|² and |β|² are probabilities and must sum to 1. <code>amp</code> rescales your input to ‖ψ‖=1 — you give the <b>direction</b> of the state, it returns the physical unit vector. Use the <span class="key">fmt</span> view to show the result as rectangular, polar or exponential.</div>

  <h2 id="gates"><span class="n">6</span>Gates</h2>
  <table>
    <tr><th>Group</th><th>Gates</th></tr>
    <tr><td>1 qubit</td><td><code>H X Y Z S T Rx Ry Rz</code> · <b>page 2</b>: <code>S† T† P(φ) U(θ,φ,λ) √X √Y</code></td></tr>
    <tr><td>2 qubits / controlled</td><td><code>CNOT CZ CP(λ) CRz C‑U</code> · <b>page 2</b>: <code>SWAP iSWAP CCX CSWAP</code></td></tr>
  </table>
  <p><code>√X</code> and <code>√Y</code> (page 2, gate variants) are <b>exact</b> square-root gates in ℤ[ζ₁₆]
     (Qiskit convention): <code>√X·√X = X</code>, <code>√Y·√Y = Y</code> exactly. <code>√X|0⟩ = (1+i)/2 |0⟩ + (1−i)/2 |1⟩</code>.</p>
  <p>Parametrized gates (<code>Rx, Ry, Rz, P, U, CP, CRz, C‑U</code>) ask for the angle(s) on an
     <b>inline drawer</b> (type the expression and <span class="key">=</span>). E.g.: <code>π/2</code>, <code>2πθ</code>, <code>π/4</code>.
     A notable angle (multiple of <b>π/8</b>) → exact; an arbitrary angle → numeric, marked <code>≈</code>.
     The drawer has <b>quick-angle keys</b> <span class="key">π/8</span> <span class="key">π/4</span> <span class="key">π/2</span> that <b>replace</b> the field (one tap = that angle).</p>

  <h3>CP vs CRz — controlled phase vs controlled rotation</h3>
  <p>They look alike but differ where it matters (the difference is invisible on 1 qubit but becomes a
     <i>relative</i> phase once controlled):</p>
  <table>
    <tr><th>Gate</th><th>diag on (|00⟩,|01⟩,|10⟩,|11⟩)</th><th>Effect</th></tr>
    <tr><td><code>CP(λ)</code></td><td><code>(1, 1, 1, e^{iλ})</code></td><td>phase <b>only on |11⟩</b>; |10⟩ untouched. <b>Symmetric</b> (control↔target).</td></tr>
    <tr><td><code>CRz(θ)</code></td><td><code>(1, 1, e^{-iθ/2}, e^{+iθ/2})</code></td><td>touches <b>both</b> control=1 states (∓θ/2). Relation: <code>CRz(θ) = CP(θ) · [P(−θ/2) on control]</code>.</td></tr>
  </table>
  <p>Common shortcuts use <b>CP</b>: <code>controlled-T = CP(π/4)</code>, <code>controlled-S = CP(π/2)</code>,
     <code>controlled-Z = CP(π)</code>; the QFT uses <code>R_k = CP(2π/2^k)</code>.</p>
  <div class="note">Phase kickback needs the <b>target to be an eigenstate</b> of the controlled gate.
     <code>|+⟩</code> is <b>not</b> an eigenstate of T (<code>T|+⟩ = (|0⟩+e^{iπ/4}|1⟩)/√2</code>); the eigenstates of
     T are <code>|0⟩</code> (eigenvalue 1) and <code>|1⟩</code> (eigenvalue e^{iπ/4}). Use <code>|1⟩</code> as the
     target to get the clean kickback <code>(1±e^{iπ/4})/2</code> on the control.</div>

  <h3>Angle convention — <span class="key">rad/trn</span> toggle</h3>
  <p>The <span class="key">rad/trn</span> toggle (in the views strip) switches how angles are <b>entered and shown</b> (the active one is shown in the status line):</p>
  <ul>
    <li><b>rad</b> (default): you type radians; phase shows as <code>e^{iθ}</code> (e.g. <code>P(π/4)</code> → <code>e^{iπ/4}</code>).</li>
    <li><b>turns</b> (normalized, <code>e^{2πiφ}</code>): you type a <b>fraction of a full turn</b>; phase shows as <code>e^{2πi·φ}</code>.
        Type <code>1/8</code> → <code>P(π/4)</code> (since 2π·1/8 = π/4); the display reads <code>e^{2πi·1/8}</code>.
        A turn-fraction <code>1/8</code> is <b>not</b> π/8 — π/8 rad is <code>1/16</code> of a turn.</li>
  </ul>
  <p>Default is <b>rad</b>. The indicator <code>· turns</code> appears in the top-right only when turns is active.
     Turns multiplies the typed value by 2π for <b>every</b> parametric gate. The symbolic eigenvalue phase
     also re-labels in turns: a free <code>e^{iθ}</code> shows as <code>e^{2πiθ}</code> (and an explicit
     <code>2πθ</code> stays <code>e^{2πiθ}</code> — it is not doubled). The exact engine is identical in both
     modes — only the angle label changes.</p>

  <h2 id="operations"><span class="n">7</span>Operations</h2>
  <table>
    <tr><th>Key</th><th>What it does</th></tr>
    <tr><td><span class="key">prob</span></td><td><b>follows the current selection</b> (live): with <span class="key">ALL</span> the full distribution P(ket) (exact fractions + bars, in the active display basis); with a single qubit, its <b>marginal</b> P(Qn=0)/P(Qn=1). Change the selection (or apply gates) and the readout updates on its own. Pressing <span class="key">prob</span> <b>alone toggles</b> it on/off; typing a qubit first (<code>n</code> or <code>n Q</code>) <b>always shows</b> that qubit — it won't toggle off (same for <code>n</code> + <span class="key">Bloch</span>/<span class="key">measure</span>).</td></tr>
    <tr><td><span class="key">measure</span></td><td>measures the selected qubits: shows the exact branch probabilities and <b>collapses immediately</b> to a sampled branch (∝ probability) — no confirmation. Use <span class="key">prob</span> to see the distribution without collapsing.</td></tr>
    <tr><td><span class="key">Bloch</span></td><td>toggles the Bloch sphere of the selected qubit. Opening it <b>selects</b> that qubit (so <span class="key">prob</span> shows its marginal and the corner indicator matches); <b>tap the sphere</b> to cycle to the next separable qubit — the selection follows; <span class="key">ALL</span> closes it (the sphere is single-qubit).</td></tr>
    <tr><td><span class="key">⟨ZZ⟩</span></td><td><b>quantum correlation</b> (page 2) — the exact parity expectation ⟨⊗Z⟩ of the selected qubits: ⟨Z<sub>i</sub>Z<sub>j</sub>⟩ = Σ(−1)<sup>parity(i,j)</sup>|amp|². With <span class="key">ALL</span> it spans every qubit; <code>n Q</code> gives the single-qubit ⟨Z<sub>n</sub>⟩ = P0−P1 (the Bloch z-component); <code>i Q j Q</code> gives the two-qubit ⟨Z<sub>i</sub>Z<sub>j</sub>⟩ — the CHSH correlation E(A,B) = P00+P11−P01−P10. Concrete states only; result is exact in ℤ[ζ₁₆] (e.g. 1/√2 for the CHSH state).</td></tr>
    <tr><td><span class="key">⟨φ|ψ⟩</span></td><td>inner product of the saved φ with the current ψ — <b>concrete states</b> (save φ first with <span class="key">M</span>)</td></tr>
    <tr><td><span class="key">⊗</span></td><td>tensor product φ ⊗ ψ — works on <b>concrete AND symbolic</b> states (e.g. build <code>T·H|ψ⟩ ⊗ |φ⟩</code>); a concrete operand is promoted automatically; save φ first with <span class="key">M</span> (see §8)</td></tr>
    <tr><td><span class="key">M</span></td><td><b>memory</b> (in the fixed command block): stores the current state as φ — concrete or symbolic — read by ⟨φ|ψ⟩ and ⊗; visible on <b>both pages</b> (the command block never slides)</td></tr>
    <tr><td colspan="2"><b>page 2 — density &amp; entanglement:</b> <span class="key">ρ</span> density matrix · <span class="key">ρ_A</span> partial trace · <span class="key">Schmidt</span> · <span class="key">S(ρ)</span> von Neumann entropy · <span class="key">C</span> concurrence. <b>measure &amp; view:</b> <span class="key">⟨ZZ⟩</span> quantum correlation (parity expectation) · <span class="key">‖ψ‖</span> norm ⟨ψ|ψ⟩ · <span class="key">phase</span> factor out the global phase · <span class="key">factor</span> per-qubit factored view</td></tr>
  </table>
  <div class="note"><span class="key">ρ_A</span> (partial trace) and <span class="key">S(ρ)</span> (von Neumann entropy of subsystem A) take the qubits to <b>keep</b> from the same <code>n Q</code> operand grammar as ⟨ZZ⟩ — e.g. <code>0 Q ρ_A</code>, <code>0 Q 1 Q S(ρ)</code>. With no selection they show a guiding error (no native pop-up).</div>

  <h2 id="symbolic"><span class="n">8</span>Symbolic engine |ψ⟩</h2>
  <p>Introducing an abstract ket (<code>|ψ⟩, |φ⟩, |χ⟩</code>) promotes the state to the <b>symbolic engine</b>,
     which coexists with the exact concrete vector. There are two uses:</p>

  <h3>(a) Eigenvalue / kickback — opaque |ψ⟩</h3>
  <p>When applying a gate to <code>|ψ⟩</code>, the calc asks for the <b>eigenvalue</b> <code>U|ψ⟩ = λ|ψ⟩</code>:</p>
  <ul>
    <li><span class="key">=</span> (without typing) → <b>default symbolic phase</b> <code>e^{iθ}</code> (clean; we use θ because φ is already the ket <code>|φ⟩</code>);</li>
    <li>type an <b>angle</b> (<code>π/4</code>, <code>2πθ</code>, <code>π</code>) → <code>e^{i·angle}</code> (exact for multiples of π/4);</li>
    <li><b>swipe the drawer down</b> (or press <span class="key">Esc</span>) → leaves <code>U|ψ⟩</code> as an unevaluated node (cancels the eigenvalue entry).</li>
  </ul>
  <p>On a controlled gate with a concrete control, the phase “kicks back” to the control (phase kickback):
     <code>CRz</code> on <code>|+⟩⊗|ψ⟩</code> with <span class="key">=</span> → <code>((1/√2)|0⟩ + (1/√2·e^{iθ})|1⟩)⊗|ψ⟩</code>.</p>
  <pre><span class="c">// kickback with φ=π/4 — the phase lands on the control (no H needed)</span>
|+⟩ |ψ⟩ <b>SET</b>
0 CTRL 1 Q <b>CU</b>   <span class="c">→ λ: π/4 =   → (1/√2)|0⟩⊗|ψ⟩ + (1/√2·e^{iπ/4})|1⟩⊗|ψ⟩</span></pre>

  <h3>(b) Unknown qubit — |ψ⟩ as control (teleportation)</h3>
  <p>When <code>|ψ⟩</code> is the <b>control</b> of a gate, it is expanded into the generic qubit
     <code>ψ₀|0⟩ + ψ₁|1⟩</code> (symbolic amplitudes ψ₀=⟨0|ψ⟩, ψ₁=⟨1|ψ⟩). From there the concrete engine
     applies everything normally, propagating ψ₀,ψ₁.</p>

  <h3>(c) Partial measurement + correction</h3>
  <p>With a concrete qubit selected, <span class="key">measure</span> draws the outcome, collapses the branch and
     <b>renormalizes</b>. Then apply the Pauli corrections (<code>X</code>/<code>Z</code>) on the target according to the outcome.</p>
  <div class="note"><b>Minimal simplification:</b> the engine only combines identical terms and applies the rules you declare — you control every step. It does not factor or normalize on its own (use <span class="key">view</span> / the <span class="key">factor</span> key to factor by hand).</div>

  <h3>(d) Symbolic memory &amp; tensor — building <code>T·H|ψ⟩ ⊗ |φ⟩</code></h3>
  <p><span class="key">M</span> and <span class="key">⊗</span> work on the symbolic engine too, so you can assemble a
     register from independently-built symbolic pieces:</p>
  <pre>|ψ⟩ <b>SET</b> · <b>H</b> · <b>T</b>      <span class="c">→ T·H|ψ⟩  (abstract nodes, no eigenvalue declared)</span>
<b>M</b>                       <span class="c">→ saves it as φ</span>
|φ⟩ <b>SET</b> · <b>⊗</b>           <span class="c">→ T·H|ψ⟩ ⊗ |φ⟩</span></pre>
  <p>The tensor is big-endian (<b>saved ⊗ current</b>) and a <b>concrete</b> operand is promoted automatically
     (e.g. <code>|ψ⟩ ⊗ |1⟩</code>). To keep the algebra unambiguous, the two operands must use
     <b>different symbols</b>: tensoring two states that share a ket label (<code>|ψ⟩ ⊗ |ψ⟩</code>) or the same
     coefficient symbol (two <code>e^{iθ}</code>) is rejected — <i>“rename — both states use …”</i>. Pick
     distinct kets (<code>|ψ⟩ |φ⟩ |χ⟩</code>) or re-enter λ with a different symbol.</p>

  <h2 id="views"><span class="n">9</span>Views</h2>
  <table>
    <tr><th>Key</th><th>Effect</th></tr>
    <tr><td><span class="key">basis</span></td><td>cycles the display basis: <code>{|0⟩,|1⟩} → {|+⟩,|−⟩} → {|i⟩,|−i⟩}</code> (per qubit with <code>n Q</code>)</td></tr>
    <tr><td><span class="key">fmt</span></td><td>cycles the phase format: <code>e^{iθ} → a+bi → polar</code></td></tr>
    <tr><td><span class="key">rad/trn</span></td><td>toggles the angle convention <b>rad</b> ↔ <b>turns</b> (see §6); the active one shows in the status line</td></tr>
    <tr><td><span class="key">view</span></td><td>cycles the state view: <b>factored</b> (does not distribute; isolates common factors) → <b>expanded</b> → <b>matrix</b> (the 2<sup>N</sup>×1 column vector of amplitudes, in the active basis, each row labelled with its basis ket; cells follow the <span class="key">fmt</span> format; capped at 64 rows with <code>⋮</code> for larger registers). Matrix is concrete-only — an abstract <code>|ψ⟩</code> state stays in Dirac form.</td></tr>
  </table>
  <p class="note">The <span class="key">prob</span> toggle (in the operations palette) shows the |amp|² distribution
     as a persistent list with bars (in the active display basis) — it replaced the old separate <code>bars</code> view.</p>

  <h2 id="examples"><span class="n">10</span>Guided examples</h2>
  <p class="note">A quick taste; the full <b>cookbook</b> (basic → advanced) is <a href="#part-cookbook">Part II</a> below.</p>

  <h3>Bell pair  (1/√2)(|00⟩+|11⟩)</h3>
  <pre>2 Q <b>SET</b>            <span class="c">→ |00⟩</span>
0 Q <b>H</b>             <span class="c">→ (1/√2)|00⟩ + (1/√2)|10⟩</span>
0 CTRL 1 Q <b>CNOT</b>   <span class="c">→ (1/√2)|00⟩ + (1/√2)|11⟩</span></pre>
  <div class="note">Shortcut (§11): <code>2 Q <b>SET</b> · 0 Q 1 Q <b>p2 Bell</b></code> — same result in one key (p2 = page 2).</div>

  <h3>GHZ₃  (1/√2)(|000⟩+|111⟩)</h3>
  <pre>3 Q <b>SET</b> · 0 Q <b>H</b> · 0 CTRL 1 Q <b>CNOT</b> · 0 CTRL 2 Q <b>CNOT</b></pre>
  <div class="note">Shortcut (§11): <code>3 Q <b>SET</b> · <b>ALL</b> <b>p2 GHZ</b></code>.</div>

  <h3>Hadamard test / kickback (eigenvalue)</h3>
  <pre>|+⟩ |ψ⟩ <b>SET</b>
0 CTRL 1 Q <b>CU</b>  <span class="c">→ λ: π  =   (φ=π → λ=−1)</span>
0 Q <b>H</b>          <span class="c">→ |1⟩⊗|ψ⟩  (the control collapses)</span></pre>

  <h3>Teleportation (complete)</h3>
  <pre><span class="c">// |ψ⟩ on Q0; Bell pair on Q1,Q2</span>
|ψ⟩ |0⟩ |0⟩ <b>SET</b>
1 Q <b>H</b> · 1 CTRL 2 Q <b>CNOT</b>        <span class="c">→ Bell on (1,2)</span>
0 CTRL 1 Q <b>CNOT</b>                  <span class="c">→ abstract control: |ψ⟩ = ψ₀|0⟩+ψ₁|1⟩</span>
0 Q <b>H</b>                            <span class="c">→ 4 measurement branches</span>
0 Q <b>measure</b> · 1 Q <b>measure</b>      <span class="c">→ collapses q0,q1 (sample) and renormalizes</span>
<span class="c">// Pauli correction on the target (Q2) according to the outcome:</span>
2 Q <b>X</b>   (if q1 = 1)   ·   2 Q <b>Z</b>   (if q0 = 1)
<span class="c">→ Q2 recovers |ψ⟩ = ψ₀|0⟩ + ψ₁|1⟩</span></pre>

  <h2 id="presets"><span class="n">11</span>Presets / macros (page 2)</h2>
  <p><b>Page 2</b> carries six <b>preset blocks</b> that expand a known circuit in
     <b>one key</b>, built from the same exact gates you'd type by hand (§10). The preset is a single
     <b>atomic</b> step in history — one <span class="key">↶</span> undoes the whole block. The manual forms
     remain available: presets are a faster path to the <i>same</i> result, not a replacement.</p>
  <p><b>Targets.</b> A preset reads the selection just like a gate: <code><b>ALL</b> &lt;preset&gt;</code> acts on the
     whole register; <code>i Q j Q &lt;preset&gt;</code> acts on the contiguous range <code>q_i…q_j</code> (big-endian).
     Bell needs exactly 2 qubits.</p>
  <table>
    <tr><th>Preset</th><th>Builds (manual equivalent)</th><th>Example</th></tr>
    <tr><td><code>QFT</code></td><td>H + controlled CP(π/2ᵏ) + reversal SWAPs</td><td><code>ALL QFT</code> · <code>0 Q 3 Q QFT</code></td></tr>
    <tr><td><code>QFT†</code></td><td>the inverse (reversal first, negative phases, reverse order)</td><td><code>ALL QFT†</code></td></tr>
    <tr><td><code>Bell</code></td><td>H + CNOT — the <b>variant</b> follows the input: |00⟩→Φ⁺, |01⟩→Ψ⁺, |10⟩→Φ⁻, |11⟩→Ψ⁻</td><td><code>0 Q 1 Q Bell</code></td></tr>
    <tr><td><code>GHZ</code></td><td>H(q₀) + chain of CNOTs → (|0…0⟩+|1…1⟩)/√2</td><td><code>ALL GHZ</code></td></tr>
    <tr><td><code>Grover</code></td><td>the <b>diffuser</b> 2|s⟩⟨s|−I (H⊗ · X⊗ · multi-controlled-Z · X⊗ · H⊗). The oracle is yours to build.</td><td><code>ALL Grover</code></td></tr>
    <tr><td><code>W</code></td><td>cascade of controlled-Ry → (1/√N)(|10…0⟩+…+|0…01⟩)</td><td><code>ALL W</code></td></tr>
  </table>
  <div class="note"><b>Exactness:</b> QFT/QFT† are exact for <b>≤4 qubits</b> (finest phase π/8 ∈ ζ₁₆); ≥5 qubits use π/16
     and turn <code>≈</code> approximate. Bell/GHZ/Grover are exact. <b>W</b> is always <code>≈</code> approximate
     (its rotation angles are not multiples of π/8) — a nice demonstration of the exact↔numeric fallback.</div>
  <div class="note">To get the four Bell states, prepare the two input qubits and press <code>Bell</code>: e.g.
     <code>2 Q SET · 1 Q X · 0 Q 1 Q p2 Bell</code> gives Ψ⁺ from |01⟩.</div>
  <div class="note"><b>On a symbolic state</b> a preset runs over its <b>concrete qubits</b>: with <code>|ψ⟩|0⟩|0⟩</code>,
     <code>1 Q 2 Q Bell</code> entangles Q1,Q2 → <code>|ψ⟩⊗(|00⟩+|11⟩)/√2</code>. It is refused only if a target qubit
     is the abstract <code>|ψ⟩</code> slot itself (presets act on concrete qubits).</div>

  <h2 id="exactness"><span class="n">12</span>Exactness & conventions</h2>
  <ul>
    <li><b>Exact core ℤ[ζ₁₆]</b> (ζ = e^{iπ/8}, ζ⁸ = −1) over BigInt: Clifford+T amplitudes and phases that are multiples of <b>π/8</b> are <b>exact</b> (never decimals). Enables exact P(π/8)/√T, R₄ and QFT up to 4 qubits. 1/√2 never degrades to 0.7071. Nested surds like <code>√(2+√2)/2 = cos(π/8)</code> render exactly.</li>
    <li><b>Arbitrary angle</b> (e.g. Rx(0.3)) → <b>numeric</b> amplitude flagged <code>≈</code>; recognition recovers notable values (1/√2, √3/2…). Phases finer than π/8 (e.g. π/16 = ζ₃₂) are also numeric/≈.</li>
    <li><b>Angle input/display:</b> <span class="key">rad/trn</span> toggles <b>rad</b> (e^{iθ}, default) ↔ <b>turns</b> (e^{2πiφ}); see §6.</li>
    <li><b>Big-endian</b> throughout the system: <code>|q₀q₁…q₍ₙ₋₁₎⟩</code>, q₀ on the left.</li>
    <li><b>U(θ,φ,λ)</b> = OpenQASM 3.0 / Qiskit convention.</li>
    <li>Practical limit: <b>N ≤ 12 qubits</b>.</li>
  </ul>
  <div class="note warn">This is a <b>didactic algebraic-manipulation tool</b> — it does not run on quantum hardware nor solve symbolic equations (it only evaluates/transforms expressions).</div>
`;

function chips(keys){
  return keys.split('·').map(s => s.trim()).filter(Boolean)
    .map(s => `<code>${esc(s)}</code>`).join('<span class="arrow">›</span>');
}

// v22: a sequência de teclas EXIBIDA é DERIVADA dos steps reais (as teclas que o examples.spec aperta),
// não de uma string escrita à mão. Elimina divergências: prep omitida ("…"), atalhos não-literais ("Bell",
// "GHZ") e PSEUDO-teclas que não existem no app ("(I)", "(no oracle)"). Cada chip é uma tecla de verdade.
const STEP_SIMPLE = { 'key:Q':'Q','key:CTRL':'CTRL','key:ALL':'ALL','key:SET':'SET','key:NEG':'±','key:PI':'π','key:INVSQRT2':'1/√2','key:.':'.','key:BKSP':'⌫','key:CLR':'ESC','eval':'=','page:1':'p2','fmtcycle':'fmt','chbase':'basis','angcycle':'rad/trn','viewform':'view','cmd:undo':'↶','cmd:redo':'↷','cmd:reset':'CLR','evidence':'factor' };
const STEP_GATE = { Sdg:'S†', Tdg:'T†', CU:'C-U', SX:'√X', SY:'√Y' };   // v22: √X/√Y exatos
const STEP_OP = { bloch:'Bloch', inner:'⟨φ|ψ⟩', tensor:'⊗', saveBra:'M', density:'ρ', partial:'ρ_A', schmidt:'Schmidt', vonneumann:'S(ρ)', concurrence:'C', globalPhase:'phase', norm:'‖ψ‖', corr:'⟨ZZ⟩' };
const STEP_INPUT = { T:'|T⟩', rand:'rand', amp:'amp' };       // v22: teclas de input (pág.2)
const STEP_PRESET = { QFTinv:'QFT†' };
const STEP_CALC = { '-':'−', '*':'×' };
function tokLabel(t){
  if (STEP_SIMPLE[t]) return STEP_SIMPLE[t];
  const i = t.indexOf(':'); if (i < 0) return t;
  const k = t.slice(0,i), v = t.slice(i+1);
  if (k === 'key') return v;                                  // dígito
  if (k === 'gate') return STEP_GATE[v] || v;
  if (k === 'op') return STEP_OP[v] || v;
  if (k === 'input') return STEP_INPUT[v] || v;
  if (k === 'preset') return STEP_PRESET[v] || v;
  if (k === 'ket') return '|' + (v === '-' ? '−' : v === '-i' ? '−i' : v) + '⟩';
  if (k === 'calc') return STEP_CALC[v] || v;
  return v;
}
function stepsToKeys(steps){
  const groups = []; let cur = [], calcRun = '';
  const flush = () => { if (calcRun){ cur.push(calcRun); calcRun = ''; } };
  const TERM = new Set(['key:SET','eval','fmtcycle','chbase','angcycle','viewform','cmd:undo','cmd:redo','cmd:reset']);
  for (let i=0;i<steps.length;i++){ const t = steps[i];
    if (t === 'page:0') continue;                             // volta à pág.1 = implícita, não vira chip
    if (t.startsWith('calc:')){ calcRun += tokLabel(t); continue; }   // entrada de ângulo: junta "π/4" num token
    flush(); cur.push(tokLabel(t));
    const isGate = t.startsWith('gate:'), isOp = t.startsWith('op:') || t === 'evidence', isPreset = t.startsWith('preset:'), isInput = t.startsWith('input:');
    let term = TERM.has(t) || isOp || isPreset || isInput;
    if (isGate){ const nx = steps[i+1]; term = !(nx && nx.startsWith('calc:')); }   // gate paramétrico abre entrada de ângulo → não termina ainda
    if (term){ groups.push(cur.join(' ')); cur = []; }
  }
  flush(); if (cur.length) groups.push(cur.join(' '));
  return groups.join(' · ');
}

function resultBlock(r){
  const keysHtml = `<div class="keys"><span class="block-label">keys</span><div class="steps">${chips(stepsToKeys(r.steps))}</div></div>`;
  let out;
  if (r.read === 'state'){
    out = `<span class="ket" data-dirac="${att(r._plain)}" data-tex="${att(r._tex)}">${esc(r._plain)}</span>`;
  } else {
    out = `<pre class="out" data-out="${att(r._out)}">${esc(r._out)}</pre>`;
  }
  return `<div class="res-block">${keysHtml}`+
    `<div class="lcd"><span class="rlabel">${esc(r.label)}</span>${out}</div></div>`;
}

// ============================ CIRCUIT DIAGRAMS (inline SVG) ============================
// v22: figuras representativas dos circuitos (pedido da operadora). SVG INLINE puro — nada externo
// (o manual é offline/single-file). Modelo por COLUNAS (time-slices); cada op é uma tupla [tipo,...].
// Ops: ['box',q,'H'] · ['cx',c,t] (CNOT) · ['cdot',c,t,'U'] (controle c → caixa rotulada em t) ·
//      ['m',q] (medidor) · ['mbox',qlo,qhi,'Uf'] (caixa multi-qubit) · ['ccbox',[ctrls],t,'X,Z'] (caixa
//      classicamente controlada: conectores tracejados dos qubits medidos). Coordenadas explícitas.
function circuitSVG(spec){
  const n = spec.n, cols = spec.cols, labels = spec.labels || Array.from({length:n},(_,i)=>'q'+i);
  const rowH = 38, gap = 18, padL = 50, padR = 14, padT = 20, padB = 16, bH = 24;
  const A = '#3f6f9c', WIRE = '#b3a7bb', TX = '#2a2230', CL = '#8a7d92', FILL = '#fbf8fc', MFILL = '#f1eaf4';
  const e = []; // fragmentos
  const bw = (lbl) => Math.max(24, lbl.length * 8.2 + 10);
  const yq = q => padT + q * rowH;
  // v22-fix: largura de coluna ADAPTATIVA ao elemento mais largo dela (boxes 'Oracle'/'Diffuser'/'QFT†'
  // excediam a colW fixa de 52px → encavalavam e cortavam o texto). colW = max(footprint da coluna) + gap;
  // os centros das colunas são acumulados da esquerda p/ a direita.
  const opW = (op) => { switch(op[0]){ case 'cx': case 'cz': case 'swap': return 20; case 'm': return 26; case 'box': return bw(op[2]); case 'cdot': case 'mbox': case 'ccbox': return bw(op[3]); default: return 24; } };
  const colW = cols.map(col => Math.max(24, ...col.map(opW)) + gap);
  let acc = padL; const xcArr = colW.map(w => { const c = acc + w/2; acc += w; return c; });
  const xc = i => xcArr[i];
  const W = acc + padR, H = yq(n-1) + bH/2 + padB;
  const text = (x,y,t,opt='') => `<text x="${x}" y="${y+4}" font-family="var(--mono),monospace" font-size="12" text-anchor="middle" fill="${TX}" ${opt}>${esc(t)}</text>`;
  const box = (x,y,lbl,fill=FILL) => { const w = bw(lbl); return `<rect x="${x-w/2}" y="${y-bH/2}" width="${w}" height="${bH}" rx="4" fill="${fill}" stroke="${A}" stroke-width="1.4"/>` + text(x,y,lbl); };
  // wires + left labels
  for (let q=0;q<n;q++){ const y = yq(q);
    e.push(`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="${WIRE}" stroke-width="1.5"/>`);
    e.push(`<text x="${padL-8}" y="${y+4}" font-family="var(--mono),monospace" font-size="11.5" text-anchor="end" fill="${CL}">${esc(labels[q])}</text>`);
  }
  // ops por coluna
  cols.forEach((col,i) => { const x = xc(i);
    for (const op of col){ const k = op[0];
      if (k === 'box'){ e.push(box(x, yq(op[1]), op[2])); }
      else if (k === 'cx'){ const yc = yq(op[1]), yt = yq(op[2]);
        e.push(`<line x1="${x}" y1="${yc}" x2="${x}" y2="${yt}" stroke="${A}" stroke-width="1.5"/>`);
        e.push(`<circle cx="${x}" cy="${yc}" r="3.6" fill="${A}"/>`);
        e.push(`<circle cx="${x}" cy="${yt}" r="9" fill="${FILL}" stroke="${A}" stroke-width="1.5"/><line x1="${x-9}" y1="${yt}" x2="${x+9}" y2="${yt}" stroke="${A}" stroke-width="1.5"/><line x1="${x}" y1="${yt-9}" x2="${x}" y2="${yt+9}" stroke="${A}" stroke-width="1.5"/>`);
      }
      else if (k === 'cdot'){ const yc = yq(op[1]), yt = yq(op[2]);
        e.push(`<line x1="${x}" y1="${yc}" x2="${x}" y2="${yt}" stroke="${A}" stroke-width="1.5"/>`);
        e.push(`<circle cx="${x}" cy="${yc}" r="3.6" fill="${A}"/>`);
        e.push(box(x, yt, op[3]));
      }
      else if (k === 'swap'){ const ya = yq(op[1]), yb = yq(op[2]);
        e.push(`<line x1="${x}" y1="${ya}" x2="${x}" y2="${yb}" stroke="${A}" stroke-width="1.5"/>`);
        for (const yy of [ya,yb]) e.push(`<line x1="${x-5}" y1="${yy-5}" x2="${x+5}" y2="${yy+5}" stroke="${A}" stroke-width="1.6"/><line x1="${x-5}" y1="${yy+5}" x2="${x+5}" y2="${yy-5}" stroke="${A}" stroke-width="1.6"/>`);
      }
      else if (k === 'm'){ const y = yq(op[1]), w = 26;
        e.push(`<rect x="${x-w/2}" y="${y-bH/2}" width="${w}" height="${bH}" rx="4" fill="${MFILL}" stroke="${A}" stroke-width="1.4"/>`);
        e.push(`<path d="M ${x-6} ${y+4} A 6 6 0 0 1 ${x+6} ${y+4}" fill="none" stroke="${A}" stroke-width="1.3"/><line x1="${x}" y1="${y+4}" x2="${x+5.5}" y2="${y-5}" stroke="${A}" stroke-width="1.3"/>`);
      }
      else if (k === 'mbox'){ const ylo = yq(op[1]), yhi = yq(op[2]), w = bw(op[3]);
        e.push(`<rect x="${x-w/2}" y="${ylo-bH/2}" width="${w}" height="${(yhi-ylo)+bH}" rx="5" fill="${MFILL}" stroke="${A}" stroke-width="1.4"/>`);
        e.push(text(x, (ylo+yhi)/2, op[3]));
      }
      else if (k === 'ccbox'){ const yt = yq(op[2]);
        for (const c of op[1]) e.push(`<line x1="${x}" y1="${yq(c)}" x2="${x}" y2="${yt}" stroke="${CL}" stroke-width="1.3" stroke-dasharray="3 2"/><rect x="${x-3.2}" y="${yq(c)-3.2}" width="6.4" height="6.4" fill="none" stroke="${CL}" stroke-width="1.3"/>`);
        e.push(box(x, yt, op[3], MFILL));
      }
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" xmlns="http://www.w3.org/2000/svg">${e.join('')}</svg>`;
}
// specs por id de card (Bell/GHZ + teleporte/superdense + Part III). Oráculos genéricos = caixa "Uf/Uₛ";
// onde o conteúdo do oráculo É o ponto didático (BV), as portas literais aparecem.
const CIRCUITS = {
  I1: { n:2, labels:['|0⟩','|0⟩'], cols:[ [['box',0,'H']], [['cx',0,1]] ] },
  I2: { n:3, labels:['|0⟩','|0⟩','|0⟩'], cols:[ [['box',0,'H']], [['cx',0,1]], [['cx',0,2]] ] },
  A4: { n:3, labels:['|ψ⟩','|0⟩','|0⟩'], cols:[
        [['box',1,'H']], [['cx',1,2]], [['cx',0,1]], [['box',0,'H']],
        [['m',0],['m',1]], [['ccbox',[0,1],2,'Xᵐ¹Zᵐ⁰']] ] },
  A5: { n:2, labels:['|0⟩','|0⟩'], cols:[
        [['box',0,'H']], [['cx',0,1]], [['box',0,'enc']], [['cx',0,1]], [['box',0,'H']], [['m',0],['m',1]] ] },
  A3: { n:3, labels:['|0⟩','|0⟩','|0⟩'], cols:[
        [['box',0,'H']], [['cdot',1,0,'π/2']], [['cdot',2,0,'π/4']],
        [['box',1,'H']], [['cdot',2,1,'π/2']], [['box',2,'H']], [['swap',0,2]] ] },
  E1: { n:2, labels:['|0⟩','|0⟩'], cols:[
        [['box',1,'X']], [['box',0,'H'],['box',1,'H']], [['mbox',0,1,'Uf']], [['box',0,'H']], [['m',0]] ] },
  E2: { n:4, labels:['|0⟩','|0⟩','|0⟩','|0⟩'], cols:[
        [['box',3,'X']], [['box',0,'H'],['box',1,'H'],['box',2,'H'],['box',3,'H']],
        [['mbox',0,3,'Uf']], [['box',0,'H'],['box',1,'H'],['box',2,'H']], [['m',0],['m',1],['m',2]] ] },
  E3: { n:4, labels:['|0⟩','|0⟩','|0⟩','|0⟩'], cols:[
        [['box',3,'X']], [['box',0,'H'],['box',1,'H'],['box',2,'H'],['box',3,'H']],
        [['cx',0,3]], [['cx',2,3]], [['box',0,'H'],['box',1,'H'],['box',2,'H']], [['m',0],['m',1],['m',2]] ] },
  E4: { n:3, labels:['|0⟩','|0⟩','|0⟩'], cols:[
        [['box',0,'H'],['box',1,'H'],['box',2,'H']], [['mbox',0,2,'Oracle']], [['mbox',0,2,'Diffuser']] ] },
  E5: { n:4, labels:['|0⟩','|0⟩','|0⟩','|1⟩'], cols:[
        [['box',0,'H'],['box',1,'H'],['box',2,'H']],
        [['cdot',2,3,'U']], [['cdot',1,3,'U²']], [['cdot',0,3,'U⁴']],
        [['mbox',0,2,'QFT†']], [['m',0],['m',1],['m',2]] ] },
  E6: { n:4, labels:['|0⟩','|0⟩','|0⟩','|0⟩'], cols:[
        [['box',0,'H'],['box',1,'H']], [['mbox',0,3,'Uꜰ']],
        [['box',0,'H'],['box',1,'H']], [['m',0],['m',1]] ] },
  E7: { n:2, labels:['|0⟩','|0⟩'], cols:[
        [['box',0,'H']], [['cx',0,1]], [['box',0,'enc']], [['cx',0,1]], [['box',0,'H']], [['m',0],['m',1]] ] },
  E8: { n:6, labels:['|0⟩','|0⟩','|0⟩','|0⟩','|0⟩','|1⟩'], cols:[
        [['box',0,'H'],['box',1,'H']],
        [['cx',1,2]], [['cx',1,4]],
        [['mbox',0,1,'QFT†']], [['m',0],['m',1]] ] },
  E10:{ n:3, labels:['|ψ⟩','|0⟩','|0⟩'], cols:[
        [['box',1,'H']], [['cx',1,2]], [['cx',0,1]], [['box',0,'H']],
        [['m',0],['m',1]], [['ccbox',[0,1],2,'Xᵐ¹Zᵐ⁰']] ] },
};
const CIRCUIT_CAP = {
  E4: 'Repeat ⟨Oracle · Diffuser⟩ √N ≈ 2× for n=3; the card runs 1 and 2 iterations.',
  E5: 'Controlled-U^{2ʲ} write the phase; QFT† reads it into the counting register (q0–q2).',
  A4: 'Dashed lines = classical control: the measured pair (q0,q1) selects the Pauli correction on q2.',
  A5: 'enc = Alice’s encoding on q0: I / X / Z / ZX for the message 00 / 01 / 10 / 11 (here 00 and 11).',
  A3: 'By hand: H · controlled-phase π/2ᵏ · final SWAP (bit reversal). Same as one key: ALL QFT (page 2). QFT† is the inverse.',
  E6: 'Uꜰ writes f(x)=x₀⊕x₁ (invariant under x→x⊕s); the final H⊗² makes every measured y satisfy y·s = 0 (mod 2).',
  E7: 'enc = Alice’s Pauli on q0: I / X / Z / ZX for the messages 00 / 01 / 10 / 11.',
  E8: 'a = 11 → order r = 2. The controlled ×11 mod 15 on the work register is just two CNOTs (it only sends |1⟩↔|11⟩); 11² ≡ 1 so q0 controls nothing. QFT† reads r into q0,q1 → gcd(11±1,15) = {3,5}.',
  E10:'Dashed lines = classical control; the measured pair (q0,q1) selects the Pauli correction on q2 (00→I · 01→X · 10→Z · 11→ZX). Deferring it as controlled gates gives one exact state.',
};
function circuitFig(id){
  const spec = CIRCUITS[id]; if (!spec) return '';
  const cap = CIRCUIT_CAP[id] ? `<figcaption>${esc(CIRCUIT_CAP[id])}</figcaption>` : '';
  return `<figure class="circuit"><span class="circuit-label">circuit</span><div class="circuit-svg">${circuitSVG(spec)}</div>${cap}</figure>`;
}

// v21 — Part III · Classic Algorithms. Each card has 4 consistent sections: Motivation (classical vs
// quantum advantage) · Circuit / key sequence + State at key points (the result blocks) · Result
// (classical interpretation). Pedagogical order is fixed by ALGO_ORDER; states are captured from the
// real interface exactly like the cookbook (anti-AP7: never an invented result).
const ALGO_ORDER = ['E1','E2','E3','E4','E5','E6','E7','E8','E10'];   // v23: E9 (Quantum counting) deferred — needs a controlled-Grover keypad feature (next cycle)
const algoCards = (examples) => {
  const byId = new Map(examples.filter(e=>e.part==='III').map(e=>[e.id,e]));
  return ALGO_ORDER.map(id=>byId.get(id)).filter(Boolean);
};
function renderAlgorithms(examples){
  const algos = algoCards(examples);
  let s = `<section class="part"><h2 class="part-h" id="part-algorithms"><span class="part-n">Part III</span>Classic Algorithms</h2>`;
  s += `<p class="part-lead">The textbook quantum algorithms, each worked end-to-end on the calculator. Every card shows the <b>motivation</b> (the classical cost it beats), the <b>key sequence</b>, the <b>state at the key points</b> — captured from the real screen — and the <b>result</b> with its classical reading. Oracles are typed as literal gate sequences, so you can see them from the inside.</p>`;
  for (const ex of algos){
    s += `<article class="ex algo" id="ex-${ex.id}"><h3><span class="exid">${ex.id}</span>${esc(ex.title)}</h3>`+
      `<p class="why"><span class="why-label">motivation</span>${esc(ex.motivation)}</p>`+
      circuitFig(ex.id)+
      `<div class="results">${ex.results.map(resultBlock).join('')}</div>`+
      `<p class="why algo-result"><span class="why-label">result</span>${esc(ex.result)}</p></article>`;
  }
  s += '</section>';
  return s;
}

// renderManual(examples, referenceSections?) — emite o doc consolidado (Parte I referência + Parte II
// cookbook). referenceSections é opcional: por padrão usa a referência embutida (REFERENCE_HTML); a
// assinatura aceita um override (ex.: testes) mantendo a referência estática como fonte canônica.
export function renderManual(examples, referenceSections = REFERENCE_HTML){
  let body = '';

  // ---- TOC unificado (Parte I referência → Parte II cookbook) ----
  body += '<nav class="toc" id="toc"><span class="block-label">contents</span><div class="toc-grid">';
  body += '<div class="toc-col"><a class="toc-h" href="#part-reference">Part I · Reference</a>';
  for (const [id,n,title] of REFERENCE_TOC) body += `<a href="#${id}"><span class="exid">${n}</span> ${esc(title)}</a>`;
  body += '</div>';
  for (const t of TIERS){
    body += `<div class="toc-col"><a class="toc-h" href="#tier-${t.key}">Part II · ${t.label}</a>`;
    for (const ex of examples.filter(e=>e.tier===t.key)) body += `<a href="#ex-${ex.id}"><span class="exid">${ex.id}</span> ${esc(ex.title)}</a>`;
    body += '</div>';
  }
  body += `<div class="toc-col"><a class="toc-h" href="#part-algorithms">Part III · Classic Algorithms</a>`;
  for (const ex of algoCards(examples)) body += `<a href="#ex-${ex.id}"><span class="exid">${ex.id}</span> ${esc(ex.title)}</a>`;
  body += '</div>';
  body += '</div></nav>';

  // ---- Parte I — Referência (estática) ----
  body += `<section class="part"><h2 class="part-h" id="part-reference"><span class="part-n">Part I</span>Reference</h2>`;
  body += `<p class="part-lead">How the calculator works: display, keypad, the “paper keys” grammar, gates, operations, the symbolic engine and the exactness conventions.</p>`;
  body += referenceSections;
  body += '</section>';

  // ---- Parte II — Cookbook (capturado da tela) ----
  body += `<section class="part"><h2 class="part-h" id="part-cookbook"><span class="part-n">Part II</span>Cookbook</h2>`;
  body += `<p class="part-lead">Worked recipes from <b>basic to advanced</b>. Each example shows the <b>key sequence</b> (from the preparation) and the <b>result exactly as it appears on screen</b> — captured from the real interface.</p>`;
  body += `<div class="legend"><b>How to read.</b> Each recipe shows the <b>key sequence</b> (step 1 is the preparation) and the <b>result exactly as it appears on the calculator screen</b> — captured automatically from the real interface. Notation: <code>n Q</code> selects qubit n; <code>c CTRL t Q CNOT</code> = control c, target t; <code>ALL</code> = all qubits; <code>p2</code> = page 2 (swipe / page-dots / arrow keys); <code>fmt/basis/rad·turns/view</code> = views; <code>=</code> confirms an angle/eigenvalue.</div>`;
  for (const t of TIERS){
    body += `<section><h2 id="tier-${t.key}"><span class="n">${t.n}</span>${t.label}</h2><p class="tier-intro">${t.intro}</p>`;
    for (const ex of examples.filter(e=>e.tier===t.key)){
      body += `<article class="ex" id="ex-${ex.id}"><h3><span class="exid">${ex.id}</span>${esc(ex.title)}</h3>`+
        `<p class="why"><span class="why-label">why</span>${esc(ex.why)}</p>`+
        circuitFig(ex.id)+
        `<div class="results">${ex.results.map(resultBlock).join('')}</div></article>`;
    }
    body += '</section>';
  }
  body += '</section>';

  // ---- Parte III — Classic Algorithms (v21) ----
  body += renderAlgorithms(examples);

  const css = `
  :root{ --bg:#e5dfe9; --card:#f6f2f8; --panel:#fbf8fc; --panel2:#ece4ef; --line:#d7cedb;
    --txt:#2a2230; --muted:#6f6277; --accent:#3f6f9c; --accent2:#2f8f5f; --key:#efe8f1;
    --warn:#c5461f; --err:#bd3a48;
    --lcd-bg:#e9f3eb; --lcd-bg2:#dfece1; --lcd-border:#bad7c4; --lcd-text:#163a26; --lcd-text2:#22513a;
    --code:#eef3ef; --codeln:#cfe0d4; --codetx:#1d4631;
    --mono:'JetBrains Mono','Fira Code',Consolas,monospace; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--txt);font-family:system-ui,Segoe UI,Roboto,sans-serif;font-size:16px;line-height:1.7}
  .wrap{max-width:900px;margin:0 auto;padding:28px 22px 90px}
  html{scroll-behavior:smooth}
  .floatnav{position:fixed;right:14px;bottom:14px;display:flex;flex-direction:column;gap:8px;z-index:50}
  .floatnav a{display:block;font-family:var(--mono);font-size:12.5px;font-weight:600;background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:11px 14px;color:var(--accent);text-align:center;min-width:78px;box-shadow:0 2px 9px rgba(0,0,0,.14);opacity:.93}
  .floatnav a:hover{opacity:1;text-decoration:none;border-color:var(--accent);background:var(--panel2)}
  @media(max-width:560px){ .floatnav{right:10px;bottom:10px;gap:7px} .floatnav a{font-size:12px;padding:10px 12px;min-width:66px} }
  a{color:var(--accent);text-decoration:none} a:hover{text-decoration:underline}
  header{display:flex;align-items:baseline;justify-content:space-between;gap:14px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:14px}
  h1{font-size:26px;margin:0} h1 small{color:var(--muted);font-size:14px;font-weight:400}
  .back{font-family:var(--mono);font-size:13px;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:6px 12px;color:var(--accent);white-space:nowrap}
  .lead{font-size:16.5px;margin:6px 0 18px}
  .block-label{display:block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:6px}
  .legend{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:0 10px 10px 0;padding:14px 18px;margin:14px 0 24px;font-size:14.5px;line-height:1.65}
  .legend code,.tier-intro code{font-family:var(--mono);background:var(--panel2);border:1px solid var(--line);border-radius:5px;padding:1px 6px;font-size:.86em;color:var(--accent2)}
  nav.toc{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 22px;margin:8px 0 22px}
  .toc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
  @media(max-width:720px){.toc-grid{grid-template-columns:1fr}}
  /* v14: ajuste fino p/ celulares (PWA): menos padding, headings/tabelas/pre menores, linhas de resultado empilhadas, quebra de tokens longos */
  @media(max-width:600px){
    .wrap{padding:18px 13px 72px}
    h1{font-size:22px} .part-h{font-size:20px} h2{font-size:18px} h3{font-size:15.5px} .lead{font-size:14.5px}
    body{font-size:15px;line-height:1.6}
    table{font-size:13px} th,td{padding:6px 8px;word-break:break-word}
    pre{font-size:12px;padding:11px 12px}
    .lcd{flex-direction:column;gap:5px;align-items:stretch} .rlabel{min-width:0}
    .ket,pre.out{font-size:15px}
    code{overflow-wrap:anywhere}
    .legend,.note,.why{font-size:13.5px}
  }
  .toc-col a{display:block;padding:3px 0;font-size:13.5px;color:var(--txt)} .toc-col a:hover{color:var(--accent)}
  .toc-h{font-weight:700;color:var(--accent2)!important;border-bottom:1px solid var(--line);margin-bottom:5px;padding-bottom:4px!important}
  .exid{display:inline-block;font-family:var(--mono);font-size:.78em;font-weight:700;color:#fff;background:var(--accent);border-radius:5px;padding:1px 6px;margin-right:8px;vertical-align:1px}
  .part{margin-top:18px}
  .part-h{font-size:25px;margin:30px 0 4px;padding-top:14px;border-top:3px double var(--line);color:#000;display:flex;align-items:baseline;gap:12px}
  .part-n{font-family:var(--mono);font-size:13px;font-weight:700;color:#fff;background:var(--accent2);border-radius:6px;padding:3px 9px}
  .part-lead{color:var(--muted);font-size:15px;margin:0 0 8px}
  h2{font-size:21px;margin:34px 0 8px;padding-top:10px;border-top:2px solid var(--line);color:#000}
  h2 .n{color:var(--accent);font-family:var(--mono);font-size:15px;margin-right:10px}
  h3{font-size:16.5px;margin:20px 0 6px;color:var(--accent2)}
  p{margin:8px 0} ul,ol{margin:8px 0;padding-left:22px} li{margin:4px 0}
  .tier-intro{color:var(--muted);font-size:15px;margin:0 0 14px}
  code{font-family:var(--mono);background:var(--panel2);border:1px solid var(--line);border-radius:5px;padding:1px 6px;font-size:.9em;color:#b5466f}
  pre{font-family:var(--mono);background:var(--code);border:1px solid var(--codeln);border-radius:10px;padding:13px 15px;overflow:auto;font-size:13.5px;line-height:1.55;color:var(--codetx);white-space:pre-wrap}
  pre b{color:#000;font-weight:700} pre .c{color:var(--muted)}
  table{border-collapse:collapse;width:100%;margin:12px 0;font-size:14px}
  th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top}
  th{background:var(--panel2);color:#000;font-weight:600}
  td code{background:var(--panel);font-size:.92em}
  .note{background:var(--panel);border-left:3px solid var(--accent2);border-radius:0 8px 8px 0;padding:9px 14px;margin:12px 0;font-size:14px}
  .note.warn{border-left-color:var(--warn)}
  .key{font-family:var(--mono);background:var(--key);border:1px solid var(--line);border-radius:6px;padding:1px 7px;font-size:.86em;color:var(--accent);white-space:nowrap}
  .sw{display:inline-block;width:11px;height:11px;border-radius:3px;vertical-align:-1px;margin-right:5px;border:1px solid rgba(0,0,0,.18)}
  .ex{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 22px;margin:16px 0;box-shadow:0 1px 3px rgba(42,34,48,.05)}
  .ex h3{margin:0 0 8px;color:#000;font-size:17.5px;font-weight:650}
  .why{margin:0 0 14px;color:var(--txt);font-size:14.5px;line-height:1.7;background:var(--panel);border-left:4px solid var(--accent2);border-radius:0 8px 8px 0;padding:10px 16px}
  .why-label{display:inline-block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:1px;color:var(--accent2);margin-right:8px}
  .algo-result{border-left-color:var(--accent);margin-top:14px}
  .algo-result .why-label{color:var(--accent)}
  .circuit{margin:0 0 16px;padding:12px 14px 10px;background:var(--panel);border:1px solid var(--line);border-radius:10px}
  .circuit-label{display:inline-block;font-family:var(--mono);font-size:10.5px;text-transform:uppercase;letter-spacing:1px;color:var(--accent);margin-bottom:6px}
  .circuit-svg{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .circuit-svg svg{display:block;max-width:100%;height:auto}
  .circuit figcaption{margin-top:8px;font-size:12.5px;color:var(--muted);line-height:1.5}
  .results{display:flex;flex-direction:column;gap:14px}
  .res-block{display:flex;flex-direction:column;gap:8px}
  .keys .block-label{margin-bottom:4px}
  .steps{display:flex;flex-wrap:wrap;align-items:center;gap:4px}
  .steps code{font-family:var(--mono);font-size:13px;background:var(--key);border:1px solid var(--line);border-radius:7px;padding:3px 9px;color:var(--txt)}
  .arrow{color:var(--muted);font-weight:700;margin:0 1px}
  .lcd{background:linear-gradient(180deg,var(--lcd-bg),var(--lcd-bg2));border:1px solid var(--lcd-border);border-radius:10px;padding:12px 16px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;box-shadow:inset 0 1px 3px rgba(22,58,38,.06)}
  .rlabel{flex:0 0 auto;min-width:160px;font-family:var(--mono);font-size:12px;color:var(--lcd-text2)}
  .ket{color:var(--lcd-text);font-size:18px}
  pre.out{margin:0;font-family:var(--mono);font-size:13px;color:var(--lcd-text);background:transparent;border:0;padding:0;white-space:pre-wrap;line-height:1.5}
  footer{margin-top:48px;border-top:1px solid var(--line);padding-top:16px;color:var(--muted);font-size:13px}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Manual — Quantum Calculator</title>
<link rel="stylesheet" href="vendor/katex/katex.min.css">
<style>${css}</style>
</head>
<body>
<nav class="floatnav" aria-label="quick navigation">
  <a href="#toc" title="Back to the index">☰ index</a>
  <a href="quantum_calc.html" title="Back to the calculator">← calc</a>
</nav>
<div class="wrap">
  <header>
    <h1>Quantum Calculator <small>— manual</small></h1>
    <span><a class="back" href="quantum_calc.html">← back to the calculator</a></span>
  </header>
  <p class="lead">Symbolic quantum-state calculator for <b>algebraic manipulation</b> of circuits —
     scientific-calculator-style keypad, <b>exact</b> amplitudes (fractions, √2, π, e^{iθ}) and a
     <b>symbolic</b> engine for abstract kets <code>|ψ⟩</code>. Single file, offline.
     <b>Part I</b> is the reference; <b>Part II</b> is the cookbook of worked examples; <b>Part III</b> walks through the classic quantum algorithms.</p>
${body}
  <footer>Quantum Calculator · manual v23 — Part I reference + Part II cookbook + Part III classic algorithms (${examples.length} worked examples). Each result is captured from the real screen (tests/examples.spec.js). Rendered offline via vendored KaTeX. <a href="quantum_calc.html">← back to the calculator</a>.</footer>
</div>
<script src="vendor/katex/katex.min.js"></script>
<script>
  document.querySelectorAll('.ket').forEach(function(el){
    try { katex.render(el.getAttribute('data-tex'), el, { throwOnError:false, displayMode:false }); }
    catch(e){ el.textContent = el.getAttribute('data-dirac'); }
  });
</script>
</body>
</html>`;
}

// Compat: renderHtml mantém o nome antigo, agora delegando ao consolidado.
export const renderHtml = renderManual;
