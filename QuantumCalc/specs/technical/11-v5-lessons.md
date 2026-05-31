# v5 — Lições do ciclo (pós-revisão, Fase 7)

Ciclo v5 = delta PURAMENTE ESTÉTICO no display do `quantum_calc.html` (3 ajustes). Sem tocar no motor.
Suíte: 233/233 (173 Node + 60 Playwright = 218 do v4 intactos + 15 novos v5). Critérios em `specs/validation/acceptance.md §v5` (V5-1..V5-6).

## O que entrou
1. **Buffer (#statusLine) ~50% maior**: 12.5px → 18.75px; min-height 18→27px.
2. **Frações sem sobreposição ao quebrar linha**: `#stateDisplay` line-height 1.6 → **3.4**.
3. **Esfera de Bloch — legenda mínima**: removidos a caption "esfera de Bloch ·", o botão ✕ e o readout `|r|` desenhado no canvas. Mantidos: rótulo `Q{n}` **reposicionado no canto superior direito** (ao lado da esfera, `position:absolute`) + o **valor do qubit** `α|0⟩+β|1⟩` no fmt atual, **abaixo** da esfera.

## Lições

### 1. O `\dfrac` do KaTeX TRANSBORDA a própria caixa — line-height fixo é traiçoeiro
A colisão das frações ao quebrar linha NÃO se resolve com um line-height "do tamanho da fração". Medição em runtime: com line-height 2.8 (=70px) o *pitch* entre linhas era 71px e a caixa (`.mfrac`) media só 35px — porém visualmente as linhas ainda pareciam **grudadas**, porque o traço da fração e o `√` do denominador (`1/(2√2)`) renderizam para FORA da bounding box medida. **A caixa mente.** Convergência só por **iteração ao vivo no navegador real** (1.85→2.2→2.8→**3.4**), olho humano. Lição: para `\dfrac` inline que quebra, dimensione o line-height pelo PIOR caso (denominador com √ aninhado) + validação visual, não pela caixa medida. Alternativa mais robusta (decoplar espaçamento da altura do conteúdo: renderizar cada termo como item flex com `row-gap`) foi considerada e **adiada** por ser invasiva no render (mudaria o caminho de render de string única do KaTeX; risco de regressão) — AP2.

### 2. Valor de 1 qubit a partir do vetor de Bloch, sem mudar o motor
`Render.blochReadout(v,fmt)`: reconstrói `|ψ⟩=cos(θ/2)|0⟩+e^{iφ}sin(θ/2)|1⟩` (Nielsen-Chuang §1.2; θ=acos(z), φ=atan2(y,x)) como **leitura numérica** do mesmo vetor que desenha a seta, e reusa `Algebra.recognize` → casos cardeais (|0⟩,|1⟩,|±⟩,|i⟩) saem **exatos**; `Algebra.format(amp,fmt)` casa o formato com o display; `Render.dirac` compõe (dropa termo zero via `isZeroAmp`, coef "1" → ket nu). `|r|<0.999` (mesmo limiar de `Bloch.render`) → `mixed · |r|=…`. Zero mudança de núcleo.

### 3. Reusar o `dirac`/`format` do próprio display dá consistência de graça
O valor da Bloch herda as convenções do visor principal (inclusive o quirk do polar `(1, 0)|0⟩`) porque compartilha o mesmo compositor. Não especializar — reusar evita divergência e código novo.

### 4. Mesmo um delta "só estético" se beneficiou dos gates
- Lente **Migration** (Fase 2) pegou que os testes asseguram os ids `#blochInline/#blochCanvas/#blochLabel` (+texto `Q{n}`): preservá-los manteve os 218 verdes ENQUANTO removia caption/✕.
- **Human-AV** (P5/P6) pegou o que nenhum teste automático pegaria: o espaçamento das frações. O teste V5-2 só assere o VALOR CSS (85px); a NÃO-colisão visual é juízo humano. AP5 na prática, de novo.

### 5. PROCESSO: a usuária (Claude Code no VSCode) NÃO vê imagens que eu abro via Read
Screenshots de Playwright lidos pela ferramenta entram só no MEU contexto — não são renderizados no chat dela. Pedir "veja o screenshot acima" não funcionou e causou confusão no loop de line-height. Correção: dar **caminho de arquivo PNG clicável** (o VSCode abre no editor) e/ou pedir para ela abrir o **app real**. Não assumir paridade de visão.

## Semente PRINCIPAL para o próximo ciclo (v6) — núcleo ζ₁₆ (π/8 e π/16 exatos)
Decidido com a usuária ao fim do v5: o próximo ciclo é o **motor ζ₁₆**, de-escopado desde o v4 (§7 de `10-v4-lessons.md`).
- **Hoje:** núcleo = ℤ[ω], ω=e^{iπ/4}=ζ₈ → fase sempre múltipla de **π/4**; cobre Clifford+T exato. π/8, π/16 caem em **fallback numérico** (flag `≈ approximate`).
- **Por quê falta:** `cos(π/8)=√(2+√2)/2` é surdo ANINHADO, fora de ℤ[ζ₈]; só existe em ℤ[ζ₁₆]. π/16 precisa de ℤ[ζ₃₂].
- **Escada ciclotômica:** ζ₄(π/2) ⊂ ζ₈(π/4, atual) ⊂ ζ₁₆(π/8) ⊂ ζ₃₂(π/16). Como ζ₈ é subanel de ζ₁₆ (ω=ζ₁₆²), os valores atuais embarcam → **sem regressão**.
- **Onde importa:** QFT de **4 qubits** usa π/8; de **5 qubits**, π/16 (portas de fase controlada 2π/2^k). Hoje a QFT é exata só até 3 qubits. Também QPE com mais bits e portas R_k de ordem alta.
- **Magnitude:** estender ℤ[ζ₈] (4 componentes) → ℤ[ζ₁₆] (8 componentes, base {1,ζ,…,ζ⁷}; ζ₁₆⁸=−1, √2=ζ₁₆²−ζ₁₆⁶). Extensão de motor real porém limitada; a spec `01-exact-symbolic-core.md §1` já previu o caminho (ℤ[ζ_{2^{m+1}}]). Decisão de escopo do v6: π/8 só, ou π/8+π/16 (ζ₃₂)?
