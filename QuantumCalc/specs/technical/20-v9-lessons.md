# Lições do ciclo v9 — bloco de PRESETS/macros no 2nd layer

> Delta de motor/UI sobre v8 maduro. 6 presets (QFT, QFT†, Bell, GHZ, Grover-difusor, W) no 2nd layer,
> montados das portas exatas existentes. Suíte 335 (250 Node + 85 Playwright). Manuais + automáticos
> lado a lado (pedido da usuária). Spec: [19-v9-presets.md](19-v9-presets.md).

## L1 — O crítico vivia na GUARDA, não no mecanismo (C1)
A premissa P1 "MCZ do difusor via loop de controle genérico do Engine" estava certa sobre o **loop**
(`Engine.apply` varre `controls` de qualquer tamanho, L907) e errada sobre o **gate**: `validate()`
(L893) roda ANTES e exige `controls.length === meta.controls`, então `Z` (c:0) com 3 controles lança.
A lente **Assumptions** da Fase 2 pegou isso. A correção foi **simplificar** (Fase 3): extrair o núcleo
já genérico em `Engine.applyN` (valida range+dup, NÃO aridade); `apply()` = `validate(aridade) → applyN`.
**Regra:** ao reusar um mecanismo existente, audite as GUARDAS em volta dele, não só o mecanismo. A
solução de um crítico pode ser uma EXTRAÇÃO (reduz duplicação), não um subsistema novo (anti-AP2).

## L2 — Bell sem lógica de variante: a preparação É o seletor
Os 4 estados de Bell não exigiram nenhum ramo de código: `H+CNOT` mapeia o input da base computacional
no Bell correspondente (|00⟩→Φ⁺, |01⟩→Ψ⁺, |10⟩→Φ⁻, |11⟩→Ψ⁻). Preparar os 2 qubits seleciona a variante.
Zero teclas extras, zero estado oculto, e didático (mostra a relação input↔Bell). **Regra:** antes de
adicionar teclas/estado p/ variantes, ver se a semântica de preparação já existente as gera de graça
(alinha com a preferência de chrome mínimo da usuária — [[ui-minimalism-preference]]).

## L3 — Convenção de exibição (fatoração) só apareceu dirigindo a UI (recorrência da lição v8 L1)
Um teste DOM-driven de `0 Q 2 Q QFT` em 4 qubits FALHOU contra a minha expectativa (forma expandida):
a tela mostra `(QFT₃ em q0q1q2) ⊗ |0⟩` — o display **fatora o qubit intacto** (separável). O motor está
certo; a apresentação aplica fatoração que o caminho do motor não revela. Corrigi a asserção p/ a tela
real (mais didática). **Regra:** para feature de UI, a TELA é a fonte de verdade; o resultado do motor
mente sobre a apresentação. (3ª vez que essa lição aparece — v8 L1/L4, agora v9.)

## L4 — Construção do W-state: verificar contra referência + invariante (anti-AP7)
O W-state é o único preset ≈approx. Antes de codar, **derivei a cascata à mão** (m=3: cos(θ₀/2)=1/√3,
θ₁=π/2 → exatamente (1/√3)(|100⟩+|010⟩+|001⟩)) e cruzei com a ref Cruz et al. (arXiv:1807.05572). Faltava
`CRy` no catálogo → `CU(θ,0,0)=controlled-Ry` (U(θ,0,0)=Ry(θ)). Teste trava `‖W‖²=1` + excitação única.
**Regra:** uma cascata "plausível" de rotações é exatamente o tipo de coisa que a IA inventa errado;
ancorar em referência + invariante numérico (norma) antes de confiar.

## L5 — Cross-check preset==manual: validação E feature didática no mesmo gesto
O pedido da usuária — **manter as formas manuais + acrescentar as automáticas** — transformou os exemplos
manuais (cookbook I1/I2/A4/A5, manual §11) em ORÁCULO dos presets: o teste `preset QFT == sequência
manual` (idêntico na tela e no motor) valida a automação contra algo independente da minha implementação
do preset. **Regra:** quando "duas formas de fazer a mesma coisa" coexistem, uma valida a outra — escopo
didático e cobertura de teste convergem.

## Sementes p/ ciclo futuro (v10)
- π/16 / ζ₃₂ → QFT/QFT† EXATA ≥5 qubits (hoje ≈approx); maior anel ciclotômico.
- Presets que hoje ficam de fora: Grover COMPLETO (oráculo + difusor) como fluxo guiado; presets com
  MEDIÇÃO (teleporte/superdense) como macro multi-passo.
- Difusor de Grover em torno de um |s⟩ arbitrário (não só uniforme).
- Persistência (localStorage) do estado/histórico; norma/⟨φ|ψ⟩ simbólico; notação ↓↑ (todas de-escopadas).
