# v24 (ciclo 25) — lições · controle generalizado (CTRL) + potência 2ʲ (POW) + card E9

Entregue: CTRL antes de qualquer porta/preset → multi-controlado via `applyN`; token `j POW` → operador
aplicado 2ʲ vezes (cap j≤10); card E9 Quantum Counting (N=4/M=2/t=3, picos c={2,6}→M=2 exato); E5 (QPE)
refrescado p/ usar `2^j`. Suíte: **397 Node + 160 Playwright (100% verde)**. Motor ℤ[ζ₁₆]/matrizes/`applyN`
INTOCADOS — o delta foi 100% Parser + execute() + keypad + doc.

## Lições do projeto (não da metodologia)

1. **O `applyN` JÁ era o motor de multi-controle — o "bloqueio" era EXPOSIÇÃO no teclado, não capacidade.**
   O ciclo 24 descobriu que o motor computa controlled-Grover/H/CCZ corretamente via injeção de controle;
   o v24 só precisou (a) relaxar a aridade em `applyGate`, (b) rotear `apply` por `applyN` no `execute()`,
   (c) injetar controles em cada op de preset. Zero matriz/porta nova. CONFIRMADO por replay (não assumido).

2. **`POW` não compõe operadores COMPOSTOS.** `j POW` repete UM operador 2ʲ vezes. O operador de Grover
   G = oráculo·difusor é composto → POW não comprime G^{2ʲ} (oracle^{2ʲ}·diff^{2ʲ} ≠ (oracle·diff)^{2ʲ}).
   Por isso o E9 usa CTRL (controlled-Z + controlled-Grover) com iterações explícitas, e o POW achou seu
   lar natural no E5 (QPE de um operador ÚNICO: T → T²=S → T⁴=Z via `1 POW`/`2 POW`). Decisão de design
   genuína resolvida com a operadora na Fase 5.

3. **Omissão de G⁴=I é EXATA, não aproximação** (espelha Shor a=11 omitindo U²). Verificado empiricamente:
   omitir o controlled-G⁴ do qubit q0 preserva os picos {2,6} — porque G⁴=I (autovalores (±i)⁴=1) e a QFT†
   é não-local. Economiza teclas de verdade, MAS exige verificação por replay (não assumir).

4. **Relaxar aridade tem de ser ASSIMÉTRICO:** alvos ESTRITOS (`tg.length===m.targets`), controles só
   limite superior solto (`ct.length>=m.controls`). Isso habilita "acumular" (CNOT+1CTRL=CCX, X+2CTRL=MCX)
   SEM perder as mensagens de erro úteis (alvo errado / poucos controles). Mudança ADITIVA: 0 regressão na
   baseline (374+154), exceto 3 migrações INTENCIONAIS de forma de command em v9.test (+controls/power).

5. **Asserção de UI usa a forma FATORADA do display, não a expandida.** O teste key→tela do controlled-H
   falhou porque o visor mostra `|1⟩⊗((1/√2)|0⟩ + (1/√2)|1⟩)` (fatorado), enquanto o teste de motor usava
   a forma expandida `(1/√2)|10⟩ + (1/√2)|11⟩`. Ambas corretas; `#stateDisplay.dataset.plain` = vista
   fatorada. Lição capitalizada de ciclos anteriores (display deriva da fonte, mas a FORMA difere por vista).

## Decisões de design (Fase 1/3)
- A3 CTRL ACUMULA · A4 ALL+CTRL mutuamente exclusivos · A1 `j POW` operandos-first · POW em qualquer operador.
- CAP 2ʲ ≤ 1024 (j≤10) — protege a UI single-thread; POW repetido→último vence; POW sem dígito→erro.
- Guard: controle ∈ range do preset → erro 'control overlaps preset targets' (`validateRange` já barra ctrl==alvo por op).

## E9 — instância canônica (verificada por replay, anti-AP7)
N=4 (search q3,q4), M=2 (oráculo Z em q3), t=3 (counting q0,q1,q2). Circuito: SET 5 · ALL H · controlled-G¹
(q2: ctrl-Z + ctrl-Grover[3,4]) · controlled-G² (q1: 2 iterações) · q0→G⁴=I OMITIDO · QFT† q0..q2. Estado
final exato em ℤ[ζ₁₆] (8 termos, fases e^{iπ/4}); picos c={2,6} P=½ → φ∈{¼,¾} → M=N·sin²(πφ)=2.
Ref: N&C §6.3; Brassard-Høyer-Mosca-Tapp 2002 (arXiv:quant-ph/0005055).
