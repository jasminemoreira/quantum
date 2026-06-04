// Confirms the single-qubit-cut spectrum is computed EXACTLY in the ring even when
// the reduced density matrix rho_A is NON-diagonal (Proposition 2(ii), second caveat).
//
// We build the HTH-CNOT showcase state of Table I (whose rho_A is diagonal, so the
// spectrum is just the diagonal) and the SAME state with one extra Hadamard on Q0,
// which is a local unitary on subsystem A: it leaves the spectrum unchanged but makes
// rho_A genuinely non-diagonal (a nonzero off-diagonal ring element). In both cases the
// engine returns lambda_+- = (tr +- sqrt(tr^2 - 4 det))/2 as exact ring amplitudes:
// the discriminant's square root is proposed from a float guess but ACCEPTED only after
// an exact BigInt re-squaring (sqrt(disc)^2 == disc), and we further check the two
// elementary-symmetric identities lambda_+ + lambda_- == tr and lambda_+ * lambda_- == det
// as exact ring equalities. (Were sqrt(disc) to leave the ring, the value would instead be
// flagged approximate.)
//
// Usage:  node scripts/eig_check.mjs  [path-to-quantum_calc.html]
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
const { Algebra:A, State, Engine, Ops } = QC;
const ap  = (s,g,o) => Engine.apply(s,g,o);
const H   = (s,q)   => ap(s,'H',{targets:[q]});
const T   = (s,q)   => ap(s,'T',{targets:[q]});
const CX  = (s,c,t) => ap(s,'CNOT',{controls:[c],targets:[t]});
const fmt = (a)     => A.format(a, 'rect').text;

function analyse(name, s){
  const { rho } = Ops.reducedDM(s, [0]);                 // rho_A = rho_{Q0}, entries are ring amplitudes
  const r00 = rho[0][0], r01 = rho[0][1], r11 = rho[1][1];
  const tr   = A.ADD(r00, r11);
  const det  = A.ADD(A.MUL(r00, r11), A.NEG(A.MUL(r01, A.CONJ(r01))));   // rho00 rho11 - |rho01|^2
  const disc = A.SUB(A.MUL(tr, tr), A.scaleInt(det, 4));                 // tr^2 - 4 det (exact, real)
  const cand = A.recognizeReal(Math.sqrt(Math.max(0, A.toComplex(disc).re)));  // float PROPOSES sqrt(disc)
  const sqrtOK = !!(cand && cand.ex && A.eqAmp(A.MUL(cand, cand), disc));       // BigInt re-square DECIDES

  console.log(`\n=== ${name} ===`);
  console.log(`  rho_A off-diagonal  : ${fmt(r01)}    exact ring zero? ${A.isZeroAmp(r01)}`);
  if (!sqrtOK){
    console.log(`  spectrum            : sqrt(disc) leaves Z[zeta_16] -> numeric fallback (flagged approx)`);
    return false;
  }
  const lamP = A.reduceExact(A.scaleInvSqrt2(A.ADD(tr, cand), 2));       // (tr + sqrt(disc))/2
  const lamM = A.reduceExact(A.scaleInvSqrt2(A.SUB(tr, cand), 2));       // (tr - sqrt(disc))/2
  const sumOK  = A.eqAmp(A.ADD(lamP, lamM), tr);                         // lam+ + lam- == tr   (exact)
  const prodOK = A.eqAmp(A.MUL(lamP, lamM), det);                        // lam+ * lam- == det  (exact)
  const v = Ops.vonNeumann(s, [0]);                                      // engine's own output, for cross-check
  console.log(`  spectrum (exact)    : { ${fmt(lamP)}, ${fmt(lamM)} }`);
  console.log(`  sqrt(disc)^2 == disc: ${sqrtOK}   (candidate accepted only after exact re-squaring)`);
  console.log(`  lam+ + lam- == tr   : ${sumOK}`);
  console.log(`  lam+ * lam- == det  : ${prodOK}`);
  console.log(`  engine valsStr      : [${v.valsStr ? v.valsStr.join(', ') : '(numeric)'}]   exactEig = ${v.exactEig}`);
  return sqrtOK && sumOK && prodOK && !!v.valsStr && v.exactEig;
}

console.log('\nExact single-qubit-cut spectrum, including the NON-diagonal rho_A case (Prop. 2(ii) caveat)');

const showcase = CX(H(T(H(State.computational(2), 0), 0), 0), 0, 1);    // rho_A diagonal
const tilted   = H(showcase, 0);                                        // local H on A: rho_A NON-diagonal, same spectrum

const a = analyse('HTH-CNOT  (rho_A diagonal)', showcase);
const b = analyse('+ extra H on Q0  (rho_A NON-diagonal)', tilted);

console.log(`\n  RESULT: spectrum exact in the ring for BOTH cases (incl. non-diagonal rho_A): ${a && b ? 'PASS' : 'FAIL'}\n`);
process.exit(a && b ? 0 : 1);
