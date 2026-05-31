# Catálogo de Operações (além das portas) — valor didático × viabilidade simbólica

> Fonte: pesquisa P0 (agente B). Resposta direta ao pedido do usuário:
> "pesquise outras operações interessantes que podem ser incorporadas".
> Classificação por (valor didático × viabilidade de fazer EXATO/simbólico).

## Tier 1 — exato, barato, alto valor (candidatos a escopo central)
- **Produto interno ⟨φ|ψ⟩, norma e checagem de normalização.** Soma finita de
  produtos conjugados; trivialmente exato. Ensina ortogonalidade/sobreposição.
- **Produto tensorial (Kronecker) de estados/operadores.** Mostra |0⟩⊗|1⟩=|01⟩.
- **Valor esperado ⟨ψ|O|ψ⟩** para observável (Pauli). Exato.
- **Probabilidades + barras de amplitude.** |amp|² por estado de base; valor
  simbólico exato, altura da barra numérica.
- **Fase global vs relativa; fatorar fase global.** Puxar e^{iα} comum, normalizar
  primeira amplitude não-nula para real positivo. CRÍTICO didaticamente (fase
  global é não-observável; relativa é). **Aqui o simbólico brilha** — tools
  numéricos borram isso.
- **Vetor/coordenadas de Bloch (1 qubit).** ⟨σx⟩=sinθcosφ, ⟨σy⟩=sinθsinφ,
  ⟨σz⟩=cosθ. Exato para 1 qubit puro.
- **Matriz densidade ρ=|ψ⟩⟨ψ|, pureza Tr(ρ²).** Produto externo. Exato.
- **Histórico de circuito / lista de passos, undo/redo.** Estado algébrico após
  cada porta (cf. `simulate_moment_steps` do Cirq). Natural no motor simbólico.
- **Exportar para Dirac / LaTeX / código Qiskit.** Representação interna já é
  algébrica → LaTeX/Dirac quase de graça. **Diferencial-chave.**
- **Presets de circuitos de curso:** Bell |Φ±⟩,|Ψ±⟩ (H+CNOT), GHZ, W,
  teleporte, codificação superdensa, Deutsch–Jozsa, difusor de Grover, QFT.

## Tier 2 — viabilidade média (candidatos a escopo, com cuidado)
- **Medição (base computacional + arbitrária), colapso pós-medição.**
  Probabilidades exatas; QUAL resultado ocorre exige RNG. Melhor: mostrar TODOS
  os ramos com probabilidade exata + estado renormalizado, opcionalmente sortear.
  Base arbitrária = rotacionar antes.
- **Traço parcial / matriz densidade reduzida ρ_A.** Exato, mas matrizes O(4ⁿ);
  ok para ≤~5 qubits. Necessário para diagnósticos de emaranhamento.
- **Entropia de emaranhamento (von Neumann)** S(ρ_A)=−Σλᵢ log λᵢ. Autovalores =
  raízes do polinômio característico → exato só p/ subsistemas de 1–2 qubits;
  acima disso, fallback numérico.

## Tier 3 — baixa viabilidade simbólica (escopo cuidadoso ou fora)
- **Decomposição de Schmidt.** = SVD da matriz de coeficientes bipartida. Exato p/
  2 qubits (fechado); híbrido/numérico para maiores. Alto valor p/ explicar emaranhamento.
- **Concorrência (2 qubits, Wootters).** Estado PURO: C=2|αδ−βγ| (totalmente
  simbólico). Estado misto: autovalores de 4×4 (pesado). → exato p/ puro.
- **Teste de separabilidade.** Puro: separável sse posto de Schmidt 1 / C=0. Misto
  geral é computacionalmente difícil → só critério PPT p/ 2×2,2×3. Não tentar geral.

## Outras operações úteis encontradas
- Composição/visão matricial do operador (produto das portas como 1 unitária).
- Decomposição em base de Pauli de um observável (didático p/ Hamiltonianos).
- Modos de exibição de fase (exp/retangular/polar) — já planejado; simbólico
  torna o toggle e^{iπ/4} ↔ (1+i)/√2 exato.
- Visão estilo q-sphere para fase multi-qubit (camada numérica sobre simbólico).

## Recomendação de priorização (RECOMENDAÇÃO — usuário decide o escopo final)
- **Centro (exato, barato, máximo valor):** produto interno & norma; tensor;
  probabilidades + barras; **fatorar fase global**; Bloch 1 qubit; ρ=|ψ⟩⟨ψ| +
  pureza; histórico com estado algébrico por passo; export LaTeX/Dirac; presets
  Bell/GHZ/W/teleporte; conjunto de portas de §02 com convenção documentada.
- **Estender se couber no "produto completo":** medição como enumeração exata de
  ramos (+ amostragem) em base comp. e arbitrária; traço parcial / ρ reduzida;
  concorrência de estado puro e Schmidt p/ 2 qubits; entropia de von Neumann p/
  subsistemas pequenos; export Qiskit; presets Deutsch–Jozsa, Grover, QFT.
- **Provável fora de escopo (YAGNI):** separabilidade de estado misto geral
  (difícil — limitar a PPT); autodecomposição simbólica p/ subsistemas >2 qubits
  (fallback numérico); entropia exata p/ N arbitrário.
