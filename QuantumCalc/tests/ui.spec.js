// Phase 6 (v2…v13) — Playwright UI tests against the reworked single-keypad UI.
// Single dynamic keypad (M14-driven), 2nd one-shot, inline angle/λ evaluator, Bloch panel.
// v13: standalone scientific-calc MODE retired (only inline angle/λ entry uses the evaluator).
import { test, expect } from '@playwright/test';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const URL = pathToFileURL(join(HERE, '..', 'quantum_calc.html')).href;
const act = (p, a) => p.locator(`[data-action="${a}"]`).first().click();
const dirac = (p) => p.locator('#stateDisplay').evaluate(el => el.dataset.plain ?? el.textContent);
// v14: carrossel paginado — a página ATIVA é a única .kp-page SEM o atributo inert (a oculta é inert + off-screen).
// page:1 = dot da cauda longa (vai p/ a página 2); page:0 = volta. (Antes: act('shift') alternava a camada.)
const activePage = (p) => p.locator('.kp-page:not([inert])').getAttribute('data-page');

// monta estados de referência só com teclas de porta (sem presets, removidos no v2)
async function bell(p){   // |Φ+⟩ = (1/√2)(|00⟩+|11⟩)
  await act(p,'key:2'); await act(p,'key:Q'); await act(p,'key:SET');
  await act(p,'key:0'); await act(p,'key:Q'); await act(p,'gate:H');
  await act(p,'key:0'); await act(p,'key:CTRL'); await act(p,'key:1'); await act(p,'key:Q'); await act(p,'gate:X');
}
async function ghz(p){   // GHZ₃ = (1/√2)(|000⟩+|111⟩)
  await act(p,'key:3'); await act(p,'key:Q'); await act(p,'key:SET');
  await act(p,'key:0'); await act(p,'key:Q'); await act(p,'gate:H');
  await act(p,'key:0'); await act(p,'key:CTRL'); await act(p,'key:1'); await act(p,'key:Q'); await act(p,'gate:X');
  await act(p,'key:0'); await act(p,'key:CTRL'); await act(p,'key:2'); await act(p,'key:Q'); await act(p,'gate:X');
}

test.beforeEach(async ({ page }) => { await page.goto(URL); });

test('initial state |0⟩, quantum mode', async ({ page }) => {
  expect(await dirac(page)).toBe('|0⟩');
  await expect(page.locator('#selection')).toContainText('ALL');
  await expect(page.locator('[data-action="gate:H"]')).toBeVisible();
});

test('ALL → H', async ({ page }) => {
  await act(page,'key:ALL'); await act(page,'gate:H');
  expect(await dirac(page)).toBe('(1/√2)|0⟩ + (1/√2)|1⟩');
});

test('manual Bell: 2 Q SET ; 0 Q H ; 0 CTRL 1 Q X', async ({ page }) => {
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:SET');
  expect(await dirac(page)).toBe('|00⟩');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:X');
  expect(await dirac(page)).toBe('(1/√2)|00⟩ + (1/√2)|11⟩');
});

test('v26 teclado de página ÚNICA: primário visível; sem dots/carrossel; tecla 2nd presente', async ({ page }) => {
  await expect(page.locator('[data-action="gate:H"]')).toBeVisible();
  await expect(page.locator('[data-action="gate:Rx"]')).toBeVisible();     // 1q no primário
  await expect(page.locator('[data-action="gate:P"]')).toBeVisible();      // v25: P na pág.1
  await expect(page.locator('[data-action="preset:Bell"]')).toBeVisible(); // v26: Bell promovido ao primário do bloco gates
  await expect(page.locator('[data-action="gate:SWAP"]')).toHaveCount(0);  // v26: SWAP foi p/ a 2ª camada
  await expect(page.locator('[data-action="gate:CNOT"]')).toHaveCount(0);  // v25: controladas dedicadas removidas
  await expect(page.locator('[data-action="gate:CP"]')).toHaveCount(0);
  await expect(page.locator('[data-action="gate:CCX"]')).toHaveCount(0);
  await expect(page.locator('[data-action="op:prob"]')).toBeVisible();     // op frequente no primário
  await expect(page.locator('[data-action="op:inner"]')).toBeVisible();    // ⟨φ|ψ⟩ no primário
  await expect(page.locator('[data-action="op:saveBra"]')).toBeVisible();  // v26: M no numpad
  await expect(page.locator('[data-action="chbase"]')).toBeVisible();      // base na faixa de vistas
  await expect(page.locator('[data-action="shift"]')).toHaveCount(0);      // shift legado inexistente
  await expect(page.locator('[data-action="key:2nd"]')).toBeVisible();     // v26: tecla 2nd
  await expect(page.locator('[data-action="page:0"]')).toHaveCount(0);     // v26: sem dots/carrossel
  await expect(page.locator('[data-action="page:1"]')).toHaveCount(0);
});

test('v26 tecla 2nd revela a 2ª camada (variantes/presets/ops estendidas) e volta', async ({ page }) => {
  await expect(page.locator('[data-action="preset:QFT"]')).toHaveCount(0);   // 2ª camada oculta no primário
  await expect(page.locator('[data-action="op:schmidt"]')).toHaveCount(0);
  await expect(page.locator('[data-action="gate:SWAP"]')).toHaveCount(0);    // v26: SWAP é da 2ª camada
  await expect(page.locator('[data-action="preset:Bell"]')).toBeVisible();   // Bell é primário
  await act(page,'key:2nd');                                                 // liga a 2ª camada
  await expect(page.locator('[data-action="gate:Sdg"]')).toBeVisible();      // variantes (S†/T†/√X)
  await expect(page.locator('[data-action="gate:SWAP"]')).toBeVisible();     // SWAP/iSWAP na 2ª camada
  await expect(page.locator('[data-action="preset:QFT"]')).toBeVisible();    // presets
  await expect(page.locator('[data-action="op:schmidt"]')).toBeVisible();    // ops estendidas
  await expect(page.locator('[data-action="gate:H"]')).toHaveCount(0);       // primário oculto na 2ª camada
  await act(page,'key:2nd');                                                 // volta à primária
  await expect(page.locator('[data-action="gate:H"]')).toBeVisible();
  await expect(page.locator('[data-action="preset:QFT"]')).toHaveCount(0);
});

test('limpeza v2: presets/Dirac/LaTeX/Qiskit/fatorar removidos do teclado', async ({ page }) => {
  await expect(page.locator('[data-action="preset:_menu"]')).toHaveCount(0);
  await expect(page.locator('[data-action="export:dirac"]')).toHaveCount(0);
  await expect(page.locator('[data-action="export:latex"]')).toHaveCount(0);
  await expect(page.locator('[data-action="export:qiskit"]')).toHaveCount(0);
  await expect(page.locator('[data-action="op:factor"]')).toHaveCount(0);
  await expect(page.locator('#presetsOverlay')).toHaveCount(0);
});

test('op norm (2nd layer): ‖ψ‖', async ({ page }) => {
  await act(page,'op:norm');   // v12: ‖ψ‖ vive no 2nd
  await expect(page.locator('#auxOutput')).toContainText('‖ψ‖');
});

test('undo/redo', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:X');
  expect(await dirac(page)).toBe('(1/√2)|01⟩ + (1/√2)|10⟩');
  await act(page,"cmd:undo");
  expect(await dirac(page)).toBe('(1/√2)|00⟩ + (1/√2)|11⟩');
  await act(page,"cmd:redo");
  expect(await dirac(page)).toBe('(1/√2)|01⟩ + (1/√2)|10⟩');
});

test('CHBASE cicla a base (comp→had) em Bell → {±}', async ({ page }) => {
  await bell(page);
  await act(page,'key:ALL');   // v3: CHBASE age na seleção — ALL cicla TODOS os qubits
  await act(page,'chbase');   // comp → had
  expect(await dirac(page)).toBe('(1/√2)|++⟩ + (1/√2)|−−⟩');
  await expect(page.locator('#selection')).toContainText('{|+⟩,|−⟩}');
});

test('formato condensado: um botão cicla o indicador exp → a+bi → polar', async ({ page }) => {
  const sel = page.locator('#selection');
  await expect(sel).toContainText('exp');                       // formato ativo no canto sup. direito (padrão)
  await act(page,'fmtcycle'); await expect(sel).toContainText('a+bi');
  await act(page,'fmtcycle'); await expect(sel).toContainText('polar');
  await act(page,'fmtcycle'); await expect(sel).toContainText('exp');   // volta ao início
  // o botão tem rótulo fixo "fmt"; os três antigos foram condensados num só
  await expect(page.locator('[data-action="fmtcycle"]')).toHaveText('fmt');
  await expect(page.locator('[data-action="fmt:exp"]')).toHaveCount(0);
  await expect(page.locator('[data-action="fmt:rect"]')).toHaveCount(0);
  await expect(page.locator('[data-action="fmt:polar"]')).toHaveCount(0);
});

test('formato condensado: cicla muda a renderização de e^{iπ/4}|1⟩', async ({ page }) => {
  await act(page,'key:1'); await act(page,'key:SET');           // |1⟩ (1 qubit)
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:T');   // T|1⟩ = e^{iπ/4}|1⟩
  const fmtBtn = page.locator('[data-action="fmtcycle"]');
  expect(await dirac(page)).toContain('e^{iπ/4}');             // exp
  await fmtBtn.click();                                         // → a+bi
  expect(await dirac(page)).toContain('1/√2');                 // parte real/imaginária explícitas
  expect(await dirac(page)).not.toContain('e^{iπ/4}');
});

// v13: standalone scientific-calculator tests REMOVED (calc mode retired). The shunting-yard evaluator
// survives ONLY as the inline angle/λ entry surface — exercised by the inline-angle tests below
// (Rx/Rz/λ via the calc keypad during a parametric gate or eigenvalue), e.g. 'inline angle entry: Rx…'.

test('NEG: invalid command (X with two targets) → error, no apply', async ({ page }) => {
  await bell(page);
  const before = await dirac(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:X');   // v25: X é 1-alvo estrito → 2 alvos = erro de aridade
  await expect(page.locator('#statusLine')).toContainText('⚠');
  expect(await dirac(page)).toBe(before);
});

test('T-8 no-XSS: GHZ render has no markup', async ({ page }) => {
  await ghz(page);
  const html = await page.locator('#stateDisplay').innerHTML();
  expect(html).not.toContain('<script'); expect(html).not.toContain('<img');
  expect(await dirac(page)).toContain('|111⟩');
});

// v13: 'mode switch preserves quantum state' REMOVED (no calc mode to switch to).

test('inline angle entry: Rx via 2nd → type pi/2 → = applies exact', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q');         // selecionar Q0
  await act(page,'gate:Rx');        // porta paramétrica (camada 2nd)
  await expect(page.locator('#statusLine')).toContainText('θ');   // prompt do ângulo na linha de status
  // digitar π/2 com o teclado da calc e confirmar
  await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:2'); await act(page,'eval');
  // Rx(π/2)|0⟩ = (1/√2)|0⟩ − (i/√2)|1⟩ — exato (sem ≈)
  const d = await dirac(page);
  expect(d).toContain('1/√2');
  expect(d).not.toContain('0.7071');
  await expect(page.locator('#approxBadge')).not.toHaveClass(/show/);
});

test('Bloch embutida no LCD renderiza (pixels VERDES, monocromático) para |+⟩ puro', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');  // |+⟩ puro
  await act(page,'op:bloch');
  await expect(page.locator('#blochInline')).toBeVisible();        // dentro da área verde do display
  await expect(page.locator('.display #blochCanvas')).toBeVisible();
  const green = await page.evaluate(() => {
    const c = document.getElementById('blochCanvas'), g = c.getContext('2d');
    const d = g.getImageData(0,0,c.width,c.height).data; let n=0;
    for (let i=0;i<d.length;i+=4) if (d[i+1]>d[i] && d[i+1]>d[i+2] && d[i+1]>80) n++;   // verde (monocromático), agnóstico de tema
    return n;
  });
  expect(green).toBeGreaterThan(50);   // o vetor de estado está desenhado em verde
});

test('Bloch oculta até invocar; toggle liga/desliga; EVOLUI com o estado e segue o qubit', async ({ page }) => {
  await expect(page.locator('#blochInline')).toBeHidden();
  await act(page,'op:bloch');                                  // liga
  await expect(page.locator('#blochInline')).toBeVisible();
  await expect(page.locator('#blochLabel')).toHaveText('Q0');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:X'); // estado evolui → continua visível
  await expect(page.locator('#blochInline')).toBeVisible();
  await act(page,'op:bloch');                                  // desliga (toggle)
  await expect(page.locator('#blochInline')).toBeHidden();
});

test('Bloch segue o qubit selecionado (rótulo) e some no modo simbólico', async ({ page }) => {
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:SET');  // |00⟩
  await act(page,'op:bloch');
  await expect(page.locator('#blochLabel')).toHaveText('Q0');
  await act(page,'key:1'); await act(page,'key:Q');            // seleciona Q1
  await expect(page.locator('#blochLabel')).toHaveText('Q1');  // a esfera segue a seleção
  await act(page,'key:CLR');
  await act(page,'ket:ψ'); await act(page,'key:SET');          // estado simbólico → esfera some
  await expect(page.locator('#blochInline')).toBeHidden();
});

test('v17 symBloch: qubit concreto SEPARÁVEL em |0⟩⊗|ψ⟩ desenha a esfera (+z); o qubit ABSTRATO recusa', async ({ page }) => {
  await act(page,'ket:0'); await act(page,'ket:ψ'); await act(page,'key:SET');     // |0⟩⊗|ψ⟩ (Q0 concreto, Q1=|ψ⟩)
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:bloch');    // Bloch de Q0 (separável) — antes recusava s.sym
  await expect(page.locator('#blochInline')).toBeVisible();                         // symBloch: esfera aparece
  await expect(page.locator('#blochLabel')).toHaveText('Q0');
  await expect(page.locator('#blochValue')).toContainText('|0⟩');                   // +z = |0⟩ puro
  await expect(page.locator('#blochValue')).not.toContainText('|1⟩');
  const green = await page.evaluate(() => {
    const c = document.getElementById('blochCanvas'), g = c.getContext('2d');
    const d = g.getImageData(0,0,c.width,c.height).data; let n=0;
    for (let i=0;i<d.length;i+=4) if (d[i+1]>d[i] && d[i+1]>d[i+2] && d[i+1]>80) n++;
    return n;
  });
  expect(green).toBeGreaterThan(50);                                                // vetor desenhado
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');       // H em Q0 → |+⟩ (segue separável)
  await expect(page.locator('#blochInline')).toBeVisible();
  await act(page,'key:1'); await act(page,'key:Q');                                 // seleciona Q1 = |ψ⟩ (abstrato)
  await expect(page.locator('#blochInline')).toBeHidden();                          // qubit abstrato → sem esfera (re-check no refresh)
});

test('controlled phase (CTRL P): |11⟩, 0 CTRL 1 Q P, π, = → −|11⟩', async ({ page }) => {
  await act(page,'key:1'); await act(page,'key:1'); await act(page,'key:SET');   // |11⟩
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q');
  await act(page,'gate:P');                              // v25: CTRL P (P na pág.1) = controlled-phase
  await act(page,'calc:π'); await act(page,'eval');                               // λ = π
  expect(await dirac(page)).toBe('−|11⟩');                                        // e^{iπ}|11⟩
});

test('ângulo simbólico: 0 Q Rz, digita 2*π/8, = → histórico mostra Rz(π/4)', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:Rz');
  await act(page,'calc:2'); await act(page,'calc:*'); await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:8');
  await act(page,'eval');
  await page.locator('summary', { hasText: 'Step history' }).click();
  await expect(page.locator('#historyOut')).toContainText('Rz(π/4)');
});

// v13: 'calc mantém ângulo simbólico (2*π/8=π/4)' REMOVED (standalone calc retired; the evaluator's
// symbolic-angle handling is still covered by the inline λ/angle tests, e.g. φ=2πt and π/4 entries).

// ===== v3 — base de exibição POR QUBIT, fixada na preparação e mantida nas operações =====
test('v3 preparação mantém a base (⊗ p/ bases diferentes): |0⟩|+⟩|1⟩ SET → |0⟩⊗|+⟩⊗|1⟩', async ({ page }) => {
  await act(page,'ket:0'); await act(page,'ket:+'); await act(page,'ket:1'); await act(page,'key:SET');
  expect(await dirac(page)).toBe('|0⟩⊗|+⟩⊗|1⟩');   // bases diferentes → separadas por ⊗, não (1/√2)(|001⟩+|011⟩)
});

test('v3 botões de ket visíveis e buffer mostra a ket-string', async ({ page }) => {
  await expect(page.locator('[data-action="ket:+"]')).toBeVisible();
  await expect(page.locator('[data-action="ket:-i"]')).toBeVisible();
  await act(page,'ket:0'); await act(page,'ket:+');
  await expect(page.locator('#statusLine')).toContainText('|0⟩|+⟩');
});

test('v3 NEG: misturar dígito e ket → erro, sem aplicar', async ({ page }) => {
  await act(page,'key:1'); await act(page,'ket:+');
  await expect(page.locator('#statusLine')).toContainText('⚠');
  expect(await dirac(page)).toBe('|0⟩');   // estado inicial inalterado
});

test('v3 phase kickback (base MANTIDA, sem CHBASE): |+⟩|−⟩ + CNOT(0→1) → |−−⟩', async ({ page }) => {
  await act(page,'ket:+'); await act(page,'ket:-'); await act(page,'key:SET');   // |+⟩⊗|−⟩
  expect(await dirac(page)).toBe('|+−⟩');                                         // preparado: base X mantida
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:X');
  expect(await dirac(page)).toBe('|−−⟩');   // controle |+⟩→|−⟩ visível direto, SEM trocar base à mão
});

test('v3 base por qubit MANUAL: 2 Q SET, 1 Q, base → indicador misto ZX', async ({ page }) => {
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:SET');    // |00⟩, base [Z,Z]
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'chbase');     // cicla só Q1: Z→X
  await expect(page.locator('#selection')).toContainText('ZX');                   // base por qubit (Q0=Z, Q1=X)
});

test('v3 ket-string convive com bitstring: 0 1 SET ainda dá |01⟩', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:1'); await act(page,'key:SET');
  expect(await dirac(page)).toBe('|01⟩');
});

test('v3 forma fatorada NÃO distribui: |0⟩, Q1 em X → |0⟩⊗(soma)', async ({ page }) => {
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:SET');   // |00⟩
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'chbase');     // Q1 → base X
  expect(await dirac(page)).toBe('|0⟩⊗((1/√2)|+⟩ + (1/√2)|−⟩)');                   // Q0 fatorado, inner distribuído
});

test('v3 evidenciar Q0 em Bell → (1/√2)[|0⟩⊗|0⟩ + |1⟩⊗|1⟩]', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'evidence');   // v12: factor (evidence) no 2nd
  expect(await dirac(page)).toBe('(1/√2)[|0⟩⊗|0⟩ + |1⟩⊗|1⟩]');
  await expect(page.locator('#selection')).toContainText('evid Q0');
});

test('v3 evidenciar UM KET (n Q + botão do ket): Bell, 0 Q |0⟩ → ramo |0⟩ fatorado, |1⟩ idem', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'ket:0');   // evidenciar |0⟩ em Q0
  expect(await dirac(page)).toBe('(1/√2)|0⟩⊗|0⟩ + (1/√2)|1⟩⊗|1⟩');
  await expect(page.locator('#selection')).toContainText('evid |0⟩Q0');
});

test('v3 toggle forma fatorado↔expandido: |0⟩, Q1 em X', async ({ page }) => {
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:SET');   // |00⟩
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'chbase');     // Q1 → base X
  expect(await dirac(page)).toBe('|0⟩⊗((1/√2)|+⟩ + (1/√2)|−⟩)');                   // fatorado (padrão), inner distribuído
  await act(page,'viewform');                                                     // → expandido
  await expect(page.locator('#selection')).toContainText('expanded');
  expect(await dirac(page)).toBe('(1/√2)|0⟩⊗|+⟩ + (1/√2)|0⟩⊗|−⟩');                 // distribuído
});


// ===================== v4 — álgebra simbólica de autoestados =====================
async function symPsiPlus(p){   // |+⟩_c ⊗ |ψ⟩  via ket-string + SET
  await act(p,'ket:+'); await act(p,'ket:ψ'); await act(p,'key:SET');
}

test('v4 prepara estado simbólico |+⟩⊗|ψ⟩ via ket-string (forma fatorada padrão isola |ψ⟩)', async ({ page }) => {
  await symPsiPlus(page);
  expect(await dirac(page)).toBe('((1/√2)|0⟩ + (1/√2)|1⟩)⊗|ψ⟩');
  await expect(page.locator('#selection')).toContainText('symbolic');
});

test('v4 botão de ket abstrato puro |ψ⟩|φ⟩', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'ket:φ'); await act(page,'key:SET');
  expect(await dirac(page)).toBe('|ψ⟩⊗|φ⟩');
});

test('v4 nó não-avaliado: Z|ψ⟩ sem regra (CLR = deixar simbólico)', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:Z');   // Z em Q0 (abstrato) → entrada de λ
  await expect(page.locator('#statusLine')).toContainText('e^{iθ}');            // prompt anuncia o padrão e^{iθ}
  await page.keyboard.press('Escape');                                           // v16: ESC físico (a tecla ESC da gaveta foi removida) → deixa simbólico → nó
  expect(await dirac(page)).toBe('Z|ψ⟩');
});

test('v4 autovalor PADRÃO: porta em |ψ⟩ + = (vazio) → fase simbólica e^{iθ} (não nó)', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:Z');   // Z em |ψ⟩ → prompt de λ
  await act(page,'eval');                                                        // = vazio → e^{iθ}
  const d = await dirac(page);
  expect(d).toContain('e^{iθ}'); expect(d).toContain('|ψ⟩'); expect(d).not.toContain('Z|ψ⟩');
});

test('v4 CRz em |ψ⟩ (controle concreto): = → e^{iθ} chutado ao controle (não nó CRz)', async ({ page }) => {
  await act(page,'ket:+'); await act(page,'ket:ψ'); await act(page,'key:SET');
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:Rz');
  await act(page,'eval');                                                        // = vazio → e^{iθ}
  const d = await dirac(page);
  expect(d).toContain('e^{iθ}'); expect(d).toContain('|ψ⟩'); expect(d).not.toContain('Rz');
});


test('REG v4: porta em |ψ⟩ pede o ângulo TODA vez (regra não é reaplicada em silêncio)', async ({ page }) => {
  // forma SEM Q no alvo (0 CTRL 1 CRz) — o caso relatado
  await act(page,'ket:+'); await act(page,'ket:ψ'); await act(page,'key:SET');
  // 1ª aplicação → prompt abre, = aplica e^{iθ}
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'gate:Rz');
  await expect(page.locator('#statusLine')).toContainText('e^{iθ}');     // prompt de λ aberto
  await expect(page.locator('[data-action="eval"]')).toBeVisible();      // teclado em modo entrada (tem '=')
  await act(page,'eval');
  // 2ª aplicação → DEVE reabrir o prompt (antes reusava a regra em silêncio, sem deixar digitar)
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'gate:Rz');
  await expect(page.locator('#statusLine')).toContainText('e^{iθ}');     // prompt reabriu → ângulo PODE ser digitado
  await expect(page.locator('[data-action="eval"]')).toBeVisible();
  await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:2'); await act(page,'eval');  // digita um novo ângulo π/2
  expect(await dirac(page)).toContain('|ψ⟩');                            // aplicou sem travar
});

test('v4 KICKBACK φ=π (λ=e^{iπ}=−1) → colapsa o controle a |1⟩⊗|ψ⟩', async ({ page }) => {
  await symPsiPlus(page);                                                        // |+⟩|ψ⟩
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:U');
  await expect(page.locator('#selection')).toContainText('λ');                   // entrada de autovalor (ângulo de fase)
  await act(page,'calc:π'); await act(page,'eval');                              // φ = π → λ = e^{iπ} = −1
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');     // H no controle
  expect(await dirac(page)).toBe('|1⟩⊗|ψ⟩');
});

test('v4 KICKBACK φ=π/4 (λ=e^{iπ/4}) → fase relativa no controle, |ψ⟩ fatorado', async ({ page }) => {
  await symPsiPlus(page);
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:U');
  await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:4'); await act(page,'eval');   // φ = π/4 → λ = e^{iπ/4}=ω (exato)
  expect(await dirac(page)).toBe('((1/√2)|0⟩ + (1/√2·e^{iπ/4})|1⟩)⊗|ψ⟩');         // |ψ⟩ isolado; fase relativa, magnitude preservada
});

test('v4 forma: toggle fatorado↔expandido isola/distribui |ψ⟩', async ({ page }) => {
  await symPsiPlus(page);
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:U');
  await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:4'); await act(page,'eval');
  expect(await dirac(page)).toBe('((1/√2)|0⟩ + (1/√2·e^{iπ/4})|1⟩)⊗|ψ⟩');         // fatorado (padrão)
  await act(page,'viewform');                                                     // → expandido
  expect(await dirac(page)).toBe('(1/√2)|0⟩⊗|ψ⟩ + (1/√2·e^{iπ/4})|1⟩⊗|ψ⟩');
  await expect(page.locator('#selection')).toContainText('expanded');
});

test('v4 prob dos qubits concretos: kickback φ=π/4 completo → P(0)=(2+√2)/4, P(1)=(2−√2)/4 (exato)', async ({ page }) => {
  await symPsiPlus(page);
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:U');
  await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:4'); await act(page,'eval');   // φ=π/4
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');                              // completa o kickback
  await act(page,'op:prob');
  const aux = await page.locator('#auxOutput').textContent();
  expect(aux).toContain('P(0) = (2+√2)/4');
  expect(aux).toContain('P(1) = (2−√2)/4');
});

test('v4 prob bloqueada quando coef simbólico (φ livre): pede φ concreto', async ({ page }) => {
  await symPsiPlus(page);
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:U');
  await page.keyboard.type('t'); await act(page,'eval');                                                   // φ=t simbólico
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');                              // coefs viram somas (1/2±1/2 e^{it})
  await act(page,'op:prob');
  await expect(page.locator('#statusLine')).toContainText('SYMBOLIC');
});

test('v4 KICKBACK simbólico φ=θ (λ=e^{iθ}) → ((1/2)±(1/2)e^{iθ})⊗|ψ⟩', async ({ page }) => {
  await symPsiPlus(page);
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:U');
  await page.keyboard.type('t');                                                 // φ = t (símbolo livre) → λ = e^{it}
  await act(page,'eval');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  expect(await dirac(page)).toBe('((1 + e^{it})/2|0⟩ + (1 − e^{it})/2|1⟩)⊗|ψ⟩');                       // v18: fator 1/2 condensado
});

test('v4 operações concretas bloqueadas no modo simbólico', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');
  await act(page,'op:norm');   // v12: ‖ψ‖ no 2nd
  await expect(page.locator('#statusLine')).toContainText('unavailable in symbolic mode');   // v13: onOp type-aware — norm/etc. erram no simbólico
});

test('v4 φ=2πt (λ=e^{2πit}): kickback mostra (1 ± e^{2πit})/2 (v18 condensado)', async ({ page }) => {
  await symPsiPlus(page);
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:U');
  await page.keyboard.type('2pi*t');                                            // φ = 2πt → λ = e^{2πit}
  await act(page,'eval');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  expect(await dirac(page)).toBe('((1 + e^{2πit})/2|0⟩ + (1 − e^{2πit})/2|1⟩)⊗|ψ⟩');                  // v18: fator 1/2 condensado
});

test('v4 UX: "medir" e "prob" habilitados no concreto e no simbólico (medir = colapso parcial)', async ({ page }) => {
  await expect(page.locator('[data-action="op:measure"]')).toBeEnabled();
  await act(page,'ket:ψ'); await act(page,'key:SET');                          // simbólico
  await expect(page.locator('[data-action="op:measure"]')).toBeEnabled();      // medir agora COLAPSA (não é mais duplicata de prob)
  await expect(page.locator('[data-action="op:prob"]')).toBeEnabled();
});

test('v4 TELETRANSPORTE completo: medir q0,q1 (colapso) + correção Pauli recupera |ψ⟩', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.01; });   // força os ramos |0⟩ na amostragem (determinístico p/ o teste)
  await page.goto(page.url());                                     // recarrega c/ o Math.random fixado
  // |ψ⟩ ⊗ |00⟩ → Bell(1,2) → CNOT(0→1) → H(0)
  await act(page,'ket:ψ'); await act(page,'ket:0'); await act(page,'ket:0'); await act(page,'key:SET');
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:1'); await act(page,'key:CTRL'); await act(page,'key:2'); await act(page,'key:Q'); await act(page,'gate:X');
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:X');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  // medir q0 e q1 (Math.random=0.01 → ambos colapsam em |0⟩, ramo sem correção)
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:measure');
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'op:measure');
  const d = await dirac(page);
  // v17: ramo |00⟩ — q0,q1 medidos em |0⟩; q2 era ψ₀|0⟩+ψ₁|1⟩ e o FOLD o RE-DOBRA em |ψ⟩
  // (clímax do teleporte: o estado original chegou). Antes do v17 mostrava ((ψ₀)|0⟩ + (ψ₁)|1⟩).
  expect(d).toBe('|00⟩⊗|ψ⟩');
  expect(d).toMatch(/\|ψ⟩/);                                      // v17: |ψ⟩ recuperado
  expect(d).not.toMatch(/ψ₀|ψ₁|1\/2|1\/√2/);                      // dobrado (sem ψ₀/ψ₁) e sem fator residual
});

test('v4 TELETRANSPORTE: controle abstrato |ψ⟩ expande p/ ψ₀|0⟩+ψ₁|1⟩ (sem erro)', async ({ page }) => {
  // prepara |ψ⟩ ⊗ |00⟩  (qubit desconhecido + par a virar Bell)
  await act(page,'ket:ψ'); await act(page,'ket:0'); await act(page,'ket:0'); await act(page,'key:SET');
  expect(await dirac(page)).toBe('|ψ⟩⊗|00⟩');
  // Bell em (1,2): H(1), CNOT(1→2)
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:1'); await act(page,'key:CTRL'); await act(page,'key:2'); await act(page,'key:Q'); await act(page,'gate:X');
  // CNOT(0→1): CONTROLE ABSTRATO |ψ⟩ → expande em ψ₀|0⟩+ψ₁|1⟩ (antes lançava erro)
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:X');
  await expect(page.locator('#statusLine')).not.toHaveClass(/err/);     // sem erro de "controle abstrato"
  let d = await dirac(page);
  expect(d).toContain('ψ₀'); expect(d).toContain('ψ₁');                 // amplitudes simbólicas do qubit desconhecido
  // H(0) completa o circuito de teletransporte
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  d = await dirac(page);
  expect(d).toContain('ψ₀'); expect(d).toContain('ψ₁');
  await expect(page.locator('#selection')).toContainText('symbolic');  // permanece estado simbólico (coef ψ₀,ψ₁)
});

// ===== v5 — delta ESTÉTICO do display (specs/validation/acceptance.md §v5) =====

test('V5-1 buffer (#statusLine) ~50% maior: font-size === 18.75px', async ({ page }) => {
  const fs = await page.locator('#statusLine').evaluate(el => getComputedStyle(el).fontSize);
  expect(fs).toBe('18.75px');
});

test('V5-2 #stateDisplay line-height 3.4 (×25px = 85px) p/ frações \\dfrac não colidirem', async ({ page }) => {
  const lh = await page.locator('#stateDisplay').evaluate(el => getComputedStyle(el).lineHeight);
  expect(lh).toBe('85px');   // 3.4 unitless × font-size 25px
});

test('V5-3 Bloch SEM legenda redundante: sem caption "esfera de Bloch", sem ✕ (.bloch-x)', async ({ page }) => {
  await act(page,'op:bloch');                                  // liga a esfera (estado |0⟩)
  await expect(page.locator('#blochInline')).toBeVisible();
  await expect(page.locator('#blochInline')).not.toContainText('esfera');
  await expect(page.locator('.bloch-x')).toHaveCount(0);       // botão ✕ removido
  await expect(page.locator('[data-action="cmd:closeBloch"]')).toHaveCount(0);
});

test('V5-4 rótulo Q{n} (canto sup. direito) + valor abaixo; canvas visível', async ({ page }) => {
  await act(page,'op:bloch');
  await expect(page.locator('.display #blochCanvas')).toBeVisible();
  await expect(page.locator('#blochLabel')).toHaveText('Q0');  // id preservado, segue a seleção
  // #blochLabel é posicionado em absolute no canto sup. direito (ao lado da esfera)
  const pos = await page.locator('#blochLabel').evaluate(el => getComputedStyle(el).position);
  expect(pos).toBe('absolute');
  await expect(page.locator('#blochValue')).toHaveText('|0⟩'); // valor do qubit (|0⟩ puro)
});

test('V5-5 valor da Bloch no fmt: |+⟩ → (1/√2)|0⟩ + (1/√2)|1⟩ abaixo da esfera', async ({ page }) => {
  await act(page,'key:ALL'); await act(page,'gate:H');         // |+⟩
  await act(page,'op:bloch');
  await expect(page.locator('#blochValue')).toHaveText('(1/√2)|0⟩ + (1/√2)|1⟩');                       // blochReadout passa list SEM amp → não condensa (backward compat v19)
});

test('V5-5 NEG valor da Bloch para qubit EMARANHADO → "mixed" (Bell, Q0)', async ({ page }) => {
  await bell(page);                                            // |Φ+⟩
  await act(page,'key:0'); await act(page,'key:Q');            // seleciona Q0
  await act(page,'op:bloch');
  await expect(page.locator('#blochValue')).toContainText('mixed');
});

// ================= v6 — núcleo exato ζ₁₆ (π/8) na UI real =================
// Exercita o delta π/8 ponta a ponta pelo DOM/FSM real (P está na camada 2nd).
// Estado inicial padrão = 1 qubit |0⟩ (sem SET). dataset.plain = string Unicode renderizada.
async function pPi8(p){           // P(π/8) no qubit selecionado (P na pág.1 desde v25) + prompt de ângulo
  await act(p,'gate:P');
  await act(p,'calc:π'); await act(p,'calc:/'); await act(p,'calc:8'); await act(p,'eval');
}
test('v6-UI P(π/8)|+⟩ exato: exp mostra e^{iπ/8}, SEM badge ≈', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');  // |0⟩ → |+⟩
  await act(page,'key:0'); await act(page,'key:Q'); await pPi8(page);          // P(π/8)|+⟩
  const d = await dirac(page);
  expect(d).toContain('e^{iπ/8}');                                             // |1⟩ = ζ/√2 → fase π/8 exata
  expect(d).not.toMatch(/0\.\d{3}/);                                           // sem decimal
  await expect(page.locator('#approxBadge')).not.toHaveClass(/show/);          // monômio → exato
});
test('v6-UI rect surdo aninhado √(4+2√2); kickback rect exato e exp ≈', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:0'); await act(page,'key:Q'); await pPi8(page);          // P(π/8)|+⟩
  await act(page,'fmtcycle');                                                  // exp → a+bi (rect)
  expect(await dirac(page)).toContain('√(4+2√2)');                             // surdo aninhado no rect
  await expect(page.locator('#approxBadge')).not.toHaveClass(/show/);          // rect exato
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');  // kickback
  expect(await dirac(page)).toContain('√(2+√2)');                              // kickback rect exato
  await expect(page.locator('#approxBadge')).not.toHaveClass(/show/);          // rect do kickback é EXATO
  await act(page,'fmtcycle'); await act(page,'fmtcycle');                      // rect → polar → exp
  await expect(page.locator('#approxBadge')).toHaveClass(/show/);              // exp do kickback → ≈ (ζ₃₂=π/16)
});
test('v6-UI screenshot do kickback em rect (radical aninhado)', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:0'); await act(page,'key:Q'); await pPi8(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');  // kickback
  await act(page,'fmtcycle');                                                  // rect
  expect(await dirac(page)).toContain('√(2+√2)');
  await page.locator('.display').screenshot({ path:'shot-v6-kickback.png' });
});
test('v6-UI NEG ângulo arbitrário (0.37) → badge ≈ acende', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:0'); await act(page,'key:Q');
  await act(page,'gate:P');
  await act(page,'calc:0'); await act(page,'calc:.'); await act(page,'calc:3'); await act(page,'calc:7'); await act(page,'eval');
  await expect(page.locator('#approxBadge')).toHaveClass(/show/);              // 0.37 ∉ ζ₁₆ → approx
});
test('v6-UI undo desfaz o P(π/8) (volta a |+⟩)', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  const plus = await dirac(page);
  await act(page,'key:0'); await act(page,'key:Q'); await pPi8(page);
  expect(await dirac(page)).not.toBe(plus);
  await act(page,'cmd:undo');
  expect(await dirac(page)).toBe(plus);                                        // undo restaura |+⟩
});
// ================= v7 — toggle de convenção de ângulo rad↔turns =================
test('v7-UI toggle ∠: indicador "turns" aparece/some no #selection', async ({ page }) => {
  await expect(page.locator('#selection')).not.toContainText('turns');   // default rad (silencioso)
  await act(page,'angcycle');
  await expect(page.locator('#selection')).toContainText('turns');       // turns ativo → indicador
  await act(page,'angcycle');
  await expect(page.locator('#selection')).not.toContainText('turns');   // volta a rad
});
test('v7-UI turns render: T|1⟩ exibe e^{2πi·1/8} (e^{iπ/4} em rad)', async ({ page }) => {
  await act(page,'key:1'); await act(page,'key:SET');                     // |1⟩
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:T');   // T|1⟩ = e^{iπ/4}|1⟩
  expect(await dirac(page)).toContain('e^{iπ/4}');                        // rad
  await act(page,'angcycle');
  expect(await dirac(page)).toContain('e^{2πi·1/8}');                     // turns: 1/8 de volta
  expect(await dirac(page)).not.toContain('e^{iπ/4}');
});
test('v7-UI turns ENTRADA: digitar 1/8 em turns aplica P(π/4) (×2π)', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');   // |+⟩
  await act(page,'angcycle');                                            // turns ON
  await act(page,'gate:P');                     // P (camada 2nd)
  await act(page,'calc:1'); await act(page,'calc:/'); await act(page,'calc:8'); await act(page,'eval');  // "1/8" → ×2π = π/4
  const d = await dirac(page);
  expect(d).toContain('e^{2πi·1/8}');                                    // P(π/4)|+⟩: |1⟩ = (1/√2)e^{2πi·1/8}
  await expect(page.locator('#approxBadge')).not.toHaveClass(/show/);    // exato (π/4 ∈ ζ₁₆)
});
test('v7-UI rad inalterado: digitar π/4 em rad aplica P(π/4) → e^{iπ/4}', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'gate:P');                     // rad (default)
  await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:4'); await act(page,'eval');
  expect(await dirac(page)).toContain('e^{iπ/4}');
  await expect(page.locator('#approxBadge')).not.toHaveClass(/show/);
});

// ================= v7 — consolidação prob+bars (prob vira toggle) =================
test('v7-UI prob toggle: liga (distribuição + on), desliga (limpa); botão bars removido', async ({ page }) => {
  await expect(page.locator('[data-action="bars"]')).toHaveCount(0);          // 'bars' consolidado → removido
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H'); // |+⟩
  await act(page,'key:ALL'); await act(page,'op:prob');                       // v20: ALL prob = distribuição plena (op:prob com selection=n vira marginal)
  await expect(page.locator('#auxOutput')).toContainText('P(|0⟩) = 1/2');     // distribuição persistente
  await expect(page.locator('#auxOutput')).toContainText('P(|1⟩) = 1/2');
  await expect(page.locator('[data-action="op:prob"]')).toHaveClass(/\bon\b/);// indicador on
  await act(page,'key:ALL'); await act(page,'gate:H'); // ALL H → H|+⟩=|0⟩, seleção segue ALL → distribuição plena re-renderiza (v21-20: prob dinâmico segue a seleção)
  await expect(page.locator('#auxOutput')).toContainText('P(|0⟩) = 1');        // colapsou em |0⟩ → P=1 (full dist, seleção ALL)
  await act(page,'key:ALL'); await act(page,'op:prob');                       // desliga (ALL/bare = toggle; v21-27: só qubit específico força mostrar)
  await expect(page.locator('#auxOutput')).toBeEmpty();
  await expect(page.locator('[data-action="op:prob"]')).not.toHaveClass(/on/);
});
test('v7-UI prob na base de exibição: Bell em {+,−} → P(++)/P(−−)', async ({ page }) => {
  await bell(page);                                                           // (1/√2)(|00⟩+|11⟩)
  await act(page,'key:ALL'); await act(page,'chbase');                        // comp → had (display basis {+,−})
  await act(page,'op:prob');
  const aux = page.locator('#auxOutput');
  await expect(aux).toContainText('P(|++⟩)');                                 // distribuição segue a base de exibição
  await expect(aux).toContainText('P(|−−⟩)');
});

// ===== v9 — presets/macros no 2nd layer (DOM-driven: dirige a tela, não o motor) =====
// As formas MANUAIS (bell()/ghz()/QFT manual) permanecem; os presets entram ao lado.
test('v9-UI ALL QFT (3 qubits) → superposição uniforme', async ({ page }) => {
  await act(page,'key:3'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:ALL'); await act(page,'key:2nd'); await act(page,'preset:QFT');
  expect(await dirac(page)).toBe('(1/2√2)|000⟩ + (1/2√2)|001⟩ + (1/2√2)|010⟩ + (1/2√2)|011⟩ + (1/2√2)|100⟩ + (1/2√2)|101⟩ + (1/2√2)|110⟩ + (1/2√2)|111⟩');
});

test('v9-UI CROSS-CHECK na TELA: preset QFT == QFT manual (|001⟩)', async ({ page }) => {
  // forma MANUAL (preservada) — monta a QFT₃ porta a porta
  await act(page,'key:3'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'gate:X');               // |001⟩
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:1'); await act(page,'key:CTRL'); await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:P'); await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:2'); await act(page,'eval');
  await act(page,'key:2'); await act(page,'key:CTRL'); await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:P'); await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:4'); await act(page,'eval');
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:2'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:P'); await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:2'); await act(page,'eval');
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:2nd'); await act(page,'gate:SWAP'); await act(page,'key:2nd');
  const manual = await dirac(page);
  // forma AUTOMÁTICA — mesmo input, tecla de preset
  await act(page,'key:3'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'gate:X');               // |001⟩
  await act(page,'key:ALL'); await act(page,'key:2nd'); await act(page,'preset:QFT');
  expect(await dirac(page)).toBe(manual);                                                   // idênticos
});

test('v9-UI Bell preset: variante pela preparação (|00⟩→Φ+, |01⟩→Ψ+)', async ({ page }) => {
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:SET');              // |00⟩
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'preset:Bell');
  expect(await dirac(page)).toBe('(1/√2)|00⟩ + (1/√2)|11⟩');                                // Φ+
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:X');               // |01⟩
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'preset:Bell');
  expect(await dirac(page)).toBe('(1/√2)|01⟩ + (1/√2)|10⟩');                                // Ψ+
});

test('v9-UI GHZ + Grover presets (ALL, |0…0⟩)', async ({ page }) => {
  await act(page,'key:3'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:ALL'); await act(page,'key:2nd'); await act(page,'preset:GHZ');
  expect(await dirac(page)).toBe('(1/√2)|000⟩ + (1/√2)|111⟩');
  await act(page,'key:2nd');                                                                  // v21-36: sem auto-return após o preset → volta à pág.1
  await act(page,'key:3'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:ALL'); await act(page,'key:2nd'); await act(page,'preset:Grover');
  expect(await dirac(page)).toBe('(3/4)|000⟩ − (1/4)|001⟩ − (1/4)|010⟩ − (1/4)|011⟩ − (1/4)|100⟩ − (1/4)|101⟩ − (1/4)|110⟩ − (1/4)|111⟩');
});

test('v9-UI W preset (≈approx) → 3 termos de excitação única', async ({ page }) => {
  await act(page,'key:3'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:ALL'); await act(page,'key:2nd'); await act(page,'preset:W');
  expect(await dirac(page)).toBe('(0.57735)|001⟩ + (0.57735)|010⟩ + (0.57735)|100⟩');
});

test('v9-UI range por dois Q: 0 Q 2 Q QFT em 4 qubits deixa q3 intacto', async ({ page }) => {
  await act(page,'key:4'); await act(page,'key:Q'); await act(page,'key:SET');              // |0000⟩
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:2nd'); await act(page,'preset:QFT');
  // a tela FATORA o qubit intacto (q3=|0⟩) como ⊗|0⟩ — QFT₃(q0q1q2) ⊗ |0⟩ (didático: o range agiu só em q0..q2)
  expect(await dirac(page)).toBe('((1/2√2)|000⟩ + (1/2√2)|001⟩ + (1/2√2)|010⟩ + (1/2√2)|011⟩ + (1/2√2)|100⟩ + (1/2√2)|101⟩ + (1/2√2)|110⟩ + (1/2√2)|111⟩)⊗|0⟩');
});

test('v9-UI bloco ATÔMICO: 1 undo desfaz a QFT inteira', async ({ page }) => {
  await act(page,'key:3'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:ALL'); await act(page,'key:2nd'); await act(page,'preset:QFT');
  expect(await dirac(page)).not.toBe('|000⟩');
  await act(page,'cmd:undo');                                                                // 1 ↶
  expect(await dirac(page)).toBe('|000⟩');                                                    // QFT inteira desfeita
});

test('v9-UI Bell preset com aridade errada (3 qubits no range) → erro', async ({ page }) => {
  await act(page,'key:3'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'key:2'); await act(page,'key:Q'); await act(page,'preset:Bell');
  await expect(page.locator('#statusLine')).toContainText('Bell requires exactly 2 qubits');
  expect(await dirac(page)).toBe('|000⟩');                                                    // estado inalterado
});


// ===================== v11 — forma matricial (vetor-coluna) =====================
test('v11-UI matrix: Bell → form×2 → vetor-coluna DENSO (zeros) + KaTeX .mtable', async ({ page }) => {
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await bell(page);
  await act(page,'viewform'); await act(page,'viewform');                              // factor → expand → matrix
  await expect(page.locator('#selection')).toContainText('matrix');
  expect(await dirac(page)).toBe('|00⟩  1/√2\n|01⟩  0\n|10⟩  0\n|11⟩  1/√2');           // denso, zeros (dataset.plain)
  expect(await page.locator('#stateDisplay.matrix-view .katex .mtable').count()).toBeGreaterThan(0);   // KaTeX renderizou (não fallback texto)
  expect(errs).toEqual([]);
});

test('v11-UI ciclo: factor → expand → matrix → factor (3 estados)', async ({ page }) => {
  await bell(page);
  await act(page,'viewform'); await expect(page.locator('#selection')).toContainText('expanded');
  await act(page,'viewform'); await expect(page.locator('#selection')).toContainText('matrix');
  await act(page,'viewform'); await expect(page.locator('#selection')).toContainText('factored');
});

test('v11-UI matrix respeita fmt (rect) + segue a base (had): |+⟩', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');           // |+⟩
  await act(page,'fmtcycle');                                                            // exp → a+bi (rect)
  await act(page,'viewform'); await act(page,'viewform');                               // → matrix
  await expect(page.locator('#selection')).toContainText('matrix');
  expect(await dirac(page)).toBe('|0⟩  1/√2\n|1⟩  1/√2');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'chbase');           // base had
  expect(await dirac(page)).toBe('|+⟩  1\n|−⟩  0');                                     // a matriz segue a base ativa
});

test('v11-UI (neg) simbólico |ψ⟩: form NUNCA chega a matrix (concrete-only)', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');                                   // estado abstrato |ψ⟩
  for (let i = 0; i < 4; i++){
    await act(page,'viewform');
    await expect(page.locator('#selection')).not.toContainText('matrix');               // cicla só factored↔expanded
  }
});

test('v11-UI cap: 7 qubits → matriz truncada com nota "(128 rows total)"', async ({ page }) => {
  await act(page,'key:7'); await act(page,'key:Q'); await act(page,'key:SET');          // |0000000⟩
  await act(page,'viewform'); await act(page,'viewform');                               // → matrix
  await expect(page.locator('#selection')).toContainText('matrix');
  expect(await dirac(page)).toContain('(128 rows total)');
});


// ===================== v12 — reorg de teclado + measure sem popup + Bloch mobile =====================
test('v26 keypad: M no numpad; ⊗/⟨φ|ψ⟩/‖ψ‖ no primário; Schmidt/ρ na 2ª camada; labels de bloco sem "2nd"', async ({ page }) => {
  // camada primária (v26: ‖ψ‖/⟨ZZ⟩/factor promovidos)
  await expect(page.locator('[data-action="op:saveBra"]')).toHaveText('M');     // 'save φ' → 'M' (v26: no numpad)
  await expect(page.locator('[data-action="op:inner"]')).toBeVisible();         // ⟨φ|ψ⟩ no primário
  await expect(page.locator('[data-action="op:tensor"]')).toBeVisible();        // ⊗ no primário
  await expect(page.locator('[data-action="op:norm"]')).toBeVisible();          // ‖ψ‖ promovido ao primário
  await expect(page.locator('[data-action="op:schmidt"]')).toHaveCount(0);       // Schmidt é da 2ª camada
  // 2ª camada (2nd)
  await act(page,'key:2nd');
  await expect(page.locator('[data-action="op:schmidt"]')).toBeVisible();        // Schmidt na 2ª camada
  await expect(page.locator('[data-action="op:density"]')).toBeVisible();        // ρ na 2ª camada
  const lbls = (await page.locator('.kp-label').allInnerTexts()).map(s => s.toLowerCase());
  for (const l of lbls) expect(l).not.toContain('2nd');                          // labels de BLOCO sem "2nd"
  expect(lbls).toContain('operations');
});

// ===== v26 Grupo A — faxina do numpad + tecla 2nd (shell do toggle) =====
test('v26-A numpad: M e ⌫ presentes; π/1√2/±/. removidos', async ({ page }) => {
  await expect(page.locator('[data-action="op:saveBra"]')).toBeVisible();        // M migrou p/ o numpad
  await expect(page.locator('[data-action="key:BKSP"]')).toBeVisible();          // ⌫ migrou p/ o numpad
  await expect(page.locator('[data-action="key:PI"]')).toHaveCount(0);           // faxina
  await expect(page.locator('[data-action="key:INVSQRT2"]')).toHaveCount(0);
  await expect(page.locator('[data-action="key:NEG"]')).toHaveCount(0);
  await expect(page.locator('[data-action="key:."]')).toHaveCount(0);
});
test('v26-A tecla 2nd: presente e faz toggle do indicador (on/off)', async ({ page }) => {
  await expect(page.locator('[data-action="key:2nd"]')).toBeVisible();
  await expect(page.locator('[data-action="key:2nd"]')).not.toHaveClass(/\bon\b/);
  await act(page,'key:2nd');                                                     // liga (re-render)
  await expect(page.locator('[data-action="key:2nd"]')).toHaveClass(/\bon\b/);
  await act(page,'key:2nd');                                                     // desliga
  await expect(page.locator('[data-action="key:2nd"]')).not.toHaveClass(/\bon\b/);
});

test('v12-UI M (memory): guarda φ, ⟨φ|ψ⟩ lê — tudo no primário (sem 2nd)', async ({ page }) => {
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'key:SET');   // |0⟩
  await act(page,'op:saveBra');                                                  // M
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:X');    // |1⟩
  await act(page,'op:inner');                                                    // ⟨φ|ψ⟩
  await expect(page.locator('#auxOutput')).toContainText('⟨φ|ψ⟩ = 0');
});

test('v12-UI measure sem popup: colapsa direto (ramos + Collapsed), zero diálogo', async ({ page }) => {
  let dialog = false; page.on('dialog', d => { dialog = true; d.dismiss(); });
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'key:0'); await act(page,'key:CTRL'); await act(page,'key:1'); await act(page,'key:Q'); await act(page,'gate:X');
  await act(page,'op:measure');
  await expect(page.locator('#auxOutput')).toContainText('branches (exact prob)');
  await expect(page.locator('#auxOutput')).toContainText('Collapsed to');
  expect(dialog).toBe(false);
});

test('v12-UI Bloch mobile: tamanho proporcional menor que 232 (v19-L29), nítida (bitmap=css×dpr), valor oculto, rótulo Q visível', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(URL);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');    // |+>
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:bloch');  // mostra a esfera
  const cv = await page.locator('#blochCanvas').boundingBox();
  expect(cv.width).toBeGreaterThan(80);                       // v19-L29: proporcional à altura útil de .disp-body (piso ~110 puro CSS, mas pode encolher por flex no container)
  expect(cv.width).toBeLessThan(170);                         // ainda MUITO menor que os 232 originais (mobile encolheu)
  expect(Math.abs(cv.width - cv.height)).toBeLessThan(2);     // canvas quadrado
  // nitidez: o bitmap interno = css × devicePixelRatio (sem upscale borrado)
  const crisp = await page.locator('#blochCanvas').evaluate(el => el.width >= Math.round(el.getBoundingClientRect().width * (window.devicePixelRatio||1)) - 1);
  expect(crisp).toBe(true);
  await expect(page.locator('#blochValue')).toBeHidden();     // v12: só o VALOR removido no mobile
  await expect(page.locator('#blochLabel')).toBeVisible();    // rótulo Q permanece (canto sup. direito)
});


test('v12-UI turns no simbólico: indicador presente e ANTES de factored', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');     // estado simbólico |ψ⟩
  await act(page,'angcycle');                              // ∠ → turns
  const sel = await page.locator('#selection').innerText();
  expect(sel).toContain('turns');
  expect(sel).toContain('factored');
  expect(sel.indexOf('turns')).toBeLessThan(sel.indexOf('factored'));   // v12: turns ANTES do form (consistente c/ concreto)
});

// ===== v13 — symbolic memory + ⊗ (FRENTE A) · scientific calc retired (FRENTE B) =====
test('v13-UI M + ⊗ symbolic: |ψ⟩ SET · M · |φ⟩ SET · ⊗ → |ψ⟩⊗|φ⟩', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');         // |ψ⟩
  await act(page,'op:saveBra');                               // M → saves φ = |ψ⟩
  await expect(page.locator('#auxOutput')).toContainText('saved as φ');
  await act(page,'ket:φ'); await act(page,'key:SET');         // current = |φ⟩
  await act(page,'op:tensor');                                // ⊗ → saved(|ψ⟩) ⊗ current(|φ⟩)
  expect(await dirac(page)).toBe('|ψ⟩⊗|φ⟩');
});

test('v13-UI ANCHOR (T·H|ψ⟩) ⊗ |φ⟩: gates leave nodes, M, ⊗ → TH|ψ⟩⊗|φ⟩', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');
  await act(page,'gate:H'); await page.keyboard.press('Escape');   // v16: H on |ψ⟩ → Esc físico deixa o nó (tecla ESC da gaveta removida)
  await act(page,'gate:T'); await page.keyboard.press('Escape');   // T → node  ⇒ TH|ψ⟩
  await act(page,'op:saveBra');                               // M
  await act(page,'ket:φ'); await act(page,'key:SET');
  await act(page,'op:tensor');
  expect(await dirac(page)).toBe('TH|ψ⟩⊗|φ⟩');
});

test('v13-UI NEG ⊗ shared label: |ψ⟩ · M · |ψ⟩ · ⊗ → "rename" error', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');
  await act(page,'op:saveBra');
  await act(page,'ket:ψ'); await act(page,'key:SET');
  await act(page,'op:tensor');
  await expect(page.locator('#statusLine')).toContainText('rename');
});

test('v13-UI mixed ⊗: saved symbolic |ψ⟩, current concrete |1⟩ → |ψ⟩⊗|1⟩', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');         // |ψ⟩
  await act(page,'op:saveBra');                               // save symbolic φ = |ψ⟩
  await act(page,'key:1'); await act(page,'key:SET');         // current concrete |1⟩ (bitstring '1' + SET)
  await act(page,'op:tensor');
  expect(await dirac(page)).toBe('|ψ⟩⊗|1⟩');
});

test('v13-UI calc RETIRED: no mode toggle key, M is on the keypad', async ({ page }) => {
  await expect(page.locator('[data-action="mode"]')).toHaveCount(0);   // scientific calc mode gone
  await expect(page.locator('[data-action="op:saveBra"]')).toBeVisible();   // M still present
  // inline angle entry STILL works (evaluator kept): Rz(π/4)|0⟩ = e^{-iπ/8}|0⟩ (exact, ζ₁₆ — global phase −θ/2)
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:Rz');
  await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:4'); await act(page,'eval');
  const d = await dirac(page);
  expect(d).toContain('e^{-iπ/8}');   // inline angle applied + exact (no ≈)
  expect(d).not.toContain('0.7071');
});

// ===================== v14 — teclado deslizante paginado (carrossel) =====================
// λ-turns BUGFIX (avulso): em turns, o autovalor 1/8 vira π/4 EXATO (não 0.125 rad approx)
test('v14-UI λ em turns: T|ψ⟩ com 1/8 → e^{2πi·1/8} exato (sem aproximação)', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');                            // |ψ⟩ simbólico
  await act(page,'angcycle');                                                    // turns
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:T');    // T|ψ⟩ → declara autovalor λ
  await act(page,'calc:1'); await act(page,'calc:/'); await act(page,'calc:8'); await act(page,'eval');  // λ = 1/8 de volta
  const d = await dirac(page);
  expect(d).toContain('e^{2πi·1/8}');                                            // 1/8 turn = π/4 → EXATO
  expect(d).not.toMatch(/0\.\d{3}/);                                             // sem decimal (não caiu em ≈approx)
});

// ===== v15 — gaveta (drawer) de ângulo/λ deslizante sobre o teclado =====
// O FEEL (slide-up/down + swipe-down=ESC) é human-AV: Playwright NÃO emula touch-swipe nem standalone (v12-L1/L4).
// Aqui = parte ESTRUTURAL: a gaveta abre na entrada (#keypad inert ⇒ zero click-through), some ao fechar (teclado
// vivo), e FORA da entrada não existe no DOM (removida ⇒ sem colisão de seletor com o comando ⌫/ESC).
const sheetCount  = (p) => p.locator('#angleSheet').count();
const keypadInert = (p) => p.locator('#keypad').evaluate(el => !!el.inert);

test('v15-UI gaveta abre na entrada: #angleSheet sobe + #keypad inert (sem click-through) + pad enxuto', async ({ page }) => {
  expect(await sheetCount(page)).toBe(0);                                          // idle: sem gaveta (sem colisão de seletor)
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:Rz');     // porta paramétrica → abre a gaveta
  await expect(page.locator('#angleSheet')).toBeVisible();
  await expect(page.locator('#angleSheet')).toHaveClass(/open/);                   // deslizou p/ cima
  expect(await keypadInert(page)).toBe(true);                                      // teclado de baixo INERTE (sem click-through)
  await expect(page.locator('#statusLine')).toContainText('Rz');                   // prompt do ângulo no display
  await expect(page.locator('#angleSheet [data-action="calc:π"]')).toBeVisible();  // pad enxuto reusado (v14-27)
  await expect(page.locator('#angleSheet [data-action="eval"]')).toBeVisible();
  await expect(page.locator('#angleSheet .sheet-handle')).toBeVisible();           // affordance de arraste (swipe-down)
});

test('v15-UI = aplica e RECOLHE: ângulo exato + teclado volta vivo + gaveta removida', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:Rz');
  await act(page,'calc:π'); await act(page,'calc:/'); await act(page,'calc:2'); await act(page,'eval');
  expect(await dirac(page)).not.toMatch(/0\.\d{3}/);                               // Rz(π/2)|0⟩ exato (a gaveta entregou o ângulo ao motor)
  await expect(page.locator('#angleSheet')).toHaveCount(0);                        // recolheu (slide-down) e foi removida
  expect(await keypadInert(page)).toBe(false);                                     // teclado VIVO de novo
});

test('v15/16-UI cancelar a entrada via Esc FÍSICO (tecla ESC da gaveta removida no v16): deixa o nó Z|ψ⟩ + teclado vivo + gaveta removida', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:Z');      // Z|ψ⟩ → entrada de λ (gaveta sobe)
  await expect(page.locator('#angleSheet')).toBeVisible();
  await page.keyboard.press('Escape');                                             // v16: cancela por Esc físico (a tecla ESC da gaveta foi removida; mobile usa swipe-down) → deixa simbólico
  expect(await dirac(page)).toBe('Z|ψ⟩');
  await expect(page.locator('#angleSheet')).toHaveCount(0);                        // recolheu
  expect(await keypadInert(page)).toBe(false);                                     // teclado vivo
});

// ===== v16 — visor de 2 painéis (estado | detalhe): troca por TAP + dots + AUTO-SWITCH das ops =====
// Estrutural; o feel da transição é human-AV. Painel ATIVO detectado pelo [inert] do painel oculto (como o carrossel v14).
const dispActive = (p) => p.locator('#dispDetail').evaluate(el => el.inert ? 'main' : 'detail');   // detalhe inert ⇒ principal ativo

test('v16-UI idle: estado e Bloch no PRINCIPAL, readouts no DETALHE, sem dots', async ({ page }) => {
  expect(await page.locator('#dispMain #stateDisplay').count()).toBe(1);            // estado no principal
  expect(await page.locator('#dispMain #blochInline').count()).toBe(1);             // esfera de Bloch INLINE no principal (não no detalhe)
  expect(await page.locator('#dispDetail #auxOutput').count()).toBe(1);             // readouts no detalhe
  await expect(page.locator('#dispDots')).toBeHidden();                             // sem detalhe → sem dots
  expect(await dispActive(page)).toBe('main');
});

test('v16/v19-UI op de readout AUTO-ROLA p/ o detalhe + setas laterais; seta esquerda volta ao principal', async ({ page }) => {
  await bell(page);                                                                 // |Φ+⟩ concreto
  await act(page,'op:prob');                                                        // prob → readout no #auxOutput
  await expect(page.locator('#dispEdgeLeft')).toBeVisible();                        // v19 (F3a): pane=1 + hasDetail → seta esquerda visível
  expect(await dispActive(page)).toBe('detail');                                    // auto-switch p/ o detalhe
  await expect(page.locator('#dispDetail #auxOutput')).toContainText('P(');         // readout está no detalhe
  await page.locator('#dispEdgeLeft').click();                                      // seta esquerda → volta ao principal
  expect(await dispActive(page)).toBe('main');
});

test('v16-UI Bloch fica INLINE no principal (NÃO auto-rola p/ o detalhe)', async ({ page }) => {
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'key:SET');      // |0⟩
  await act(page,'op:bloch');                                                       // liga a esfera (showBloch)
  await expect(page.locator('#blochInline')).toBeVisible();
  expect(await dispActive(page)).toBe('main');                                      // permanece no principal (esfera é didática, junto do estado)
});

test('v16-UI entrada de ângulo: chip rad/turns (angcycle) presente e ALTERNA durante a entrada', async ({ page }) => {
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:Rz');      // abre a entrada de ângulo
  const chip = page.locator('#selection [data-action="angcycle"]');
  await expect(chip).toBeVisible();
  const m0 = (await chip.textContent()).trim();                                     // rad | turns
  await chip.click();                                                               // alterna DURANTE a entrada (antes era engolido)
  expect((await chip.textContent()).trim()).not.toBe(m0);
});

// ===================== v19 — UI (F3a setas laterais + F3b expandir) =====================
test('v19-UI F3a: setas laterais OCULTAS quando NÃO há detalhe (idle)', async ({ page }) => {
  // estado idle (sem op de readout) → sem detalhe → setas escondidas
  await expect(page.locator('#dispEdgeLeft')).toBeHidden();
  await expect(page.locator('#dispEdgeRight')).toBeHidden();
});
test('v19-UI F3a: op:prob mostra a SETA DIREITA (pane=0, hasDetail=1) + auto-rola p/ detalhe → SETA ESQUERDA', async ({ page }) => {
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'key:SET');      // |0⟩
  await act(page,'op:prob');                                                       // readout no detalhe → auto-switch (v16)
  // Após auto-switch, pane=1 → seta ESQUERDA visível (volta p/ estado), direita oculta
  await expect(page.locator('#dispEdgeLeft')).toBeVisible();
  await expect(page.locator('#dispEdgeRight')).toBeHidden();
  // tap na seta esquerda → volta ao painel principal → seta DIREITA visível, esquerda oculta
  await page.locator('#dispEdgeLeft').click();
  await expect(page.locator('#dispEdgeRight')).toBeVisible();
  await expect(page.locator('#dispEdgeLeft')).toBeHidden();
});
test('v19-UI F3b: botão dispArrowBottom existe no DOM + classe .display-expanded é semântica do toggle (human-AV cobre overflow real)', async ({ page }) => {
  // Estado idle: seta oculta + body sem classe expandida
  await expect(page.locator('#dispArrowBottom')).toHaveCount(1);                    // botão presente
  await expect(page.locator('body')).not.toHaveClass(/display-expanded/);
  // O ResizeObserver dispara em overflow REAL — Playwright não force overflow consistente (depende de fonts/render);
  // humanAV (operadora ao vivo) valida a semântica (estado longo → ▼ aparece → toque expande → ▲ → toque restaura).
});


// ===================== v20 — PER-QUBIT INSPECTOR (M2 dispatch + M3 fita + M4 tap-cycle) =====================
// M1 (Ops.probQ núcleo) é coberto por tests/v20.test.mjs. Aqui validamos UI.

test('v20-UI-1 ALL prob: mantém distribuição plena (regressão v7)', async ({ page }) => {
  await bell(page);
  await act(page,'key:ALL'); await act(page,'op:prob');                                // explicit ALL (Parser selection persiste de CNOT)
  await expect(page.locator('#auxOutput')).toContainText('P(|00⟩)');
  await expect(page.locator('#auxOutput')).toContainText('P(|11⟩)');
});

test('v20-UI-2 n Q prob: marginal P(Qn=0)/P(Qn=1) em Bell', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:prob');        // 0 Q prob
  const text = await page.locator('#auxOutput').innerText();
  expect(text).toContain('P(Q0=0)');
  expect(text).toContain('P(Q0=1)');
  expect(text).toContain('1/2');                                                      // marginal exata
});

test('v20-UI-3 prob: "n Q prob" SEMPRE mostra (tem input); bare prob desliga (v21-27)', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:prob');        // "0 Q prob" → mostra P(Q0)
  await expect(page.locator('#auxOutput')).toContainText('P(Q0=0)');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:prob');        // "0 Q prob" de novo → MOSTRA (input, não desliga)
  await expect(page.locator('#auxOutput')).toContainText('P(Q0=0)');
  await act(page,'op:prob');                                                          // bare prob (sem input) → desliga
  expect(await page.locator('#auxOutput').innerText()).toBe('');
});

test('v21-20 prob DINÂMICO: o readout segue a seleção corrente sem re-apertar prob', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:prob');        // prob ON, seleção Q0
  await expect(page.locator('#auxOutput')).toContainText('P(Q0=0)');
  await act(page,'key:1'); await act(page,'key:Q');                                   // SÓ muda a seleção → readout segue (dinâmico, sem prob)
  await expect(page.locator('#auxOutput')).toContainText('P(Q1=0)');
  await expect(page.locator('#auxOutput')).not.toContainText('P(Q0=0)');
  await act(page,'key:ALL');                                                          // ALL → distribuição plena (dinâmico)
  await expect(page.locator('#auxOutput')).toContainText('P(|00⟩)');
  await act(page,'op:prob');                                                          // prob OFF
  await expect(page.locator('#auxOutput')).toBeEmpty();
});

test('v20-UI-5a ring oculto em 1 qubit (H|0⟩ — só Q0 ciclável, tap seria no-op)', async ({ page }) => {
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'key:SET');
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'gate:H');
  await act(page,'op:bloch');
  await expect(page.locator('#blochTapRing')).toBeHidden();
});
test('v20-UI-5b ring visível em Bell (≥2 qubits cicláveis)', async ({ page }) => {
  await bell(page);
  await act(page,'op:bloch');                                                          // Parser.selection já = 1 (último Q de CNOT)
  await expect(page.locator('#blochTapRing')).toBeVisible();
});

test('v21-22 tap-cycle no centro MOVE a seleção (Bloch+indicador acoplados)', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:bloch');       // abre Bloch → seleção Q0
  await expect(page.locator('#blochLabel')).toHaveText('Q0');
  expect(await page.locator('#selection').innerText()).toContain('Q0');               // indicador Q0
  const box = await page.locator('#blochCanvas').boundingBox();
  await page.mouse.click(box.x + box.width/2, box.y + box.height/2);                  // tap centro → cicla Q0→Q1
  await expect(page.locator('#blochLabel')).toHaveText('Q1');                         // esfera em Q1
  expect(await page.locator('#selection').innerText()).toContain('Q1');               // v21-22: seleção SEGUE (acoplado, não mais view-only)
});

test('v21-23 ALL fecha a Bloch + prob volta à distribuição plena (esfera é de 1 qubit)', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:bloch');       // Bloch on, seleção Q0
  await expect(page.locator('#blochInline')).toBeVisible();
  await act(page,'op:prob');                                                          // prob → marginal de Q0
  await expect(page.locator('#auxOutput')).toContainText('P(Q0=0)');
  await act(page,'key:ALL');                                                          // ALL → fecha Bloch + prob full dist
  await expect(page.locator('#blochInline')).toBeHidden();                            // v21-22: ALL fecha a esfera
  await expect(page.locator('#auxOutput')).toContainText('P(|');                      // distribuição plena (dinâmico)
});

test('v21-24 abrir Bloch com ALL selecionado fixa a seleção em Q0', async ({ page }) => {
  await bell(page);
  await act(page,'key:ALL');                                                          // seleção ALL
  await act(page,'op:bloch');                                                         // abre → deve fixar Q0
  expect(await page.locator('#selection').innerText()).toContain('Q0');               // v21-22: seleção alinhada ao qubit mostrado
  await expect(page.locator('#blochLabel')).toHaveText('Q0');
});

test('v20-UI-8 tap FORA do centro não cicla (mantém Q0)', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q'); await act(page,'op:bloch');
  await expect(page.locator('#blochLabel')).toHaveText('Q0');                         // âncora: esfera aberta em Q0
  await page.waitForTimeout(360);                                                     // espera a animação de zoom do canvas (.28s) ASSENTAR antes de medir (senão o box é obsoleto → clique cai perto do centro → ciclo)
  const box = await page.locator('#blochCanvas').boundingBox();
  // tap no CANTO da esfera (máxima distância do centro, bem além do tapRadius de 44px)
  await page.mouse.click(box.x + 3, box.y + 3);
  await expect(page.locator('#blochLabel')).toHaveText('Q0');                         // não cicla
});

test('v21-2 overscroll-behavior none — swipe-down não dispara pull-to-refresh (sem reload acidental)', async ({ page }) => {
  await bell(page);
  const ob = await page.evaluate(() => getComputedStyle(document.body).overscrollBehaviorY);
  expect(ob).toBe('none');
});

test('v21-3 tick háptico (navigator.vibrate) ao pressionar uma tecla', async ({ page }) => {
  await page.evaluate(() => { window.__vib = []; navigator.vibrate = (ms) => { window.__vib.push(ms); return true; }; });
  await act(page, 'key:2');                                   // .click() dispara pointerdown → vibrate
  expect(await page.evaluate(() => window.__vib)).toContain(70);
});

test('v21-4 háptico no tap-cycle da esfera de Bloch (só quando clicável)', async ({ page }) => {
  await bell(page);                                          // concreto 2 qubits → cicláveis (ring visível)
  await act(page, 'op:bloch');
  await page.evaluate(() => { window.__vib = []; navigator.vibrate = (ms) => { window.__vib.push(ms); return true; }; });
  const box = await page.locator('#blochCanvas').boundingBox();
  await page.mouse.click(box.x + box.width/2, box.y + box.height/2);   // tap no centro → cicla → vibra
  expect(await page.evaluate(() => window.__vib)).toContain(70);
});

test('v21-5 tap no estado alterna fonte 50% (toggle .state-half)', async ({ page }) => {
  const sd = page.locator('#stateDisplay');
  await expect(sd).not.toHaveClass(/state-half/);
  await sd.click();                                           // tap simples (sem movimento)
  await expect(sd).toHaveClass(/state-half/);                 // fonte a 50%
  await sd.click();
  await expect(sd).not.toHaveClass(/state-half/);             // volta ao normal (toggle)
  await sd.click();                                           // 50% de novo
  await expect(sd).toHaveClass(/state-half/);
  await act(page, 'cmd:reset');                               // v21-23: CLR restaura a fonte padrão
  await expect(sd).not.toHaveClass(/state-half/);
});

test('v21-27 prob: dígito MOSTRA o qubit pedido (não alterna); sem dígito = toggle', async ({ page }) => {
  await bell(page);                                                          // |Φ+⟩ (2 qubits)
  await act(page,'key:0'); await act(page,'op:prob');                        // "0 prob" → mostra P(Q0)
  await expect(page.locator('#auxOutput')).toContainText('P(Q0=0)');
  await act(page,'key:1'); await act(page,'op:prob');                        // "1 prob" já ligado → TROCA p/ Q1 (não desliga)
  await expect(page.locator('#auxOutput')).toContainText('P(Q1=0)');
  await expect(page.locator('#selection')).toContainText('Q1');
  await act(page,'key:1'); await act(page,'op:prob');                        // "1 prob" no MESMO qubit → MOSTRA (não desliga)
  await expect(page.locator('#auxOutput')).toContainText('P(Q1=0)');
  await act(page,'op:prob');                                                 // bare prob (sem input) → toggle OFF
  await expect(page.locator('#auxOutput')).toBeEmpty();
  // "n Bloch" com input também MOSTRA/troca (não desliga)
  await act(page,'key:0'); await act(page,'op:bloch');                       // abre em Q0
  await expect(page.locator('#blochLabel')).toHaveText('Q0');
  await act(page,'key:1'); await act(page,'op:bloch');                       // "1 Bloch" → troca p/ Q1 (não fecha)
  await expect(page.locator('#blochInline')).toBeVisible();
  await expect(page.locator('#blochLabel')).toHaveText('Q1');
});

test('v21-31 ESC dispensa a mensagem do detalhe (ex.: "Result φ⊗ψ…") e volta ao estado', async ({ page }) => {
  await act(page,'ket:ψ'); await act(page,'key:SET');          // |ψ⟩
  await act(page,'op:saveBra');                                // M → salva φ
  await act(page,'ket:φ'); await act(page,'key:SET');          // |φ⟩
  await act(page,'op:tensor');                                 // ⊗ → "Result φ⊗ψ became the current state."
  await expect(page.locator('#auxOutput')).toContainText('became the current state');
  await act(page,'key:CLR');                                   // ESC
  await expect(page.locator('#auxOutput')).toBeEmpty();        // v21-31: mensagem dispensada
});

test('v21-32 ⟨ZZ⟩ (pág.2): sem seleção → ⟨Z₀Z₁⟩ de TODOS; Bell correlacionado = +1', async ({ page }) => {
  await bell(page);
  await act(page,'op:corr');                                // ⟨ZZ⟩ sobre todos os qubits (ALL default)
  const text = await page.locator('#auxOutput').innerText();
  expect(text).toContain('⟨Z₀Z₁⟩');                                                  // rótulo com subscritos por qubit
  expect(text).toContain('= 1');                                                     // Bell Φ+ → correlação +1 exata
});

test('v21-32 ⟨ZZ⟩ segue a SELEÇÃO: "0 Q ⟨ZZ⟩" em Bell → ⟨Z₀⟩ = 0 (qubit marginal)', async ({ page }) => {
  await bell(page);
  await act(page,'key:0'); await act(page,'key:Q');                                   // alvo Q0 (pág.1)
  await act(page,'op:corr');                                // → ⟨Z₀⟩
  const text = await page.locator('#auxOutput').innerText();
  expect(text).toContain('⟨Z₀⟩');
  expect(text).not.toContain('Z₁');                                                  // só o qubit pedido
  expect(text).toContain('0');                                                       // Bell: ⟨Z₀⟩ = P0−P1 = 0
});

test('v22 √X (pág.2): aplicar duas vezes = X (|0⟩→|1⟩)', async ({ page }) => {
  await act(page,'key:1'); await act(page,'key:Q'); await act(page,'key:SET');   // |0⟩ (1 qubit)
  await act(page,'key:2nd');                                                       // pág.2
  await act(page,'gate:SX'); await act(page,'gate:SX');                           // √X·√X = X
  expect(await dirac(page)).toBe('|1⟩');
  await expect(page.locator('#approxBadge')).not.toHaveClass(/show/);             // √X é EXATO (sem badge ≈)
});

test('v21-26 preset no estado default ALL executa SEM re-apertar ALL (Bell)', async ({ page }) => {
  await act(page,'key:2'); await act(page,'key:Q'); await act(page,'key:SET');   // |00⟩ (2 qubits) — indicador ALL (default, allFlag=false)
  await expect(page.locator('#selection')).toContainText('ALL');
  await act(page,'preset:Bell');                        // v21-25: aplica direto, sem precisar apertar a tecla ALL antes
  expect(await dirac(page)).toBe('(1/√2)|00⟩ + (1/√2)|11⟩');                       // Φ+ em todos os qubits
});

test('v21-25 prob em estado MISTO (|0⟩|ψ⟩) liga e DESLIGA (toggle no simbólico)', async ({ page }) => {
  await act(page,'ket:0'); await act(page,'ket:ψ'); await act(page,'key:SET');   // |0⟩⊗|ψ⟩ — concreto + simbólico
  await act(page,'op:prob');                                                      // liga → distribuição simbólica
  await expect(page.locator('#auxOutput')).toContainText('P(0)');
  await act(page,'op:prob');                                                      // v21-24: DESLIGA (antes era one-shot e não desligava)
  await expect(page.locator('#auxOutput')).toBeEmpty();
});

test('v21-1 Bloch ON habilita a affordance de expandir + expand re-desenha a esfera', async ({ page }) => {
  await bell(page);
  await act(page,'op:bloch');                                                          // liga a esfera
  await expect(page.locator('#dispArrowBottom')).toBeVisible();                        // v21-1: Bloch habilita a seta de expandir
  const w0 = await page.locator('#blochCanvas').evaluate(el => parseFloat(el.style.width) || 0);
  await page.locator('#dispArrowBottom').click();                                      // expande o display
  await page.waitForTimeout(700);                                                      // transição (≈270) + re-render agendado (300)
  await expect(page.locator('#dispArrowBottom')).toHaveClass(/up/);                    // estado expandido (▲ restaurar)
  const w1 = await page.locator('#blochCanvas').evaluate(el => parseFloat(el.style.width) || 0);
  expect(w1).toBeGreaterThan(0);                                                       // re-desenhada (renderBloch rodou)
  expect(w1).toBeGreaterThanOrEqual(w0);                                               // cresce (ou ao menos não encolhe) com o display expandido
  // v21-4: ao expandir, o painel principal empilha (esfera em cima centralizada, estado em largura cheia embaixo)
  expect(await page.locator('#dispMain').evaluate(el => getComputedStyle(el).flexDirection)).toBe('column');
  await page.locator('#dispArrowBottom').click();                                      // retrai (_expanded=false)
  await page.waitForTimeout(700);
  expect(await page.locator('#dispMain').evaluate(el => getComputedStyle(el).flexDirection)).toBe('row');   // v21-4: normal volta a lado a lado
  await act(page,'op:bloch');                                                          // desliga a esfera
  await expect(page.locator('#dispArrowBottom')).toBeHidden();                         // sem Bloch, sem expand, sem overflow → affordance some (default)
});


// ───────── v24 — generalized control (CTRL) + power (2ʲ / POW), full key→screen path ─────────
test('v24 POW key (2^j) is present in the fixed command block', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('.kp-command [data-action="key:POW"]')).toHaveCount(1);
});
test('v24 (+) generalized controlled-H: 2 Q SET · 0 Q X · 0 CTRL 1 Q H → (1/√2)|10⟩+(1/√2)|11⟩', async ({ page }) => {
  await page.goto(URL);
  for (const a of ['key:2','key:Q','key:SET','key:0','key:Q','gate:X','key:0','key:CTRL','key:1','key:Q','gate:H']) await act(page,a);
  expect(await dirac(page)).toBe('|1⟩⊗((1/√2)|0⟩ + (1/√2)|1⟩)');   // factored: q0 stays |1⟩, q1 → |+⟩ (controlled-H fired)
});
test('v24 (+) POW visible: 1 Q SET · 0 Q H · 0 Q 2 2^j T (=T⁴=Z) → |−⟩', async ({ page }) => {
  await page.goto(URL);
  for (const a of ['key:1','key:Q','key:SET','key:0','key:Q','gate:H','key:0','key:Q','key:2','key:POW','gate:T']) await act(page,a);
  expect(await dirac(page)).toBe('(1/√2)|0⟩ − (1/√2)|1⟩');
});
test('v24 (−) ALL + CTRL → error, no apply', async ({ page }) => {
  await page.goto(URL);
  for (const a of ['key:1','key:Q','key:SET']) await act(page,a);
  const before = await dirac(page);
  for (const a of ['key:ALL','key:0','key:CTRL','gate:H']) await act(page,a);
  await expect(page.locator('#statusLine')).toContainText('⚠');
  expect(await dirac(page)).toBe(before);
});
test('v24 (−) POW cap: 1 1 2^j → error (max j=10)', async ({ page }) => {
  await page.goto(URL);
  for (const a of ['key:1','key:1','key:POW']) await act(page,a);
  await expect(page.locator('#statusLine')).toContainText('⚠');
  await expect(page.locator('#statusLine')).toContainText('exponent too large');
});
test('v24 (−) preset control overlaps its target range → error, no apply', async ({ page }) => {
  await page.goto(URL);
  for (const a of ['key:3','key:Q','key:SET']) await act(page,a);       // |000⟩
  const before = await dirac(page);
  for (const a of ['key:1','key:CTRL','key:1','key:Q','key:2','key:Q','key:2nd','preset:Grover']) await act(page,a);   // ctrl q1 ∈ {1,2}
  await expect(page.locator('#statusLine')).toContainText('⚠');
  await act(page,'key:2nd');
  expect(await dirac(page)).toBe(before);
});

// v26 — indicador de processamento (#busyDot). Gating por CUSTO PREVISTO (não por timer): ops baratas
// rodam síncronas e o indicador NUNCA acende (a preocupação da operadora: nada de pisca-pisca em op curta).
// O "aparece em op pesada" depende de quadros/timing e é validado no device (como o háptico).
test('v26 busyDot: existe, escondido no início', async ({ page }) => {
  await page.goto(URL);
  const dot = page.locator('#busyDot');
  await expect(dot).toHaveCount(1);
  await expect(dot).toBeHidden();
});
test('v26 busyDot: op CURTA (ALL H em |0⟩) não acende o indicador (zero pisca-pisca)', async ({ page }) => {
  await page.goto(URL);
  await act(page,'key:ALL'); await act(page,'gate:H');     // n=1: custo ínfimo → caminho síncrono
  expect(await dirac(page)).toBe('(1/√2)|0⟩ + (1/√2)|1⟩');
  await expect(page.locator('#busyDot')).toBeHidden();      // segue escondido (nunca foi mostrado)
});
test('v26 busyDot: cadeia de gates de 1 qubit nunca acende o indicador', async ({ page }) => {
  await page.goto(URL);
  for (const a of ['key:0','key:Q','gate:H','key:0','key:Q','gate:T','key:0','key:Q','gate:S']) await act(page,a);
  await expect(page.locator('#busyDot')).toBeHidden();
});
test('v26 busyDot: op PESADA (ALL H em 10 qubits) ACENDE o indicador', async ({ page }) => {
  await page.goto(URL);
  for (const a of ['key:1','key:0','key:Q','key:SET']) await act(page,a);   // |0…0⟩ com 10 qubits
  // observa a transição do atributo hidden DURANTE a aplicação (determinístico: instalado antes da op,
  // captura o show mesmo que o hide venha logo depois — independe do timing exato dos quadros)
  const shown = page.evaluate(() => new Promise(res => {
    const el = document.getElementById('busyDot');
    let seen = false;
    new MutationObserver(() => { if (!el.hidden) seen = true; }).observe(el, { attributes:true });
    setTimeout(() => res(seen), 4000);
  }));
  await act(page,'key:ALL'); await act(page,'gate:H');
  expect(await shown).toBe(true);
  await expect(page.locator('#busyDot')).toBeHidden();    // e volta a esconder ao terminar
});

// v26 — About (botão "i" ao lado do "?")
test('v26 about: botão i abre o overlay com o crédito de autoria', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('#aboutOverlay')).toBeHidden();
  await act(page,'about');
  await expect(page.locator('#aboutOverlay')).toBeVisible();
  await expect(page.locator('#aboutCard')).toContainText('Jasmine Moreira');
  await expect(page.locator('#aboutCard')).toContainText('QuantumCalc');
  await expect(page.locator('#aboutCard a')).toHaveAttribute('href', 'https://www.linkedin.com/in/jasminemoreira2013/');
});
test('v26 about: × fecha; clique no card NÃO fecha; backdrop fecha', async ({ page }) => {
  await page.goto(URL);
  await act(page,'about');
  await page.locator('#aboutCard h2').click();                 // clique no conteúdo: NÃO fecha
  await expect(page.locator('#aboutOverlay')).toBeVisible();
  await page.locator('#aboutX').click();                        // botão ×
  await expect(page.locator('#aboutOverlay')).toBeHidden();
  await act(page,'about');
  await page.locator('#aboutOverlay').click({ position:{ x:5, y:5 } });   // backdrop (canto, fora do card)
  await expect(page.locator('#aboutOverlay')).toBeHidden();
});
