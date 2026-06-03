// Reference verification by exact algebraic equality (Section 5).
// Every check below is decided by ring equality (A.eqAmp) or by exact support
// inspection -- never by a floating-point tolerance.
//
// Usage:  node scripts/verify.mjs  [path-to-quantum_calc.html]
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
const { Algebra, State, Engine, Ops } = QC;
const A = Algebra;

const ap = (s,g,o)=>Engine.apply(s,g,o);
const G1 = (g)=>(s,q)=>ap(s,g,{targets:[q]});
const X=G1('X'),Y=G1('Y'),Z=G1('Z'),H=G1('H'),S=G1('S'),T=G1('T'),SX=G1('SX'),SY=G1('SY');
const CX=(s,c,t)=>ap(s,'CNOT',{controls:[c],targets:[t]});
const CZ=(s,c,t)=>ap(s,'CZ',{controls:[c],targets:[t]});
const CP=(s,c,t,lam)=>ap(s,'CP',{controls:[c],targets:[t],params:[lam]});
const SWAP=(s,a,b)=>ap(s,'SWAP',{targets:[a,b]});
const basis=(bits)=>State.fromBits(bits);

function stateEq(a,b){
  const idxs = new Set([...a.amps.keys(), ...b.amps.keys()]);
  for (const i of idxs){
    const x = a.amps.get(i) || A.ZERO, y = b.amps.get(i) || A.ZERO;
    if (!A.eqAmp(x,y)) return false;
  }
  return true;
}
const allExact = (s)=>s.amplitudes().every(e=>e.amp.ex);

let pass=0, fail=0;
function check(name, ok){ (ok?pass++:fail++); console.log(`  [${ok?'OK':'XX'}] ${name}`); }

// ---- A. gate / circuit identities (operator equality on a basis) ----
console.log('\nA. Gate and circuit identities (exact ring equality on each basis state)');
const id1 = (f,g)=>['0','1'].every(x=>stateEq(f(basis(x)),g(basis(x))));
const id2 = (f,g)=>['00','01','10','11'].every(x=>stateEq(f(basis(x)),g(basis(x))));
check('sqrt(X)^2 = X',      id1(s=>SX(SX(s,0),0), s=>X(s,0)));
check('sqrt(Y)^2 = Y',      id1(s=>SY(SY(s,0),0), s=>Y(s,0)));
check('T^4 = Z',            id1(s=>T(T(T(T(s,0),0),0),0), s=>Z(s,0)));
check('T^2 = S',            id1(s=>T(T(s,0),0), s=>S(s,0)));
check('S^2 = Z',            id1(s=>S(S(s,0),0), s=>Z(s,0)));
check('H Z H = X',          id1(s=>H(Z(H(s,0),0),0), s=>X(s,0)));
check('H X H = Z',          id1(s=>H(X(H(s,0),0),0), s=>Z(s,0)));
check('H^2 = I',            id1(s=>H(H(s,0),0), s=>s));
check('CNOT^2 = I',         id2(s=>CX(CX(s,0,1),0,1), s=>s));

// ---- B. QFT exact on <= 4 qubits ----
console.log('\nB. Quantum Fourier transform (exact on n<=4 qubits)');
function qft(s, n){
  for (let i=0;i<n;i++){
    s = H(s,i);
    for (let j=i+1;j<n;j++) s = CP(s, j, i, Math.PI/2**(j-i));  // controlled phase pi/2^(j-i)
  }
  for (let i=0;i<Math.floor(n/2);i++) s = SWAP(s, i, n-1-i);
  return s;
}
function iqft(s, n){
  for (let i=0;i<Math.floor(n/2);i++) s = SWAP(s, i, n-1-i);
  for (let i=n-1;i>=0;i--){
    for (let j=n-1;j>i;j--) s = CP(s, j, i, -Math.PI/2**(j-i));
    s = H(s,i);
  }
  return s;
}
for (const n of [2,3,4]){
  const zero = '0'.repeat(n);
  const q0 = qft(basis(zero), n);
  // flat: all |amp|^2 equal to 1/2^n  (exact)
  const p0 = A.norm2(q0.amplitudes()[0].amp);
  const flat = q0.amplitudes().every(e => A.norm2(e.amp).value === p0.value) && Math.abs(p0.value - 1/(1<<n))<1e-12;
  check(`n=${n}: QFT|0> uniform, all amplitudes exact & flat`, allExact(q0) && q0.amplitudes().length===(1<<n) && flat);
  // roundtrip iQFT(QFT)=I on every basis state, exactly
  let rt = true;
  for (let x=0;x<(1<<n);x++){ const b=x.toString(2).padStart(n,'0'); if(!stateEq(iqft(qft(basis(b),n),n), basis(b))) rt=false; }
  check(`n=${n}: QFT^dagger QFT = I (all ${1<<n} basis states, exact)`, rt);
}

// ---- C. Deutsch-Jozsa / Bernstein-Vazirani (exact support) ----
console.log('\nC. Deutsch-Jozsa / Bernstein-Vazirani (exact outcome support)');
// 2 query qubits (q0,q1) + ancilla q2. Standard phase-kickback construction.
function djbv(oracle){
  let s = basis('001');               // ancilla = |1>
  s = H(s,0); s = H(s,1); s = H(s,2); // H on all
  s = oracle(s);
  s = H(s,0); s = H(s,1);             // H on query
  return s;
}
const queryBits = (idx)=>[(idx>>2)&1,(idx>>1)&1];   // n=3, q0=bit2, q1=bit1
const support = (s)=>s.amplitudes().map(e=>queryBits(e.index));
// constant oracle f=0: identity
const constS = djbv(s=>s);
check('DJ constant -> query = 00 with certainty', support(constS).every(([a,b])=>a===0&&b===0));
// balanced oracle f(x)=x0 xor x1: CNOT(q0,anc), CNOT(q1,anc)
const balS = djbv(s=>CX(CX(s,0,2),1,2));
check('DJ balanced -> query never 00', support(balS).every(([a,b])=>!(a===0&&b===0)));
// BV hidden s=11: same oracle, recovers 11
check('BV hidden s=11 -> query = 11 with certainty', support(balS).every(([a,b])=>a===1&&b===1));

// ---- D. Teleportation (deferred measurement), exact ----
console.log('\nD. Teleportation by deferred measurement (exact)');
function rhoEq(rA, rB){
  for (let i=0;i<rA.length;i++) for (let j=0;j<rA[i].length;j++) if(!A.eqAmp(rA[i][j], rB[i][j])) return false;
  return true;
}
// input on q0 = magic state T H |0> (non-stabilizer), Bell pair on (q1,q2)
function teleport(prep){
  let s = basis('000');
  s = prep(s);                 // prepare input on q0
  s = H(s,1); s = CX(s,1,2);   // Bell pair (q1,q2)
  s = CX(s,0,1); s = H(s,0);   // Bell measurement basis on (q0,q1)
  s = CX(s,1,2);               // deferred X correction (ctrl q1)
  s = CZ(s,0,2);               // deferred Z correction (ctrl q0)
  return s;
}
const prep = (s)=>T(H(s,0),0);
const tele = teleport(prep);
const rhoOut = Ops.reducedDM(tele,[2]).rho;          // state delivered to q2
const rhoIn  = Ops.densityMatrix(prep(basis('0'))).entries; // |psi_in><psi_in|
// build rhoIn as 2x2 from entries
const RIN = [[A.ZERO,A.ZERO],[A.ZERO,A.ZERO]];
for (const e of rhoIn) RIN[e.i][e.j] = e.amp;
check('teleported rho(q2) == input rho exactly', rhoEq(rhoOut, RIN));

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
