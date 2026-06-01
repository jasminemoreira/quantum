# v23 (ciclo 24) — Part III E6–E10 · referências de circuito

Cards doc-only no padrão E (v21). Estados capturados do motor via replay dos `steps` (anti-AP7).
Circuitos como sequências LITERAIS de portas concretas. Motor ℤ[ζ₁₆] intocado.

## E6 — Simon's algorithm
- **Ref:** Nielsen & Chuang, *Quantum Computation and Quantum Information*, §5.4.3 (Simon); Simon 1997, SIAM J. Comput. 26(5).
- **Instância:** n=2 bits, período s=11 (binário). 2 qubits input + 2 output (4 qubits).
- **Circuito:** H⊗² (input) · oráculo Uf (CNOTs: copia input→output e codifica s; p/ s=11, Uf = CNOT(q0→q2)·CNOT(q1→q3)·CNOT(q0→q3) ou equivalente que satisfaça f(x)=f(x⊕s)) · H⊗² (input) · measure input.
- **Exatidão:** só H/CNOT → EXATO em ℤ[ζ₁₆]. Resultado: y medido satisfaz y·s=0 (mod 2) → resolve s por sistema linear.

## E7 — Superdense coding (expandido)
- **Ref:** Nielsen & Chuang §2.3 (superdense coding); Bennett & Wiesner 1992, PRL 69.
- **Expande o card A5** (que mostra só a caixa de encoding). Versão completa: prepara Bell (H q0 · CNOT q0→q1) · Alice codifica 2 bits em q0 (00→I, 01→X, 10→Z, 11→ZX) · Bob decodifica (CNOT q0→q1 · H q0) · measure → recupera os 2 bits. Mostrar as 4 mensagens.
- **Exatidão:** H/CNOT/Pauli → EXATO.

## E8 — Shor N=15 (compilado) — MAIOR RISCO, PORTAR DE REFERÊNCIA
- **Refs:** Beauregard, *Circuit for Shor's algorithm using 2n+3 qubits*, arXiv:quant-ph/0205095; Nielsen & Chuang §5.3 (order-finding/Shor); Vandersypen et al. 2001, Nature 414 (realização NMR de Shor-15, a=7); Markov & Saeedi, circuitos compilados p/ N=15.
- **Instância:** N=15, base a=7 (período r=4) ou a=11 (período r=2). Reg. de contagem = 3 qubits (QFT₃) + reg. de trabalho.
- **Por que cabe exato:** QFT₃ usa fases controladas R₂=π/2, R₃=π/4 — ambas múltiplas de π/8 ⇒ EXATAS em ℤ[ζ₁₆]. A multiplicação modular compilada p/ N=15 (a fixo) reduz a permutações de base → X/SWAP/CNOT/CCX, todas exatas. Logo o estado é exato; a leitura do período é probabilística (explicada na seção result; gcd(a^{r/2}±1,15) → fatores 3,5).
- **AÇÃO P1/P5:** transcrever o circuito compilado EXATO da referência escolhida (não inventar); validar o estado capturado batendo com o esperado (período correto).

## E9 — Quantum Counting
- **Ref:** Nielsen & Chuang §6.3 (quantum counting); Brassard, Høyer, Mosca, Tapp 2002, *Quantum Amplitude Amplification and Estimation*, arXiv:quant-ph/0005055.
- **Instância:** espaço de busca pequeno (n=2 → 4 itens) com M itens marcados; reg. de contagem t≤4 qubits (QFT†ₜ exata). QPE sobre o operador de Grover G: H em todos · controlled-G^{2ʲ} · QFT†ₜ · measure → estima θ → M = N·sin²(θ/2).
- **Exatidão:** Grover op = H/X/MCZ (exato) + QFT†≤4q (exato) ⇒ ESTADO exato em ℤ[ζ₁₆]; a estimativa de M é probabilística (seção result).

## E10 — Teleportation (expandido)
- **Ref:** Nielsen & Chuang §1.3.7 / §2.3 (teleportation); Bennett et al. 1993, PRL 70. (Reformula o card A4 + §10 já existentes.)
- **Circuito:** estado a teleportar |ψ⟩ (ket simbólico, caminho v4) em q0; par de Bell em q1,q2 (H q1 · CNOT q1→q2); Alice: CNOT q0→q1 · H q0; **medir q0,q1 → ENUMERAR os 4 ramos (00/01/10/11)**; Bob aplica a correção de Pauli condicional (00→I, 01→X, 10→Z, 11→ZX) em q2 → recupera |ψ⟩.
- **Exatidão:** caminho simbólico (SymState/SymEngine) + Pauli → EXATO; medição enumerada (não amostrada) p/ mostrar os 4 ramos + correção.

## FINAL — o que foi de fato implementado (ciclo 24, doc-only, reorientado p/ MÍNIMO de teclas)
A operadora exigiu o menor número de teclas (usar presets; "ninguém reproduz 200 teclas à mão"). Mudanças vs. o plano acima:
- **E8 Shor: a=11 (NÃO a=7).** Com a=11 a controlled-(×11 mod 15) colapsa em **2 CNOTs** (|0001⟩↔|1011⟩) e 11²≡1 ⇒ U² omitido; t=2 + **preset QFT†**. ~14 teclas. r=2 → gcd(11±1,15)={3,5}. (a=7 exigia 9 CSWAP+12 CNOT ≈ 200 teclas — descartado por irreprodutível.)
- **E7, E10: usam o preset Bell.** E5 (QPE): usa o **preset QFT†** (não a inverse-QFT à mão).
- **E9 Quantum Counting: DEFERIDO ao ciclo 25.** QPE de contagem precisa de Grover CONTROLADO; não há preset controlado nem controlled-H no teclado → ~215 teclas. Descoberta: o motor JÁ faz Grover controlado certo via applyN (injetar controle nas ops do preset; N=4/M=2/t=3→M=2 exato); falta a feature de **controle generalizado** no teclado (ciclo 25). Detalhe em `specs/technical/45-v23-lessons.md`.
- Part III final = **E1–E8 + E10 (9 cards)**.

## Política de exatidão (herdada v9/v21)
QFT/QPE exata só ≤4 qubits (R_k até π/8 ∈ ζ₁₆); ≥5 qubits → π/16 ∈ ζ₃₂ → ≈approx sinalizado. Todas as instâncias acima escolhidas p/ caírem no regime EXATO. Se algum estado capturado sair ≈, o badge ≈ sinaliza (consistente com o resto do app).
