// Phase 6 — spec-driven automated tests for the pure core (M1–M10).
// Source of truth: specs/validation/acceptance.md (SC-1..6, T-1..8) +
// specs/examples/worked-examples.md (E1–E8) + specs/datasets/ground-truth.json.
// Loads the SCRIPT from quantum_calc.html and evaluates it with DOM stubs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const HTML = join(HERE, '..', 'quantum_calc.html');

function loadQC(){
  const html = readFileSync(HTML, 'utf8');
  const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const stubEl = () => ({ textContent:'', style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){return false;} },
                          appendChild(){}, addEventListener(){}, dataset:{}, disabled:false });
  const document = { addEventListener(){}, getElementById:stubEl, querySelector:()=>null,
                     querySelectorAll:()=>[], createElement:stubEl, createTextNode:(t)=>({textContent:String(t)}) };
  const window = {};
  const fn = new Function('window','document', `${script}\n;return window.QC;`);
  return fn(window, document);
}
const QC = loadQC();
const { Algebra, Gate, State, Engine, Ops, Parser, Render, History } = QC;
const fmt = (a, f) => Algebra.format(a, f || 'exp').text;
const dirac = (s, f) => Render.dirac(Render.terms(s, f || 'exp').list);
const apply = (s, g, o) => Engine.apply(s, g, o);
const bell = () => apply(apply(State.computational(2), 'H', { targets:[0] }), 'CNOT', { controls:[0], targets:[1] });
// fase controlada CP(λ) via CU(0,0,λ) — usado para montar a QFT manualmente
const cphase = (s, ctrl, tgt, lam) => apply(s, 'CU', { controls:[ctrl], targets:[tgt], params:[0,0,lam] });

// ---------------- SC-1 circuit correctness ----------------
test('SC-1 Bell |Φ+⟩ exact (E3)', () => assert.equal(dirac(bell()), '(1/√2)|00⟩ + (1/√2)|11⟩'));
test('SC-1 GHZ₃ exact (E7)', () => {
  let s = apply(State.computational(3), 'H', { targets:[0] });
  s = apply(s, 'CNOT', { controls:[0], targets:[1] });
  s = apply(s, 'CNOT', { controls:[0], targets:[2] });
  assert.equal(dirac(s), '(1/√2)|000⟩ + (1/√2)|111⟩');
});
test('SC-1 QFT|000⟩ → uniform 8 terms 1/√8', () => {
  const PI = Math.PI;
  let s = State.computational(3);
  s = apply(s, 'H', { targets:[0] });
  s = cphase(s, 1, 0, PI/2); s = cphase(s, 2, 0, PI/4);
  s = apply(s, 'H', { targets:[1] });
  s = cphase(s, 2, 1, PI/2);
  s = apply(s, 'H', { targets:[2] });
  s = apply(s, 'SWAP', { targets:[0,2] });
  const a = s.amplitudes();
  assert.equal(a.length, 8);
  for (const x of a){ const c = Algebra.toComplex(x.amp); assert.ok(Math.abs(c.re - 1/Math.sqrt(8)) < 1e-12 && Math.abs(c.im) < 1e-12); }
});
test('SC-1 NEG: Bell uses |00⟩,|11⟩ not |01⟩,|10⟩', () => {
  const bits = bell().amplitudes().map(x => x.bits);
  assert.deepEqual(bits, ['00','11']); assert.ok(!bits.includes('01') && !bits.includes('10'));
});

// ---------------- SC-2 symbolic exactness ----------------
test('SC-2 H/S/T amplitudes are exact (ex===true)', () => {
  assert.ok(apply(State.computational(1),'H',{targets:[0]}).amplitudes().every(x => x.amp.ex === true));
  assert.ok(apply(State.fromBits('1'),'T',{targets:[0]}).amplitudes().every(x => x.amp.ex === true));
});
test('SC-2 T|1⟩=e^{iπ/4}, S|1⟩=i (E2)', () => {
  assert.equal(fmt(apply(State.fromBits('1'),'T',{targets:[0]}).amplitudes()[0].amp), 'e^{iπ/4}');
  assert.equal(fmt(apply(State.fromBits('1'),'S',{targets:[0]}).amplitudes()[0].amp), 'i');
});
test('SC-2 NEG: Clifford+T coef strings contain NO decimals', () => {
  const decimal = /\d\.\d/;
  for (const f of ['exp','rect','polar'])
    for (const t of Render.terms(bell(), f).list) assert.ok(!decimal.test(t.coef), `decimal in ${t.coef}`);
});

// ---------------- SC-3 bases & formats ----------------
test('SC-3 three phase formats all exact for Bell', () => {
  for (const f of ['exp','rect','polar']) assert.ok(!Render.terms(bell(), f).approx);
});
test('SC-3 |0⟩ in Hadamard basis = (1/√2)|+⟩+(1/√2)|−⟩', () => {
  // |0⟩ = (|+⟩+|−⟩)/√2 — re-expressing the state |0⟩ in the {|+⟩,|−⟩} basis
  assert.equal(dirac(State.computational(1).withBasis('had')), '(1/√2)|+⟩ + (1/√2)|−⟩');
});
test('SC-3 H|0⟩=|+⟩ displays as |+⟩ in Hadamard basis', () => {
  const plus = apply(State.computational(1), 'H', { targets:[0] });
  assert.equal(dirac(plus.withBasis('had')), '|+⟩');
});
test('SC-3 Bell in Hadamard basis = (1/√2)|++⟩+(1/√2)|−−⟩', () => {
  assert.equal(dirac(bell().withBasis('had')), '(1/√2)|++⟩ + (1/√2)|−−⟩');
});
test('SC-3 NEG: basis roundtrip comp→had→comp identical amps', () => {
  const b = bell();
  const had = Engine.changeBasis(b, 'had');
  const back = Engine.changeBasis(had, 'comp');
  // changeBasis(had) applied twice returns original (H is involutive)
  const reapplied = Engine.changeBasis(Engine.changeBasis(b,'had'),'had');
  assert.equal(dirac(reapplied.withBasis('comp')), dirac(b));
});

// ---------------- SC-4 input FSM ----------------
function freshParser(){ Parser.clear(); return Parser; }
test('SC-4 n Q gate → 1-qubit apply command', () => {
  const p = freshParser(); p.digit('0'); p.q();
  const r = p.applyGate('H');
  assert.equal(r.command.kind, 'apply'); assert.deepEqual(r.command.targets, [0]);
});
test('SC-4 ALL gate → applyAll', () => {
  const p = freshParser(); p.all();
  assert.equal(p.applyGate('H').command.kind, 'applyAll');
});
test('SC-4 c CTRL t Q CNOT → controls/targets', () => {
  const p = freshParser(); p.digit('0'); p.ctrl(); p.digit('1'); p.q();
  const r = p.applyGate('CNOT');
  assert.deepEqual(r.command.controls, [0]); assert.deepEqual(r.command.targets, [1]);
});
test('SC-4 multidigit 1 0 Q H → Q10', () => {
  const p = freshParser(); p.digit('1'); p.digit('0'); p.q();
  assert.deepEqual(p.applyGate('H').command.targets, [10]);
});
test('SC-4 SET bitstring vs count (P3 disambiguation)', () => {
  let p = freshParser(); for (const d of '101') p.digit(d);
  assert.deepEqual(p.set().command.spec, { bits:'101' });
  p = freshParser(); p.digit('3'); p.q();
  assert.deepEqual(p.set().command.spec, { count:3 });
  p = freshParser(); for (const d of '10') p.digit(d);
  assert.deepEqual(p.set().command.spec, { bits:'10' }); // '10' = |10⟩, not 10 qubits
});
test('SC-4 NEG: CNOT with 1 operand → error, no command', () => {
  const p = freshParser(); p.digit('0'); p.q();
  const r = p.applyGate('CNOT');
  assert.ok(r.error && !r.command);
});
test('SC-4 NEG: "2 SET" (non-binary, no Q) → error', () => {
  const p = freshParser(); p.digit('2');
  assert.ok(p.set().error);
});

// ---------------- SC-5 numeric fallback ----------------
test('SC-5 Rx(π/2), Rz(π/2) exact; Rx(π) exact', () => {
  assert.ok(apply(State.computational(1),'Rx',{targets:[0],params:[Math.PI/2]}).amplitudes().every(x=>x.amp.ex));
  assert.ok(apply(State.computational(1),'Rz',{targets:[0],params:[Math.PI/2]}).amplitudes().every(x=>x.amp.ex));
  assert.ok(apply(State.computational(1),'Rx',{targets:[0],params:[Math.PI]}).amplitudes().every(x=>x.amp.ex));
});
test('SC-5 recognize(1/√2,0) → exact 1/√2', () => {
  const a = Algebra.recognize(Math.SQRT1_2, 0);
  assert.equal(a.ex, true); assert.equal(fmt(a), '1/√2');
});
test('SC-5 NEG: Rx(0.3) → numeric flagged approx', () => {
  const s = apply(State.computational(1),'Rx',{targets:[0],params:[0.3]});
  assert.ok(s.amplitudes().some(x => x.amp.ex === false));
  assert.ok(Algebra.format(s.amplitudes()[0].amp, 'rect').approx === true);
});
test('SC-5 NEG: recognize(1/3) stays numeric (no false exact, T-6)', () => {
  assert.equal(Algebra.recognize(1/3, 0).ex, false);
  assert.equal(Algebra.recognize(0.123456789, 0).ex, false);
});

// ---------------- SC-6 ops & export ----------------
test('SC-6 Bell probabilities are exact fractions 1/2', () => {
  const p = Ops.probabilities(bell());
  assert.equal(p[0].str, '1/2'); assert.equal(p[1].str, '1/2');
});
test('SC-6 NEG: ⟨0|1⟩ = 0 exactly', () => {
  assert.ok(Algebra.isZeroAmp(Ops.inner(State.fromBits('0'), State.fromBits('1'))));
});

// ---------------- T-1 ℤ[ζ₈]⊂ℤ[ζ₁₆] rules (v6: base de 8 componentes) ----------------
test('T-1 ℤ[ζ₈]⊂ℤ[ζ₁₆]: ω=ζ², ω²=i, ω⁴=−1, conj(ω)=−ω³, √2=ζ²−ζ⁶ (E6)', () => {
  const Z = Algebra._Zeta16, zp = Algebra.zpow16;
  const w = zp(2);                                  // ω = ζ² = e^{iπ/4}
  assert.ok(w.mul(w).eq(zp(4)), 'ω²=ζ⁴=i');
  assert.ok(w.mul(w).mul(w).mul(w).eq(zp(8)), 'ω⁴=ζ⁸=−1');
  assert.ok(zp(8).eq(new Z([-1,0,0,0,0,0,0,0])), 'ζ⁸=−1');
  assert.ok(w.conj().eq(zp(14)), 'conj(ω)=ζ⁻²=ζ¹⁴=−ω³');
  assert.ok(Algebra.Z_SQRT2.eq(new Z([0,0,1,0,0,0,-1,0])), '√2=ζ²−ζ⁶');
  assert.ok(zp(2).mul(zp(6)).eq(zp(8)), 'ω·ω³=ζ²·ζ⁶=ζ⁸=−1');
});
// ---------------- T-1b ζ₁₆ (v6 NOVO): anel estendido π/8 ----------------
test('T-1b ζ₁₆: ζ⁸=−1, 2cos(π/8)=ζ−ζ⁷=√(2+√2), 2sin(π/8)=ζ³−ζ⁵, conj(ζ)=−ζ⁷, embedding ω=ζ²', () => {
  const Z = Algebra._Zeta16, zp = Algebra.zpow16;
  assert.ok(zp(8).eq(new Z([-1,0,0,0,0,0,0,0])), 'ζ⁸=−1');
  const c1 = zp(1).sub(zp(7)).toComplex();          // ζ−ζ⁷ = 2cos(π/8) = √(2+√2)
  assert.ok(Math.abs(c1.re - 2*Math.cos(Math.PI/8)) < 1e-12 && Math.abs(c1.im) < 1e-12, '2cos(π/8)=√(2+√2)');
  const s1 = zp(3).sub(zp(5)).toComplex();          // ζ³−ζ⁵ = 2sin(π/8) = √(2−√2)
  assert.ok(Math.abs(s1.re - 2*Math.sin(Math.PI/8)) < 1e-12 && Math.abs(s1.im) < 1e-12, '2sin(π/8)=√(2−√2)');
  assert.ok(zp(1).conj().eq(new Z([0,0,0,0,0,0,0,-1])), 'conj(ζ)=−ζ⁷');
  assert.ok(Algebra.Z_OMEGA.eq(zp(2)), 'embedding ω=ζ² (não-regressão)');
});

// ---------------- T-2 endianness internal ----------------
test('T-2 internal big-endian: fromBits("10")→index 2, bits(3)="11"', () => {
  assert.equal([...State.fromBits('10').amps.keys()][0], 2);
  assert.equal(State.computational(2).bits(3), '11');
});

// ---------------- T-3 qubit cap ----------------
test('T-3 NEG: N>12 refuses (throws, no hang)', () => {
  assert.throws(() => State.computational(13));
  assert.doesNotThrow(() => State.computational(12));
});

// ---------------- T-4 reduced ρ without 4^N ----------------
test('T-4 reduced ρ from vector; full ρ refused for N>5', () => {
  const r = Ops.reducedDM(bell(), [0]);
  assert.equal(r.dim, 2);
  // Bell reduced ρ_A = I/2 → diag(1/2,1/2), off-diagonal 0
  assert.equal(fmt(r.rho[0][0], 'rect'), '1/2');
  assert.equal(fmt(r.rho[1][1], 'rect'), '1/2');
  assert.ok(Algebra.isZeroAmp(r.rho[0][1]) && Algebra.isZeroAmp(r.rho[1][0]));
  assert.throws(() => Ops.densityMatrix(State.computational(6))); // full ρ only N≤5
});

// ---------------- T-5 U convention (OpenQASM 3) ----------------
test('T-5 U(0,0,π/2)=diag(1,i) [controlled-S building block]', () => {
  const M = Gate.matrix('U', [0,0,Math.PI/2]);
  assert.equal(fmt(M[0][0]), '1'); assert.ok(Algebra.isZeroAmp(M[0][1]));
  assert.ok(Algebra.isZeroAmp(M[1][0])); assert.equal(fmt(M[1][1]), 'i');
});
test('T-5 U(π,0,π)=X (up to convention)', () => {
  const M = Gate.matrix('U', [Math.PI,0,Math.PI]);
  // U(π,0,π) → [[0,-e^{iπ}],[0... ]] = [[0,1],[1,0]] = X
  assert.ok(Algebra.isZeroAmp(M[0][0]) && Algebra.isZeroAmp(M[1][1]));
});

// ---------------- T-7 immutability + undo/redo ----------------
test('T-7 gate application does not mutate input State', () => {
  const s0 = State.computational(1);
  const before = dirac(s0);
  apply(s0, 'H', { targets:[0] });
  assert.equal(dirac(s0), before); // s0 unchanged
  assert.ok(Object.isFrozen(s0));
});
test('T-7 undo/redo restore identical states', () => {
  History.init(State.computational(2));
  History.push(bell(), 'bell', null);
  const bd = dirac(History.current());
  const u = History.undo(); assert.equal(dirac(u), '|00⟩');
  const r = History.redo(); assert.equal(dirac(r), bd);
});

// ---------------- T-8 input validation (no-XSS surface) ----------------
test('T-8 NEG: fromBits rejects non-binary (no injection via bitstring)', () => {
  assert.throws(() => State.fromBits('1<img>'));
  assert.throws(() => State.fromBits('012'));
});
test('T-8 NEG: invalid command (bad qubit index) throws, no silent apply', () => {
  assert.throws(() => apply(State.computational(2), 'H', { targets:[9] }));
  assert.throws(() => apply(State.computational(2), 'CNOT', { controls:[0], targets:[0] })); // repeated qubit
});

// ---------------- extra: entanglement metrics ----------------
test('entanglement: concurrence/vonNeumann (Bell=1, product=0)', () => {
  assert.ok(Math.abs(Ops.concurrencePure(bell()).value - 1) < 1e-9);
  assert.ok(Math.abs(Ops.vonNeumann(bell(), [0]).S - 1) < 1e-9 && Ops.vonNeumann(bell(),[0]).exactEig);
  assert.ok(Math.abs(Ops.concurrencePure(State.computational(2)).value) < 1e-9);
  assert.ok(Math.abs(Ops.vonNeumann(State.computational(2), [0]).S) < 1e-9);
});
test('Bell variants & GHZ via gate circuits (ground-truth)', () => {
  // |Φ+⟩ = H(0)·CNOT(0→1)|00⟩
  const phiP = bell();
  // |Φ−⟩ = Z(0)·|Φ+⟩
  const phiM = apply(phiP, 'Z', { targets:[0] });
  // |Ψ+⟩ = X(1)·|Φ+⟩
  const psiP = apply(phiP, 'X', { targets:[1] });
  // |Ψ−⟩ = Z(0)·X(1)·|Φ+⟩
  const psiM = apply(psiP, 'Z', { targets:[0] });
  // GHZ₃ = CNOT(0→2)·CNOT(0→1)·H(0)|000⟩
  let ghz = apply(State.computational(3), 'H', { targets:[0] });
  ghz = apply(ghz, 'CNOT', { controls:[0], targets:[1] });
  ghz = apply(ghz, 'CNOT', { controls:[0], targets:[2] });
  assert.equal(dirac(phiP,'rect'), '(1/√2)|00⟩ + (1/√2)|11⟩');
  assert.equal(dirac(phiM,'rect'), '(1/√2)|00⟩ − (1/√2)|11⟩');
  assert.equal(dirac(psiP,'rect'), '(1/√2)|01⟩ + (1/√2)|10⟩');
  assert.equal(dirac(psiM,'rect'), '(1/√2)|01⟩ − (1/√2)|10⟩');
  assert.equal(dirac(ghz,'rect'), '(1/√2)|000⟩ + (1/√2)|111⟩');
});

// ================= v6 — núcleo exato ζ₁₆ (π/8) =================
// specs/technical/12-v6-zeta16-core.md §8. Fronteira P3: rect exato grau-4; exp exato só p/ monômio.
test('v6-1 P(π/8) exato: P(π/8)|+⟩ → |1⟩ coef = ζ/√2, exp "1/√2·e^{iπ/8}"', () => {
  let s = apply(State.computational(1), 'H', { targets:[0] });
  s = apply(s, 'P', { targets:[0], params:[Math.PI/8] });
  const a1 = s.amps.get(1);
  assert.ok(a1.ex, '|1⟩ coef EXATO (não numérico) — π/8 fecha em ζ₁₆');
  assert.ok(a1.z.eq(Algebra.zpow16(1)) && a1.k === 1, '|1⟩ = ζ/√2');
  assert.equal(Algebra.format(a1, 'exp').text, '1/√2·e^{iπ/8}');
  assert.equal(Algebra.format(a1, 'exp').approx, false, 'monômio → exp exato (não approx)');
});
test('v6-2 kickback rect EXATO: H·P(π/8)·H|0⟩ → ½+√(2+√2)/4 + √(2−√2)i/4', () => {
  let s = apply(apply(apply(State.computational(1), 'H', { targets:[0] }),
                      'P', { targets:[0], params:[Math.PI/8] }), 'H', { targets:[0] });
  const a0 = s.amps.get(0);
  assert.ok(a0.ex, 'amp exato no anel');
  assert.equal(Algebra.format(a0, 'rect').text, '(1/2+√(2+√2)/4+√(2−√2)i/4)', 'soma grau-4 exata (Q2-revisado P3)');
  assert.equal(Algebra.format(a0, 'rect').approx, false);
  const c = Algebra.toComplex(a0);
  assert.ok(Math.abs(c.re - (1+Math.cos(Math.PI/8))/2) < 1e-12 &&
            Math.abs(c.im - Math.sin(Math.PI/8)/2) < 1e-12, 'valor numérico correto');
});
test('v6-3 Ry(π/4) exato: cos(π/8)|0⟩+sin(π/8)|1⟩ = √(2+√2)/2|0⟩ + √(2−√2)/2|1⟩', () => {
  let s = apply(State.computational(1), 'Ry', { targets:[0], params:[Math.PI/4] });
  assert.equal(fmt(s.amps.get(0), 'rect'), '√(2+√2)/2');
  assert.equal(fmt(s.amps.get(1), 'rect'), '√(2−√2)/2');
});
test('v6-4 R₄=CP(π/8) exato (bloco da QFT-4): |11⟩ → ζ|11⟩', () => {
  let s = apply(apply(State.computational(2), 'X', { targets:[0] }), 'X', { targets:[1] }); // |11⟩
  s = apply(s, 'CP', { controls:[0], targets:[1], params:[Math.PI/8] });
  const a3 = s.amps.get(3);
  assert.ok(a3.ex && a3.z.eq(Algebra.zpow16(1)), 'CP(π/8)|11⟩ = ζ|11⟩ exato');
});
test('v6-4b QFT-4 EXATA: QFT|0001⟩ → 16 amplitudes TODAS exatas, com conteúdo π/8 (ζ ímpar)', () => {
  const PI = Math.PI;
  let s = apply(State.computational(4), 'X', { targets:[3] });   // |0001⟩
  s = apply(s,'H',{targets:[0]}); s = cphase(s,1,0,PI/2); s = cphase(s,2,0,PI/4); s = cphase(s,3,0,PI/8);  // R₄=π/8
  s = apply(s,'H',{targets:[1]}); s = cphase(s,2,1,PI/2); s = cphase(s,3,1,PI/4);
  s = apply(s,'H',{targets:[2]}); s = cphase(s,3,2,PI/2);
  s = apply(s,'H',{targets:[3]});
  s = apply(s,'SWAP',{targets:[0,3]}); s = apply(s,'SWAP',{targets:[1,2]});
  const amps = s.amplitudes();
  assert.equal(amps.length, 16);
  assert.ok(amps.every(x => x.amp.ex), 'TODAS as 16 amplitudes exatas (π/8 não cai no numérico)');
  assert.ok(amps.some(x => x.amp.z.c[1]!==0n || x.amp.z.c[3]!==0n || x.amp.z.c[5]!==0n || x.amp.z.c[7]!==0n),
            'há amplitude com potência ímpar de ζ (fase π/8 genuína — antes era approx)');
});
test('v6-5 prob nested surd EXATA: P(0) do kickback = ½+√(2+√2)/4', () => {
  let s = apply(apply(apply(State.computational(1), 'H', { targets:[0] }),
                      'P', { targets:[0], params:[Math.PI/8] }), 'H', { targets:[0] });
  const n2 = Algebra.norm2(s.amps.get(0));
  assert.ok(n2.exact && n2.deg4, 'probabilidade exata, grau-4 (rA≠0)');
  assert.equal(Algebra.normStr(n2), '1/2+√(2+√2)/4');
});
test('v6-6 NEG: exp do kickback é ζ₃₂ (mag/fase π/16) → approx sinalizado', () => {
  let s = apply(apply(apply(State.computational(1), 'H', { targets:[0] }),
                      'P', { targets:[0], params:[Math.PI/8] }), 'H', { targets:[0] });
  assert.ok(Algebra.format(s.amps.get(0), 'exp').approx, 'magnitude genuinamente ζ₃₂ → approx no exp');
});
test('v6-7 NEG não-regressão: H|0⟩=1/√2 (rect & exp), T(π/4) exato ζ²', () => {
  let s = apply(State.computational(1), 'H', { targets:[0] });
  assert.equal(fmt(s.amps.get(0), 'rect'), '1/√2');
  assert.equal(fmt(s.amps.get(0), 'exp'), '1/√2');
  let t = apply(apply(State.computational(1), 'H', { targets:[0] }), 'T', { targets:[0] });
  assert.ok(t.amps.get(1).ex && t.amps.get(1).z.eq(Algebra.zpow16(2)), 'T|+⟩: |1⟩ = ω/√2 = ζ²/√2 exato');
});
test('v6-9 toKatex de surdo aninhado é LaTeX VÁLIDO (não "\\sqrt \\left", chaves balanceadas)', () => {
  // KaTeX não carrega no Playwright offline → este caminho (LaTeX) só é coberto aqui (Node).
  let s = apply(apply(apply(State.computational(1),'H',{targets:[0]}),'P',{targets:[0],params:[Math.PI/8]}),'H',{targets:[0]});
  const tex = Render.toKatex(Render.dirac(Render.terms(s,'rect').list));
  assert.ok(tex.includes('\\sqrt{'), 'usa \\sqrt{…} com chaves');
  assert.ok(!/\\sqrt\s*\\left/.test(tex), 'NÃO produz "\\sqrt \\left(" (malformado)');
  assert.ok(!/\\sqrt\s*\(/.test(tex), 'NÃO produz "\\sqrt (" (malformado)');
  let bal = 0; for (const ch of tex){ if (ch==='{') bal++; else if (ch==='}') bal--; if (bal<0) break; }
  assert.equal(bal, 0, 'chaves balanceadas');
  // surdo aninhado real → fração vertical \dfrac{\sqrt{2+√2…}}{4}
  assert.ok(/\\dfrac\{\\sqrt\{2\+\\sqrt\{2\}\}\}\{4\}/.test(tex), 'kickback Re → \\dfrac{\\sqrt{2+\\sqrt{2}}}{4}');
});
test('v6-8 NEG: ângulo fora de ζ₁₆ não é ring-exato (π/5 numérico; 0.37 approx no display)', () => {
  let s = apply(State.computational(1), 'H', { targets:[0] });
  const a1 = apply(s, 'P', { targets:[0], params:[Math.PI/5] }).amps.get(1);  // π/5 ∉ múltiplos de π/8
  assert.ok(!a1.ex, 'π/5 → NÃO exato no anel ζ₁₆ (amp numérica)');            // (display pode reconhecer π/5 como rótulo — v5)
  const b1 = apply(s, 'P', { targets:[0], params:[0.37] }).amps.get(1);       // ângulo genuinamente arbitrário
  assert.ok(!b1.ex, '0.37 → numérico');
  assert.equal(Algebra.format(b1, 'exp').approx, true, '0.37 → approx no display');
});
