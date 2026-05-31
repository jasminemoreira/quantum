# Concorrentes / Ferramentas Similares + Lacuna de Mercado

> Fonte: pesquisa P0 (agente B). **Achado central:** o espaço web/GUI é
> INTEIRAMENTE numérico. Os únicos pares simbólicos (SymPy, Wolfram) exigem
> ambiente de programação. **Não existe** ferramenta de arquivo único, web,
> simbólica, com UX de calculadora de teclado.

| Ferramenta | URL | Simbólica/Numérica | Arquivo único? | Força | Lacuna que preenchemos |
|---|---|---|---|---|---|
| Quirk | algassert.com/quirk | **Numérica** (≤16 qubits) | App web | Melhor UX drag-drop | Sem álgebra: mostra 0,7071, não e^{iπ/4} |
| IBM Quantum Composer | quantum.cloud.ibm.com/composer | **Numérica** | Nuvem | q-sphere, barras | Numérico, pesado, na nuvem |
| Qiskit | qiskit.org | **Numérica** | Lib Python | Padrão da indústria | Code-first, numérico |
| Cirq | quantumai.google/cirq | **Numérica** (`simulate_moment_steps`) | Lib Python | Stepping educacional | Numérico, code-first |
| QuTiP | qutip.org | **Numérica** (`ptrace`, tensor) | Lib Python | Densidade, traço parcial | Numérico, research-grade |
| **SymPy quantum** | docs.sympy.org (physics.quantum) | **SIMBÓLICA** (Dirac, qapply, represent) | Lib Python | Único par simbólico real | Exige Python + código; sem GUI |
| **Wolfram Quantum** | wolfram.com/quantum-computation-framework | **SIMBÓLICA** | Paclet Mathematica (pago) | Simbólico + emaranhamento | Proprietário, pago, só Mathematica |
| Quantum Odyssey | store.steampowered.com/app/2802710 | Numérica (jogo) | Desktop | Gamificado | Jogo, sem saída algébrica |
| QuVis (St Andrews) | st-andrews.ac.uk/physics/quvis | Numérica/conceitual | Web | Pedagogia baseada em pesquisa | Animações de conceito, não calculadora |
| Visualizadores web diversos | (vários) | **Numérica** | Apps web | Amplitude/fase/Bloch | Todos numéricos |

## Lacunas didáticas / estado da arte (o que nos torna únicos)
1. **Álgebra exata em vez de decimais.** Mostrar 1/√2 e e^{iπ/4} em vez de 0,7071.
2. **Derivação algébrica passo a passo como artefato principal.** Estado de Dirac
   exato por passo — o que o aluno escreveria no papel. Nenhum tool numérico faz.
3. **Pedagogia explícita de fase global vs relativa.** Simbólico pode *mostrar* o
   fator de fase global e deixar fatorá-lo.
4. **Transparência de convenção.** Exibir ordenação de qubits e convenção de fase
   global de U — fonte frequente de confusão entre Qiskit/Cirq/textbook.
5. **Zero instalação, arquivo único, sem código.** SymPy/Wolfram exigem
   programação; Quirk/Composer são numéricos. Sem par combinando simbólico + GUI
   + zero-install.
6. **Circuitos de curso em forma fechada.** Estado simbólico exato através de
   Bell/GHZ/teleporte/QFT — igual ao deduzido no quadro.

**Posicionamento:** "A calculadora simbólica de bolso para computação quântica" —
álgebra exata (estilo SymPy/Wolfram) com a UX de uma calculadora científica de
arquivo único e zero instalação.

## Re-checagem web (2026-05, v8) — lacuna confirmada
Busca refeita durante a validação humana do cookbook v8. Achados:
- Espaço web/GUI **segue numérico**: Quirk exporta amplitudes numéricas; "quantum
  state calculators" recentes (agricarehub, Calcady, Bloch calculators) pedem α/β
  em **decimais** e dão probabilidades — não manipulam circuitos simbolicamente.
- Simbólicos **seguem exigindo programação**: SymPy quantum (Python), Wolfram
  Quantum (Mathematica pago), add-on "Quantum" Dirac/Bra-Ket de Gómez-Muñoz
  (Mathematica). Trabalhos simbólicos recentes (Maude, Dirac-em-Coq, Quasimodo) são
  verificação/pesquisa, não didáticos de teclado.
- **Mais próximo:** Dirac.js (pyramids.github.io/diracjs) — parser/formatador de
  notação de Dirac via CAIXA DE TEXTO; **sem portas, circuitos, medição, Bloch,
  |ψ⟩ abstrato ou teclado**. Não é uma calculadora de circuitos.
- **Conclusão:** a combinação exato-ζ₁₆ + teclado + portas/circuitos + |ψ⟩ abstrato
  + arquivo único offline permanece sem par. (Ressalva: busca amostrada, não prova
  inexistência absoluta.)
