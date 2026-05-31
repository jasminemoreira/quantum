# v2 — Avaliador de Expressões, Ponte Estado→Calc, Bloch & Teclado (pesquisa técnica)

> Ciclo v2. O domínio científico quântico é REUSADO do v1 (Giles–Selinger ℤ[ω],
> Nielsen–Chuang) — ver specs/technical/01–03 e references/bibliography.md.
> Aqui só os mecanismos NOVOS do delta, com referência.

## 1. Avaliador de expressões (calc científica) — Tier 2
- **Parsing:** Shunting-yard (Dijkstra, 1961) infixo→RPN, depois avaliação da pilha RPN.
  Algoritmo clássico documentado; suporta precedência, parênteses, funções unárias.
  Ref: Dijkstra, *Algol-60 translation* (1961); Wikipedia "Shunting-yard algorithm".
- **Domínio numérico:** COMPLEXO `a+bi`. Valor = reaproveita o tipo `Amp` do v1
  (exato em ℤ[ω]/surd quando o resultado fecha nesse anel: inteiros, frações, ±√2,
  múltiplos de π via fase ω^k, i) e cai para `numeric {re,im,approx}` em funções
  transcendentes de argumento arbitrário (sin/cos/tan/log/exp/√ de não-quadrado).
- **Operadores/funções:** `+ − × ÷ ^`, unário `−`, `√`, `sin cos tan`, `exp ln log`,
  constantes `π e i`, `1/√2`. Exatos quando o argumento é notável (ex.: `cos(π/4)=1/√2`
  via recognize); senão numérico sinalizado. Reusa `Algebra.recognize`/`matchSurd`.
- **Divisão exata:** para manter exatidão, divisão por inteiro/√2/ω^k é fechada em
  ℤ[ω] (multiplicação pelo inverso da unidade + ajuste de k); divisão geral → numérico.

## 2. Ponte Estado→Calc — Tier 1 (reusa M5 Ops do v1)
Valores do estado atual referenciáveis em expressões (sintaxe a fixar na Fase 1):
- `norm` / `⟨ψ|ψ⟩` → `Ops.norm` (surd exato).
- `amp[bits]` → amplitude do índice de base (Amp exato/numérico). Ex.: `amp[01]`.
- `P(bits)` → `Algebra.norm2` da amplitude (fração/surd exato). Ex.: `P(11)`.
- `⟨ψ|O|ψ⟩` para O ∈ {X,Y,Z} num qubit → valor esperado de Pauli.
  Fórmula: ⟨O⟩ = Σ_ij ψ_i* O_ij ψ_j (Nielsen–Chuang §2.2.5); exato em ℤ[ω].
  Implementação: aplicar O ao estado (Engine) e fazer ⟨ψ|Oψ⟩ via Ops.inner.

## 3. Esfera de Bloch (Canvas 2D) — Tier 1
- Vetor de Bloch (x,y,z) do qubit selecionado já é computado no v1
  (`Ops.blochVector` via ρ reduzida 2×2; ⟨σx⟩,⟨σy⟩,⟨σz⟩, |r|≤1).
- Render: projeção ortográfica/isométrica simples do vetor 3D em Canvas 2D
  (eixos x,y,z + ponto na esfera + meridianos). Sem libs; ~uma função de desenho.
  Estado misto/emaranhado → |r|<1 (ponto interno), sinalizado.

## 4. Teclado único + 2nd/SHIFT + Modo — Tier 1 (UX convention)
- Padrão de calculadora científica HP/TI: tecla com função PRIMÁRIA + função
  SECUNDÁRIA exposta por uma tecla modificadora ('2nd'/SHIFT). Sem base científica;
  é convenção de UX consolidada. Substitui o menu lateral por abas do v1.
- **Modo** (quântico ↔ calculadora) remapeia o significado das teclas; o estado
  quântico e o histórico são preservados entre trocas de modo.
- Mapa exato (camada primária vs 2nd por modo) = decisão da Fase 1 (arquitetura).

## Veredito de viabilidade
Tudo viável em arquivo único HTML/JS offline, sem novas dependências, reusando o
núcleo do v1. Nenhum Tier 3. Nenhum bloqueio técnico.
