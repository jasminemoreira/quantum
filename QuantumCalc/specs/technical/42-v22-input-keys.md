# v22 (ciclo 23) — Teclas de input / composição de estado (DELTA)

**Delivery Target:** Delta completo (4 grupos neste ciclo).
**Modo:** DELTA sobre o QuantumCalc v0.1 (motor exato ℤ[ζ₁₆] INTOCADO; numéricos só pelo caminho ≈ já existente).

## Motivação (P0)
A calc compõe estados via portas a partir da base computacional, mas não permite **inserir estados arbitrários/aleatórios** nem aplicar **ângulos comuns** rapidamente. No ensino, isso obriga a recorrer a uma calculadora científica para os drills de conversão de coordenadas / probabilidade / Bloch. O delta reaproveita o contrato **"exato por padrão, aproximado sinalizado (badge ≈)"**.

## Os 4 grupos (design fechado em P0)

| # | Tecla(s) | Onde | Exato? | Comportamento |
|---|---|---|---|---|
| 1 | **√X, √Y** | pág.2 · gate variants | EXATO | SX/SY ∈ ℤ[ζ₁₆]; (1±i)/2 = e^{±iπ/4}/√2 = ω^{±1}/√2. Convenção Qiskit SX ⇒ SX²=X, SY²=Y exatos. **(spike feito: commit 2b7a332)** |
| 1 | **\|T⟩** | pág.2 · input | EXATO | MACRO de prep ATÔMICO = reseta p/ \|0⟩ de 1 qubit, aplica H depois T ⇒ (\|0⟩+e^{iπ/4}\|1⟩)/√2. (P3 achado B: estado FRESCO de 1 qubit, NÃO sobre o registro corrente — sempre exato.) NÃO toca em ketBasis/CARDINAL_KETS/evidência (\|T⟩ não forma par de base de medição). |
| 2 | **π/8, π/4, π/2** | UI de **entrada de ângulo** | EXATO | Quick-insert ao digitar o ângulo de P/U/Rz/CP. SUBSTITUEM o buffer por "π/8" etc. (P3 achado C: substitui, não insere no meio → evita "2π/8"). NÃO são teclas de porta na pág.2 (evita duplicar T=P(π/4)/S=P(π/2)/Z=P(π)). |
| 3 | **rand** | pág.2 · input | ≈ | Estado FRESCO de **1 qubit** (como SET; History.init). Amostragem **Haar-uniforme** na esfera de Bloch (P3 achado D: θ=acos(1−2u), φ=2πv — NÃO θ uniforme). Normalizado. Badge ≈ ON. |
| 4 | **amp** | pág.2 · input | ≈ | Estado FRESCO de **1 qubit** α\|0⟩+β\|1⟩, aceitando **a+bi E r∠θ** (toggle), via overlay guiado que espelha a gaveta de ângulo (um overlay por vez). Normaliza ao confirmar; α=β=0 → erro. Badge ≈ ON. |

## Critérios de sucesso (mensuráveis)
- √X²=X, √Y²=Y EXATOS (badge OFF). |T⟩ exato (badge OFF).
- rand gera estado normalizado válido (‖ψ‖²=1) com badge ≈.
- amp normaliza e o estado bate com o digitado (a+bi e r∠θ).
- Suíte Node + Playwright verde; validação humana no device (Motorola).

## Fora de escopo (YAGNI)
- amp/rand de **n qubits** (2ⁿ amplitudes — custo×benefício ruim p/ iniciante).
- |T⟩ como ket cardeal (mexeria na máquina de bases).
- Exatidão fora de ℤ[ζ₁₆] (impossível por construção; ex.: √3, fases não-múltiplas de π/8).
- √X†/√Y† (adiável).

## Viabilidade (P0 — sem bloqueador)
- ✅ Modo ≈ + badge `#approxBadge` já existem (ângulos fora de π/8).
- ✅ Página 2 tem espaço (novo grupo 'input').
- ✅ Entrada de amplitudes pode espelhar o padrão da **gaveta de ângulo** (overlay/inline existente).

## Correção de processo
Este conjunto deveria ter aberto um ciclo Versus desde o início (apontado pela operadora). √X/√Y foi implementado antes do P0 (deslize) e está reclassificado como **spike de P5 validado**.
