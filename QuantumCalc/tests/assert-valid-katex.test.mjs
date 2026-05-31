// tests/assert-valid-katex.test.mjs — Fase 6 (v8): guards do helper assertValidKatex.
// Garante que o helper REJEITA os modos de falha conhecidos (negativos) e ACEITA LaTeX válido.
// (Cobertura antes no examples.test.mjs, removido no rework DOM-driven; restaurada aqui.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertValidKatex } from './assert-valid-katex.mjs';

test('assertValidKatex NEG: \\dfrac dentro de e^{…} lança (bug de layout v7)', () => {
  assert.throws(() => assertValidKatex('e^{\\dfrac{1}{8}}'), /dfrac/);
});
test('assertValidKatex NEG: chaves desbalanceadas lança', () => {
  assert.throws(() => assertValidKatex('\\frac{1}{2'), /desbalanceadas/);
});
test('assertValidKatex NEG: string vazia lança', () => {
  assert.throws(() => assertValidKatex(''), /vazio/);
});
test('assertValidKatex NEG: comando LaTeX inválido lança (renderToString)', () => {
  assert.throws(() => assertValidKatex('\\notacommand{x}'));
});
test('assertValidKatex POS: LaTeX válido passa', () => {
  assert.ok(assertValidKatex('\\tfrac{1}{\\sqrt2}|00\\rangle'));
  assert.ok(assertValidKatex('e^{i\\pi/4}|1\\rangle'));   // \tfrac/expoente simples OK
});
