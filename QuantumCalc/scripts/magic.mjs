// Exact resource read-out (Section 4): sde and certified magic witnesses.
// For each canonical state, reports:
//   - sde : the smallest-denominator-exponent (max reduced 1/sqrt2 power), exact;
//   - W1  : whether all nonzero amplitudes share one magnitude (stabilizer states
//           are "flat"); unequal magnitudes => certified non-stabilizer (magic);
//   - W2  : whether every relative phase c_x * conj(c_0) is a multiple of pi/2;
//           a relative phase of pi/4 (from a T gate) => certified magic.
//
// Usage:  node scripts/magic.mjs  [path-to-quantum_calc.html]
import { readFileSync } from 'node:fs';
const HTML = process.argv[2]
  || 'U:/home/jasmine/Doutorado/quantum/QuantumCalc/quantum_calc.html';

function loadQC(){
  const html = readFileSync(HTML, 'utf8');
  const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const stubEl = () => ({ textContent:'', style:{}, classList:{ add(){}, remove(){}, toggle(){}, contains(){return false;} },
                          appendChild(){}, addEventListener(){}, dataset:{}, disabled:false });
  const document = { addEventListener(){}, getElementById:stubEl, querySelector:()=>null,
                     querySelectorAll:()=>[], createElement:stubEl, createTextNode:(t)=>({textContent:String(t)}) };
  const fn = new Function('window','document', `${script}\n;return window.QC;`);
  return fn({}, document);
}
const QC = loadQC();
const { Algebra, State, Engine } = QC;
const A = Algebra;

const ap = (s,g,o)=>Engine.apply(s,g,o);
const H=(s,q)=>ap(s,'H',{targets:[q]}), T=(s,q)=>ap(s,'T',{targets:[q]});
const CX=(s,c,t)=>ap(s,'CNOT',{controls:[c],targets:[t]});
const CZ=(s,c,t)=>ap(s,'CZ',{controls:[c],targets:[t]});

const states = [
  ['Bell |Phi+>',            CX(H(State.computational(2),0),0,1)],
  ['magic T|+>',             T(H(State.computational(1),0),0)],
  ['T-Bell',                 CX(T(H(State.computational(2),0),0),0,1)],
  ['HTH-CNOT',               CX(H(T(H(State.computational(2),0),0),0),0,1)],
  ['cluster CZ|++>',         CZ(H(H(State.computational(2),0),1),0,1)],
  ['GHZ3',                   CX(CX(H(State.computational(3),0),0,1),0,2)],
];

const n2val = (a)=>{ const n=A.norm2(a); return n.value; };

for (const [name, s] of states){
  const list = s.amplitudes();
  // sde = max reduced 1/sqrt2 exponent over the support
  const sde = Math.max(...list.map(e => A.reduceExact(e.amp).k));
  // W1: all magnitudes equal? (exact via norm2)
  const mags = list.map(e => n2val(e.amp));
  const flat = mags.every(m => Math.abs(m - mags[0]) < 1e-12);
  // W2: relative phases multiple of pi/2 ?  (phase index j, pi/4 units)
  const c0 = list[0].amp;
  let magicPhase = false, phases = [];
  for (const e of list){
    const r = A.MUL(e.amp, A.CONJ(c0));
    const c = A.toComplex(r);
    const j = A.angleExact(Math.atan2(c.im, c.re));   // phase = j*pi/4, or null
    phases.push(j === null ? '?' : j);
    if (j === null || (j % 2 !== 0)) magicPhase = true;
  }
  console.log(`\n=== ${name} ===`);
  console.log(`  sde = ${sde}`);
  console.log(`  W1 magnitudes flat? ${flat}  -> ${flat ? 'no W1 witness' : 'MAGIC (unequal |amp|)'}`);
  console.log(`  W2 rel-phase idx (pi/4 units) = [${phases.join(',')}]  -> ${magicPhase ? 'MAGIC (phase not in {0,pi/2,pi,3pi/2})' : 'no W2 witness'}`);
  console.log(`  verdict: ${(!flat || magicPhase) ? 'NON-STABILIZER (magic certified)' : 'stabilizer-compatible'}`);
}
