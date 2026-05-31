# Modelo de Arquitetura — Quantum Calculator (P1)

> Padrão: **Layered**. Dependência só para baixo: núcleo puro → domínio →
> aplicação → apresentação. State **imutável**. Arquivo único HTML/JS, offline.

## Camadas e módulos

```
[apresentação]  M11 ui (DOM, teclado, toggles, orquestração)
                      │  (eventos)        ▲ (assina State)
[aplicação]     M6 parser  M8 history  M9 export  M10 presets
                      │
[domínio]       M4 engine ── M5 operations
                      │            │
                M2 state ──────────┘
                      │
[núcleo]        M1 algebra (ℤ[ω] + numérico)   M3 gates (matrizes)
```

## Contratos por módulo (interfaces)

### M1 `algebra` (puro)
```
Amp = exato { a,b,c,d: BigInt, k: int }   // (a+bω+cω²+dω³)/√2^k, ω=e^{iπ/4}
    | numérico { re, im: number, approx: true }
Amp.add(x,y) Amp.mul(x,y) Amp.conj(x) Amp.scaleInvSqrt2(x,n)
Amp.fromNumeric(re,im) Amp.recognize(x) -> Amp   // 0,7071→1/√2 etc.
Amp.toDisplay(x, fmt: 'exp'|'rect'|'polar') -> string  // exato quando possível
Amp.norm2(x) -> {num:BigInt, den:BigInt}         // |amp|² racional exato
```
Regras (de Giles–Selinger, ver specs/technical/01): ω²=i, ω⁴=−1, √2=ω−ω³,
conj(a,b,c,d)=(a,−d,−c,−b), mul via convolução + dobra ω⁴=−1.

### M2 `state` (imutável)
```
State { n:int, k:int, amps: Map<basisIndex:int, Amp>, basis:'comp'|'had'|'circ',
        selection: 'ALL' | qubitIndex:int }
State.init(spec: {bits:string} | {count:int}) -> State    // SET
State.amplitudes() -> [{index, bitstring(big-endian), amp}]   // só não-nulas
State.withSelection(sel) State.withBasis(b)
```

### M3 `gates`
```
Gate.meta(name) -> { arity, params?, controllable }
Gate.matrix(name, params?) -> [[Amp]]      // 2×2, 4×4, 8×8 em ℤ[ω] (ou numérico se θ arbitrário)
// nomes: I X Y Z H S Sdg T Tdg P Rx Ry Rz U  CNOT CZ CU SWAP iSWAP CCX CSWAP
```

### M4 `engine`
```
apply(state, gateName, {targets:[int], controls:[int], params?}) -> State
changeBasis(state, basis) -> State          // tensor de unitárias de 1 qubit
// expande operador local no espaço de 2^N via produto tensorial implícito
```

### M5 `operations` (funções puras State→resultado)
```
inner(a,b) norm(s) tensor(a,b) probabilities(s) -> [{bitstring, prob:Amp.norm2}]
factorGlobalPhase(s) -> {global:Amp, state:State}
densityMatrix(s) purity(s) blochVector(s, qubit)
measure(s, {basis, qubits}) -> [{outcome, prob, postState}]   // enumera ramos
partialTrace(s, keepQubits) reducedDM(...) concurrencePure(s) schmidt2(s) vonNeumann(s, sub)
```

### M6 `parser` (Interpreter)
```
feed(key) -> void                  // acumula buffer
commands() -> Command[]            // resolve gramática
// gramática: bits → SET estado; N + Q + SET → N qubits; n + Q + gate → 1 qubit;
// ALL + gate → vetor todo; c [t...] + GATE → controlada (operandos antes da porta)
Command = {kind:'set'|'apply'|'select'|'basis'|'format'|'measure'|'op'|'export'|'preset'|'clear', ...}
```

### M7 `render` (Strategy: fmt + basis)
```
renderState(state, {phaseFmt, showBars, showBloch}) -> DOMNode
// Dirac simbólico, indicador de seleção (ALL/Qn), barras de |amp|², coords de Bloch (1 qubit)
```

### M8 `history` (Command + pilha de States imutáveis)
```
push(state, command) undo() -> State redo() -> State canUndo() canRedo()
```

### M9 `export`
```
toLatex(state) -> string           // \frac{1}{\sqrt2}\lvert00\rangle + ...
toDirac(state) -> string
toQiskit(history) -> string        // converte big→little-endian na borda
```

### M10 `presets`
```
load(name) -> Command[]   // 'bell_phi+','ghz','w','teleport','superdense','dj','grover','qft'
```

### M11 `ui`
Monta o teclado (dígitos, Q, SET, ALL, CLR, portas, π, 1/√2, toggles de base/formato),
liga eventos → `parser.feed`, executa `commands` via `engine`/`operations`,
empilha em `history`, re-renderiza via `render`. Única camada com efeitos no DOM.

## Modelo de dados central
- **Estado** = vetor esparso de amplitudes `Amp` indexado por inteiro de base
  (bit i = qubit i, big-endian) + `k` global (expoente de 1/√2) + `n` + base + seleção.
- **Amp** = união {exato ℤ[ω]} | {numérico aproximado, sinalizado}.
- **Command** = registro declarativo (habilita histórico, undo/redo, export).

## Premissas (Leveson — explícitas)
State imutável; amplitudes default exatas (numérico só sinalizado); N≤8–12;
big-endian; navegador c/ BigInt; usuário lê Dirac. Núcleo sem DOM.
