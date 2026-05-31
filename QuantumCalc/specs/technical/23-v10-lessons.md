# Lições do ciclo v10 — organização + consolidação de docs + tradução EN + PWA

> Ciclo entregue: Help removido · manual.html consolidado (Parte I Referência + Parte II Cookbook) ·
> produto 100% EN · PWA (manifest + service worker + ícone). 339 testes verdes (252 Node + 87 Playwright).
> Publicado em https://jasminemoreira.com.br/quantum/. Engine ζ₁₆/portas/presets/simbólico INTOCADO.

## 1. C1 (perda de conteúdo) resolvido por DISCIPLINA DE SEQUÊNCIA, não por componente novo
A consolidação fazia o gerador (`examples-render`) emitir `manual.html`, que SOBRESCREVE o `manual.html`
hand-authored. Extrair a referência §1–13 PARA DENTRO do `examples-render.mjs` (como `REFERENCE_HTML` estático)
ANTES de qualquer geração eliminou o risco — sem git-recovery, sem componente. Lição: alguns 🔴 de migração
são resolvidos por ORDEM de operações, não por código.

## 2. Reordenação responsiva do teclado: `display:contents` + grid `order` por classe de slug
A forma mais limpa de reempilhar/parear os blocos no mobile SEM mexer no DOM/JS do `renderKeypad` foi:
`display:contents` nas colunas (promove os painéis a itens de grid) + `order`/`grid-column` por classe
`zone-<slug>` (o slug derivado do `label` do grupo). Escopo por modo via classe no `#keypad`
(`mode-quantum`/`layer2`/`mode-calc`). **Armadilhas:** (a) o base `align-items:flex-start` causou
shrink-to-fit (blocos espremidos à esquerda) ao virar coluna — precisou `stretch`/`grid-column` explícito;
(b) o slug deriva do LABEL humano → renomear o label ("GATES") quebra silenciosamente o vínculo label→slug→CSS.
**Lição:** se um hook de CSS deriva de texto user-facing, mantenha label↔slug↔seletor sincronizados (ou use
uma `key` explícita no grupo).

## 3. PWA cache-first exige BUMP de cache a cada deploy
O service worker é cache-first → usuários que já visitaram continuam vendo o app ANTIGO até o nome do
`CACHE` mudar (o `activate` purga o antigo). Toda republicação de arquivo alterado PRECISA de bump
(`qcalc-v10-N`), senão PWAs instaladas nunca atualizam. (10 bumps no ciclo de polimento.)

## 4. Tradução: strings setadas em JS escapam de varreduras ingênuas
O rótulo do toggle de tema ('escuro'/'claro') era setado em JS (`toggleTheme.textContent`) e escapou tanto
da varredura inicial quanto do catch-all de ACENTO (palavra sem acento). **Lição:** strings user-facing
DINÂMICAS (atribuídas em runtime) são as mais fáceis de perder; o guard `no-pt-leak` precisa de
(strip de comentários) + (tokens-âncora) + (catch-all de acento Latin) E ainda assim exige varrer
`.textContent =`/`createTextNode`/`out()` manualmente.

## 5. Regras de formatação do render precisam de cobertura SIMÉTRICA
`Render.toKatex` renderizava `1/2` como `\dfrac` (vertical) mas `i/2` inline — a regex de fração só casava
numerador `\d+`. Achado em teste manual. **Lição:** quando o render trata padrões caso-a-caso (fração por
tipo de numerador), cada variante (i, N·i, √…·i) precisa de regra própria, ou a inconsistência aparece em
estados específicos.

## 6. ASSUNÇÃO ERRADA do P0/P2: ergonomia mobile foi subestimada
As lentes da Fase 2 do v10 focaram em SW/tradução/migração; a USABILIDADE do teclado em tela de celular não
teve lente própria. Resultado: a PWA "funcionava" mas era inviável ergonomicamente, exigindo **8 rodadas**
de ajuste de layout em teste manual (display pela metade, fontes, reordenação por prioridade, grade 4-col,
tiras de 1-col, pareamento, rótulos curtos). **Lição p/ v11:** se há entrega mobile/PWA, ativar uma lente
**Mobile-UX/thumb-zone** já na Fase 2 (alvos ≥44px, essencial acima da dobra, larguras de coluna por
contagem de colunas internas vs comprimento de rótulo).

## Pendências carregadas p/ v11 (ver [21-v10-seed] decisão de escopo)
- Forma MATRICIAL no `fmt` (vetor-coluna 2^N na base ativa; só concreto) — feature NOVA, deferida ao v11.
- Pesquisar/incorporar outras operações/views interessantes (pedido original do P0).
