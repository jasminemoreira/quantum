# v22 (ciclo 23) — Lições de projeto (Fase 7)

Delta entregue: teclas de **input/composição de estado** na pág.2 — √X/√Y (exatos), |T⟩ (macro H·T), rand (Haar), amp (amplitudes complexas), atalhos de ângulo — mais um longo cluster de **polish de UX dirigido por dogfooding** no Motorola Edge 50 Ultra (v22-1..21).

## Domínio (quântico)
- **L1 — Qubit emaranhado no Bloch = vetor nulo, e isso é o certo.** Para um qubit de um par de Bell, a matriz densidade reduzida é ρ=I/2 (maximamente misto) → vetor de Bloch de comprimento 0 (centro da esfera), sem direção. O app já calcula a ρ reduzida e mostra "esfera sem seta + fita 50/50" tanto no concreto quanto no `|ψ⟩⊗Bell`. A ausência de seta é a assinatura física do emaranhamento máximo — não um bug. (Decidido NÃO rotular; chrome mínimo.)
- **L2 — Contrato ≈ é VALUE-DRIVEN, não code-path.** O badge ≈ acende quando o VALOR exibido não é exatamente representável em ℤ[ζ₁₆], não quando o caminho é numérico. Logo `amp` com α=β=1 → 1/√2 mostra SEM ≈ (é exato), enquanto 2/√5 acende ≈. Honesto e reusa a infra existente (zero código de badge novo).
- **L3 — Amplitude é número COMPLEXO; ângulo é real.** O pad do ângulo (dígitos/π/√) é pobre para amplitude. A entrada de amplitude precisa de pad científico (√ sin cos exp i π) e cada amplitude (α, β) é UMA expressão complexa — cobrindo rect (a+b·i), polar/exp (r·exp(i·θ)) de graça. Fase = `exp(i·θ)`, NÃO `e^(...)` (o `^`/POW trunca o expoente à parte real → e^{iθ} daria 1).
- **L4 — Presets sobre estado simbólico:** as portas H/CNOT/CP/SWAP já operavam sobre qubits CONCRETOS de um SymState (é o que o teleporte faz). A restrição "preset concrete-only" (v9) era conservadora demais; liberá-la quando todos os alvos são concretos (recusar só se o alvo é o slot abstrato |ψ⟩) é matematicamente correto e barato.

## Stack / motor
- **L5 — Antes de empobrecer/replicar UI, checar o que o MOTOR já suporta.** O `Calc.evaluate` já tinha aritmética complexa completa (√ sin cos exp ln conj abs + π e i); só os BOTÕES tinham sido removidos do pad do ângulo. O pad científico do amp saiu "de graça" reaproveitando o avaliador — sem mexer no motor.
- **L6 — `window.prompt` nativo é proibido num app "tudo pelo teclado próprio".** Abre o teclado do SO e aceita lixo ("XPTO"). Varrer TODAS as entradas: amp (refeito p/ pad), ρ_A/S(ρ) (passaram a ler a gramática de operandos `n Q`, como ⟨ZZ⟩), e o `collectParams` morto (continha o último prompt) removido. Resultado: ZERO `window.prompt` no app.

## UI / animação (o grosso do dogfooding)
- **L7 — Num carrossel de páginas com altura compartilhada, adicionar conteúdo a UMA página afeta TODAS.** A 1ª colocação do grupo input como linha full-width esticou a pág.1. Solução: 2 colunas reais de altura independente (override do `display:contents` só na pág.2) + sempre verificar igualdade de alturas (page1==page2).
- **L8 — Para colapsar item de CSS grid SEM deixar vão E com animação:** `height:0` ANIMA mas deixa a track + o `row-gap` (o "vão extra"); `display:none` fecha o vão mas mata a animação. Padrão "ANIMA-DEPOIS-REMOVE": anima height:0 (.25s) e, ao assentar (~280ms), aplica `display:none` (remove a track + gap); no expand-back, reverte a classe antes de animar a volta.
- **L9 — Troca de layout instantânea + compensação de tamanho devem ocorrer no MESMO frame.** O `display:none` (instantâneo) removia o gap (blocos sobem) enquanto o crescimento compensatório do display usava transição .25s (blocos voltavam) → "pulinho". Fix: o crescimento compensatório também instantâneo (`transition:none`, commit no mesmo frame) → movimento líquido zero.
- **L10 — Teste flaky com elemento ANIMADO:** o v20-UI-8 (tap-cycle) capturava `boundingBox()` durante a animação de zoom do canvas (.28s) → coords obsoletas → clique caía perto do centro → ciclava. Fix de teste: esperar a animação assentar antes de medir + clicar no canto. (Era flaky, não defeito — vermelho histórico desde v20, agora 100% verde.)

## Premissas P0/P1 revistas
- O `amp` foi redesenhado 3× no dogfooding (campos nativos → pad enxuto do ângulo → pad científico com expressão complexa). A forma final (expressão complexa única por amplitude) é melhor que os campos guiados separados — mais natural e cobre rect/polar/exp sem toggle de formato.
- O layout da pág.2 também iterou bastante (linha full-width → encaixe no vão → 2 colunas → split do operations → reorder → colapso). A forma final (2 colunas; esq = input/measure&view/density&entanglement; dir = gate variants/2 qubits/presets) é a preferência da operadora, validada no device.
