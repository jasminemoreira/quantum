# Lições do ciclo v8 — cookbook `examples.html`

> Delta de documentação (cookbook 25 exemplos, básico→avançado). Motor/portas/UI v7 INTOCADOS.
> Entregue + validado contra a TELA real. Suíte 300 (224 Node + 76 Playwright).

## L1 — Validar contra a TELA, não contra o motor (a lição central)
A primeira validação (examples.test.mjs) checava o caminho do MOTOR (`compute` via `loadQC`).
Mas um cookbook "o que você vê" documenta o caminho TECLA→TELA — e eles **divergem** onde a UI
aplica convenções de exibição que o motor não revela: ket-string SET fixa a base de PREPARAÇÃO por
qubit + forma fatorada (`|0⟩|+⟩|1⟩` → `|0⟩⊗|+⟩⊗|1⟩`, não expandido); fmt padrão exp esconde o surdo
de π/8 (só em rect); o display FATORA o ket comum (`((1/√2)|0⟩+…)⊗|ψ⟩`); ops têm prefixo (`⟨φ|ψ⟩ = 0`).
A usuária pegou: *"algumas sequências de teclas não produzem o resultado apresentado na tela"*.
**Correção (padrão-ouro):** validação DOM-driven — um teste Playwright dirige a sequência REAL de
botões e CAPTURA `#stateDisplay`/`#auxOutput`/`#statusLine`/`#blochValue`; a captura É o resultado
documentado (gera o examples.html). **Regra:** para doc de app interativo, dirija a UI real; o caminho
do motor é um atalho que mente sobre a apresentação.

## L2 — Nenhuma tecla-fantasma; verificar arity (CTRL×Q)
Toda tecla documentada tem de existir e ser pressionável. A usuária caçou 3 fantasmas:
**QFT⁻¹** (não há tecla — monta-se com SWAP + CP de ângulo negativo + H), **U** (existe mas escondida
no 2nd; standalone em |ψ⟩ não é fluxo natural — o exemplo certo é kickback com CP), e ERROS DE ARITY:
SWAP é `{t:2,c:0}` (2 alvos, SEM controle → `0 Q 1 Q SWAP`, não `0 CTRL 1 Q`); CSWAP é `{t:2,c:1}`;
CCX é `{t:1,c:2}`. **A arity (Gate.meta) determina CTRL×Q.** Rótulos-resumo nos chips ("QFT⁻¹","H×3")
enganam — mostrar as primitivas LITERAIS e explicar o agrupamento na prosa. Trava: `manual.test.mjs`
afirma as 22 arities + reprova as notações erradas (assert.throws).

## L3 — Human-AV é insubstituível para doc didático de UI
Os testes (mesmo DOM-driven) confirmam que a string capturada é válida/presente — mas NÃO julgam
adequação semântica/UX. A usuária, em ~6 rodadas, reformou o entregável pegando o que nenhum teste
pega: tema escuro→claro (usar o modo claro da calc); falta da preparação inicial em cada exemplo;
explicações curtas demais; A10 sem sentido; teclas-fantasma; e a divergência tela×doc. Validação
humana contínua foi o que deu fidelidade e valor didático ao cookbook.

## L4 — Convenções de exibição da UI são um contrato OCULTO (descobertas dirigindo a UI)
Nenhuma estava em spec; só apareceram ao dirigir a interface real:
- ket-string SET → `qbasis` = base de preparação por qubit + forma fatorada.
- `op:bloch` chama `showBloch()` → escreve `#blochValue` (leitura do estado), NÃO `#auxOutput`.
- resultado da calc aparece em `#statusLine` (prefixo `= `).
- camada 2nd é one-shot: reseta após GATE, mas NÃO após OP (precisa de `shift` de volta).
- entrada de ângulo usa o layout da calc (`calc:π`, `calc:/`, `calc:N`, `eval`); negativo `−π/2` é
  exato (`isPi`); `3π/2` é sintaxe inválida (use o negativo).

## L5 — A lacuna de mercado se manteve (re-checagem web 2026-05)
Busca refeita confirmou specs/competitors/landscape.md: o espaço web/GUI segue numérico (Quirk, IBM
Composer, "state calculators" de decimais); simbólicos seguem exigindo programação (SymPy, Wolfram,
add-on Mathematica de Gómez-Muñoz); o mais próximo no navegador (Dirac.js) é um PARSER de notação por
caixa de texto — sem portas/circuitos/teclado/|ψ⟩. A combinação exato-ζ₁₆ + teclado + circuitos +
offline permanece sem par. Reforça o posicionamento: "a calculadora simbólica de bolso para QC".

## Sementes p/ ciclo futuro (v9)
- Persistir as capturas (JSON) p/ regenerar o doc sem re-dirigir a UI (mudança só-display ficou cara).
- Snapshot dos screenshots no CI (regressão visual). Versão EN do cookbook (i18n). Mais exemplos
  (W-state via Ry≈approx como demo do fallback numérico; QFT-4 dirigido; superdense com medição real).
- Helper de driving reusável (DSL de steps) extraível para os projetos irmãos (BlochTool/etc.).
