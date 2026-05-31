# Exemplos Trabalhados — aritmética ℤ[ω] concreta (referência Tier 2 + vetores de teste)

> Base de ℤ[ω]: 1=(1,0,0,0), ω=(0,1,0,0), ω²=i=(0,0,1,0), ω³=(0,0,0,1).
> √2 = ω − ω³ = (0,1,0,−1). Estado guarda expoente global `k` (divisor √2^k).
> Ordenação **big-endian**: índice de base = Σ qᵢ·2^(n−1−i), q₀ é o bit mais à esquerda.

## E1 — H em 1 qubit
Início: |0⟩ → n=1, k=0, amp[0]=(1,0,0,0).
H|0⟩ = (|0⟩+|1⟩)/√2 → **k=1**, amp[0]=(1,0,0,0), amp[1]=(1,0,0,0).
Display exato: `(1/√2)|0⟩ + (1/√2)|1⟩` (não 0,7071).

## E2 — Fases exatas (T, S)
- T = diag(1, ω). **T|1⟩ = ω|1⟩** → amp[1]=(0,1,0,0), k=0. Display fase: `e^{iπ/4}|1⟩`.
- S = diag(1, i). **S|1⟩ = i|1⟩** → amp[1]=(0,0,1,0), k=0. Display: `e^{iπ/2}|1⟩` = `i|1⟩`.
- T·T|1⟩ = ω²|1⟩ = i|1⟩ = S|1⟩ ✓ (consistência ω²=i).

## E3 — Estado de Bell |Φ+⟩ (preset)
Início |00⟩ (n=2, k=0, amp[00]=(1,0,0,0)).
1. `0 Q H` (H em q0): |00⟩ → (|00⟩+|10⟩)/√2 → k=1, amp[00]=(1,0,0,0), amp[10]=(1,0,0,0).
2. `0 1 CNOT` (controle q0, alvo q1): |10⟩→|11⟩, |00⟩ fica.
**Resultado:** k=1, amp[00]=(1,0,0,0), amp[11]=(1,0,0,0) = `(1/√2)|00⟩ + (1/√2)|11⟩`. ✓

## E4 — Mudança de base / autoestado de Y
|+i⟩ = (|0⟩ + i|1⟩)/√2 → k=1, amp[0]=(1,0,0,0), amp[1]=(0,0,1,0). Exato em ℤ[ω]. ✓

## E5 — Probabilidade de medição (exata)
Para |Φ+⟩ (E3): P(00) = |amp[00]|² = N(t)/2^k com t=(1,0,0,0) → N=1, k=1 → **1/2**.
P(11)=1/2; P(01)=P(10)=0. Frações exatas, sem float. ✓

## E6 — Multiplicação em ℤ[ω] (verificação da regra)
ω·ω³ = ω⁴ = −1 = (−1,0,0,0). Via shift (×ω em (0,0,0,1)): (a,b,c,d)=(0,0,0,1) ↦ (−d,a,b,c)=(−1,0,0,0). ✓
conj(ω) = conj(0,1,0,0) = (0,−0,−0,−1)·? regra conj(a,b,c,d)=(a,−d,−c,−b) → (0,0,0,−1) = −ω³. E ω† = e^{−iπ/4} = −ω³ ✓.

## E7 — GHZ de 3 qubits (preset)
|000⟩ —`0 Q H`→ (|000⟩+|100⟩)/√2 —`0 1 CNOT`→ (|000⟩+|110⟩)/√2 —`0 2 CNOT`→
`(1/√2)|000⟩ + (1/√2)|111⟩`. k=1, amp[000]=(1,0,0,0), amp[111]=(1,0,0,0). ✓

## E8 — Ângulo arbitrário (fallback numérico sinalizado)
`Rx(0.3)` em |0⟩: cos(0,15)=0,98877…, −i·sin(0,15)=−0,14944…i → amplitudes
NUMÉRICAS marcadas `approx:true`. reconhecer() não acha forma exata → display
numérico com aviso. (Contraste com Rx(π/2), que é exato.)

---
Estes vetores servem de **ground truth** para os testes da Fase 6 (specs/datasets).
