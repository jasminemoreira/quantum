# v4 — Álgebra simbólica de Dirac (kets abstratos) — pesquisa técnica

> Ciclo 5 (v4). Motor NOVO, ao lado do vetor concreto ℤ[ω] (v1–v3). Delta completo.
> Inspirado no modelo do `sympy.physics.quantum` (Tier 2), adaptado a JS single-file/offline.

## 1. Modelo de referência — sympy.physics.quantum
Núcleo conceitual maduro para notação de Dirac simbólica:
- **Ket(label) / Bra(label):** kets abstratos rotulados (`|ψ⟩`, `|ψ₀⟩`). Concretos = labels especiais.
- **Operator / `qapply`:** aplica operadores a estados; o que não sabe avaliar fica **não-avaliado**.
- **TensorProduct (⊗):** produto de fatores de subsistemas; distribui sobre somas.
- **Add/Mul/Pow + coeficientes simbólicos:** estado = combinação linear `Σ cᵢ · termoᵢ`.
- **Dagger, InnerProduct, OuterProduct:** ⟨·|·⟩, |·⟩⟨·|.
- **`represent`:** projeta para uma base concreta (ponte com o motor de vetor).
Refs: docs SymPy `physics.quantum`; Dirac-notation CAS; term rewriting (Baader & Nipkow).

## 2. Representação adotada (adaptada)
- **Termo** = `{ coef: Expr, factors: Factor[] }`, onde `Factor` = ket concreto (`|0⟩`,`|1⟩`,…)
  ou ket abstrato (`|ψ⟩`, `|ψ₀⟩`), na ordem dos subsistemas (big-endian).
- **Estado simbólico** = lista de Termos (combinação linear). Soma = concatenar; produto
  por escalar = multiplicar `coef`.
- **Coef (Expr)** = expressão simbólica geral: números/surd/ℤ[ω], `e^{i·ângulo}`, `e^{2πiθ}`,
  símbolos livres, produtos/potências/somas. (Estende o `Amp`/`PiAngle` do v1–v2 com símbolos.)
- **Aplicação de porta U a um fator:**
  - fator CONCRETO → avalia com o motor v1–v3 (gera nova combinação concreta);
  - fator ABSTRATO `|ψ⟩` → procura **regra declarada** `U|ψ⟩ = λ|ψ⟩` (ou geral); se houver,
    reescreve (coef ×= λ, fator mantém); senão, vira nó **não-avaliado** `U|ψ⟩` (fator composto).
  - porta CONTROLADA: aplica U ao alvo condicionada ao(s) controle(s); no kickback, o alvo
    abstrato com regra de autovalor leva λ ao coeficiente do ramo de controle = 1.

## 3. Declaração de regras (UI) — INLINE
Ao aplicar U a um qubit/fator abstrato: a calc oferece, na linha de status (como a entrada
de ângulo do v2), digitar o **autovalor λ** (expressão) → grava a regra `U|ψ⟩=λ|ψ⟩` e aplica;
ou **deixar simbólico** → mantém `U|ψ⟩`. Regras ficam num registro consultável.

## 4. Simplificação — MÍNIMA (decisão do usuário)
Só: (a) **combinar termos idênticos** (mesmo vetor de fatores) somando coeficientes;
(b) **aplicar as regras declaradas**. SEM fatoração/normalização automática (o usuário
controla cada passo — didático). Reaproveita a manipulação de display do v3 (fatorar/
evidenciar/expandir) como AÇÕES manuais sobre a expressão simbólica.

## 5. Mistura abstrato + concreto
Fatores concretos e abstratos coexistem num mesmo termo (`|0⟩_c ⊗ |ψ⟩_reg`). Portas em
qubits concretos usam o motor ℤ[ω]; em abstratos, regra/nó. Kets nomeados AVULSOS
(|ψ⟩,|φ⟩,|ψ₀⟩…), cada um com autovalor próprio; sem família indexada por fórmula.

## 6. Casos de uso âncora
- Kickback abstrato: `|0⟩_c⊗|ψ⟩`, H(c), controlled-U (regra `U|ψ⟩=e^{2πiθ}|ψ⟩`), H(c)
  → `|ψ⟩⊗((1+e^{2πiθ})/2|0⟩ + (1−e^{2πiθ})/2|1⟩)`.
- QPE abstrato (com kets avulsos + regras por potência de U, declaradas inline).

## Veredito de viabilidade
Tier 2 (modelo SymPy portado). Sem dependências externas (motor próprio em JS, inspirado).
Risco principal = o tipo Expr de coeficiente simbólico (estender Amp) e a engine de
combinação de termos — Fase 1 detalha. Sem bloqueio. Não regride v1–v3 (motor à parte).

## 7. ARQUITETURA (Fase 1 — confirmada pela usuária)

### Decisão central de integração: PROMOÇÃO NO MODO QUÂNTICO (sem 3º modo)
Introduzir um ket abstrato (`|ψ⟩`,`|φ⟩`,`|ψ₀⟩`…) **promove** `State → SymState`. Estado
concreto-puro permanece no **caminho rápido ℤ[ω]** (v1–v3 intacto; 162 testes não regridem).
Render/Engine despacham por **tipo** de representação. `SymState.isPureConcrete()` rebaixa de
volta ao caminho rápido. Mistura concreto+abstrato (`|0⟩_c⊗|ψ⟩`) coexiste no mesmo estado
(kickback). Não há novo modo top-level.

### Decomposição — 4 módulos novos + extensões mínimas (Layered preservado)
| Módulo | Responsabilidade | Pureza |
|---|---|---|
| **M15 SymExpr** | Coeficiente simbólico `Expr = Σ` monômios sobre átomos {Amp/ℤ[ω], PiAngle, fase `e^{iφ}`/`e^{2πiθ}`, símbolo livre λ/θ}. Ops: `add/mul/neg/pow(int)/combineLike/format/toTex`. Estende Amp/PiAngle (v1–v2). | pura |
| **M16 SymState** | `Term[]`, `Term={coef:Expr,factors:Factor[]}`, `Factor={concrete:ket}\|{abstract:label}`, big-endian. Imutável. Ops: `add`(concat)/`scale`/`combineLikeTerms`/`fromConcrete(State)`/`isPureConcrete()→State\|null`. | pura |
| **M17 SymEngine** | `apply(symstate,opSpec,rules)→SymState` (não muta). Fator CONCRETO→expande via `Engine`/`Gates` ℤ[ω]; ABSTRATO→`Rules.lookup`: se `U\|ψ⟩=λ\|ψ⟩`→coef×=λ mantém fator, senão nó **não-avaliado** `U\|ψ⟩` (Composite); controlada→λ ao ramo de controle (kickback); depois `combineLikeTerms`. | pura |
| **M18 Rules** | Registro: `declare(gate,ketLabel,λ:Expr)`/`lookup(gate,ketLabel)→Expr\|null`. Viaja no History. | pura |

**Extensões:** M1Δ (expor Amp/PiAngle + átomo de fase `e^{iθ}`) · M6Δ Parser (token de ket
abstrato; entrada **inline de λ** reusando o ângulo-inline do v2) · M7Δ Render
(`renderSym(symstate,fmt)→{dirac,tex,approx,termCount}`; reusa fatorar/evidenciar/expandir
como ações manuais) · M8 History (snapshots carregam SymState+Rules) · **M11Δ UI** (botões de
ket abstrato, linha de status p/ λ, despacho por tipo, inspetor mínimo de regras) · M14Δ Keymap
(tokens de ket abstrato + tecla declarar-regra).

### Interfaces (contratos)
- `SymExpr`: `add/mul/pow(n)/combineLike()`, `format(fmt)→{text,tex,approx}`; átomo de fase `e^{iθ}`/`e^{2πiθ}`.
- `SymState.fromConcrete(state)→SymState`; `combineLikeTerms()→SymState`; `isPureConcrete()→State|null`.
- `SymEngine.apply(symstate, opSpec, rules)→SymState` — reusa `opSpec={gate,targets,controls,params}` do Parser v1–v3.
- `Rules.declare(gate,ketLabel,λ:Expr)` / `Rules.lookup(gate,ketLabel)→Expr|null`.
- `Render.renderSym(symstate,fmt)→{dirac,tex,approx,termCount}` — espelha `renderState`.

### Padrões (confirmados)
Herdados: Layered, Command, Strategy, Domain Model, Immutable State, Pure-core/DOM-só-UI,
KISS+YAGNI+SOLID, single-threaded. **Novos:** Composite (árvore termo/fator/nó), Term Rewriting
(regras declaradas), Interpreter REUSADO (avaliador shunting-yard do v2 p/ coef λ).

### Assunções explícitas (AP4)
A1 sem checagem de consistência das regras; A2 kets abstratos = símbolos independentes (sem
⟨ψ|ψ⟩/norma/prob automáticos); A3 kickback só com regra declarada (sem suposição implícita de
autoestado); A4 crescimento de Expr/nº termos limitado pelos passos da usuária
(`combineLikeTerms` = única contração); A5 fatores concretos avaliam idênticos ao v1–v3
(ℤ[ω]=fonte única); A6 big-endian.

### Negative scope (v4)
Sem fatoração/normalização automática (simplificação MÍNIMA) · sem resolver equações (não é CAS
completo) · sem família indexada λ_k=f(k) (só kets avulsos) · sem norma/medição/prob/Bloch sobre
abstratos · sem inferência automática de autoestado · sem checagem de contradição de regras · NÃO
regride v1–v3 · sem persistência.

### Tecnologia / escopo
Opção única (estender Amp/PiAngle em JS single-file, sem CAS externo) → sem tabela comparativa.
Delivery Target = **DELTA COMPLETO**, sem bloqueio técnico → sem split.

## 8. NOTAS DE IMPLEMENTAÇÃO (Fase 5)

Representação efetiva (mais simples que a do P1 e correta):
- **Factor por TERMO**, não por subsistema persistente: `Term = { coef:Expr, slots:Slot[] }`,
  `Slot` = `'0'|'1'` (qubit concreto, bit definido NAQUELE termo) ou `{label,nodes[]}` (abstrato,
  nó não-avaliado decorando |ψ⟩). É o análogo do `State` (índice→amp) com amp→Expr + slots
  abstratos. Entrelaçamento concreto = vários termos (como no concreto); kickback = split de
  controle por termo. NÃO precisou de "bloco concreto sub-State" — a forma por-termo já tila os
  qubits e delega a matriz ℤ[ω] por bits. Limite assumido: gate 2-qubit entrelaçante ENTRE dois
  abstratos, ou alvo misto concreto+abstrato → não suportados (lançam).
- **CONTROLE ABSTRATO (extensão P5, autorizada pela usuária — TELETRANSPORTE):** quando `|ψ⟩` é o
  CONTROLE de uma porta controlada, é EXPANDIDO no qubit genérico desconhecido `ψ₀|0⟩ + ψ₁|1⟩`
  (`SymState.expandAbstract`: amplitudes simbólicas livres `ψ₀=⟨0|ψ⟩`, `ψ₁=⟨1|ψ⟩`). Depois o motor
  concreto aplica a porta normalmente, propagando `ψ₀/ψ₁`. Reproduz a álgebra canônica de
  teletransporte (`|ψ⟩⊗|00⟩` → H(1),CNOT(1→2),CNOT(0→1),H(0) → 4 ramos de medida, cada um com `|ψ⟩`
  corrigido por Pauli no qubit alvo) e o teste de Hadamard. Coexiste com o kickback opaco: `|ψ⟩` só
  expande como CONTROLE; como ALVO de 1 porta mantém regra-de-autovalor/nó. Ket abstrato DECORADO
  por nó (ex.: `Z|ψ⟩` sem regra) não expande (erro claro). `isPureConcrete` exige também coef sem
  símbolo livre (base concreta com `ψ₀/ψ₁` ⇒ continua SymState).
- **Expr** = Σ monômios `{amp:Amp, syms:[[name,power]]}`. Símbolo livre = nome opaco; **fase
  estruturada** e^{i·c·(π?)·sym} = nome codificado (`ph:coefN/coefD/hasPi/sym`) cujo display DOBRA
  o expoente pela potência (λ²=e^{2πiθ}²→**e^{4πiθ}**, habilita QPE U^{2^k} por aplicação repetida).
- **Entrada de λ** (inline, reusa o teclado da calc): a entrada é o **ÂNGULO DE FASE φ**; o autovalor é
  **λ = e^{iφ}** (eigenvalue de unitária ⇒ |λ|=1). φ CONCRETO → λ=e^{iφ} exato p/ múltiplo de π/4
  (via recognize; ex.: φ=π/4→ω; φ=π→−1; φ=π/2→i); φ SIMBÓLICO linear `[coef][π?]sym` (θ, 2πθ, πθ)
  → fase estruturada e^{iφ} (phaseAtom). Forma literal `e^{…}`/`exp(…)` também aceita (compat).
  CLR/Esc = "deixar simbólico" (nó). Fecha o 🟡 da revisão de escopo. NOTA: a 1ª implementação tratava
  a entrada como λ DIRETO (número), o que dava |λ|≠1 (físico errado) — corrigido p/ ângulo de fase.
  PADRÃO (refinamento P5): `=` com buffer VAZIO → λ = **e^{iθ}** (fase simbólica elegante; símbolo θ
  e não φ, que já é o ket |φ⟩). Assim CRz em |+⟩⊗|ψ⟩ + `=` dá ((1/√2)|0⟩+(1/√2·e^{iθ})|1⟩)⊗|ψ⟩
  (kickback) em vez do nó CRz|ψ⟩.
- **Promoção = preparação**: `SET` materializa `SymState` sse a ket-string contém ≥1 ket abstrato
  (paleta {|ψ⟩,|φ⟩,|χ⟩}); senão `State` concreto (caminho rápido v1–v3 intacto). Despacho por
  `state.sym` em `execute`/`refresh`. Operações concretas (norma/medição/Bloch/base/barras/evidência-por-qubit)
  ficam bloqueadas no modo simbólico (negative scope). Regras = registro global `SymRules`.
- **Forma FATORADA simbólica** (`Render.factoredSym`, reusa o conceito do v3 como AÇÃO manual): fatora
  os subsistemas FIXOS (mesmo slot em todos os termos) — tipicamente o(s) ket(s) abstrato(s) `|ψ⟩`
  comuns — pondo a soma dos slots variáveis entre parênteses. PADRÃO = fatorado (isola `|ψ⟩`); botão
  `forma` alterna fatorado↔expandido. Ex.: kickback → `((1/√2)|0⟩ + (1/√2·e^{iπ/4})|1⟩)⊗|ψ⟩`.
- **Probabilidade dos qubits CONCRETOS** (`UI.symProb`, botão `prob` no modo simbólico):
  bem-definida quando os fatores abstratos são COMUNS a todos os termos (|ψ⟩ unitário fatorável) →
  P(bits) = |coef|² (fases têm módulo 1). EXATO quando o coef recai em ℤ[ω] (ex.: kickback (1±ω)/2 →
  P=(2±√2)/4, exato mesmo com a MAGNITUDE da amplitude exibida em decimal — √((2±√2)/4) não é surd limpo).
  Se o coef é soma/símbolo livre (φ simbólico) → probabilidade SIMBÓLICA (depende do parâmetro): pede φ
  concreto. Se os fatores abstratos diferem entre termos → exigiria ⟨ψ|·⟩ (fora do escopo): pede fatorar.
- **prob vs medir (modo simbólico):** `prob` = distribuição dos qubits concretos (não-destrutivo);
  `medir` = **MEDIDA PARCIAL projetiva por AMOSTRAGEM** de UM qubit concreto selecionado
  (`UI.symMeasure`, extensão P5 p/ teletransporte): sorteia o resultado ∝ Σ|amp|² (amplitudes
  simbólicas ψ₀,ψ₁ como base unitária), colapsa para o ramo e renormaliza por `1/√P` (exato p/ P
  diádico via `recognize`: ½→√2, ¼→2). Requer `n Q` (ALL → erro); qubit abstrato → erro (expanda
  como controle antes). São funções DISTINTAS (revertida a consolidação "só prob", que valia quando
  eram idênticos). Fluxo de teletransporte: medir q0,q1 → corrigir q2 com X/Z → recupera `|ψ⟩`.

Testes: 35 v4 core (`tests/v4.test.mjs`) + 19 Playwright v4 (`tests/ui.spec.js`). Suíte total 218/218
(inclui o redesenho do teclado em zonas + camada 2nd, a esfera de Bloch embutida, o controle
abstrato e a MEDIDA PARCIAL — protocolo de teletransporte completo ponta a ponta. Ver ui-layout.md).
