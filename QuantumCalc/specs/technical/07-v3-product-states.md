# v3 — Preparação de estado-produto via ket-string (pesquisa técnica)

> Ciclo 4 (v3). DELTA sobre o núcleo puro ℤ[ω] do v1/v2 (ver 01–06).
> Apenas o mecanismo NOVO: entrada de uma "ket-string" de kets cardeais → estado-produto.

## 1. Os 6 kets cardeais (estados estabilizadores de 1 qubit)
São os autoestados das três Paulis — todos EXATOS em ℤ[ω] (ω=e^{iπ/4}, 1/√2=ω−ω³, i=ω²):

| Ket | Vetor | Autoestado de | ℤ[ω] |
|---|---|---|---|
| \|0⟩ | (1, 0) | Z (+1) | exato |
| \|1⟩ | (0, 1) | Z (−1) | exato |
| \|+⟩ | (1/√2)(1, 1) | X (+1) | exato |
| \|−⟩ | (1/√2)(1, −1) | X (−1) | exato |
| \|+i⟩ | (1/√2)(1, i) | Y (+1) | exato |
| \|−i⟩ | (1/√2)(1, −i) | Y (−1) | exato |

Ref: Nielsen–Chuang §1.3, §10.5 (estabilizadores); são exatamente as bases de exibição já
implementadas no v2 (comp/had/circ), logo o gerador de cada ket JÁ existe no núcleo.

## 2. Ket-string → estado-produto (mecanismo novo)
- Entrada: sequência de tokens de ket digitada pelo usuário, ex.: `|0⟩|+⟩|1⟩`.
- Materialização (SET): estado = ⊗_q |k_q⟩, big-endian (1º ket = Q0).
  Ex.: `|0⟩|+⟩|1⟩` → |0⟩⊗|+⟩⊗|1⟩ = (1/√2)(|001⟩ + |011⟩) — exato.
- nº de kets = N (≤12). Construção: tensor sucessivo (`Ops.tensor`/`State` já existem) ou
  preenchimento direto do vetor (2^N amplitudes) a partir dos fatores de 1 qubit.
- É a GENERALIZAÇÃO do SET-bitstring do v2: bitstring 0/1 é o caso com kets ∈ {|0⟩,|1⟩}.

## 3. Coexistência com a FSM de SET (v2) — sem regressão
Três formas de SET, desambiguadas pelo tipo de token no buffer:
1. dígitos 0/1 (bitstring) + SET → |bits⟩            (v2, mantido)
2. `N Q` + SET → N qubits |0…0⟩ (contagem)            (v2, mantido)
3. ket-string (tokens de ket) + SET → estado-produto  (NOVO v3)
Misturar tokens de dígito e de ket no mesmo buffer = ERRO claro.

## 4. Restrição: estado PERMANECE PURO
- Preparar só é válido para qubit separável (ρ reduzida pura) — tipicamente a montagem
  do estado inicial. Preparar/reset de qubit EMARANHADO produziria um remanescente MISTO
  (matriz densidade) → DESCARTADO neste ciclo (mantém núcleo vetor-de-estado exato).

## 5. Caso de uso motivador — phase kickback
Preparar ancilla em |−⟩ e registrador em |+⟩/|0⟩/|1⟩, aplicar porta controlada/oráculo U_f,
e observar a fase do autovalor "retornar" ao controle (|+⟩→|−⟩ quando a fase é −1). Núcleo
algébrico de Deutsch–Jozsa, Bernstein–Vazirani, Grover, Shor. Hoje exige montar |±⟩ via H/X;
a ket-string elimina esse passo, deixando a álgebra de interesse limpa. Ref: Nielsen–Chuang §1.4.3–1.4.4.

## Veredito de viabilidade
Tier 1 (reusa o núcleo). Os 6 kets já são gerados internamente; falta só (a) tokens de ket
no teclado, (b) parse da ket-string na FSM, (c) construtor do produto no SET. Nenhum bloqueio.
Estado segue exato em ℤ[ω] e puro. Sem novas dependências; single-file/offline preservados.
