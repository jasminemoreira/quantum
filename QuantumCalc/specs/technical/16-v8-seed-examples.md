# Semente do ciclo v8 — `examples.html` (cookbook prático, básico→avançado)

> Decidido no fim do v7 (usuária pediu "documento com exemplos práticos, do básico ao avançado").
> Conduzir como **ciclo v8 enxuto** (Versus) em **sessão NOVA**. Fase 0 leve (escopo já quase fixado aqui).

## Entregável
**`examples.html`** — HTML único, offline, KaTeX (mesmo estilo/CSS do `manual.html`), abre ao lado da
calculadora. Linkar do `manual.html` (e vice-versa). NÃO é referência (isso é o manual) — é **prática
guiada**: cada exemplo = objetivo + sequência de teclas + **resultado esperado (validado)** + 1 linha
do "porquê".

## Formato decidido (usuária, fim do v7)
- HTML+KaTeX offline (não Markdown, não seção do manual). Arquivo separado `examples.html`.

## HARD REQUIREMENT (qualidade — anti-AP7)
**Cada exemplo é VALIDADO contra o motor antes de entrar no doc** — rodar a sequência de teclas via
Node (engine) ou Playwright (DOM real) e capturar a saída REAL; nunca inventar resultado. Os exemplos
viram, de quebra, casos de teste. Reusar o harness de `tests/` (loadQC / act+dirac).
Aproveitar para criar o helper **`assertValidKatex(str)`** (lição v7 §L1: ponto cego KaTeX-offline) e
rodar em cada string de estado dos exemplos.

## Progressão proposta (básico → avançado) — refinar na Fase 0 do v8
**Básico**
1. Preparar estados: `N Q SET` (contagem), bitstring `+SET`, ket-string `|0⟩|+⟩|1⟩ +SET`.
2. Porta única: `0 Q X`, `0 Q H` → |+⟩. `ALL H`.
3. Vistas: 3 formatos (exp/rect/polar via `fmt`) e 3 bases (via `basis`); constantes π, 1/√2.

**Intermediário**
4. Bell `(H + CNOT)` e GHZ (3 qubits).
5. `prob` (toggle) + `Bloch` (1 qubit) + leitura α|0⟩+β|1⟩.
6. Medição/colapso; ⟨φ|ψ⟩ (`save φ` + `⟨φ|ψ⟩`); norma.
7. Mudança de base e como o estado se reexpressa.

**Avançado** (o que v6/v7 destravam)
8. Clifford+T exato; **P(π/8) exato (√T)** e o display de surdo aninhado `√(2±√2)`.
9. **QFT de 3 e 4 qubits** (exata) — montagem com H + CP(π/2,π/4,π/8) + SWAP.
10. **Phase kickback / teste de Hadamard** — com o lembrete do AUTOESTADO (alvo |1⟩, não |+⟩);
    `controlled-T = CP(π/4)`; **CP vs CRz** (matrizes, quando usar cada).
11. **Convenção de ângulo ∠ rad↔turns** — o caso real "1/8 de volta = π/4 ≠ π/8"; e^{2πiφ}.
12. **Teleportação** completa (medida parcial amostrada + correção Pauli).
13. **Simbólico |ψ⟩** — autovalor inline `U|ψ⟩=λ|ψ⟩` (λ=e^{iθ}), kickback simbólico, fase de QPE.
14. **Emaranhamento** — concorrência, decomposição de Schmidt, entropia de von Neumann, ρ reduzida.

## Notas p/ a Fase 0 do v8
- Modo DELTA (doc sobre v7 maduro, 265 testes). Motor/UI INTOCADOS (só documentação + possível helper
  de teste). Out-of-scope: qualquer mudança no motor/portas.
- Decidir na Fase 0: profundidade (quantos exemplos por tier), se inclui screenshots (a usuária NÃO vê
  imagens lidas via Read no VSCode — preferir descrição textual + caminho de PNG clicável se gerar),
  e se os exemplos viram uma suíte `tests/examples.test.mjs` automatizada.
- Convenção de teclas no doc: usar a mesma notação dos testes (`0 Q H`, `1 CTRL 2 Q CNOT`, `2nd P` etc.).
- Estado da UI no v7: teclado `ALL · CTRL · Q · SET · 2nd` (linha 1) / `CLR · ↶ · ↷ · ⟲ · ⌫` (linha 2);
  strip `basis · fmt · ∠ · form · → calc`; `prob` é toggle (não há mais `bars`).
