# Lições do ciclo v7 (toggle de convenção de ângulo rad↔turns + nota CP/CRz) — Fase 7

Lições sobre ESTE projeto. Insumo para o v8 (start_new_cycle).

## L1 — O MESMO ponto cego de render recorreu (3ª vez): KaTeX offline
Dois bugs de render passaram VERDES por toda a suíte Playwright porque o KaTeX (CDN) não carrega no
Playwright offline → o caminho LaTeX nunca é renderizado: (a) `1/8` dentro do expoente `e^{2πi·1/8}`
virava `\dfrac` (fração display-size num sobrescrito → estourava); (b) o kickback simbólico mostrava
`e^{iθ}` em vez de `e^{2πiθ}`. **Lição (3ª confirmação, após v6 L4):** TODA classe nova de string de
display precisa de uma asserção **Node** sobre `toKatex` (v7-8 cobre o expoente). Considerar
sistematizar: um teste que percorre exemplos de cada formato e valida o LaTeX (chaves balanceadas,
sem `\dfrac` em sobrescrito, sem `\sqrt \left`).

## L2 — Decisão "turns só concreto" (P1) refinada em P5 pelo uso real
A Fase 1 de-escopou o ângulo simbólico do turns (para manter o motor simbólico intocado) — decisão
prudente. Mas ao USAR, a inconsistência visual (`e^{iθ}` concreto-em-turns ao lado de `e^{2πi·…}`)
incomodou a usuária. A extensão (relabel `e^{iθ}→e^{2πiθ}` com **guard hasPi** contra `e^{2πi·2πθ}`)
foi segura e display-only. **Lição:** expectativas de CONSISTÊNCIA de display só aparecem no uso real;
decisões de-escopadas por risco podem ser refinadas quando a validação humana revela a lacuna — desde
que o refinamento seja registrado (não-silencioso) e tenha guard.

## L3 — Redundância de UI (prob/bars) só o usuário-do-domínio pega
A usuária notou, explorando, que `prob` e `bars` eram quase a mesma coisa (ambos = distribuição |amp|²
+ barras; diferiam só em apresentação/persistência/base). Consolidar no `prob`-toggle (visual do prob +
persistência do bars + base de exibição) simplificou a UI (1 conceito em vez de 2). **Lição:**
redundância de UI raramente aparece na spec; aparece quando um especialista exercita a ferramenta.

## L4 — Flag de modo no módulo (ANGLE_MODE) evitou threading invasivo
Passar `angleMode` por ~10 funções de render (renderState/factored/evidence/terms/blochReadout/…) seria
invasivo. Um flag de modo de exibição em Algebra (`ANGLE_MODE`, lido por `format`/`phaseLabel` via
`getAngleMode`) manteve o delta pequeno. Pequeno trade-off de pureza (Algebra ganhou estado de
exibição), justificado: é estratégia de FORMATAÇÃO (não DOM, não estado quântico). Default 'rad' ⇒
não-regressão por construção.

## L5 — Uma sessão longa acumulou 4 refinamentos de UI dirigidos pela usuária
Além do delta planejado (toggle de ângulo + nota CP/CRz), a validação manual gerou: 2 correções de
render (KaTeX), a consolidação prob/bars, e 2 swaps de tecla (Q↔CTRL, 2nd↔⌫). Todos AUTORIZADOS,
REGISTRADOS (record_decision) e TESTADOS — o método segurou (sem scope-creep silencioso). **Lição:** a
fase de validação humana é onde o polimento real acontece; a disciplina de registrar cada expansão de
escopo (AP9/AP10) é o que mantém isso rastreável em vez de virar deriva.

---
**Sementes p/ v8** (de specs/technical/13-v7-seeds.md, já consumidas as S1/S2 do v7): nenhuma pendente
explícita. Candidatos vivos: π/16 (ζ₃₂, QFT-5q); família λ_k=f(k); simplificação trig; persistência;
norma simbólica; ↓↑; sistematizar teste de toKatex (L1). **Sugestão process:** depositar um helper de
teste `assertValidKatex(str)` reusável no v8.
