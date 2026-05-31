# Lições de Implementação & Decisões Finais (Fase 7 — ciclo v1)

> Capturadas após implementar e testar `quantum_calc.html` (M1–M11). Entrada
> valiosa para um eventual ciclo v2 (start_new_cycle). Não são lições sobre a
> metodologia — são sobre ESTE projeto (domínio, stack, padrões, premissas erradas).

## Decisões finais (vs. contratos de P1)
- **`norm2` devolve surd `(p+q√2)/2^k`, não fração racional `{num,den}`** (desvio do
  contrato M1). Motivo de domínio: a probabilidade `|amp|²` de um único estado de
  base em Clifford+T pode ser IRRACIONAL — ex.: `cos²(π/8) = (2+√2)/4`. O "N(t)" de
  Giles–Selinger §8 é o módulo complexo `t·t̄`, que cai em ℤ[√2] (carrega √2) para
  superposições. Quando `q=0`, reduz à fração racional que o contrato esperava.
- **`k` por-amplitude** (cada `Amp` carrega seu `k`) em vez de "k global por vetor".
  Equivalente e mais robusto para somas/produtos de amplitudes com denominadores
  diferentes; `State.k` mantido apenas nominalmente.
- **Base de display = estratégia de render (Strategy), não transformação de State.**
  Estado mantido SEMPRE em base computacional internamente; render transforma só na
  exibição (H^⊗n para Hadamard; (H·S†)^⊗n para circular), exato em ℤ[ω]. Evita a
  ambiguidade de aplicar portas num estado "já rotacionado". (P1 acertou ao prever isto.)
- **Convenção fixada e exibida:** `U(θ,φ,λ)` = OpenQASM 3.0/Qiskit; big-endian interno,
  reversão `q → n-1-q` só no export Qiskit (testado).

## Premissa de P0/P1 que se mostrou imprecisa
- **"Ângulos notáveis π/2^m são exatos"** — verdadeiro só com anel ciclotômico
  CRESCENTE (ℤ[ζ_{2^{m+1}}]). Com o núcleo concreto fixado em **ℤ[ω] = ζ₈**
  (ω=e^{iπ/4}), as fases EXATAS são múltiplos de **π/4**. T (π/4), S (π/2), Z, e a
  QFT com fases π/2 e π/4 permanecem exatos; **π/8 e mais finos caem no fallback
  numérico sinalizado** (`approx`). Consistente com a restrição "ℤ[ω] sobre BigInt".
  → Candidato natural a escopo v2: núcleo ζ₁₆/ζ_{2^m} para QFT de mais qubits exata.

## Armadilhas de stack / implementação encontradas
- **Despacho de matriz de portas multi-qubit:** SWAP/iSWAP (4×4, sem controle) não
  cabiam no caminho `STATIC[base]` (só 1-qubit) nem nos parametrizados → precisaram de
  `case` explícito no `build()`. Pego pelo teste do preset QFT (que usa SWAP no fim).
- **`recognize()` como porta de exatidão:** rotações computadas numericamente e depois
  reconhecidas em ℤ[ω] unificam a decisão exato/aproximado num único ponto; `matchSurd`
  com tolerância fixa (1e-7) e busca limitada evita falsos "exatos" (testado com 1/3, 0.1234).
- **Display imaginário:** `1/√2i` é ambíguo; formatar como `i/√2` (numerador) exigiu
  um helper dedicado (`imagLiteral`). Pequeno, mas central para a legibilidade didática.

## Lição de processo/teste específica do projeto
- **Bug de UX só visível em DOM real + screenshot:** o `#auxOutput` mantinha o
  resultado de uma operação ANTERIOR (ex.: matriz ρ 8×8 do GHZ) após o estado mudar
  por reset/porta/undo — invisível para asserções textuais sobre o ESTADO, capturado ao
  inspecionar a tela real (Playwright screenshot). Confirma AP5: teste de unidade do
  núcleo não substitui inspeção visual/humana. Corrigido (limpa em `execute`/undo/redo)
  + teste de regressão Playwright.

## Limites práticos confirmados
- N ≤ 12 qubits (recusa acima, sem travar). ρ completa só N ≤ 5; emaranhamento via ρ
  reduzida direto do vetor (sem materializar 4^N) — entropia/Schmidt exatos p/ ≤2 qubits,
  numérico (rotulado) acima. W₃ é numérico (1/√3 ∉ ζ₈), exibido com badge `≈`.
