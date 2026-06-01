# v23 (ciclo 24) — lições e decisões finais · Part III E6–E10 (doc-only)

## O que foi entregue
Part III do manual.html = **E1–E8 + E10 (9 cards)**. Novos/revisados neste ciclo:
- **E6 Simon** (n=2, s=11): H⊗² · oráculo (CNOTs, f(x)=x₀⊕x₁) · H⊗² → input ∈ {|00⟩,|11⟩}. Exato.
- **E7 Superdense (expandido)**: **preset Bell** · Pauli (I/X/Z/ZX) · CNOT·H → 4 mensagens 00/01/10/11. Exato.
- **E8 Shor N=15, a=11**: `SET · H · H · 2 CNOTs · preset QFT†` (~14 teclas). controlled-(×11 mod 15) = 2 CNOTs (|0001⟩↔|1011⟩); 11²≡1 ⇒ U² omitido; t=2; picos {0,2}→r=2→gcd(11±1,15)={3,5}. Exato.
- **E10 Teleportation (4 ramos)**: **preset Bell** (q1,q2) · Alice (CNOT·H) · correções ADIADAS (CNOT q1→q2, CZ q0→q2) → q2=|ψ⟩ exato, determinístico; os 4 ramos de medição (00→I,01→X,10→Z,11→ZX) na prosa/circuito.
- **E5 QPE (revisado)**: troca inverse-QFT manual (~12 portas) pelo **preset QFT†**; mesmo |0011⟩.

## Decisões finais
- **a=11 (não a=7)** para Shor-15: instância de MENOR número de teclas (2 CNOTs vs 9 CSWAP+12 CNOT). r=2.
- **QFT† via preset** em E5/E8 (não inverse-QFT à mão).
- **E9 Quantum Counting DEFERIDO ao ciclo 25** (decisão de escopo registrada, não silencioso).

## Lições do projeto
1. **Mínimo de teclas é REQUISITO, não estética.** Expandir algoritmos da família QPE porta-a-porta (mult modular controlada, Grover controlado) gera 200+ teclas inúteis didaticamente. Os PRESETS (QFT/QFT†/Bell/Grover) devem ser os blocos dos cards; escolher a instância que minimiza teclas (Shor a=11). A operadora interrompeu a entrega das versões longas — antipadrão real pego por human-AV.
2. **O preset QFT† CASA a convenção da inverse-QFT do QPE** (verificado: mesmo |0011⟩ que o SWAP+CP-negativos à mão). Usar o preset. (O "preset deu errado no E9" era bug de autofase do meu Grover-controlado à mão, NÃO incompatibilidade do preset.)
3. **applyN já multi-controla QUALQUER porta (inclusive H) corretamente.** Grover controlado por injeção de controle nas ops do preset Grover dá contagem exata (N=4/M=2→M=2). O bloqueio do quantum counting curto é EXPOSIÇÃO no teclado (Engine.apply rejeita aridade), não capacidade do motor → carry-forward: feature de **controle generalizado** ("CTRL antes de qualquer porta/preset") encurta Shor/QPE/Counting de uma vez.
4. **Endianness Qiskit(little)↔motor(big) inverte a ordem das portas de circuito portado.** A sequência de SWAPs do c_amod15 teve de ser invertida; sempre verificar o ciclo da permutação no motor, nunca assumir.
5. **Princípio da medição adiada torna o teleporte determinístico e exato para um card** (correções controladas em vez de medição aleatória) → 1 estado simbólico limpo q2=|ψ⟩, replayável/pinável (anti-AP7).
6. **Display (fatorado) ≠ pin de teste (expandido)** são artefatos separados; o teste anti-AP7 fixa a forma EXPANDIDA, a manual captura o render default FATORADO. Não confundir (quebrou os pins E1–E5 momentaneamente ao trocar para fatorado).

## Carry-forward (ciclo 25)
- **Feature "controle generalizado"** (CTRL + qualquer porta/preset → applyN multi-controlado; matemática já existe). Encurta Shor (mult modular controlada), turbina QPE, e habilita:
- **Card E9 Quantum Counting** canônico curto (N=4, M=2, t=3 → QPE sobre Grover; picos c={2,6}→M=2 exato verificado).
- Radar antigo: CU(λ)/EV multi-qubit; iOS KaTeX baseline; entrada direta de amplitudes (já tem badge ≈).
