# v19 — Lições (condense concreto + DENOM_ALT + UX expand display)

Ciclo 20, Versus P0→P7 em Opus, sessão única. Escopo entregue em 3 frentes:
**F1** condense concreto (`Render._condenseConcrete` espelhando v18 simbólico — Bell `(1/√2)|00⟩+(1/√2)|11⟩` → `(|00⟩+|11⟩)/√2` etc.), **F2** const `DENOM_ALT_SRC` (DRY para a alternation de denom limpo, capitalizando lição v18-L3), **F3** nova UX do display (F3a setas laterais ◀▶ substituem dots/tap-anywhere; F3b seta inferior ▼/▲ expande o display ocultando 4 zones do teclado — kets/gates/gate-variants/2-qubits). 428 testes verdes (320 Node + 108 PW), 0 padrão/módulo novo. Polish F3 = **16 deploys live** com a operadora — 16 lições anotadas abaixo.

## L1 — Threshold de termos para condense de display (anti-overflow KaTeX)
Operadora rodou ALL H em 4 qubits ao vivo; F1 condensou 16 termos num único numerador horizontal do `\dfrac` (KaTeX não quebra linha em fração), gerando scroll horizontal ilegível. Testes automated v19-1..v19-13 todos com ≤4 termos nunca exercitaram many-term states. **Fix:** `MAX_CONCRETE_CONDENSE_TERMS = 4` no predicado. **Lição reusável:** predicado de display precisa de limite de tamanho/wraping além de correção matemática. **5ª recorrência da meta-L** "human-AV pega o que automated não pega" (v17-L1, v18-L1, v18-bilateral-bug em P5, v19-L1, v19-L11/L20 abaixo).

## L2 — Contrato bilateral entre predicado e render-target
O predicado de `_condenseConcrete` valida `denText` em `'rect'`; a primeira versão renderizava o denominador com `fmt` do usuário. Em `exp` mode `A.format(√2,'exp').text→'1.41421'` numérico (já era a lição v18-L1, agora aplicada também ao concreto). **Princípio:** quando dois pontos formam um contrato (validador + emissor), use a MESMA representação dos dois lados.

## L3 — DRY informal capitalizado: `DENOM_ALT_SRC` como const única
Lição v18-L3 ("seria DRY extrair") agora capitalizada: a alternation `(\d+√\d+|√\d+|\d+)` mora em **uma** const no top-level do `<script>`, consumida por 4 sites via `new RegExp(prefix + DENOM_ALT_SRC, 'g')`: toKatex digit-frac, toKatex regra v18, SymExpr.condense step 6, e agora `_condenseConcrete` step 6. Anti-drift garantido quando o conjunto crescer (ex.: futuros denominadores grau-4).

## L4 — Display height fixo é DELIBERADO (bug Chromium 100dvh no PWA reload)
Tentei sobrescrever `.display{height:560px}` em modo expandido via CSS estática; a operadora alertou que `height:340/172` é deliberado p/ resolver bug de Chromium standalone (100dvh vem errado após reload até um evento de geometria). **Fix correto:** ajuste DINÂMICO em JS no toggle (mede `keypad.offsetHeight` antes/depois, soma a diferença ao display via inline style). Mantém o invariante do reload. **Lição:** invariantes do código atual têm history não-óbvia; antes de "consertar" CSS antiga, perguntar PORQUE ela é assim.

## L5 — Botão SVG via `border-trick` precisa de wrapper clicável
A seta-de-baixo `.disp-arrow-bottom` era um `<button>` com bordas formando triângulo (width:0; height:0; border-top:7px solid). Área clicável: 0×0. Setas laterais funcionavam porque ficavam DENTRO de `.disp-edge-left/right` (22px wide). **Fix:** envolver o triângulo numa `<span>` interna com botão 22×14px clicável. **Princípio:** elementos sem dimensão (border-trick) não recebem cliques diretamente — precisam de parent dimensionado.

## L6 — ResizeObserver no SCROLL CONTAINER, não no elemento que cresce livre
Primeira versão observava `#stateDisplay` (cresce livre dentro do `.disp-scroll`) — `scrollHeight ≡ clientHeight`, observer nunca disparava. **Fix:** observar `.disp-scroll` (overflow:auto fixed-size flex container); o overflow real mora lá. **Princípio:** para detectar overflow vertical/horizontal, observe o CONTAINER de fixed-size, não o conteúdo que pode crescer.

## L7 — `transition: max-height` é FUNDAMENTALMENTE QUEBRADO para layout sync
`max-height` transiciona linearmente, mas o tamanho REAL é `min(natural, max-height)`. Quando max-height vai de 500 → 0 e natural=150, a primeira metade da animação (max-height 500→150) tem ZERO mudança visual. Resultado: display cresce simultaneamente mas zones ficam paradas → app cresce momentaneamente → salto visível. **Fix:** usar `height` real (JS captura natural pré-toggle, CSS transiciona linear natural→0). Mas então a class precisa de `!important` p/ vencer o inline `style.height = naturalpx` (especificidade inline > class). **Lições combinadas:** `max-height` só serve quando você não precisa de sincronia de layout; `!important` é necessário quando você mistura inline-style com CSS-class.

## L8 — `applyExpand` vs `toggleExpand`: separar affordance de mutação
O ResizeObserver chamava `applyExpand`, que internamente re-media e re-setava `disp.style.height`. Quando o display começava a crescer e o observer disparava (mudança em `_overflowing`), `applyExpand` rodava com `_expanded=true`, re-media as zones (já colapsadas → freed=0), e re-setava `disp.style.height = current animatedHeight + 0`, congelando a animação. **Fix:** dividir em duas funções — `applyExpand` só atualiza affordance da seta; `toggleExpand` faz a mutação real e é chamada SÓ pelo gesto. **Princípio:** quando um observer pode disparar reentry, separe leitura/affordance (idempotente) de mutação (one-shot).

## L9 — `fitViewport` resetando inline-height durante animação
fitViewport rodava em `window.resize` (disparado por toda mudança de layout, incluindo animação F3b), e LIMPAVA `disp.style.height = ''`. Display começava a expandir → resize → fitViewport limpa → display contrai. **Fix:** `if (_expanded) return` no topo do fitViewport. **Lição:** funções globais que mexem em propriedades devem respeitar estados UI que também mexem nas mesmas propriedades — coordene via guard.

## L10 — Lock `#app.style.height` cobre desync residual
Mesmo com as 4 transitions sincronizadas (display height + zones height + zones opacity + zones padding/margin todas em `cubic-bezier(.4,0,.2,1)`), sobravam ~3-4px de jump devido a sub-pixel rounding entre `getBoundingClientRect` (float) e `offsetHeight` (integer), ou a gaps do grid não totalmente contabilizados no `freed`. **Fix:** travar `app.style.height = app.offsetHeight + 'px'` durante a transição (.27s timeout), liberar depois. A borda inferior fica estável mesmo com micro-jump interno. **Princípio:** quando precisão sub-pixel é inviável, locks externos absorvem o erro.

## L11 — Salvar inline-height pré-expand é necessário no PWA (fitViewport interage)
No PWA standalone, fitViewport setou `disp.style.height = '400px'` (dinâmico). Ao colapsar com `disp.style.height = ''`, o display caía pra CSS estática 172px (menor que original). **Fix:** `_preExpandDispH = disp.style.height` antes de sobrescrever; restaurar no collapse. **Princípio:** ao tomar controle temporário de uma propriedade, salve o estado anterior para restaurar — não assuma que limpar inline volta ao "valor esperado".

## L12 — `padding` reservando espaço para affordances deve ser FINO
Primeira versão dos panes do display tinha `padding-left/right: 17px` p/ reservar espaço pras setas laterais. Operadora notou que o texto ficava denso (mais quebras de linha). As setas têm só ~7px visualmente; 17px era reserva excessiva. **Fix:** padding 10px. **Princípio:** reservar espaço pra affordances tem custo de largura útil; use o mínimo necessário (largura do elemento visual + 1-2px de respiro).

## L13 — Pré-cálculo no load NÃO é melhor que medição no toggle (neste caso)
Tentei pré-capturar `_keypadFreed` e `_zoneNaturalH` no load e em resize, usando-os no toggle (sub-pixel via `getBoundingClientRect`). Resultado: PIOROU em PWA e web ("pula tanto no PWA quanto na web"). Causa provável: race condition entre captures, ou layout não-estabilizado no momento das medições iniciais (mesmo com setTimeout 200/600/1500ms). **Lição:** medições inline-toggle têm vantagem do "estado atual EXATO no momento da ação"; pré-cálculos são vulneráveis a drift do layout. **REVERTIDO no v19-10**, ficando com o flip-flop no toggleExpand mesmo (3-4px aceitável).

## L14 — Operadora prefere unificar comportamentos sobre branches custom
Operadora notou que PWA já tem fluid height (`fitViewport` setando dinamicamente) e perguntou: "se funciona, por que não usar PWA mode para tudo?". Resposta: ungate `fitViewport` para rodar no desktop browser também. Mudança simples (1 linha de condição), efeito grande: display fills viewport em qualquer modo, full-HD não tem mais calculadora pequena no meio. **Princípio:** unificar comportamentos > manter modos paralelos. Se uma branch já resolve um problema, considere se a outra branch precisa da diferença.

## L15 — Transições `height: auto` não funcionam — precisa value explícito
Para o collapse animar de `0 → natural`, a CSS precisa de UM VALOR DE HEIGHT EXPLÍCITO. Setei `z.style.height = natural_px` no expand step ANTES do classList.add (ainda visível, transitions off momentaneamente). Quando classList.remove no collapse, body rule sai → zone fica com inline `naturalpx` → transition de 0 (computed) → naturalpx. Depois de 270ms, limpar inline → layout natural. **Lição:** browsers não animam de/para `auto`; quando precisar de transição até "tamanho natural", você precisa capturar e setar pixels explícitos.

## L16 — Scrollbar da PÁGINA escondida elimina jump de layout
Display expand fazia o body crescer 1-2px (sub-pixel ou padding), o que reservava espaço para uma scrollbar da página → conteúdo deslocava ~15px horizontalmente. **Fix:** `html, body { scrollbar-width: none; -ms-overflow-style: none } html::-webkit-scrollbar, body::-webkit-scrollbar { display: none }` — scroll funciona (wheel/touch), só o tracker não aparece. **Princípio:** scrollbars overlay (Mac) não causam isso; scrollbars classic (Win/Linux) sim. Esconder é UX padrão pra apps imersivos.

## L22 — iOS Safari browser tem o bug do baseline; iOS PWA standalone NÃO

Operadora pediu uma tentativa de fix para o bug histórico (KaTeX #2931, WebKit Bugzilla #207754) de `\dfrac` renderizar com baseline-rounding errado no Safari iOS. Leonardo (validador externo) fez 7 rodadas live no iPhone real, todas via WhatsApp. Sequência:

1. **Hipótese inicial (operadora):** "no Safari, usar inline" → implementei `\dfrac → \tfrac` (textstyle) só no iOS via UA detect. **Falhou**: `\tfrac` reduziu o tamanho da fração mas baseline ainda errado.
2. **Tentativa 2:** CSS hack `.katex .mfrac { vertical-align: -0.18em }` via `@supports (-webkit-touch-callout:none)`. **Falhou**: @supports não foi específico o bastante OU CSS do KaTeX venceu por especificidade.
3. **Tentativa 3:** JS detect → `body.ios-webkit` class + `!important` na regra, offset bumped para -0.35em. **Funcionou parcialmente**: fração agora alinhada com os kets, mas radical `\sqrt` cruzando o travessão da fração.
4. **Tentativa 4-6:** ajustar `.sqrt` translateY iterativamente — 0.10em (em cima), 0.18em (desceu demais), 0.14em (perfeito no browser). 
5. **Tentativa 7 (Leonardo):** "No PWA fica diferente do browser." → revisei a história: **antes do v19-19 (quando os hacks iOS começaram), Leonardo havia validado PWA várias vezes como "perfeito"**. Os hacks tinham QUEBRADO o PWA que já estava OK.
6. **Confirmação:** envolvi os hacks iOS em `body.ios-webkit:not(in standalone)` — `@media (display-mode:standalone)` desativa todos os hacks no PWA, voltando ao `\dfrac` default. **Funcionou: ambos browser E PWA agora corretos**.

**Lições reusáveis:**
- **iOS Safari browser e iOS PWA standalone renderizam KaTeX DIFERENTE.** O baseline-rounding bug do WebKit afeta APENAS o Safari browser; o webview de PWA standalone usa um path de rendering distinto que não tem o bug. Aprendizado contraintuitivo (mesmo motor, comportamentos diferentes).
- **Quando aplicar fix UA-based: verifique seu impacto em ambos os modos** (browser + standalone). Não assuma simetria.
- **Sequência de bug + fix iterativo via validador externo (Leonardo, 7 rodadas WhatsApp) funcionou** porque o operador-AI tinha hipóteses concretas em cada rodada e o validador respondia com palavras-chave precisas ("perfeito"/"alto"/"baixo"/"cruzando"). Sem device, é o jeito.
- **Recorrência meta-L:** 6ª vez human-AV pega o que automated não pega (v17/v18/v18-P5/v19-L1/v19-L11-L20/v19-L22). Aqui literalmente NENHUM teste pegou; só Leonardo no iPhone real.

CSS final aplicado (linhas ~159-170):
```css
body.ios-webkit .katex .mfrac{vertical-align:-0.45em !important}
body.ios-webkit .katex .mfrac .sqrt{transform:translateY(0.14em) !important}
@media (display-mode:standalone){
  body.ios-webkit .katex .mfrac{vertical-align:baseline !important}
  body.ios-webkit .katex .mfrac .sqrt{transform:none !important}
}
```

JS: `\dfrac→\tfrac` em `toKatex` só quando `_isIOSWebKit && !matchMedia('(display-mode:standalone)').matches`.

## Carry-forward → v20 (não iniciado)
- `CU(λ)` ergonômico / `EV multi-qubit ⟨Z₀Z₁⟩` — agora **7 ciclos adiado** (v13/14/16/17/18/19). Vira top-of-mind se for retomado.
- iOS KaTeX baseline fix (radar; sem device).
- Possíveis F3 v2: animação MUITO mais polida via FLIP (capturando rects pré/pós e animando via transform — mais complexo, custo certo, ganho perceptivo dúbio dado os 3-4px atuais).
- Scrollbar customizada estilizada (em vez de escondida) — opção dual de design.
- Persistência: salvar `_expanded` em `localStorage` para sobreviver reload.
