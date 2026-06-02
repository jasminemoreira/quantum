# v25 — Racionalização do teclado (gramática unificada CTRL+base) — Lições

Ciclo 26 do Versus. Delta brownfield: TECLADO + DOCS + TESTES. Motor ℤ[ζ₁₆]/applyN/Gate.META/Presets **intocado**. Suíte 100% verde: 397 Node + 160 Playwright.

## O que foi entregue
- Removidas do keypad as portas controladas redundantes: CNOT, CZ, CP(λ), CRz, C-U (linha 'controlled', pág.1) + CCX, CSWAP (pág.2). Permanecem no MOTOR (Presets.expand usa op('CNOT')/op('CP')/op('CU') no Bell/GHZ/QFT/W).
- Mantidos: SWAP, iSWAP (primitivas 2q genuínas) + CTRL + bases 1q.
- **EXTRA aprovado pela operadora** (não-silencioso): P(φ) e U(θφλ) PROMOVIDOS da pág.2 → bloco 'gates' da pág.1, para que as controladas comuns (CTRL P, CTRL U) não exijam navegação de página.
- ~18 cards reescritos (gate:CNOT→X, CZ→Z, CP→P, CRz→Rz, CU→U, CCX→X, CSWAP→SWAP); helper genérico `_ctrl(gate,c,t,...args)`; manual.html regenerado; nota da gramática unificada na §6.

## Lições

### L1 — Bit-identidade pela MATRIZ-BASE (chave de risco-zero)
`Gate.matrix(name)=build(m.base)` (quantum_calc.html:1016): CNOT e X compartilham `base:'X'`; applyN aplica a matriz-base sobre os ALVOS e trata controles pelo loop. Logo `c CTRL t Q X` ≡ `c CTRL t Q CNOT` ESTADO IDÊNTICO. Mesma família p/ CZ/Z, CP/P, CRz/Rz, CU/U, CCX/X, CSWAP/SWAP. **Resultado: os pinos anti-AP7 (v21.test) ficaram INALTERADOS** — a reescrita dos cards foi pura troca de token, e o replay recomputou os mesmos estados. Quando a equivalência é algébrica (mesma base+controle), o teste de regressão de estado é a rede de segurança perfeita.

### L2 — A entrada de autovalor λ é disparada por ALVO ABSTRATO, não pelo nome da porta
SymEngine/onGate (quantum_calc.html:3277-3278): aplicar QUALQUER porta a um slot |ψ⟩ abstrato dispara `startLambdaEntry` (params da porta ignorados). Por isso `CTRL U`/`CTRL P`/`CTRL Rz` sobre |ψ⟩ preservam o kickback simbólico exatamente como CU/CP/CRz faziam (assunção A3 CONFIRMADA em código + verde nas suítes ui.spec v4 CRz/CU). Lição: antes de assumir que renomear uma porta quebra o simbólico, achar ONDE o comportamento é decidido — aqui era o layout do estado, não a porta.

### L3 — O ripple do "extra" (P/U → pág.1) foi MAIOR que o core
Promover P/U à pág.1 (decisão de ergonomia) tocou MAIS sítios que a remoção das controladas: B-cards de P(π/8) que navegavam à pág.2 (page:1 antes de gate:P), helpers de teste (pPi8), e testes de "no-auto-return"/layout (v2/v14/v22) que assumiam P/U na pág.2. Lição: relocar uma tecla entre páginas tem ripple em TODO replay que navegava até ela — `grep page:1 + gate:<X>` é obrigatório ao mover qualquer tecla de página.

### L4 — M4 (testes de UI) foi SUBESPECIFICADO no P1; a P2 acertou ao concentrar o risco em Migração
O P1 disse "helpers bell()/ghz()". A realidade: ~20+ act() de gates removidos + asserção de visibilidade (gate:CP toBeVisible) + suítes dedicadas CRz/CU + shot-crz + NEG (CNOT-aridade) + layout em v2/v14/v22. A crítica adversarial (P2) classificou corretamente a concentração POR LENTE (Migração/Coexistência) e POR MÓDULO (M4) como o risco real — não o motor. Lição: em delta sobre código maduro, o grosso do trabalho costuma ser a TRANSIÇÃO da suíte de testes, não a feature.

### L5 — Testes NEG que dependiam da porta removida precisam de novo veículo
O NEG "CNOT com 1 operando → erro" virou inválido (X com 1 operando é válido). Reescrito como "X com 2 alvos → erro de aridade estrita". Lição: ao remover uma tecla, os testes negativos que a usavam como gatilho de erro devem migrar para outro caso que ainda exercite a MESMA regra (aridade estrita do v24).

### L6 — Pipeline de doc auto-verificável paga dividendos
manual.html é regenerado por examples.spec.js (replay no app real → captura → writeFileSync). Reescrever os steps + rodar a suíte regenerou o manual com os chips corretos (stepsToKeys deriva de steps) e provou key→tela. Zero edição manual de manual.html.

## Resíduo / diferido
- **F3 (balanço de layout da pág.1)**: após remover a linha 'controlled' sobra um quarto livre ao lado do numpad. Diferido ao v26 (redesign do teclado único + 2nd subsume).
- **Deploy NÃO feito**: publicar via ./deploy-ssh.sh + bump sw.js quando desejado.
- **CP vs CRz**: subseção do manual mantida, reframe p/ CTRL P vs CTRL Rz (conteúdo didático preservado).
