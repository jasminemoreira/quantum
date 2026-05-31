# v9 — Especificação técnica: bloco de PRESETS/macros (`quantum_calc.html`)

> Fase 1 (arquitetura) do ciclo v9. Baseline: [18-v9-seed-presets.md](18-v9-seed-presets.md).
> Reusa as portas EXATAS já existentes (H, CP, SWAP, CNOT, X, Z, Ry). Núcleo ζ₁₆/portas base INTOCADOS.
> Referência das sequências: examples-data.mjs (QFT₃/QFT⁻¹ já validados na tela, v8) + Nielsen-Chuang.

## 1. Módulo M10 Presets (NOVO, puro)

```
Presets.expand(name, n, qubits) -> { ops: OpSpec[], approx: boolean }
  name    : 'QFT' | 'QFTinv' | 'Bell' | 'GHZ' | 'Grover' | 'W'
  n       : nº total de qubits do estado
  qubits  : índices-alvo já resolvidos (range contíguo ou ALL), big-endian (qubits[0] = MSB)
  OpSpec  : { gate, targets:int[], controls:int[], params:number[] }   // mesmo shape do Parser/Engine
  approx  : true se algum op cai no fallback numérico (QFT span≥5 OU W)
```
**Puro:** sem DOM, sem chamar Engine. Só gera a lista ordenada de opSpecs. O `execute` (M11)
dobra a lista via `Engine.apply` e faz **um** `History.push` (bloco atômico).
Testável isolado: comparar `ops` esperados + rodar o motor sobre eles.

## 2. Sequências (qubits Q = [Q₀..Q_{m-1}], Q₀ = mais significativo)

### QFT  (exata se m ≤ 4; ≈approx se m ≥ 5)
```
para i = 0 … m-1:
    H(Q[i])
    para j = i+1 … m-1:
        CP(π / 2^(j-i))  controls=[Q[j]]  targets=[Q[i]]
para i = 0 … ⌊m/2⌋-1:
    SWAP(Q[i], Q[m-1-i])            // reversão de ordem
```
Ângulo fino = π/2^(m-1): m=4 → π/8 = R₄ ∈ ζ₁₆ (exato); m=5 → π/16 = R₅ ∈ ζ₃₂ (numérico ≈approx).
Confere bit-a-bit com a sequência validada `examples-data.mjs` QFT₃ (linha 176).

### QFT†  (inversa — reversão primeiro, fases negativas, ordem inversa)
```
para i = 0 … ⌊m/2⌋-1:
    SWAP(Q[i], Q[m-1-i])
para i = m-1 … 0 (decrescente):
    para j = m-1 … i+1 (decrescente):
        CP(−π / 2^(j-i))  controls=[Q[j]]  targets=[Q[i]]
    H(Q[i])
```
Confere com `examples-data.mjs` A11/QFT⁻¹ (linha 184): SWAP(0,2)·H(2)·CP(−π/2)c2t1·H(1)·CP(−π/4)c2t0·CP(−π/2)c1t0·H(0).
Invariante de teste: **QFT† ∘ QFT = identidade** (exato p/ m≤4).

### Bell  (exatamente 2 qubits [a,b] = [Q₀,Q₁]; exato)
```
H(a)
CNOT(controls=[a], targets=[b])
```
**Sem lógica de variante:** H+CNOT mapeia o input da base computacional no estado de Bell
correspondente → |00⟩→Φ⁺, |01⟩→Ψ⁺, |10⟩→Φ⁻, |11⟩→Ψ⁻. A variante vem da PREPARAÇÃO do usuário.

### GHZ  (m ≥ 2; exato)
```
H(Q[0])
para i = 1 … m-1:
    CNOT(controls=[Q[i-1]], targets=[Q[i]])      // cascata
```
Resultado: (|0…0⟩ + |1…1⟩)/√2. (Cadeia ou estrela — ambas dão GHZ; usar cascata.)

### Grover — DIFUSOR (m ≥ 1; exato em ζ₁₆)
```
para i: H(Q[i])
para i: X(Q[i])
applyN('Z', targets=[Q[m-1]], controls=[Q[0]..Q[m-2]])   // MCZ via Engine.applyN (resolve C1)
para i: X(Q[i])
para i: H(Q[i])
```
Implementa **−(2|s⟩⟨s|−I)** (difere do difusor por fase global −1, irrelevante; a calc fatora fase global).
MCZ p/ qualquer m **sem ancilla nem primitiva nova** — `Engine.applyN` reusa o loop de controle JÁ
genérico (L907) pulando SÓ a checagem de aridade do `validate` (que bloqueava Z com c≠0). Ver §9 (C1).
Entradas ±1 → amplitudes permanecem exatas em ℤ[ω]. (m=1: Z sem controle — caso de borda.)
ESCOPO: só o difusor (building block). Oráculo é problema-específico, montado à mão pelo usuário.

### W-state  (m ≥ 2; SEMPRE ≈approx — Ry de ângulo não-notável)
Cascata de Ry controlados (Cruz et al. 2018, arXiv:1807.05572 — "Efficient quantum algorithms
for GHZ and W states"). Esqueleto (ângulos θ_k = 2·arccos(√(1/(m−k))), k=0…m-2):
```
X(Q[0])                                          // |10…0⟩
para k = 0 … m-2:
    bloco controlado(Q[k] → Q[k+1]) que move amplitude via Ry(±θ_k) + CNOT
```
**Ry controlado = `CU(θ,0,0)`** — NÃO há CRy no catálogo; U(θ,0,0)=Ry(θ) e CU existe (`c:1`). (resolve I2)
Resultado-alvo: (1/√m)·(|10…0⟩ + |01…0⟩ + … + |0…01⟩). **≈approx** (todas as amplitudes numéricas).
FASE 5: portar a sequência exata da referência; CRITÉRIO = match numérico ao alvo (tolerância ~1e-9).
FALLBACK documentado (se a cascata travar): construir o vetor-alvo numérico direto (1/√m nas posições
de excitação única) — equivalente, também ≈approx; decisão de Fase 5 se o gate-circuit for problemático.

## 3. FSM / gramática (M6 Parser)
```
preset(name) ->
  se kets pendentes ou estado simbólico (sym): erro
  se allFlag:           qubits = [0 … n-1]
  senão se 2 Q:         qubits = [min … max]   (range CONTÍGUO)
  senão se 1 Q:         qubits = [q]            (válido só p/ QFT/QFT†/Grover; senão erro de aridade)
  valida aridade mínima: QFT/QFT†≥1, Bell=2, GHZ≥2, Grover≥1, W≥2
  -> { kind:'preset', name, qubits }  |  { error }
```
Aridade fora do intervalo → mensagem clara (ex.: "Bell requer exatamente 2 qubits").

## 4. execute / History (M11 + M8)
```
execute({kind:'preset', name, qubits}):
  cur = History.current()
  se cur.sym: erro "preset requer estado concreto"            // concrete-only (A5)
  {ops, approx} = Presets.expand(name, cur.n, qubits)
  ns = cur;  para op de ops:  ns = Engine.applyN(ns, op.gate, op)   // applyN: valida range+dup, NÃO aridade (ops de preset são confiáveis, incl. MCZ) — resolve C1
  History.push(ns, labelOf(cmd), cmd)                          // 1 snapshot ATÔMICO
  se shifted: reset one-shot 2nd
labelOf: 'QFT q0..q3' | 'QFT† q0..q3' | 'Bell q0,q1' | 'GHZ q0..q2' | 'Grover q0..q2' | 'W q0..q2'
```
Undo (↶) restaura o State pré-preset (um passo).

## 5. UI / Keymap (M14)
Novo grupo no `Q_LEFT_2` (camada 2nd), classe de cor `pre`. Teclas:
`preset:QFT 'QFT'` · `preset:QFTinv 'QFT†'` · `preset:GHZ 'GHZ'` · `preset:Grover 'Grv'` ·
`preset:W 'W'` · `preset:Bell 'Bell'`  (Bell = 1 tecla, variante pela preparação).
Atenção ao espaço vertical do keypad (3 grupos atuais + 1). Fitts/Hick: agrupar por afinidade.

## 6. Premissas (AP4)
A1 dois Q = range contíguo; ALL = registro inteiro; big-endian (Q₀=MSB).
A2 aridades mínimas validadas no Parser.
A3 ângulos float em rad → `expI`/`recognizeAngle` exato em ζ₁₆ se múltiplo de π/8, senão numérico ≈approx.
A4 approx = (QFT/QFT† com m≥5) OU W; render reflete o flag `.ex` real.
A5 preset CONCRETO atômico; erro sobre estado simbólico (|ψ⟩).
A6 turns mode (v7) NÃO afeta presets — ângulos sempre em radianos programáticos.
A7 MCZ do difusor via loop de controle genérico do Engine — sem ancilla/primitiva nova, exato.

## 7. Escopo negativo
Grover completo c/ oráculo · presets com medição (teleporte/superdense) · QFT≥5q EXATA (π/16, ζ₃₂) ·
mudança no núcleo ζ₁₆ ou portas base · presets sobre estado simbólico · persistência ·
tudo do v8 não tocado pelo delta (AS-IS preservado).

## 8. Validação (herda lições v8)
- DOM-driven: pressionar o preset na UI real e capturar a tela (#stateDisplay etc.).
- Cross-check de motor: QFT|0…0⟩ = uniforme; **QFT†∘QFT = I**; Bell/GHZ corretos; difusor = −(2|s⟩⟨s|−I);
  W normalizado (≈approx). Arity dos presets via teste (análogo a manual.test.mjs).
- Não regredir os 300 testes (224 Node + 76 Playwright). Atualizar manual.html + examples.html.

## 9. Resolução Fase 3 (resposta unificada ao gate da Fase 2)

**C1 (🔴, MCZ do difusor bloqueado por `validate`) — RESOLVIDO sem novo módulo, simplificando:**
Extrair o núcleo genérico de `Engine.apply` (que já varre controles arbitrários, L907) em
`Engine.applyN(state, name, {targets, controls, params})` — valida **só** range+duplicatas, **não** aridade.
O `apply()` público vira `validate(aridade) → applyN` (comportamento idêntico p/ entrada manual de portas).
O **folder de preset** usa `applyN` (ops geradas internamente, confiáveis). MCZ p/ qualquer m, exato.
→ 1 helper aditivo (extrai código já existente, sem duplicação); M4 ganha 1 método; 0 módulo novo.

**🟡 integrados na mesma resposta:**
- **I1** (W sub-especificado): manter cascata (decisão da usuária) com a referência Cruz et al. arXiv:1807.05572
  citada; fallback de vetor-alvo numérico documentado. Reforço de referência, sem código novo (anti-AP7).
- **I2** (sem CRy): Ry controlado = `CU(θ,0,0)`. Nota no §2/W. Sem código novo.
- **I3** (dois Q = range): definido — range CONTÍGUO `[min..max]` (ordenado); desambiguação determinística
  pelo token final (preset vs porta). Manual documenta. Sem complexidade extra.
- **I4** (muitos termos no LCD): **ACEITO como está** — é comportamento PRÉ-EXISTENTE do render (a QFT₃
  manual do cookbook já renderia 8 termos); o preset não piora além do que a entrada manual já produz.
  NÃO adicionar cap/aviso (evita feature creep / AP9). Aceitação explícita.
- **I5** (reset one-shot 2nd): incluir `'preset'` na condição da L2290. Trivial, em M11.
- **I6** (edges + boundary): m=1 (difusor=Z s/ ctrl, QFT=só H), m=2 (menor W) tratados em Presets;
  boundary π/16 reusa `expI/recognizeAngle` (ζ₁₆ já estabelecido no v6 → π/16 cai numérico). Testes de borda na Fase 6.
- **I7** (Bell por preparação): esclarecer no manual que a "variante" vale sobre input da base computacional;
  sobre input arbitrário é só H+CNOT. Doc, sem código.
- **I8** (espaço 2nd + Playwright): presets em 1 grupo (~6 teclas, 5/linha); atualizar os testes Playwright
  do 2nd layer (esperado em "não regredir"). UI + testes.

**Saldo:** 0 módulo adicionado/removido/redesenhado na Fase 3; 1 método aditivo (`applyN`, extração);
demais achados = clarificações de spec, doc, ou aceitação explícita. Sem aumento de complexidade.
