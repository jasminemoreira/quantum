// Gate-by-gate exact trace of the HTH-CNOT state (Table IV).
// Loads the QuantumCalc exact engine (ZZ[zeta_16] over BigInt) straight from
// quantum_calc.html and prints the EXACT state after each gate of the sequence
//   |00>  --H(q0)-->  --T(q0)-->  --H(q0)-->  --CNOT(q0,q1)-->
// reproducing the step-by-step derivation whose final magnitudes (2+/-sqrt2)/4
// match Table I. Every line is an exact ring element -- no floating point.
//
// Usage:  node scripts/steps.mjs  [path-to-quantum_calc.html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HTML = process.argv[2]
  || join(dirname(fileURLToPath(import.meta.url)), '..', 'quantum_calc.html');

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
const { Algebra, State, Engine, Render } = QC;
const A = Algebra;
const dirac = (s) => Render.dirac(Render.terms(s, 'exp').list);

const ap = (s, g, o) => Engine.apply(s, g, o);
const H  = (s,q)   => ap(s,'H',{targets:[q]});
const T  = (s,q)   => ap(s,'T',{targets:[q]});
const CX = (s,c,t) => ap(s,'CNOT',{controls:[c],targets:[t]});

// the sequence of Table IV (one gate per row)
const steps = [
  ['initial |00>',    (s) => s],
  ['H  q0',           (s) => H(s,0)],
  ['T  q0',           (s) => T(s,0)],
  ['H  q0',           (s) => H(s,0)],
  ['CNOT q0 -> q1',   (s) => CX(s,0,1)],
];

console.log('\nHTH-CNOT gate-by-gate exact trace (Table IV)\n');
let s = State.computational(2);
for (const [label, step] of steps){
  s = step(s);
  console.log(`  ${label.padEnd(16)} ${dirac(s)}`);
}

// final amplitudes as exact magnitudes^2 (ties the last row to Table I: (2 +/- sqrt2)/4)
console.log('\n  final |amplitude|^2 per basis state (exact):');
for (const e of s.amplitudes()){
  const b = e.index.toString(2).padStart(2,'0');
  const n2 = A.MUL(e.amp, A.CONJ(e.amp));              // |amp|^2 as an exact real ring element
  console.log(`    |${b}> : ${A.format(n2, 'rect').text}`);
}
console.log('');
