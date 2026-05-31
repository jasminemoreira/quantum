# v17 — Lições (symBloch + fold automático ψ₀|0⟩+ψ₁|1⟩→|ψ⟩)

Ciclo 18, conduzido pela metodologia Versus (P0→P7) em Opus, sessão única.
Escopo entregue: **2 frentes de MOTOR/simbólico** — (1) **symBloch** (esfera de Bloch de um qubit
concreto e separável dentro de um `SymState`); (2) **fold** automático que reconhece
`ψ₀|0⟩+ψ₁|1⟩`→`|ψ⟩` (clímax do teleporte, qubit volta a ser ket abstrato de motor).
A 3ª frente (fix do baseline das frações do KaTeX no Safari iOS) foi **DESCOPADA pela operadora na
Fase 3** (radar; sem device para validar; tratada como bug upstream do KaTeX/WebKit, não do app).
Suíte 398 (293 Node + 105 Playwright); 0 padrão/módulo novo.

## L1 — Guard upstream short-circuita o dispatch da função-folha (o bug do `routeAction`)
O symBloch foi implementado estendendo `showBloch` (função-folha) para tratar `s.sym` via
`reducedOneQubit`. Os smoke-tests de motor passaram (a função estava certa), MAS ao vivo a esfera
não abria: `routeAction` tinha um guard ANTERIOR — `if (arg==='bloch' && History.current().sym){
showError('the Bloch sphere requires a concrete state'); return; }` — que barrava o estado simbólico
**antes** de o controle chegar ao `showBloch`. O dispatch novo nunca era alcançado.
**Lição:** ao estender o DOMÍNIO de uma função-folha (aceitar um caso antes recusado), faça `grep`
por guards/gates UPSTREAM (no router/dispatcher) que dão short-circuit sobre o mesmo predicado
(`s.sym`, `mode`, etc.). É a MESMA classe do ponto-cego recorrente "função validada em unit-test ≠
caminho da UI validado" (cf. KaTeX-offline-Playwright nos v5/v7). Antídoto que funcionou: **human-AV
ao vivo da operadora pegou o que o smoke-test não pegava** (AP5 na prática, 4ª recorrência) + um
teste de UI dedicado (`ui.spec 'v17 symBloch'`) que exercita o caminho de roteamento real, não só a
função pura.

## L2 — O predicado "mesmo c exato" DISPENSA lógica de fase global (simplificação)
Na Fase 2 levantei o risco de ter que comparar coeficientes "até fase global". A resolução da Fase 3
foi mais simples e mais correta: o fold só dispara quando os dois ramos são `c·L₀|0⟩` e `c·L₁|1⟩`
com o **MESMO `c`** (igualdade EXATA em ℤ[ζ₁₆] via `SymExpr.eq`). A fase global É o próprio `c`
comum, preservado no slot dobrado — não há nada "a menos de fase" a comparar. Se os ramos têm
escalares diferentes (ex.: `Z|ψ⟩ = ψ₀|0⟩ − ψ₁|1⟩`, c=+1 vs −1), o padrão simplesmente não casa e o
estado fica intacto (correto: `Z|ψ⟩ ≠ |ψ⟩`). **Anti-AP2:** a crítica adversarial revelou fragilidade
imaginada; a resposta foi REMOVER complexidade, não adicionar.

## L3 — Um invariante existente tornou o fold seguro por construção (ket decorado)
Preocupação ME da Fase 2: e se `|ψ⟩` estiver decorado por um nó (`H|ψ⟩`)? Folding para um `|ψ⟩` bare
perderia o gate. Resolveu-se sozinho: `expandAbstract` JÁ **lança erro** em ket decorado
(`'cannot expand |ψ⟩ decorated by an unevaluated gate'`), logo os átomos lineares `L₀/L₁` SÓ nascem
de um ket bare. O fold reconstrói sempre um slot bare `{label, nodes:[]}` e isso é exato.
**Lição:** antes de criar tratamento de edge-case, procure um invariante a montante que já o exclua.

## L4 — A precisão do predicado FOI a segurança de migração (o 🔴 auto-resolveu)
O único 🔴 da Fase 2 (fold rodando após cada `apply` poderia alterar saídas de testes simbólicos
existentes) reduziu-se, na prática, a **exatamente UMA atualização intencional** (o teste do
teletransporte em `ui.spec`, que agora afirma `|00⟩⊗|ψ⟩` em vez de `((ψ₀)|0⟩ + (ψ₁)|1⟩)` — a própria
entrega da feature). Todos os outros 397 testes ficaram byte-idênticos, porque o predicado separável
preciso **não casa** os estados intermediários EMARANHADOS do teleporte (`ψ₀|00⟩+ψ₁|11⟩`, grupos de
1 termo) nem o de pré-medição (sinais relativos do Hadamard ⇒ c diferente). **Lição:** escrever o
predicado EXATO na fase de design é o que torna a regressão um não-evento.

## L5 — symBloch: o estado reduzido é bem-definido sob fator abstrato comum
`reducedOneQubit` reusa a separabilidade de `symProb` (fator abstrato `|ψ⟩` COMUM a todos os termos
⇒ desentrelaçado do bloco concreto) + exige coeficientes NUMÉRICOS puros (sem `ψ₀/ψ₁/θ/λ`) e então
monta um `State` concreto e delega ao `blochVector` existente. A pureza/mistura DENTRO do bloco
concreto fica por conta do `blochVector` (ρ reduzida), idêntico ao caminho concreto — um qubit
concreto emaranhado com OUTRO concreto mostra `|r|<1` ("mixed"), como já fazia. Não houve novo
algoritmo de separabilidade.

## Carry-forward → v18 (não iniciado)
- `CU(λ)` ergonômico / kickback com autovetor arbitrário; **EV multi-qubit `⟨Z₀Z₁⟩`** (pendente desde
  o v13/v14, adiado de novo no v16 e no v17).
- fix do baseline das frações do KaTeX no Safari iOS (radar; bug upstream WebKit `\dfrac` inline +
  `line-height` alto) — só faz sentido com um device iOS para human-AV.
