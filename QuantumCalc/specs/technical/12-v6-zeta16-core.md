# v6 — Núcleo exato ζ₁₆ (π/8) · pesquisa técnica (Fase 0)

> Estende o núcleo ℤ[ω]=ℤ[ζ₈] (ω=e^{iπ/4}) do v1 para **ℤ[ζ₁₆]** (ζ=e^{iπ/8}), tornando
> EXATOS os circuitos de ângulo π/8. Caminho já antecipado em `01-exact-symbolic-core.md §1`
> (ℤ[ζ_{2^{m+1}}]). Refs: Giles–Selinger arXiv:1212.0506; Kliuchnikov–Maslov–Mosca.
> Escopo v6: **π/8 só** (ζ₁₆, grau 8). π/16 (ζ₃₂, grau 16) DE-ESCOPADO.

## 1. O anel ℤ[ζ₁₆]
- ζ = ζ₁₆ = e^{iπ/8}, raiz primitiva 16ª da unidade.
- Polinômio ciclotômico Φ₁₆(x) = **x⁸ + 1** ⇒ **ζ⁸ = −1** (grau 8 sobre ℚ).
- Base integral: {1, ζ, ζ², …, ζ⁷}. Elemento: u = Σ_{j=0}^{7} a_j ζ^j, a_j ∈ ℤ (BigInt).
- Amplitude com denominador √2 global: `amp = (Σ a_j ζ^j) / (√2)^k` (mesmo esquema do v1).

## 2. Aritmética exata (FATO, derivado de ζ⁸ = −1)
Seja u = (a₀,…,a₇).
- **Soma:** componente a componente.
- **× ζ (shift com wrap):** ζ·u = (−a₇, a₀, a₁, a₂, a₃, a₄, a₅, a₆). [pois ζ⁸=−1]
- **× geral:** convolução dos coeficientes mod (ζ⁸+1): produto polinomial grau ≤14, depois reduzir ζ^{8+r} = −ζ^r.
- **Conjugado complexo:** ζ̄ = ζ^{-1} = −ζ⁷. Em coeficientes: conj(u)₀ = a₀; conj(u)_k = −a_{8−k} para k=1..7. [análogo ao ζ₈: conj=(a,−d,−c,−b)]
- **√2 exato:** √2 = ζ² − ζ⁶. [e^{iπ/4} − e^{i3π/4} = √2 ✓]
- **cos(π/8) exato (surdo ANINHADO):** 2cos(π/8) = ζ + ζ^{-1} = **ζ − ζ⁷** = √(2+√2). sin(π/8) = (√2/2)·(ζ−ζ⁷ via rotação) → também em ℤ[ζ₁₆][1/√2]. ⇒ o que ℤ[ζ₈] NÃO expressava (√(2±√2)) agora é exato.

## 3. Embedding ℤ[ζ₈] ⊂ ℤ[ζ₁₆] (SEM REGRESSÃO)
ω = ζ₈ = ζ₁₆². Um elemento antigo (a₀+a₁ω+a₂ω²+a₃ω³) → (a₀ + a₁ζ² + a₂ζ⁴ + a₃ζ⁶): só potências PARES, coeficientes ímpares = 0. Logo todo estado/amplitude de v1–v5 é um caso particular exato em ℤ[ζ₁₆] → os 233 testes devem continuar verdes. √2 = ζ²−ζ⁶ coincide com a imagem de √2=ω−ω³.

## 4. O que passa a ser exato (gates / circuitos)
- **P(π/8) = diag(1, e^{iπ/8}) = √T** (relativa π/8). [Atenção à nomenclatura: T=diag(1,e^{iπ/4}) é a "π/8 gate" histórica, mas sua fase RELATIVA é π/4 — já exata em ζ₈. A fase π/8 verdadeira é √T.]
- **R_k da QFT:** R_k = diag(1, e^{2πi/2^k}) = diag(1, e^{iπ/2^{k-1}}). k=2→π/2 (S), k=3→π/4 (T), **k=4→π/8 (ζ₁₆, NOVO)**. ⇒ **QFT exata até 4 qubits** (antes: 3). k=5→π/16 fora do escopo.
- Entrada inline de ângulo (v2): θ = π/8, 3π/8, … passam a fechar EXATO em vez de cair no numérico.

## 5. Desafios de IMPLEMENTAÇÃO (não só a aritmética)
1. **DISPLAY de surdos aninhados:** `Algebra.format`/`matchSurd` hoje reconhecem `m + n√2` sobre 2^p. Para ζ₁₆ a magnitude pode ser √(2±√2) — `format` precisa exprimir radicais aninhados (ou exibir via cos/sin de π/8). DECISÃO de design (Fase 1): string de surdo aninhado vs notação e^{iπ/8}.
2. **recognizeAngle:** já reconhece múltiplos de π/8 como rótulo; verificar cobertura para múltiplos ímpares (π/8, 3π/8, 5π/8, 7π/8).
3. **recognize (numérico→exato):** estender `matchSurd` para detectar √(2±√2) ao reconhecer amplitudes numéricas (ex.: 0.9239→cos(π/8)).
4. **norm2 / sqrtRat:** a norma de uma amplitude ζ₁₆ pode envolver √(2±√2); revisar a extração de magnitude exata.
5. **Custo:** 8 BigInts por amplitude (vs 4). Vetor de 2^N amplitudes: dobra a memória do núcleo exato. N≤8–12 mantido.

## 6. Viabilidade
Tier 2 (portar algoritmo documentado). A estrutura de classe `Zomega` (mulOmega, conj, norm) generaliza para `Zeta16` (8 componentes). Sem lib externa, sem dependência nova, arquivo único/offline preservado. Risco concentrado no DISPLAY de surdos aninhados (M7/format), não na aritmética do anel (mecânica, derivada de ζ⁸=−1). Candidato a PoC: confirmar que QFT-4q fecha em ℤ[ζ₁₆] e que `format` produz uma string legível para √(2+√2)/2.

## 7. PoC executado (Fase 0) — VIABILIDADE CONFIRMADA
PoC Node standalone (não tocou no app): 13/14 (o 1 "fail" foi o recognizer simplificar `1/2` melhor que a asserção). Validado:
- **Anel** (classe `Z16`, 8 BigInts): ζ⁸=−1; √2=ζ²−ζ⁶; 2cos(π/8)=ζ−ζ⁷=√(2+√2); conj(ζ)=e^{-iπ/8}; embedding ω=ζ²=e^{iπ/4}.
- **Fechamento H+P(π/8):** |0⟩→H→P(π/8)→H = ((1+ζ)/2)|0⟩+((1−ζ)/2)|1⟩ exato (kickback π/8).
- **Format de surdo aninhado (RISCO):** `matchNestedSurd(r)` busca `r=√(p+q√2)/2^m` (m≤4, q∈[−8,8], p=round(s−q√2), s=r²·2^{2m}); renderiza. Acertou cos(π/8)=√(2+√2)/2, sin(π/8)=√(2−√2)/2, cos/sin(3π/8), 1/√2=√(2)/2, inteiros.
- **Conclusão:** Tier 2, sem bloqueador. O recognizer opera sobre r² (∈ ℤ[√2]) e ESTENDE `matchSurd` (que já casa m+n√2). Pronto p/ Fase 1.

## 8. Contrato M1 FINALIZADO (Fases 1–3) — o que implementar na Fase 5

**Arquitetura (P1):** SUBSTITUIR `Zomega`(4 BigInt) por `Zeta16`(8 BigInt) uniforme; valores ζ₈ embarcam como coeficientes de índice PAR (ω=ζ²). Caminho único, sem dual-type. Padrões herdados inalterados (Layered/Command/Strategy/Domain Model/imutável/núcleo puro). N≤12 mantido (memória ×2 trivial).

**8.1 Classe `Zeta16`** (porta o Z16 do PoC). u = (a₀..a₇), valor Σ aⱼζʲ, ζ=e^{iπ/8}, ζ⁸=−1.
- `add/sub`: componente a componente. `mulInt(n)`: escala.
- `mulZeta()` (×ζ, shift+wrap): (−a₇, a₀, a₁, a₂, a₃, a₄, a₅, a₆).
- `mul(o)`: convolução grau ≤14, reduzir ζ^{8+r}=−ζ^r.
- `conj()`: c₀=a₀; c_k=−a_{8−k} (k=1..7).
- `toComplex()`: Σ aⱼ·(cos jπ/8 + i sin jπ/8).
- Constantes base-8: `ONE=(1,0,0,0,0,0,0,0)`; `I=ζ⁴=(0,0,0,0,1,0,0,0)`; `OMEGA=ζ²=(0,0,1,0,0,0,0,0)`; `SQRT2=ζ²−ζ⁶=(0,0,1,0,0,0,−1,0)`.
- `reduceExact`: ÷2 quando todos os 8 coef pares (k≥2); ÷√2 via `mul(SQRT2)` divisível por 2 (k≥1).

**8.2 Migração de 4 call-sites EXTERNOS à M1** (aridade 4→8) — completar TODOS (omitir 1 = regressão silenciosa):
- `OMEGA7` (ω⁷=ζ¹⁴=−ζ⁶): `exact(new Zeta16(0,0,0,0,0,0,-1,0), 0)`.
- `NEG_INV_R2` (−1/√2): `exact(new Zeta16(-1,0,0,0,0,0,0,0), 1)`.
- `wpow(m)` (ω^m=ζ^{2m}): tabela de 8 potências → coeficiente de índice par 2m mod 16 (com sinal de ζ^{8+r}=−ζ^r).
- `surdToAmp(p,q,k)` (p+q√2 sobre √2^{2k}): `reduceExact(exact(new Zeta16(p,0,q,0,0,0,-q,0), 2*k))`.
- Testes: reescrever T-1 (core.test.mjs:167) na base de 8 comps; ADICIONAR T-1b ζ₁₆ (ζ⁸=−1, √2=ζ²−ζ⁶, 2cos π/8=ζ−ζ⁷, conj(ζ)=−ζ⁷, embedding ω=ζ²).

**8.3 Display — DECISÃO P3 (rect exato algébrico, base grau-4)** — SUPERSEDE a escolha P1 "surdo aninhado único":
- **rect**: `exactReIm` devolve Re/Im = `(m + n√2 + s√(2+√2) + t√(2−√2))/2^p` DIRETO dos 8 coef (m=racional; n de (a₂−a₆); s de (a₁−a₇); t de (a₃−a₅)). `realToStr` estende p/ renderizar a soma de 4 termos (omitir termos zero; ζ₈ ⇒ s=t=0 ⇒ saída IDÊNTICA ao v5). EXATO p/ toda amplitude π/8 (monômio E interferência, ex.: kickback Re=½+√(2+√2)/4). SEM reconhecimento numérico no display.
- **exp/polar**: exato só quando amplitude é monômio c·e^{ikπ/8} (|c| via `sqrtRatStr` ℤ[√2] + fase via `recognizeAngle`, que já cobre múltiplos de π/8); caso genuinamente ζ₃₂ (ex.: kickback tem mag/fase = π/16) → ≈approx (badge) ou exibir rect.
- **norm2/probabilidade**: z·z̄ exato no anel; reduz a fração quando RACIONAL (caso de medição comum; não-regressão ζ₈); grau-4 irracional → expressão exata base grau-4 ou numérico.
- **`matchNestedSurd`**: usado SÓ em `recognize` (entrada NUMÉRICA do usuário → exato), opera sobre r²∈ℤ[√2] reusando `matchSurd`, com re-verificação `toComplex`<1e-6 e janela limitada (m≤4, q∈[−8,8]) aceita. FORA do caminho de display (AP2: simplifica; elimina risco de falso-exato no display).

**8.4 Premissas/limites (P1–P2):** ζ⁸=−1 (Φ₁₆=x⁸+1); embedding ω=ζ² lossless ⇒ 233 testes mantêm VALORES; somas reais grau-4 de exp/polar genuinamente ζ₃₂ → ≈; tolerância recognize ~1e-7..1e-12 sem falso-exato (re-verificação obrigatória); KaTeX renderiza radical aninhado, offline degrada p/ Unicode. FORA DE ESCOPO: π/16/ζ₃₂.
