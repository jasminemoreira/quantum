// tests/no-pt-leak.test.mjs — Phase 6 (v10): translation guard (anti-drift).
// The product is 100% English. This trap scans the USER-FACING strings of quantum_calc.html (code
// comments may stay in PT and are stripped before scanning) and the WHOLE generated manual.html for
// leftover Portuguese anchor tokens. It fails if any remain — covering completeness AND consistency of
// the PT→EN translation in one place (specs/technical/22 §Resolução Fase 3).
// Glossary: porta→gate, alvo→target, controle→control, estado→state, fase→phase, medir→measure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// Distinctive Portuguese tokens that must NOT survive in user-facing text. Accented/PT-only words need
// no boundary; ambiguous bare words use \b to avoid English false positives (e.g. "porta" ⊂ "!important").
const PT_PATTERNS = [
  /\bportas?\b/i, /\balvos?\b/i, /\bcontrole\b/i, /\brequer\b/i, /\bvazio\b/i,
  /\bfora do\b/i, /desconhecid/i, /inválid/i, /repetid/i, /esperad/i, /recebidos/i,
  /concorrência/i, /função/i, /express[ãa]o de [âa]ngulo/i, /selecione/i,
  /não suportad/i, /não é porta/i, /não dá/i, /divisão/i, /observável/i, /traço parcial/i,
  /\bbasico\b/i, /\bavancado\b/i, /sem estado/i,
  /\bescuro\b/i, /\bclaro\b/i, /\blimpar\b/i, /\bdesfaz/i, /\brefaz/i, /\breinici/i, /\bsalvar\b/i, /\besfera\b/i,
  /[ãõçáéíóúâêàü]/i,   // catch-all: any Latin/PT accented char in user-facing text (math uses Greek/√/π, not these)
];

// Remove CSS/JS block comments, JS line comments (protecting URLs `://`) and HTML comments, so only
// user-facing strings/markup remain.
function stripComments(src){
  let s = src.replace(/\/\*[\s\S]*?\*\//g, ' ');     // /* ... */  (CSS + JS block)
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');            // <!-- ... -->
  s = s.replace(/^\s*\/\/[^\n\r]*/gm, '');           // line comment at start of line
  s = s.replace(/([^:'"\\])\/\/[^\n\r]*/g, '$1');    // inline // comment (not after : ' " or \)
  return s;
}

function scan(label, text){
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (const re of PT_PATTERNS){
    for (let i = 0; i < lines.length; i++){
      if (re.test(lines[i])) hits.push(`  [${re}] line ${i + 1}: ${lines[i].trim().slice(0, 120)}`);
    }
  }
  assert.equal(hits.length, 0, `${label}: Portuguese leaked into user-facing text:\n${hits.join('\n')}`);
}

test('no-pt-leak: quantum_calc.html user-facing strings are English', () => {
  const html = readFileSync(join(ROOT, 'quantum_calc.html'), 'utf8');
  scan('quantum_calc.html', stripComments(html));
});

test('no-pt-leak: generated manual.html is English', () => {
  const path = join(ROOT, 'manual.html');
  assert.ok(existsSync(path), 'manual.html not found — run `npx playwright test examples.spec.js` first');
  scan('manual.html', readFileSync(path, 'utf8'));
});
