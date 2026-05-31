# Glossário de Domínio — Quantum Calculator

> Vocabulário fixado na Fase 0 (Nível 1 — Domínio). Sinônimos a evitar marcados.

| Termo | Entendimento | Exemplo |
|---|---|---|
| Qubit | Unidade quântica de informação; estado em ℂ². | \|0⟩, \|1⟩ |
| Estado / vetor de estado | Vetor unitário em (ℂ²)^⊗N descrevendo N qubits. | (\|00⟩+\|11⟩)/√2 |
| Amplitude | Coeficiente complexo de um estado de base. | 1/√2 em (\|0⟩+\|1⟩)/√2 |
| Notação de Dirac (ket) | Notação \|·⟩ para estados; ⟨·\| para o dual (bra). | \|01000010⟩ |
| Base computacional | {\|0⟩,\|1⟩}^⊗N; padrão. | \|0⟩, \|1⟩ |
| Base de Hadamard (X) | {\|+⟩,\|−⟩} = (\|0⟩±\|1⟩)/√2. | \|+⟩ |
| Base circular (Y) | {\|+i⟩,\|−i⟩} = (\|0⟩±i\|1⟩)/√2. Autoestados de Y. | \|+i⟩ |
| Porta (gate) | Operador unitário aplicado a 1+ qubits. | H, X, CNOT |
| Estado de base / basis state | Estado puro de base computacional indexado por bitstring. | \|01000010⟩ |
| Fase global | Fator e^{iα} multiplicando todo o estado; **não-observável**. | — |
| Fase relativa | Fase entre amplitudes; **observável**. | i em (\|0⟩+i\|1⟩)/√2 |
| Representação simbólica/exata | Manter √2, frações, π, e^{iθ} exatos (não float). | 1/√2, e^{iπ/4} |
| ℤ[ω] | Anel ω=e^{iπ/4}; representa exatamente amplitudes Clifford+T. | a+bω+cω²+dω³ |
| Clifford+T | Conjunto de portas universal {H,S,CNOT,T}; amplitudes em ℤ[1/√2,i]. | — |
| Produto tensorial (⊗) | Combina estados/operadores de qubits distintos. | \|0⟩⊗\|1⟩=\|01⟩ |
| Matriz densidade (ρ) | ρ=\|ψ⟩⟨ψ\| (puro) ou mistura; descreve estado/subsistema. | — |
| Traço parcial | Reduz ρ a um subconjunto de qubits (ρ_A). | — |
| Emaranhamento | Correlação quântica não-fatorável entre qubits. | estado de Bell |
| Medição | Projeção em uma base; prob. = \|amp\|². | Born: \|amp\|² |
| ALL (seleção) | Aplicar operação ao vetor inteiro (padrão). | ALL + H |
| Qn (seleção) | Aplicar operação ao qubit n específico. | 0 Q (= Q0) |
| SET | Inicializar o estado a partir da entrada. | 8 SET → \|00000000⟩ |

## Termos vagos a evitar / desambiguar
- "número" na entrada: é **contagem de qubits** ou **bitstring**? (ver
  specs/validation — ambiguidade '10'). Distinguir explicitamente na UI.
- "calculadora": aqui = manipulador algébrico exato de estado quântico, NÃO
  uma calculadora numérica genérica.
