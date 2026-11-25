# v28 (cycle 28) — Lições: ângulo simbólico em fases diagonais

**L1 — Reusar um nome de símbolo AFIRMA igualdade.** O default `θ` fixo fazia `P(θ)` e `Rz(θ)`
compartilharem o ângulo por acidente (e duas `P(θ)` virarem `e^{2iθ}`). O default honesto é
INDEPENDÊNCIA: símbolo fresco por gate (`θ → θ₂ → θ₃`); igualdade só quando o usuário DIGITA o mesmo
símbolo. Achado só apareceu no human-AV — os testes automáticos validavam a álgebra, não a semântica
do nome. (math-before-didactics)

**L2 — Derivar o contador de símbolos do ESTADO, não de um contador global.** `freshPhaseSym` lê
`SymState.symbolIds()`: reset no SET e consistência com undo/redo saem de graça, sem estado paralelo.

**L3 — Delta aditivo com whitelist + asserção defensiva.** `applyDiagPhaseSym` não toca
`applyOne`/`applyN`; whitelist `{P, Rz}` na FSM e `throw` no motor (dupla barreira). Resultado:
zero regressão no caminho numérico ℤ[ζ₁₆] e no λ.

**L4 — Guardar mudança de formatação atrás de uma condição que hoje nunca ocorre.** O `phaseLabel`
com denominador após o símbolo (`e^{−iθ/2}`) só dispara com `coefD≠1`, que só o Rz novo produz →
nenhum display existente mudou, e o `toKatex` já renderizava inline sem alteração.

**L5 — Rz simbólico é DOIS ramos.** `e^{−iθ/2}` em |0⟩ e `e^{+iθ/2}` em |1⟩ (não fase global
descartável quando há controle). Testar Rz só em |0⟩ pegou isso.

**L6 — O hook de testes precisa do EXIT STATUS.** Rodar suites com `tail`/pipes esconde o código de
saída; usar `...; echo "VERSUS_TEST_EXIT=$?"` (Playwright roda de dentro de `tests/`).
