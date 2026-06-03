// Reproducible exact entanglement invariants for the canonical-states table
// (Section 3.4). Loads the QuantumCalc exact engine (ZZ[zeta_16] over BigInt)
// straight from quantum_calc.html and reports, per state:
//   - the exact Dirac form (confirms the state),
//   - exact concurrence via |det|^2 (2-qubit rows),
//   - the exact reduced density matrix rho_0 (diagonal here -> exact spectrum),
//   - Schmidt rank and the (numeric) von Neumann entropy as a cross-check.
//
// Usage:  node scripts/invariants.mjs  [path-to-quantum_calc.html]
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
  const window = {};
  const fn = new Function('window','document', `${script}\n;return window.QC;`);
  return fn(window, document);
}

const QC = loadQC();
const { Algebra, State, Engine, Ops, Render } = QC;
const A = Algebra;
const dirac = (s) => Render.dirac(Render.terms(s, 'exp').list);
const re = (amp) => A.format(amp, 'rect').text;        // exact real/rect surd string

const ap = (s, g, o) => Engine.apply(s, g, o);
const H  = (s,q)        => ap(s,'H',{targets:[q]});
const T  = (s,q)        => ap(s,'T',{targets:[q]});
const CX = (s,c,t)      => ap(s,'CNOT',{controls:[c],targets:[t]});
const CZ = (s,c,t)      => ap(s,'CZ',{controls:[c],targets:[t]});

function build(name, fn){ return { name, s: fn() }; }

const states = [
  build('product |+0>',              () => H(State.computational(2),0)),
  build('Bell |Phi+>',               () => CX(H(State.computational(2),0),0,1)),
  build('T-Bell (|00>+w|11>)/r2',    () => CX(T(H(State.computational(2),0),0),0,1)),
  build('HTH-CNOT (surd spectrum)',  () => CX(H(T(H(State.computational(2),0),0),0),0,1)),
  build('cluster CZ|++>',            () => CZ(H(H(State.computational(2),0),1),0,1)),
  build('GHZ3 (Q0|Q1Q2)',            () => CX(CX(H(State.computational(3),0),0,1),0,2)),
];

for (const { name, s } of states){
  console.log('\n=== ' + name + ' ===');
  console.log('  state :', dirac(s));
  if (s.n === 2){
    const c = Ops.concurrencePure(s);
    console.log('  conc  : C =', +c.value.toFixed(6), ' |det|^2 =', c.detN2Str,
                c.exactN2 ? '(exact)' : '(approx)');
  }
  const { rho } = Ops.reducedDM(s, [0]);
  console.log('  rho_0 : [[', re(rho[0][0]), ',', re(rho[0][1]), '],');
  console.log('          [', re(rho[1][0]), ',', re(rho[1][1]), ']]');
  const v  = Ops.vonNeumann(s, [0]);
  const rank = v.vals.filter(x => x > 1e-9).length;
  console.log('  spec  : lambda =', v.vals.map(x => +x.toFixed(6)),
              ' rank =', rank, ' S =', +v.S.toFixed(6), 'bits',
              v.exactEig ? '(exact eig)' : '(numeric eig)');
}
