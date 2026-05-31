# v4 — Lições do ciclo (pós-revisão, Fase 7)

Insumo para um eventual ciclo futuro (`start_new_cycle`). Lições sobre ESTE projeto, não sobre a metodologia.

## 1. O ket abstrato |ψ⟩ tem DOIS papéis (mecanismos distintos)
- **Autoestado opaco** (kickback/QPE): `U|ψ⟩=λ|ψ⟩`, λ declarado inline; `|ψ⟩` NUNCA expande; usado como ALVO de porta controlada.
- **Qubit genérico desconhecido** (teletransporte/teste de Hadamard): `|ψ⟩=ψ₀|0⟩+ψ₁|1⟩`; EXPANDE quando usado como CONTROLE.
- A regra de despacho "alvo → autovalor/nó · controle → expande" resolve os dois sem ambiguidade. **Só apareceu na validação** — o P0/P1 previam apenas o kickback (alvo). O caso âncora (teletransporte) forçou o controle abstrato.

## 2. Medida parcial simbólica sem CAS de norma
Renormalizar por `1/√P` com `P` diádico (½→√2, ¼→2) via `recognize` mantém exatidão. As amplitudes simbólicas (ψ₀,ψ₁) tratadas como **base unitária** no PESO da amostragem dão probabilidades corretas para os protocolos (teletransporte) sem precisar de norma simbólica/`⟨ψ|ψ⟩`.

## 3. Render LaTeX: transform por-string UNIFICA tudo
`Render.toKatex(dirac)` (Unicode→LaTeX) cobre TODAS as formas (concreto, simbólico, `⊗`, nós) — mais robusto que geradores `tex` separados. No design original o `⊗` derrubava o KaTeX (caía em texto). Fração vertical (`\dfrac`), remoção de parênteses de coef não-soma e `\left…\right` só fizeram sentido **depois** de unificar o render.

## 4. Forma fatorada deve ser POSICIONAL
Fatorar "fixos à frente" REORDENA os qubits e confunde (aplicar porta "trocava" qubits de lugar no display). Fatorar só os fixos nas BORDAS (e deixar fixos intercalados na soma) preserva a ordem de inserção. Lição de UX que só emergiu no uso real.

## 5. A validação HUMANA pegou o que os testes não pegaram (AP5 na prática)
A maioria dos bugs e melhorias emergiu do teste exploratório ao vivo da especialista, não da suíte: ordem de qubits, buffer da calc pós-`=`, reaplicação silenciosa de regra, KaTeX/`⊗`, prob/medir. Testes automatizados pegam a ÁLGEBRA (exatidão ℤ[ω], estados); o humano pega USABILIDADE, ordem e render. O loop "implementa→screenshot→ajusta" foi muito eficaz para o redesenho visual.

## 6. Escopo negativo de um delta pode virar escopo positivo
"Sem controle abstrato" e "sem medição sobre simbólico" (negative scope v4) foram REVERTIDOS (autorizados pela usuária) porque o teletransporte exige ambos. A fronteira "mínima" do delta era estreita demais para os protocolos canônicos — um caso de uso âncora pode exigir o que o delta inicial excluiu.

## 7. Candidatos para um próximo ciclo (não implementados)
- Família indexada de autovalores `λ_k=f(k)` (QPE multi-qubit completo) — de-escopada no P0/P3.
- Norma/`⟨ψ|φ⟩`/medição na base arbitrária sobre estados simbólicos com fatores abstratos DIFERENTES entre termos.
- Reconhecimento/simplificação opcional (ex.: `½+½e^{iθ} = e^{iθ/2}cos(θ/2)`) — hoje a simplificação é mínima de propósito.
- Núcleo ζ₁₆ (π/8 exato), notação ↓↑, persistência opcional (localStorage) do tema/estado.
