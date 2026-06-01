// tests/v14.test.mjs — Phase 6 (v14): teclado deslizante paginado (page-model do Keymap).
// O delta é UI-only; a parte PURA (testável em Node) é Keymap.layout(mode,page). O comportamento de
// gesto/switchPage/auto-return é DOM → coberto em ui.spec (Playwright) + validação humana ao vivo.
// Source: specs/technical/29-v14-seed-sliding-keypad.md (§Phase 0 outcome).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
function loadQC(){
  const html = readFileSync(join(HERE,'..','quantum_calc.html'),'utf8');
  const script = html.slice(html.indexOf('<script>')+8, html.lastIndexOf('</script>'));
  const stub = () => ({ textContent:'', style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false;}}, appendChild(){}, addEventListener(){}, setAttribute(){}, dataset:{}, disabled:false });
  const document = { addEventListener(){}, getElementById:stub, querySelector:()=>null, querySelectorAll:()=>[], createElement:stub, createTextNode:(t)=>({textContent:String(t)}) };
  return new Function('window','document',`${script}\n;return window.QC;`)({}, document);
}
const QC = loadQC();
const { Keymap } = QC;

// v22-6: pg.R pode ser null | zona única (pág1: numérico) | ARRAY de zonas (pág2: 2 colunas)
const zoneActs = (z) => !z ? [] : Array.isArray(z) ? z.flatMap(g => g.keys.map(k => k[0])) : z.keys.map(k => k[0]);
const zoneLabels = (z) => !z ? [] : Array.isArray(z) ? z.flatMap(g => g.keys.map(k => k[1])) : z.keys.map(k => k[1]);
const pageActs = (pg) => pg.L.flatMap(g => g.keys.map(k => k[0])).concat(zoneActs(pg.R));
const allQuantumActs = (lay) => lay.command.keys.map(k=>k[0])
  .concat(lay.pages.flatMap(pageActs)).concat(lay.strip.map(s=>s[0]));
const allQuantumLabels = (lay) => lay.command.keys.map(k=>k[1])
  .concat(lay.pages.flatMap(pg => pg.L.flatMap(g=>g.keys.map(k=>k[1])).concat(zoneLabels(pg.R))))
  .concat(lay.strip.map(s=>s[1]));

// ---- contrato do page-model ----
test('v14-1 quantum: layout(mode,page) = {strip, command, pages[2]} (sem cols)', () => {
  const lay = Keymap.layout('quantum', 0);
  assert.ok(lay.strip && lay.command && Array.isArray(lay.pages), 'tem strip/command/pages');
  assert.equal(lay.pages.length, 2, '2 páginas');
  assert.ok(!lay.cols, 'quantum não usa mais cols');
});
test('v14-2 calc = pad de ângulo ENXUTO (grade única em cols.R; coluna de funções removida)', () => {
  const calc = Keymap.layout('calc');
  assert.ok(calc.cols && !calc.pages && !calc.command, 'calc tem cols, não pagina');
  assert.equal(calc.cols.L.length, 0, 'coluna de funções científicas removida (L vazia)');
  const acts = calc.cols.R.flatMap(g => g.keys.map(k => k[0]));
  // mantidos: dígitos, π, parênteses, operadores + − × /, ⌫, = (v16: tecla ESC=key:CLR REMOVIDA — cancela por swipe-down/Esc físico)
  for (const a of ['calc:0','calc:9','calc:.','calc:π','calc:(','calc:)','calc:+','calc:-','calc:*','calc:/','key:BKSP','eval'])
    assert.ok(acts.includes(a), `mantém ${a}`);
  // REMOVIDOS: funções científicas (YAGNI p/ ângulo) + 1/√2, e, i, √, ^ (magnitude/Euler, nunca ângulo)
  for (const a of ['calc:sin','calc:cos','calc:tan','calc:ln','calc:log','calc:exp','calc:conj','calc:abs','calc:re','calc:√','calc:^','calc:1/√2','calc:e','calc:i'])
    assert.ok(!acts.includes(a), `removido ${a}`);
});
test('v14-3 page é só a página ATIVA do carrossel: a estrutura retornada é a mesma p/ page 0 e 1', () => {
  // ambas as páginas vivem sempre no DOM (carrossel); switchPage (UI) só move a janela visível.
  assert.equal(JSON.stringify(Keymap.layout('quantum',0)), JSON.stringify(Keymap.layout('quantum',1)));
});

// ---- bloco de COMANDO fixo: M no slot do '2nd' ----
test("v14-4 comando fixo tem M (op:saveBra) e NÃO tem a tecla '2nd'/shift", () => {
  const cmd = Keymap.layout('quantum',0).command.keys.map(k=>k[0]);
  assert.ok(cmd.includes('op:saveBra'), 'M no comando');
  assert.ok(!cmd.includes('shift'), "sem tecla 'shift'/'2nd'");
});
test('v14-5 numérico (pág1.R) perdeu o M e mantém os dígitos', () => {
  const num = Keymap.layout('quantum',0).pages[0].R;
  const acts = num.keys.map(k=>k[0]);
  assert.ok(acts.includes('key:7') && acts.includes('key:PI') && acts.includes('key:INVSQRT2'));
  assert.ok(!acts.includes('op:saveBra'), 'M saiu do numérico');
});

// ---- página 2 = cauda longa em 2 COLUNAS (v22-6), SEM dígitos ----
test('v14-6 página 2 = 2 colunas (L=input+operations · R=variants+2q+presets), ZERO dígitos', () => {
  const p1 = Keymap.layout('quantum',1).pages[1];
  assert.ok(Array.isArray(p1.R), 'pág2 agora tem coluna direita (array de grupos)');
  const acts = pageActs(p1);
  assert.ok(acts.includes('gate:SWAP') && acts.includes('op:schmidt') && acts.includes('preset:QFT'));
  assert.ok(acts.includes('input:T') && acts.includes('input:rand') && acts.includes('input:amp'), 'grupo input na pág2');
  assert.ok(!acts.some(a => /^key:[0-9.]$/.test(a)), 'nenhum dígito na pág2');
});
test('v14-7 página 1 = frequentes (gates/kets/controlled/operations + numérico)', () => {
  const p0 = pageActs(Keymap.layout('quantum',0).pages[0]);
  assert.ok(p0.includes('gate:H') && p0.includes('ket:0') && p0.includes('gate:CNOT'));
  assert.ok(p0.includes('op:prob') && p0.includes('op:inner') && p0.includes('op:tensor'));
  assert.ok(p0.includes('key:7'), 'numérico na pág1');
});

// ---- remoção do '2nd' / shift em TODO o teclado quântico ----
test("v14-8 nenhuma ação 'shift' e nenhum label '2nd' no teclado quântico", () => {
  const lay = Keymap.layout('quantum',0);
  assert.ok(!allQuantumActs(lay).includes('shift'), "sem ação 'shift'");
  assert.ok(!allQuantumLabels(lay).includes('2nd'), "sem label '2nd'");
});

// ---- M está SÓ no comando fixo (visível nas 2 páginas), não nas páginas ----
test('v14-9 M (op:saveBra) só no comando fixo, não nas páginas', () => {
  const lay = Keymap.layout('quantum',0);
  assert.ok(lay.command.keys.some(k=>k[0]==='op:saveBra'));
  assert.ok(!pageActs(lay.pages[0]).includes('op:saveBra'));
  assert.ok(!pageActs(lay.pages[1]).includes('op:saveBra'));
});

// ---- relabels do strip (desambiguação) ----
test("v14-10 strip = basis/fmt/rad·trn/view (∠→rad/trn, form→view)", () => {
  const strip = Keymap.layout('quantum',0).strip;
  assert.deepEqual(strip.map(s=>s[0]), ['chbase','fmtcycle','angcycle','viewform']);
  assert.deepEqual(strip.map(s=>s[1]), ['basis','fmt','rad/trn','view']);
});

// ---- relabel da tecla de divisão (entrada de ângulo/λ) ----
test("v14-11 tecla de divisão (calc:/) exibe '/' (era '÷')", () => {
  const div = Keymap.layout('calc').cols.R.flatMap(g=>g.keys).find(k=>k[0]==='calc:/');
  assert.ok(div, 'tecla calc:/ existe');
  assert.equal(div[1], '/', "label é '/'");
});
