# v10 — Arquitetura: organização + consolidação de docs + tradução EN + PWA

> Fase 1 do ciclo v10. Baseline: [21-v10-seed.md](21-v10-seed.md). Delta completo (4 frentes num ciclo).
> Motor ζ₁₆/portas/presets/simbólico INTOCADO. Não regredir os 335 testes (atualizando asserções PT→EN).

## Frente 1 — Remover o colapsável "Help" da calculadora
`quantum_calc.html` rodapé tem dois `<details>`: **"Step history"** (historyOut — MANTÉM) e
**"Help — input grammar"** (~linhas 202–225 — REMOVER; duplica o manual). O link `📖 manual ↗` (header,
~linha 172) permanece. Nada além desse bloco muda na frente 1.

## Frente 2 — Consolidar docs num único `manual.html`
- Estrutura (escolha da usuária): **Parte I Referência** (ex-`manual.html` §1–13) **→ Parte II Cookbook**
  (26 exemplos, 3 tiers), com **TOC unificado**.
- `examples.html` é gerado por `examples.spec.js`→`examples-render.mjs` a partir de `examples-data.mjs`.
  v10: `examples-render.mjs` ganha `renderManual(examples, referenceSections)` que emite o doc consolidado;
  as **seções de referência** entram como **HTML estático** no render (são prosa, não capturas); os
  **exemplos** seguem DOM-driven (capturados da tela real).
- `examples.spec.js`: muda o output para **`manual.html`**; asserções de estrutura passam a checar Parte I
  + Parte II; `examples.html` é removido. Links nos docs/app apontam só p/ `manual.html` (já é o caso da
  interface; o antigo `manual.html`→`examples.html` deixa de existir pois viram um só).
- O antigo `manual.html` (referência à mão) é absorvido no template do render; o arquivo final `manual.html`
  passa a ser o GERADO. (Conferir que o `📖 manual ↗` e os `← back` continuam válidos.)

## Frente 3 — Tradução para inglês (produto 100% EN)
- `examples-data.mjs`: `title`, `why`, `label`, `tier-intro` PT→EN. `examples-render.mjs`: strings de UI
  do doc (legendas, rótulos "teclas/por quê", intro) PT→EN. Seções de referência: já EN.
- `quantum_calc.html`: `lang="en"`; **mensagens de erro/status** PT→EN (lista não-exaustiva):
  'porta desconhecida'→'unknown gate'; 'qubit Q… fora do estado'→'qubit Q… out of range';
  'qubits repetidos no comando'→'repeated qubits in command'; 'esperados N alvo(s)/controle(s)'→
  'expected N target(s)/control(s)'; 'presets usam Q (alvos), não CTRL'→'presets use Q (targets), not CTRL';
  '…requer exatamente 2 qubits'→'…requires exactly 2 qubits'; '…requer ≥N qubit(s)'; 'preset requer estado
  concreto'→'preset requires a concrete state'; 'ρ completa só p/ N≤5'; 'concorrência: requer 2 qubits';
  'função desconhecida'; mensagens do parser/SET/ângulo. Comentários de código (não user-facing) podem ficar.
- **NÃO mudam** as strings de ESTADO capturadas (dirac) — a fidelidade DOM-driven do cookbook é preservada.
- **Não-regressão:** atualizar asserções de teste que casam substrings PT — `v9.test.mjs` (v9-16 parser,
  v9-11 `/controle/`→`/control/`), `ui.spec.js` (v9 'Bell requer exatamente 2 qubits'→EN), `manual.test.mjs`
  (assert.throws com mensagens PT), e varrer os demais por substrings PT.

## Frente 4 — PWA (App Shell), mantendo o `file://` em paralelo
- **`manifest.webmanifest`**: `name:"Quantum Calculator"`, `short_name:"QCalc"`, `start_url:"./quantum_calc.html"`,
  `scope:"./"`, `display:"standalone"`, `background_color`/`theme_color` = cor do tema claro, `icons[]`
  (192, 512, maskable). Link no `<head>`: `<link rel="manifest" href="./manifest.webmanifest">` +
  `<meta name="theme-color">` + `<link rel="apple-touch-icon">`.
- **`sw.js`** (App Shell): 
  - `CACHE='qcalc-v10'`; `SHELL=['./quantum_calc.html','./manual.html','./vendor/katex.min.css',
    './vendor/katex.min.js', fontes katex, './icons/icon-192.png','./icons/icon-512.png','./manifest.webmanifest']`.
  - `install`→`caches.open(CACHE).addAll(SHELL)` + `skipWaiting()`; `activate`→apaga caches ≠ CACHE +
    `clients.claim()`; `fetch`→**cache-first** com fallback de rede (e cache da resposta nova).
- **Registro** (em `quantum_calc.html`, no fim do script): 
  `if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));`
  → em `file://` NÃO registra (uso "abrir o arquivo" intacto; SW não roda em file:// de qualquer modo).
- **`icons/`**: `icon-192.png`, `icon-512.png`, `icon-maskable.png` — IA-gerados (SVG→PNG) com glifo do
  tema (ex.: `|ψ⟩` ou a esfera de Bloch) na cor do tema claro; safe-area p/ maskable.

## Testes (Fase 6)
- `examples.spec.js`: gera/valida `manual.html` (Parte I + Parte II, 26 cards, KaTeX, offline, links EN).
- `pwa.spec.js` NOVO: via Playwright **`webServer`** (http) — manifest parseável e com campos obrigatórios;
  SW registra e entra em `activated`; após load, recurso do SHELL servido do cache (offline: 2ª visita com
  rede cortada ainda renderiza). Os specs `file://` atuais ficam inalterados (SW=no-op em file://).
- Atualizar asserções PT→EN nos testes existentes. Meta: 335 + novos, 0 regressão.

## Premissas (AP4)
A1 SW só ativa em http(s); `file://` = página simples. A2 precache cobre o shell (examples.html removido).
A3 manual.html é GERADO (referência estática + exemplos capturados). A4 tradução não toca strings de estado.
A5 asserções PT→EN são parte da não-regressão. A6 hospedagem pela usuária (entregamos arquivos+README).
A7 ícones IA-gerados, ajustáveis depois.

## Escopo negativo
Capacitor/nativo/lojas; push/notificações; backend; mudança no motor; multilíngue (é EN, não bilíngue);
SW em file:// (por design); tudo do v9 não tocado.

## Resolução Fase 3 (resposta unificada ao gate — simplifica, não complexifica)

**C1 (🔴 perda de conteúdo na consolidação) — RESOLVIDO por SEQUÊNCIA (processo, sem componente novo):**
ORDEM OBRIGATÓRIA na Fase 5: (1) EXTRAIR a referência do `manual.html` atual p/ dentro do
`examples-render.mjs` (seções estáticas, EN) **ANTES** de qualquer geração; (2) implementar
`renderManual` (Parte I referência + Parte II cookbook); (3) só ENTÃO rodar `examples.spec` p/ GERAR o novo
`manual.html`; (4) deletar `examples.html` e reconciliar links (calc→manual mantém; remover manual→examples;
back-links → manual; refs de shot). Nunca gerar antes de extrair (senão sobrescreve a referência).

**🟡 integrados (cada um simplifica ou adiciona só mecanismo):**
- **Sweep PT (completude+consistência da tradução) → 1 TESTE-GUARDA:** `tests/no-pt-leak.test.mjs` varre o
  `quantum_calc.html` (strings user-facing) + o `manual.html` gerado por tokens PT remanescentes
  (acentos em mensagens, palavras-âncora: "porta","alvo","controle","estado","requer","desconhecida",
  "fora","repetidos"). Falha se sobrar PT. Cobre M-calc + M-doc + M-tests num só trap. Glossário:
  alvo→target, controle→control, porta→gate, estado→state, fase→phase, medir→measure.
- **SW SHELL incompleto / fonts KaTeX → RUNTIME CACHE (simplifica):** o `fetch` handler é cache-first
  **com cache-on-fetch** (toda resposta same-origin GET nova é guardada). Logo o precache NÃO precisa ser
  exaustivo: precachear os pontos de entrada (`./quantum_calc.html`, `./manual.html`, `./manifest.webmanifest`,
  ícone) e o resto (KaTeX css/js/fonts) é cacheado na 1ª visita online. Remove o risco de "faltou um path".
- **Fluxo de update (Resilience) — padrão:** `CACHE='qcalc-v10'`; `activate` apaga caches ≠ CACHE;
  `skipWaiting()` + `clients.claim()`. Bump do nome = nova versão purga a antiga. `pwa.spec` testa offline
  (2ª carga sem rede) e ativação.
- **Ícones → 1 SVG (simplifica):** manifest aponta UM ícone SVG (`icons/icon.svg`, `purpose:"any maskable"`,
  `type:"image/svg+xml"`) — sem rasterização/PNG/build. (Se algum browser exigir PNG, rasterizar via
  Playwright fica como fallback opcional, fora do caminho principal.)
- **https + subpath → paths RELATIVOS `./`** em manifest (start_url/scope), registro e SHELL → tolera o
  subpath do GitHub Pages. README de entrega documenta o requisito de servir por https (ou localhost).
- **pwa.spec sem quebrar file://:** `playwright.config.js` ganha um `webServer` (http local) usado só por
  `pwa.spec.js`; `ui.spec`/`examples.spec` seguem em `file://` (pathToFileURL) inalterados.

**Saldo:** 0 módulo adicionado/removido/redesenhado; M-icons SIMPLIFICA (conjunto PNG → 1 SVG); SW usa
runtime-cache (precache enxuto); +1 teste-guarda PT; C1 = disciplina de sequência. Complexidade não aumenta.
