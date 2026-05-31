# Semente do ciclo v9 — bloco de PRESETS/macros no 2nd layer

> Decidido no fim do v8 (usuária: "implementar funções avançadas para um bloco na 2nd: QFT, QFT†,
> estados de Bell + sugestões"). FEATURE de motor/UI no `quantum_calc.html` (NÃO é doc). Conduzir como
> ciclo v9 (Versus), desenhando na Fase 0/1 antes de codar (AP6). Reusa CP/H/SWAP/CNOT exatos do v7.

## Escopo proposto (a confirmar/refinar na Fase 0)
Um grupo de teclas de **preset/macro** na camada 2nd que expandem para um BLOCO de portas conhecido,
em vez de uma porta só. Escolhidos pela usuária p/ semear:
- **QFT** — H + cadeia de CP(2π/2ᵏ) + SWAPs de reversão.
- **QFT†** — a inversa (CP de ângulo negativo, ordem reversa).
- **Bell** — |Φ+⟩ (H + CNOT) em 2 qubits.
- **GHZ** — (|0…0⟩+|1…1⟩)/√2 em N qubits (H + cadeia de CNOTs).

Candidatos deixados de fora por ora (podem voltar com aprovação): difusor de Grover; W-state (≈approx).

## Decisões-chave para a Fase 0/1
1. **Convenção de alvo.** Como o preset sabe em quais qubits agir?
   - QFT/QFT† pedem um RANGE ou ALL (ex.: `0 Q 3 Q QFT` = QFT em q0..q3; ou `ALL QFT`).
   - Bell pede 2 qubits (ex.: `0 Q 1 Q Bell`). GHZ pede N (ALL ou range).
   - Definir uma gramática consistente com o FSM atual (Q=alvo, CTRL=controle, ALL).
2. **Granularidade no histórico.** Bloco ATÔMICO (um ↶ desfaz a QFT inteira) vs. empilhar cada porta.
   Atômico é mais limpo p/ o usuário; avaliar como o History lida com isso.
3. **Exatidão.** QFT exata só **≤4 qubits**: R_k = CP(2π/2ᵏ); R₄=CP(π/8)∈ζ₁₆, mas R₅=CP(π/16)∈ζ₃₂
   (fora do núcleo) → sinalizar ≈approx acima de 4 qubits. Documentar o limite.
4. **Reuso.** Montar a partir das portas EXATAS já existentes (H, CP, SWAP, CNOT) — sem motor novo;
   idealmente um helper que gera a sequência de portas e a aplica (como o `qft()` do cookbook v8).
5. **UI.** Onde no 2nd layer? Um novo grupo "presets/blocos"? Rótulos e ergonomia (Fitts/Hick).
6. **Display/render.** O resultado de uma QFT mostra muitos termos — conferir legibilidade no LCD
   (já visto no cookbook que QFT₃|001⟩ rende 8 termos com fases).

## Não-escopo (provável)
- Presets que exigem MEDIÇÃO (teleporte, superdense) como macro de um toque — fluxo com colapso/correção
  não cabe num botão simples.
- π/16 / ζ₃₂ (QFT ≥5 qubits exata) — segue de-escopado.
- Mudança no núcleo ζ₁₆ ou nas portas base.

## Validação esperada (herdando lições do v8)
- **DOM-driven** (lição v8 L1): testar pressionando o preset na UI real e capturando a tela.
- Cross-check do estado resultante contra o motor (ex.: QFT|0…0⟩ = uniforme; QFT†∘QFT = identidade).
- Não regredir os 300 testes atuais. Atualizar o manual + o cookbook com os novos presets.

## Handoff
Estado mostrará v8 fechado (Fase 7) → `start_new_cycle` (v9) → Fase 0 lê este arquivo como baseline.
Fase 0 (design) pede o modelo mais capaz (Opus); sessão longa → considerar chat novo + 'retomar Versus'.
