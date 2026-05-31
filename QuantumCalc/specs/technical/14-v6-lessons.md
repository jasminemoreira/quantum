# Lições do ciclo v6 (núcleo exato ζ₁₆, π/8) — Fase 7

Lições sobre ESTE projeto (não sobre a metodologia). Insumo para o v7 (start_new_cycle).

## L1 — A alavanca da exatidão NÃO estava onde a spec apontou primeiro
O P0 marcou o "display de surdo aninhado" como o RISCO do delta. Mas o ganho real (π/8 exato) veio do
**`expI(α)` na camada de portas**: as fases de porta passavam por `recognize(cos α, sin α)`, que falhava
para π/8 (não é (m+n√2)/2^p) → caía no numérico. A correção foi mapear múltiplos de π/8 DIRETO para ζ^k
via `angleIndex16`/`zpow16` — não tem nada a ver com display. **Lição:** rastreie o fluxo de dados até
onde a exatidão é PERDIDA (entrada da porta), não só onde é EXIBIDA.

## L2 — A crítica adversarial (Fase 2/3) pegou um erro de design ANTES do código
A escolha P1 "surdo aninhado ÚNICO √(p+q√2)/2^m" era INSUFICIENTE: a amplitude canônica do kickback
`Re = ½ + √(2+√2)/4` é uma SOMA (racional + radical), não um surdo único. A lente Linguistics + um
cálculo numérico na Fase 3 revelaram isso, levando à decisão "soma exata base grau-4" — que era ao mesmo
tempo MAIS exata (cobre interferência) E mais simples no caminho de display (eliminou recognição numérica
e o risco de falso-exato). **Lição:** a fase adversarial se pagou; o design mudou antes de implementar.

## L3 — `deg4=false ⟺ ℤ[√2]` tornou a não-regressão AUTOMÁTICA
Manter o contrato de `norm2` `{p,q,k}` como o caso ℤ[√2] e só estender (rA,rB) para π/8 genuíno fez os
233 testes ζ₈ passarem com saída BYTE-IDÊNTICA, garantido algebricamente pelo embedding ω=ζ² (não por
sorte). `exactReIm` em base grau-4 reduz a `realToStr` quando RA=RB=0. **Lição:** projete a extensão para
que o caso antigo seja subcaso ESTRITO → não-regressão por construção.

## L4 — Teste que não exercita um caminho de render não o protege (reforça lição do v5)
O bug do KaTeX (`\sqrt` sem chaves → `\sqrt \left(` malformado) passou VERDE por 244 testes porque o
KaTeX (CDN) não carrega no Playwright offline — a conversão LaTeX dos surdos aninhados novos NUNCA foi
renderizada. O olho humano pegou na hora (screenshot). **Lição:** o gap "KaTeX-offline-no-Playwright" é
ponto cego conhecido; para QUALQUER classe nova de string de display, adicionar asserção Node sobre
`toKatex` (v6-9: sem `\sqrt \left`, chaves balanceadas).

## L5 — A exatidão π/8 entrega o valor DIDÁTICO do projeto, e de forma não-planejada
No teste manual, a calculadora ajudou a usuária (especialista) a pegar DOIS erros na própria dedução à
mão: (a) convenção de ângulo (1/8 de volta = 2π/8 = π/4, ≠ π/8 em radianos); (b) |+⟩ NÃO é autoestado de
T, logo o phase-kickback fatorado não vale (precisa de autoestado |1⟩). E o kickback de uma controlled-T
(π/4) produz fase de **meio-ângulo π/8**, agora EXATA: `√(2+√2)/2·e^{iπ/8}` em vez de `0.92·e^{i0.39}`.
**Lição:** a exatidão no regime π/8 torna circuitos controlled-T/QFT legíveis algebricamente — exatamente
o objetivo do P0 ("auxiliar o desenvolvimento algébrico dos circuitos de curso").

## L6 (processo) — Divergência implementação × constraint documentada
A camada "2nd" era um TOGGLE puro, divergindo da constraint "2nd/SHIFT = one-shot (próxima tecla)".
Descoberto pela automação de UI (Playwright), corrigido a pedido da usuária (reset em `execute()` após
aplicar porta da 2nd). Pré-existente, fora do delta de motor v6. **Lição:** constraints documentadas
merecem um teste que as verifique; toggles "one-shot" são fáceis de implementar como toggle por engano.

---
**Sementes p/ v7** (specs/technical/13-v7-seeds.md): toggle de convenção de ângulo (rad↔turns); nota
CP vs CRz no manual. **Demais de-escopadas:** π/16 (ζ₃₂), λ_k=f(k), simplificação trig, persistência,
norma simbólica, notação ↓↑.
