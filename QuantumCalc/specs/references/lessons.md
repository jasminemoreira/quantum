# QuantumCalc — Índice cumulativo de lições

Lições detalhadas por ciclo ficam em `specs/technical/NN-vXX-lessons.md`. Este arquivo é o
registro persistente que alimenta o próximo ciclo.

| Ciclo | Versão | Arquivo | Resumo |
|---|---|---|---|
| 22 | v21 | `40-v21-lessons.md` | Part III E1–E5; oráculos como portas literais |
| 23 | v22 | `43-v22-lessons.md` | Teclas de input pág.2; expand sem pulo |
| 25 | v24 | `47-v24-lessons.md` | Controle generalizado + potência 2ʲ |
| 26 | v25 | `48-v25-lessons.md` | Gramática unificada CTRL+base |
| 27 | v26 | `49-v26-lessons.md` | Teclado único + 2nd; CSS dvh+flex no PWA |
| 28 | v28 | `51-v28-lessons.md` | Ângulo simbólico em P/Rz; símbolo fresco por gate |
| 29 | v29 | `53-v29-lessons.md` | PLAY no manual: app real em iframe via postMessage |

## Ciclo 28 — destaques para levar adiante

- Reusar um nome de símbolo afirma igualdade → default = símbolo fresco (`θ`, `θ₂`, …).
- Contadores derivados do estado (não globais) ganham reset/undo de graça.
- Delta aditivo + whitelist + asserção no motor = zero regressão no caminho exato.
- Mudança de formato atrás de condição que hoje nunca ocorre = risco zero no display existente.
- Human-AV pega erros semânticos que a suíte automática não pega.

## Ciclo 29 — destaques para levar adiante

- Demo/replay deve passar pela MESMA rota do toque e ser comparada com a captura real.
- file:// = iframe cross-origin → postMessage; trocar só o #hash não recarrega um iframe.
- `fn.toString()` injetado leva comentários → em inglês.
- Golden da saída exibida ANTES de refatorar.
- `fixed` deslocado no celular → medir scrollWidth e achar quem alarga o documento.
