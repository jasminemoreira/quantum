# Sementes do ciclo v7 (candidatas) — depositadas durante a validação humana do v6

> Ideias que surgiram da usuária ao exercitar o app no fim do v6 (Fase 6). NÃO implementadas no v6.
> Cada uma é uma feature/escopo novo → deve passar pela Fase 0 do v7 (não bolt-on). Atende o pedido
> explícito do P0: "pesquisar outras operações interessantes a incorporar → depositar em specs/".

## S1 — Toggle de convenção de ângulo: radianos ↔ "turns" (normalizado)

**Motivação (caso real):** ao reproduzir um circuito controlled-T, a usuária rotulou a porta como
"1/8" pensando em **fração de volta** (φ=1/8 → fase e^{2πi·1/8}=e^{iπ/4}), enquanto a calculadora
interpreta o ângulo de `P(φ)` em **radianos diretos** (φ=π/8 → e^{iπ/8}). Mismatch de fator 2π/… que
custou tempo de depuração. A convenção "turns"/normalizada (fase = e^{2πiφ}, φ∈[0,1)) é comum em
estimação de fase e em parte da literatura/ferramentas.

**Proposta:** um toggle na faixa de vistas (ao lado de `fmt`), ex. rótulo **`rad`↔`turns`** (ou `θ`↔`θ/2π`),
que muda como o ângulo digitado é interpretado:
- `rad` (atual/padrão): `P(θ)` → e^{iθ}; entra π/4.
- `turns` (normalizado): `P(θ)` → e^{2πiθ}; entra 1/8 para a mesma porta.

**AMBIGUIDADES A RESOLVER NA FASE 0 (por que merece ciclo próprio, não bolt-on):**
1. O toggle afeta só a **ENTRADA** do ângulo, ou também o **DISPLAY** (mostrar `e^{2πi·1/8}` vs `e^{iπ/4}`)?
2. Vale para **todas** as portas paramétricas (P/Rx/Ry/Rz/U/CP/CRz) ou só fase (P/CP)?
3. Interação com o **ângulo simbólico** do v4 (π/4, 2πθ) e com a constante π da calc — conflito de unidade?
4. Rótulos no **histórico** e no **prompt** mudam de unidade junto?
5. Persistência da escolha entre operações (como fmt/base) e valor padrão (`rad`, p/ não regredir).
6. Não-regressão: a suíte atual assume radianos; o toggle não pode quebrar os 250 testes no modo `rad`.

**Escopo provável:** delta de UI + camada de interpretação de ângulo (M6/M11) + render de rótulo (M7).
Motor (ℤ[ζ₁₆], portas) intocado. Tier 1 (sem álgebra nova; só conversão ×2π na entrada/rótulo).

## S2 — Nota no manual: CP vs CRz (esclarecimento didático)

**Motivação:** a usuária confundiu CP e CRz no circuito de kickback. As duas existem e estão CORRETAS,
mas a diferença não está documentada no `manual.html`.

**Fatos (verificados no motor v6):**
- `P(λ)=diag(1,e^{iλ})` (fase só em |1⟩) vs `Rz(θ)=diag(e^{-iθ/2},e^{+iθ/2})` (∓θ/2). Diferem por fase
  global: P(θ)=e^{iθ/2}Rz(θ) — invisível em 1 qubit.
- **Controladas** (a fase global vira RELATIVA): `CP(λ)=diag(1,1,1,e^{iλ})` (fase só em |11⟩, simétrica) vs
  `CRz(θ)=diag(1,1,e^{-iθ/2},e^{+iθ/2})` (mexe em |10⟩ e |11⟩). Relação: CRz(θ)=CP(θ)·[P(−θ/2) no controle].
- Atalhos úteis: **controlled-T = CP(π/4)**, c-S = CP(π/2), c-Z = CP(π). QFT usa R_k = CP(2π/2^k).
- Lembrete de phase-kickback: o alvo precisa ser **AUTOESTADO** da porta controlada. |+⟩ NÃO é autoestado
  de T (T|+⟩=(|0⟩+e^{iπ/4}|1⟩)/√2). Autoestados de T: |0⟩ (1) e |1⟩ (e^{iπ/4}).

**Proposta:** uma seção curta no `manual.html` com essas tabelas + os atalhos + o lembrete do autoestado.
Delta de DOC puro (nenhum código de motor/UI). Pode ir junto com S1 ou isolado.

---
**Demais sementes de-escopadas (de ciclos anteriores, ainda válidas):** π/16 (ζ₃₂, QFT-5q); família
indexada λ_k=f(k); reconhecimento/simplificação trig; persistência localStorage; norma/⟨φ|ψ⟩ simbólico;
notação ↓↑. Ver decisões do v6 (P0).
