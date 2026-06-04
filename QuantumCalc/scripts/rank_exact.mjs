// Exact Schmidt rank / separability across the cut A = Q0 | B = rest, decided ONLY
// by integer (BigInt) ring zero-tests -- no floating point anywhere. This realizes
// Theorem 1: |psi> is a product across A|B iff every 2x2 minor of the matricisation
// M_{A|B} vanishes (eq. 7), and the Schmidt rank is the exact rank of M_{A|B}.
// The ranks/separability verdicts printed here are the "rank" column of Table I,
// reached without a tolerance: each minor is an element of Z[zeta_16][1/sqrt2] and
// "= 0" is A.isZeroAmp on its eight BigInt coordinates.
//
// Usage:  node scripts/rank_exact.mjs  [path-to-quantum_calc.html]
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
const { Algebra:A, State, Engine } = QC;
const ap = (s,g,o) => Engine.apply(s,g,o);
const H  = (s,q)   => ap(s,'H',{targets:[q]});
const T  = (s,q)   => ap(s,'T',{targets:[q]});
const CX = (s,c,t) => ap(s,'CNOT',{controls:[c],targets:[t]});
const CZ = (s,c,t) => ap(s,'CZ',{controls:[c],targets:[t]});

// amplitude at basis index i (ring zero if absent from the sparse map)
function ampAt(s, i){ for (const e of s.amplitudes()) if (e.index === i) return e.amp; return A.ZERO; }

// matricisation M (2 x 2^{n-1}) for A = {Q0} (Q0 is the MSB of the basis index)
function matriciseQ0(s){
  const n = s.n, cols = 1 << (n - 1), M = [new Array(cols), new Array(cols)];
  for (let i = 0; i < (1 << n); i++){ const a = (i >> (n - 1)) & 1, b = i & (cols - 1); M[a][b] = ampAt(s, i); }
  return M;
}
// exact rank over the ring by 2x2 minor zero-tests (eq. 7); two rows => rank in {0,1,2}
function exactRankQ0(s){
  const M = matriciseQ0(s), cols = M[0].length;
  let nonzero = false;
  for (let b = 0; b < cols; b++) if (!A.isZeroAmp(M[0][b]) || !A.isZeroAmp(M[1][b])) nonzero = true;
  if (!nonzero) return { rank:0, separable:false };
  for (let b = 0; b < cols; b++) for (let bp = b + 1; bp < cols; bp++){
    const minor = A.SUB(A.MUL(M[0][b], M[1][bp]), A.MUL(M[0][bp], M[1][b]));   // exact ring element
    if (!A.isZeroAmp(minor)) return { rank:2, separable:false };               // some minor != 0  => entangled
  }
  return { rank:1, separable:true };                                           // all minors = 0  => product
}

// canonical states of Table I, with their expected Schmidt rank across Q0|rest
const states = [
  ['|+>|0> (product)', () => H(State.computational(2), 0),                     1],
  ['Bell |Phi+>',      () => CX(H(State.computational(2), 0), 0, 1),           2],
  ['T-Bell',           () => CX(T(H(State.computational(2), 0), 0), 0, 1),     2],
  ['HTH-CNOT',         () => CX(H(T(H(State.computational(2), 0), 0), 0), 0, 1), 2],
  ['cluster CZ|++>',   () => CZ(H(H(State.computational(2), 0), 1), 0, 1),     2],
  ['GHZ3',             () => CX(CX(H(State.computational(3), 0), 0, 1), 0, 2), 2],
];

console.log('\nExact Schmidt rank / separability across A = Q0 | B = rest');
console.log('(decided ONLY by BigInt ring zero-tests on the 2x2 minors of eq.(7) -- no floating point)\n');
let allOK = true;
for (const [name, build, expRank] of states){
  const { rank, separable } = exactRankQ0(build());
  const ok = rank === expRank; allOK = allOK && ok;
  console.log(`  ${name.padEnd(20)} rank = ${rank}   ${(separable ? 'separable' : 'ENTANGLED').padEnd(9)} ${ok ? '[OK]' : '[MISMATCH, Table I expects ' + expRank + ']'}`);
}
console.log(`\n  ${allOK ? 'all ranks match Table I (decided in the ring, no tolerance)' : 'MISMATCH vs Table I'}\n`);
