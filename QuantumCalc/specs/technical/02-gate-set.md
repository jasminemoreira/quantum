# Conjunto de Portas (matrizes canônicas)

> Fonte: pesquisa P0 (agente B). Formas canônicas de Nielsen & Chuang [NC],
> Wikipedia *List of quantum logic gates* [W], Qiskit `UGate` [QU].
> **Todas exatas em ℤ[ω], exceto rotações Rx/Ry/Rz/U de ângulo arbitrário.**

## Convenções a FIXAR (um tool simbólico DEVE declarar — diferencial didático)
- **Ordenação de qubits:** big-endian (|q₁q₀⟩, textbook) vs little-endian (Qiskit).
  Decisão pendente — ver specs/validation. O display deve mostrar a convenção.
- **Fase global de U(θ,φ,λ):** convenção OpenQASM 3.0 (Qiskit moderno) difere da
  2.0 por e^{i(φ+λ)/2}. Fixar e documentar.

## Portas de 1 qubit
| Porta | Matriz | Papel | Exata ℤ[ω]? |
|---|---|---|---|
| I | [[1,0],[0,1]] | Identidade (σ₀) | ✅ |
| X | [[0,1],[1,0]] | Flip de bit; rot. π em x | ✅ |
| Y | [[0,−i],[i,0]] | Bit+fase; rot. π em y | ✅ |
| Z | [[1,0],[0,−1]] | Flip de fase; rot. π em z | ✅ |
| H | (1/√2)[[1,1],[1,−1]] | Superposição; troca base Z↔X | ✅ |
| S (√Z) | [[1,0],[0,i]] | Quarto de volta em z (e^{iπ/2}) | ✅ |
| S† | [[1,0],[0,−i]] | Inversa de S | ✅ |
| T (π/8) | [[1,0],[0,e^{iπ/4}]] | Oitavo de volta; H,CNOT,T = universal | ✅ (ω) |
| T† | [[1,0],[0,e^{−iπ/4}]] | Inversa de T | ✅ |
| P(φ) | [[1,0],[0,e^{iφ}]] | Fase geral; P(π)=Z, P(π/2)=S, P(π/4)=T | ✅ se φ=π/2^m |
| Rx(θ) | [[cos(θ/2), −i·sin(θ/2)],[−i·sin(θ/2), cos(θ/2)]] | Rotação em x | ⚠️ só θ notável |
| Ry(θ) | [[cos(θ/2), −sin(θ/2)],[sin(θ/2), cos(θ/2)]] | Rotação em y | ⚠️ só θ notável |
| Rz(θ) | [[e^{−iθ/2},0],[0,e^{iθ/2}]] | Rotação em z | ⚠️ só θ notável |
| U(θ,φ,λ) | [[cos(θ/2), −e^{iλ}sin(θ/2)],[e^{iφ}sin(θ/2), e^{i(φ+λ)}cos(θ/2)]] | Unitária 1-qubit geral (ZYZ) | ⚠️ só ângulos notáveis |

A **Uθ** do mockup é caso especial de U (provavelmente Ry(θ) a menos de convenção).

## Portas de 2+ qubits (base computacional, ordem |q₁q₀⟩)
| Porta | Matriz | Papel |
|---|---|---|
| CNOT (CX) | [[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]] | Flip alvo se controle=1; emaranha |
| CZ | diag(1,1,1,−1) | Fase −1 em |11⟩; simétrica |
| C-U | diag(I₂, U) | U no alvo se controle=1 |
| SWAP | [[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,0,1]] | Troca dois qubits |
| iSWAP | [[1,0,0,0],[0,0,i,0],[0,i,0,0],[0,0,0,1]] | Troca + fase i |
| Toffoli (CCX) | I₈ com canto inf. dir. 2×2 = X | Flip alvo se 2 controles=1 |
| Fredkin (CSWAP) | I₈ trocando |101⟩↔|110⟩ | Troca 2 alvos se controle=1 |

**Universalidade:** {H, T, CNOT} é conjunto universal padrão (NC).
