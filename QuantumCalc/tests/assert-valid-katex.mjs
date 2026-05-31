// tests/assert-valid-katex.mjs — helper v8 que fecha o ponto cego KaTeX-offline (lição v7 §L1, 3ª recorrência).
// Valida a string LaTeX (saída de Render.toKatex) de DUAS formas:
//   1) guarda HEURÍSTICA contra os modos de falha JÁ vistos (válidos p/ o KaTeX, mas que ESTOURAM o layout):
//      \dfrac dentro de um expoente e^{…} (bug v7: fração display-style num sobrescrito → gigante/sobreposto).
//   2) validação REAL: como o KaTeX está vendorizado, renderiza via katex.renderToString({throwOnError:true}).
//      Isso pega LaTeX genuinamente inválido — o que a heurística sozinha não pegaria.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
// KaTeX vendorizado (UMD) — carregado uma vez.
const katex = require(join(HERE, '..', 'vendor', 'katex', 'katex.min.js'));

// chaves balanceadas
function bracesBalanced(s){
  let depth = 0;
  for (const ch of s){ if (ch === '{') depth++; else if (ch === '}'){ depth--; if (depth < 0) return false; } }
  return depth === 0;
}

// \dfrac (ou \frac em display) dentro de QUALQUER expoente e^{…} → estoura o sobrescrito (regra v7)
function dfracInExponent(s){
  // procura e^{ … } e inspeciona o conteúdo balanceado do sobrescrito
  let i = 0;
  while ((i = s.indexOf('^{', i)) !== -1){
    let depth = 1, j = i + 2;
    for (; j < s.length && depth > 0; j++){ if (s[j] === '{') depth++; else if (s[j] === '}') depth--; }
    const sup = s.slice(i + 2, j - 1);
    if (sup.includes('\\dfrac')) return true;
    i = j;
  }
  return false;
}

// Lança se a string LaTeX for inválida ou cair num modo de falha de layout conhecido.
export function assertValidKatex(latex, ctx = ''){
  const where = ctx ? ` [${ctx}]` : '';
  if (typeof latex !== 'string' || latex.trim() === '')
    throw new Error(`KaTeX vazio/não-string${where}`);
  if (!bracesBalanced(latex))
    throw new Error(`KaTeX com chaves desbalanceadas${where}: ${latex}`);
  if (dfracInExponent(latex))
    throw new Error(`KaTeX com \\dfrac dentro de e^{…} (estoura o sobrescrito, bug v7)${where}: ${latex}`);
  // validação real de sintaxe LaTeX via KaTeX vendorizado
  try { katex.renderToString(latex, { throwOnError: true, displayMode: false }); }
  catch (e){ throw new Error(`KaTeX inválido${where}: ${e.message}\n  LaTeX: ${latex}`); }
  return true;
}

export { katex };
