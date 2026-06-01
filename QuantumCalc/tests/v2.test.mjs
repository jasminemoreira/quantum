// Phase 6 (v2) — calc engine (M12), expectation (M5Δ), algebra ext (M1Δ).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
function loadQC(){
  const html = readFileSync(join(HERE,'..','quantum_calc.html'),'utf8');
  const script = html.slice(html.indexOf('<script>')+8, html.lastIndexOf('</script>'));
  const stub = () => ({ textContent:'', style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false;}}, appendChild(){}, addEventListener(){}, dataset:{}, disabled:false, hidden:false });
  const document = { addEventListener(){}, getElementById:stub, querySelector:()=>null, querySelectorAll:()=>[], createElement:stub, createTextNode:(t)=>({textContent:String(t)}) };
  const window = {};
  return new Function('window','document',`${script}\n;return window.QC;`)(window, document);
}
const QC = loadQC();
const { Algebra, State, Engine, Ops, Calc, Bloch, Keymap } = QC;
const fmt = (a,f)=>Algebra.format(a, f||'rect').text.replace(/−/g,'-');
const bell = () => Engine.apply(Engine.apply(State.computational(2),'H',{targets:[0]}),'CNOT',{controls:[0],targets:[1]});
const evl = (e, ctx) => Calc.evaluate(e, ctx);

// ---- M1Δ DIV/POW ----
test('M1Δ DIV exact: 1/√2', () => { const r = Algebra.DIV(Algebra.ONE, Algebra.recognize(Math.SQRT2,0)); assert.equal(r.ex, true); assert.equal(fmt(r),'1/√2'); });
test('M1Δ DIV by zero throws', () => assert.throws(()=>Algebra.DIV(Algebra.ONE, Algebra.ZERO)));
test('M1Δ POW integer exact: i^2 = -1', () => { const r = Algebra.POW(Algebra.IMAG,2); assert.equal(r.ex,true); assert.equal(fmt(r),'-1'); });

// ---- M12 calc: arithmetic ----
test('calc 1+2*3 = 7 (precedência)', () => { const r=evl('1+2*3'); assert.ok(!r.error); assert.equal(fmt(r.value),'7'); });
test('calc (1+2)*3 = 9', () => assert.equal(fmt(evl('(1+2)*3').value),'9'));
test('calc 2^3 = 8', () => assert.equal(fmt(evl('2^3').value),'8'));
test('calc -2^2 = -4 (menos unário < ^)', () => assert.equal(fmt(evl('-2^2').value),'-4'));
test('calc √2 exact', () => { const r=evl('√(2)'); assert.equal(r.value.ex,true); assert.equal(fmt(r.value),'√2'); });
test('calc i*i = -1 exact', () => assert.equal(fmt(evl('i*i').value),'-1'));
test('calc 1/√(2) exact = 1/√2', () => { const r=evl('1/√(2)'); assert.equal(r.value.ex,true); assert.equal(fmt(r.value),'1/√2'); });
test('calc cos(π/4) recognized = 1/√2', () => { const r=evl('cos(π/4)'); assert.equal(fmt(r.value),'1/√2'); });
test('calc (1+√(2))/2 exact', () => { const r=evl('(1+√(2))/2'); assert.equal(r.value.ex,true); });
test('calc NEG: 1/3 → numeric approx', () => { const r=evl('1/3'); assert.equal(r.value.ex,false); assert.equal(r.approx,true); });
test('calc NEG: 1/0 → error', () => { const r=evl('1/0'); assert.ok(r.error); });
test('calc NEG: bad token → error', () => { const r=evl('foo(2)'); assert.ok(r.error); });
test('calc NEG: unbalanced paren → error', () => { const r=evl('(1+2'); assert.ok(r.error); });

// ---- M12 calc: state refs (over the state) ----
function ctxFor(s){
  return { n:s.n,
    amp:(b)=>{ if(b.length!==s.n) throw new Error('bits'); return s.amps.get(parseInt(b,2))||Algebra.ZERO; },
    prob:(b)=>{ if(b.length!==s.n) throw new Error('bits'); const a=s.amps.get(parseInt(b,2))||Algebra.ZERO; return Algebra.norm2(a); },
    ev:(O,q)=>Ops.expectation(s,O,q),
    norm:()=>Algebra.fromNumber(Math.sqrt(Ops.n2Value(Ops.norm(s)))) };
}
test('calc P(11) on Bell = 1/2', () => { const r=evl('P(11)', ctxFor(bell())); assert.ok(!r.error); assert.equal(fmt(r.value),'1/2'); });
test('calc amp[00] on Bell = 1/√2', () => { const r=evl('amp[00]', ctxFor(bell())); assert.equal(fmt(r.value),'1/√2'); });
test('calc EV(Z,0) on Bell = 0', () => { const r=evl('EV(Z,0)', ctxFor(bell())); assert.ok(Algebra.isZeroAmp(r.value)); });
test('calc norm on Bell = 1', () => { const r=evl('norm', ctxFor(bell())); assert.equal(fmt(r.value),'1'); });
test('calc P(00)+P(11) on Bell = 1', () => { const r=evl('P(00)+P(11)', ctxFor(bell())); assert.equal(fmt(r.value),'1'); });
test('calc NEG: amp[0] wrong length → error', () => { const r=evl('amp[0]', ctxFor(bell())); assert.ok(r.error); });

// ---- M5Δ expectation ----
test('expectation ⟨Z⟩ on |0⟩ = 1', () => assert.equal(fmt(Ops.expectation(State.fromBits('0'),'Z',0)),'1'));
test('expectation ⟨Z⟩ on |1⟩ = -1', () => assert.equal(fmt(Ops.expectation(State.fromBits('1'),'Z',0)),'-1'));
test('expectation ⟨X⟩ on |+⟩ = 1', () => { const plus=Engine.apply(State.computational(1),'H',{targets:[0]}); assert.equal(fmt(Ops.expectation(plus,'X',0)),'1'); });
test('expectation NEG: bad observable → throw', () => assert.throws(()=>Ops.expectation(State.computational(1),'W',0)));

// ---- M14 keymap ----
test('keymap paginado (v14): comando fixo + 2 páginas + faixa de vistas', () => {
  assert.deepEqual(Keymap.MODES, ['quantum','calc']);
  const lay = Keymap.layout('quantum', 0);
  // estrutura v14: { strip:[[action,label,cls]], command:{label,n,keys}, pages:[{L:[grupos],R:grupo|null}, ...] }
  assert.ok(lay.strip && lay.command && Array.isArray(lay.pages) && lay.pages.length === 2);
  const zoneActs = (z) => !z ? [] : Array.isArray(z) ? z.flatMap(g => g.keys.map(k => k[0])) : z.keys.map(k => k[0]);   // v22-6: pg.R pode ser array (pág2 = 2 colunas)
  const pageActs = (pg) => pg.L.flatMap(g => g.keys.map(k => k[0])).concat(zoneActs(pg.R));
  const cmd = lay.command.keys.map(k => k[0]);
  const p0 = pageActs(lay.pages[0]);   // paleta frequente + numérico
  const p1 = pageActs(lay.pages[1]);   // cauda longa
  const strip = lay.strip.map(s => s[0]);
  // v14: comando FIXO com M (op:saveBra) no slot que o '2nd' liberou; tecla 'shift'/'2nd' REMOVIDA
  assert.ok(cmd.includes('op:saveBra'), 'M no comando fixo');
  assert.ok(!cmd.includes('shift'), "tecla '2nd'/shift removida do comando");
  assert.ok(cmd.includes('key:ALL') && cmd.includes('key:Q') && cmd.includes('key:SET'));
  // numérico (pág0.R) já NÃO tem M
  assert.ok(zoneActs(lay.pages[0].R).includes('key:7') && !zoneActs(lay.pages[0].R).includes('op:saveBra'), 'numérico na pág0, sem M');
  // página 0 = frequentes (gates/kets/controlled/operations)
  assert.ok(p0.includes('gate:H') && p0.includes('gate:CP') && p0.includes('op:inner') && p0.includes('gate:Rx'));   // ⟨φ|ψ⟩ no primário
  assert.ok(p0.includes('op:tensor') && !p0.includes('op:norm') && !p0.includes('evidence'));   // ⊗ no primário; ‖ψ‖/factor na pág2
  assert.ok(!p0.includes('gate:SWAP') && !p0.includes('op:schmidt'));   // cauda longa fora da pág0
  // página 1 = cauda longa em 2 COLUNAS (v22-6: L=input+operations · R=variants+2q+presets), SEM dígitos
  assert.ok(Array.isArray(lay.pages[1].R), 'pág2 tem coluna direita (array de grupos)');
  assert.ok(p1.includes('gate:SWAP') && p1.includes('op:schmidt') && p1.includes('gate:U') && p1.includes('op:norm') && p1.includes('evidence'));
  assert.ok(p1.includes('input:T') && p1.includes('input:rand') && p1.includes('input:amp'), 'grupo input na pág2');
  assert.ok(!p1.some(a => /^key:[0-9]$/.test(a)), 'pág2 sem dígitos');
  // M está SÓ no comando fixo (não nas páginas) — visível nas 2 páginas por ser fixo
  assert.ok(!p0.includes('op:saveBra') && !p1.includes('op:saveBra'));
  // faixa de vistas: ações + labels desambiguados (v14)
  assert.deepEqual(strip, ['chbase','fmtcycle','angcycle','viewform']);
  assert.deepEqual(lay.strip.map(s => s[1]), ['basis','fmt','rad/trn','view']);
  // calc mantém a forma de 2 colunas (sem paginação)
  const calc = Keymap.layout('calc');
  assert.ok(calc.cols && !calc.pages);
});

// ---- M13 bloch (smoke: render runs with a fake canvas) ----
test('bloch render runs on fake 2D context', () => {
  const calls=[]; const ctx={ clearRect(){}, beginPath(){}, arc(){}, ellipse(){}, moveTo(){}, lineTo(){}, stroke(){}, fill(){}, fillText(){}, setTransform(){}, scale(){}, set strokeStyle(v){}, set fillStyle(v){}, set lineWidth(v){}, set font(v){}, set globalAlpha(v){} };
  const canvas={ width:300, height:250, getContext:()=>ctx };
  const bb=Ops.blochVector(State.fromBits("0"),0);
  const b={x:Algebra.toComplex(bb.x).re,y:Algebra.toComplex(bb.y).re,z:Algebra.toComplex(bb.z).re,r:bb.r};
  assert.doesNotThrow(()=>Bloch.render(canvas, b));
  assert.ok(Math.abs(b.z-1)<1e-9 && Math.abs(b.r-1)<1e-9);
});

// ---- CP (=CU1/controlled phase) + CRz ----
test('CP(π/2) on |11⟩ = i|11⟩ (fase controlada)', () => {
  const r = Engine.apply(State.fromBits('11'),'CP',{controls:[0],targets:[1],params:[Math.PI/2]});
  assert.equal(r.amplitudes()[0].bits,'11'); assert.equal(fmt(r.amplitudes()[0].amp,'exp'),'i');
});
test('CP(π) == CZ on |11⟩ → −|11⟩', () => {
  assert.equal(fmt(Engine.apply(State.fromBits('11'),'CP',{controls:[0],targets:[1],params:[Math.PI]}).amplitudes()[0].amp),'-1');
});
test('CP NEG: nada quando controle=0 (|01⟩ inalterado)', () => {
  const r = Engine.apply(State.fromBits('01'),'CP',{controls:[0],targets:[1],params:[Math.PI/2]});
  assert.equal(r.amplitudes()[0].bits,'01'); assert.equal(fmt(r.amplitudes()[0].amp),'1');
});
test('CRz aplica fases ±θ/2 nos ramos com controle=1', () => {
  // CRz(π) em |10⟩ (controle q0=1, alvo q1=0) → e^{-iπ/2}|10⟩ = −i|10⟩
  const r = Engine.apply(State.fromBits('10'),'CRz',{controls:[0],targets:[1],params:[Math.PI]});
  assert.equal(fmt(r.amplitudes()[0].amp),'-i');
});
test('keymap expõe CP/CRz/CU no layout quântico (primário)', () => {
  const prim = JSON.stringify(Keymap.layout('quantum', false));
  assert.ok(prim.includes('gate:CP') && prim.includes('gate:CRz') && prim.includes('gate:CU'));
});

// ---- ângulo simbólico: múltiplo racional de π ----
test('calc π simbólico: 2*π/8 → π/4', () => { const r = Calc.evaluate('2*π/8', null); assert.equal(r.isPi, true); assert.equal(r.piStr, 'π/4'); });
test('calc π: π → "π"', () => assert.equal(Calc.evaluate('π',null).piStr, 'π'));
test('calc π: 3*π/2 → 3π/2', () => assert.equal(Calc.evaluate('3*π/2',null).piStr, '3π/2'));
test('calc π: π/4 + π/4 → π/2', () => assert.equal(Calc.evaluate('π/4+π/4',null).piStr, 'π/2'));
test('calc π: π*2 → 2π', () => assert.equal(Calc.evaluate('π*2',null).piStr, '2π'));
test('calc π: −π/3 → −π/3', () => assert.equal(Calc.evaluate('-π/3',null).piStr, '−π/3'));
test('calc π: π/π → racional 1 (não-π, exato)', () => { const r = Calc.evaluate('π/π',null); assert.ok(!r.isPi); assert.equal(Algebra.format(r.value,'rect').text,'1'); });
test('calc π: cos(π/4) → 1/√2 exato (não-π)', () => { const r = Calc.evaluate('cos(π/4)',null); assert.ok(!r.isPi); assert.equal(Algebra.format(r.value,'rect').text,'1/√2'); });
test('calc π: π+1 → numérico (mistura π com não-π)', () => { const r = Calc.evaluate('π+1',null); assert.ok(!r.isPi && r.approx); });
test('calc π: piNum de π/2 ≈ 1.5708 (rad p/ a porta)', () => { const r = Calc.evaluate('π/2',null); assert.ok(Math.abs(r.piNum - Math.PI/2) < 1e-12); });

// ---- exibição: fase numérica como múltiplo racional de π ----
test('display: fase numérica (1/2)e^{±iπ/8}', () => {
  const a = Algebra.numeric(0.5*Math.cos(Math.PI/8), 0.5*Math.sin(Math.PI/8));
  assert.equal(Algebra.format(a,'exp').text, '1/2·e^{iπ/8}');
  const b = Algebra.numeric(0.5*Math.cos(-Math.PI/8), 0.5*Math.sin(-Math.PI/8));
  assert.equal(Algebra.format(b,'exp').text, '1/2·e^{-iπ/8}');
});
test('display: CRz(π/4) sobre H⊗H|00⟩ → fases π/8 simbólicas', () => {
  let s = Engine.applyAll(State.computational(2),'H');
  s = Engine.apply(s,'CRz',{controls:[0],targets:[1],params:[Math.PI/4]});
  const m = {}; for (const x of s.amplitudes()) m[x.bits] = Algebra.format(x.amp,'exp').text;
  assert.equal(m['00'],'1/2'); assert.equal(m['01'],'1/2');
  assert.equal(m['10'],'1/2·e^{-iπ/8}'); assert.equal(m['11'],'1/2·e^{iπ/8}');
});
test('display exato inalterado: T|1⟩=e^{iπ/4}, S|1⟩=i, H|0⟩ amp=1/√2', () => {
  assert.equal(Algebra.format(Engine.apply(State.fromBits('1'),'T',{targets:[0]}).amplitudes()[0].amp,'exp').text,'e^{iπ/4}');
  assert.equal(Algebra.format(Engine.apply(State.fromBits('1'),'S',{targets:[0]}).amplitudes()[0].amp,'exp').text,'i');
  assert.equal(Algebra.format(Engine.apply(State.computational(1),'H',{targets:[0]}).amplitudes()[0].amp,'exp').text,'1/√2');
});

// ---- √2 simbólico (√ como operador unário de alta precedência) ----
test('calc √2 sem parênteses → √2', () => assert.equal(fmt(evl('√2').value),'√2'));
test('calc √2/2 → 1/√2 (precedência: (√2)/2)', () => assert.equal(fmt(evl('√2/2').value),'1/√2'));
test('calc √2+1 → (1+√2) exato', () => { const r=evl('√2+1'); assert.equal(r.value.ex,true); assert.equal(fmt(r.value),'(1+√2)'); });
test('calc √2*√2 → 2 exato', () => assert.equal(fmt(evl('√2*√2').value),'2'));
test('calc √8 → 2√2', () => assert.equal(fmt(evl('√8').value),'2√2'));
test('calc 1+√2 → (1+√2) sem /1', () => assert.equal(fmt(evl('1+√2').value),'(1+√2)'));
test('calc √2/3 → numérico (fora de ℤ[ω])', () => { const r=evl('√2/3'); assert.equal(r.value.ex,false); });
test('calc √(2) com parênteses ainda = √2', () => assert.equal(fmt(evl('√(2)').value),'√2'));

// ---- LaTeX do estado (para render KaTeX) ----
test('Render.stateTex(Bell) → LaTeX com \\sqrt{2} e \\lvert', () => {
  const b = bell();
  const tex = QC.Render.stateTex(b, 'rect');
  assert.match(tex, /\\tfrac\{1\}\{\\sqrt\{2\}\}/);
  assert.match(tex, /\\lvert 00\\rangle/);
  assert.match(tex, /\\lvert 11\\rangle/);
});

// v12: botão I (identidade) removido do teclado; gate-variants 4 teclas; 2-qubits sem espaçador
test('v14 keymap: sem botão I; gate-variants/2-qubits na página 2 (cauda longa)', () => {
  const p1 = Keymap.layout('quantum', 1).pages[1];   // página 2 (cauda longa, v22-6: 2 colunas)
  const cols = [...p1.L, ...(Array.isArray(p1.R) ? p1.R : p1.R ? [p1.R] : [])];   // L + R (R = array na pág2)
  const all = cols.flatMap(g => g.keys.map(k => k[0]));
  assert.ok(!all.includes('gate:I'), 'botão gate:I removido do teclado');
  assert.ok(all.includes('gate:Sdg') && all.includes('gate:Tdg') && all.includes('gate:U'), 'demais variantes presentes');
  assert.ok(all.includes('gate:SWAP') && all.includes('gate:CSWAP'), '2-qubits presentes');
});
