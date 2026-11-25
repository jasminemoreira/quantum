# Coverage matrix — Cycle 29 · PLAY no manual

Lentes: 7 universais + condicionais ativadas (UI/UX, Migration / Coexistence, Process / Workflow,
Resilience, Linguistics / Grammar, Mechanical Engineering). Módulos = tabela V(1) de
`specs/technical/architecture.md`.

## Iteração 30 — V(1)

| id | module | lens | severity | description |
|------|--------|------|----------|-------------|
| AS-01 | play-overlay | Assumptions | 🟡 | O link "?" do app (href=manual.html) dentro do iframe carrega o MANUAL dentro da sobreposição (manual aninhado com seus próprios ▶); o link do About (LinkedIn) idem. Premissa implícita: "o app embutido não navega". |
| AS-02 | demo-runner | Assumptions | 🟡 | Dentro do PWA, `@media (display-mode: standalone)` também casa no iframe → o app embutido usa o layout CSS do PWA (100dvh do iframe) e o fitViewport é pulado; no navegador usa fitViewport. A-8 precisa ser verificada nos DOIS modos. |
| AS-03 | demo-runner | Assumptions | 🟢 | Passos `measure` são amostrados → o visor da demo pode diferir do LCD capturado no manual (A-9). Aceito: é o app real. |
| AR-01 | demo-reset | Architectural | 🟢 | O módulo é um único `iframe.src = …` executado pelo play-overlay — sem responsabilidade independente → fundir em play-overlay. |
| AR-02 | demo-visual | Architectural | 🟢 | CSS `.demo-hit` + `hilite()` só são usados pelo demo-runner → fundir em demo-runner. |
| AR-03 | play-data | Architectural | 🟡 | `stepsToKeys` passa a ser derivado de `stepsToGroups`; a string de chips é fixada pelo teste keys↔steps (v21) → a refatoração deve ser BYTE-IDÊNTICA, senão os chips do manual derivam. |
| I-01 | play-tests | Implementability | 🟡 | Com o ritmo real (~350 ms/tecla + 600 ms/grupo) um teste PW sobre os 92 resultados levaria ~25 min → o protocolo precisa de um override de ritmo SÓ p/ teste (`qc-play.ms`), não exposto na UI. |
| S-01 | demo-runner | Scientific | 🟢 | Tempos 350/200/600 ms são heurísticas de UX sem referência → constantes nomeadas e ajustáveis, validadas no human-AV da operadora. |
| SEC-01 | play-protocol | Security | 🟢 | Qualquer site que embuta a calculadora num iframe pode enviar `qc-play` e "apertar teclas" → impacto nulo (só comandos já existentes do routeAction, sem dados/segredos; nada sai do app além de índices). Manter filtro `e.source === window.parent`. |
| SEC-02 | play-data | Security | 🟢 | O JSON dos steps vai num atributo HTML → precisa do escape de atributo (`att()`); um `"` ou `'` num token quebraria o markup. |
| P-01 | play-overlay | Performance | 🟡 | Um iframe por res-block (92) carregaria o app 92× → UM iframe compartilhado, criado preguiçosamente no 1º ▶. |
| P-02 | play-overlay | Performance | 🟢 | Recarga completa por play (HTML de ~4,6 k linhas + KaTeX) custa centenas de ms no celular; no PWA vem do cache do SW. Aceitável: mostra "carregando" até `qc-ready`. |
| R-01 | play-overlay | Regulatory | 🟢 | WCAG 2.2 SC 2.2.2 (conteúdo em movimento >5 s precisa de parar) → ■ atende; SC 2.1.1 (teclado) → ▶ é `<button>`, ESC fecha, foco volta ao ▶ ao fechar. |
| RES-01 | play-overlay | Resilience | 🟡 | O iframe não carrega / nunca envia `qc-ready` (navegador offline sem SW, versão antiga do app no cache) → sobreposição presa em "carregando" → timeout (~5 s) e fallback (link "abrir na calculadora"). |
| RES-02 | demo-runner | Resilience | 🟡 | Um passo lança exceção no meio da demo → o runner deve parar limpo, liberar o bloqueio de toque e enviar `qc-done{error}`; nunca deixar o teclado travado. |
| UX-01 | play-overlay | UI/UX | 🟡 | No celular a sobreposição cobre o card → acender o chip NO MANUAL é invisível. A barra da sobreposição deve mostrar sua própria cópia dos chips do bloco com o grupo corrente aceso (funciona em desktop e mobile; chips do manual intocados). |
| UX-02 | play-overlay | UI/UX | 🟡 | O × não pode colidir com os botões do próprio app no canto (? / i) dentro do iframe → controles numa barra FORA do iframe, não flutuando sobre o app. |
| UX-03 | play-overlay | UI/UX | 🟢 | Ao fechar, a posição de leitura e o foco voltam ao ▶ de origem (fluxo de leitura preservado). |
| MIG-01 | play-data | Migration / Coexistence | 🟡 | Os testes do manual (contagens de estrutura, no-pt-leak, KaTeX, keys↔steps) rodam sobre o manual regenerado → texto/aria do botão em INGLÊS; asserts de contagem atualizados de forma intencional. |
| MIG-02 | demo-runner | Migration / Coexistence | 🟡 | O SW precacheia quantum_calc.html + manual.html → sem bump do CACHE o PWA instalado fica com manual novo + app antigo (sem receptor) → `qc-ready` nunca chega. Bump obrigatório; RES-01 cobre a mistura de versões. |
| MIG-03 | demo-runner | Migration / Coexistence | 🟢 | O app sem pai deve ficar idêntico (A-4) → receptor e `qc-ready` só quando `window.parent !== window`; os 169 PW existentes são a rede de regressão. |
| PW-01 | play-overlay | Process / Workflow | 🟡 | Máquina de estados indefinida para ■/×/↻ no meio da demo → definir: idle→loading→playing→(done\|stopped)→interactive; fechar de QUALQUER estado = parar + `iframe.src='about:blank'` (mata timers); ↻ de qualquer estado = recarregar. |
| PW-02 | play-protocol | Process / Workflow | 🟡 | Após ↻, mensagens atrasadas `qc-step`/`qc-done` da execução anterior acenderiam o chip errado → cada `qc-play` carrega `runId`; o manual ignora mensagens de outro `runId`. |
| PW-03 | demo-runner | Process / Workflow | 🟡 | O bloqueio por `pointer-events` não cobre o TECLADO FÍSICO (keydown do desktop) → durante a demo o handler de keydown também deve ignorar teclas. |
| L-01 | play-protocol | Linguistics / Grammar | 🟡 | "Grupo" ambíguo: `page:0` não gera chip e tokens `calc:` se fundem num chip. Definir: `stepGroup[i]` = índice do chip que contém o passo i; todo passo pertence a exatamente um grupo (`page:0` pertence ao grupo seguinte); calculado SÓ em play-data e enviado; o app nunca reagrupa. |
| L-02 | play-protocol | Linguistics / Grammar | 🟢 | Semântica de `qc-done`: `{stopped:true}` por ■; `{error}` em RES-02; senão concluído. Fixar no contrato. |
| MEC-01 | demo-runner | Mechanical Engineering | 🟡 | Atraso fixo por tecla × custo variável: ops pesadas são adiadas (busyPending) e a gaveta de ângulo desliza (.25 s). Se a próxima tecla for disparada antes de assentar, o `if (busyPending) return` do routeAction a ENGOLE. O runner deve esperar `busyPending === false` antes de cada passo. |
| MEC-02 | demo-runner | Mechanical Engineering | 🟢 | A vida do destaque depende do re-render (A-5). Aplicar ANTES do routeAction e também remover por timeout, p/ ações que não re-renderizam o teclado. |

### Concentração

- **Por módulo:** `play-overlay` concentra 11 achados em 8 lentes (Assumptions, Performance,
  Regulatory, Resilience, UI/UX, Process / Workflow, + fusão AR-01). Não é má concepção: é o
  orquestrador de UI e lhe falta uma ESPINHA explícita — a máquina de estados (PW-01). Resposta da
  Fase 3: estados nomeados absorvem RES-01 (timeout no loading), PW-02 (runId), UX-03 (restaurar
  foco no close) e P-01 (iframe único).
- **Por lente:** nenhuma lente atinge todos os módulos → sem falha sistêmica.
- `demo-runner` concentra o risco de TEMPO (MEC-01, RES-02, PW-03): tratar como um loop async com
  esperas explícitas, não como cadeia de setTimeout fixos.

### Gate

🔴 0 · 🟡 16 · 🟢 12

## Iteração 31 — V(2)

Foco: estrutura nova da V(2) (máquina de estados do play-overlay, handshake/runId do
play-protocol, loop async do demo-runner, barra de controles).

| id | module | lens | severity | description |
|------|--------|------|----------|-------------|
| L-03 | play-protocol | Linguistics / Grammar | 🟡 | `qc-ready` não carrega `runId`: com ↻↻ rápido, o documento ANTIGO (ainda não descarregado quando o novo `src` é atribuído) pode enviar `qc-ready`; o manual então envia `qc-play` a um documento que vai morrer → fica em `playing` sem nenhum `qc-step`. Correção: o manual carrega o iframe com `#qc-run=<runId>` e o app ecoa esse `runId` no `qc-ready`. |
| L-04 | play-protocol | Linguistics / Grammar | 🟡 | O campo `groups` do protocolo (number[], passo→chip) tem o mesmo nome do `groups` de `stepsToGroups` (string[], rótulos dos chips) → duas implementações corretas podem mandar coisas diferentes. Renomear o campo para `stepGroup` em todo o contrato e no atributo `data-step-group`. |
| RES-03 | play-overlay | Resilience | 🟡 | Timeout de 5 s no `loading` como FALHA dá falso positivo no 1º carregamento num celular lento (app + KaTeX sem cache). Correção: aos 5 s apenas MOSTRA o link de fallback, sem cancelar; se `qc-ready` chegar depois, a demo segue normalmente. |
| UX-04 | play-overlay | UI/UX | 🟡 | O "swipe-down fecha" (Fase 0) não pode ser detectado sobre o iframe: os gestos vão para o app (que usa swipe no visor e arrasto na Bloch). Restringir o swipe-down à BARRA da sobreposição; dentro do app os gestos continuam do app. |
| UX-05 | play-overlay | UI/UX | 🟢 | ▶ e ↻ na barra são redundantes: o ▶ existe nos blocos do manual; na barra basta UM botão que alterna ■ (tocando) / ↻ (parado/concluído) + ×. |
| UX-06 | play-overlay | UI/UX | 🟢 | No celular a página do manual rola por trás da sobreposição (scroll-through) → travar o scroll do `body` enquanto aberta. |
| AR-04 | play-data | Architectural | 🟢 | `data-groups` (rótulos) é redundante: a barra pode CLONAR os chips já renderizados do próprio bloco (mesma fonte, zero divergência). play-data emite só `data-steps` + `data-step-group`; os `<code>` dos chips recebem `data-g`. |
| I-02 | play-overlay | Implementability | 🟡 | O script do manual vive dentro de um template literal (`renderManual` em examples-render.mjs): um script de ~100 linhas com crases/`${}` teria de ser escapado à mão (frágil). Escrever como função JS real `manualPlay()` no módulo e injetar `(${manualPlay.toString()})()` — sem escape, analisável pelo Node. |
| AS-04 | play-protocol | Assumptions | 🟢 | O filtro `e.source === iframe.contentWindow` supõe que o WindowProxy do iframe mantém identidade entre recargas (padrão HTML: sim). Coberto por teste (↻ seguido de demo completa). |
| MEC-03 | demo-runner | Mechanical Engineering | 🟢 | `busyPending` é liberado por double-rAF; numa aba em segundo plano o rAF pausa → `idle()` espera até a aba voltar. Comportamento aceito (a demo pausa junto), não um travamento. |
| MIG-04 | play-data | Migration / Coexistence | 🟢 | Os chips ganham `data-g` e o bloco ganha um `<button>` → muda o HTML do manual, mas nenhum teste existente casa o HTML dos chips (o keys↔steps usa `stepsToKeys`). Regenerar e conferir os testes do manual. |
| SEC-03 | play-protocol | Security | 🟢 | O `runId` no hash do iframe é só um número; o app o lê com `parseInt` e ignora qualquer outra coisa (nada do hash é interpretado como passo). |

### Concentração (it.31)

- **Por módulo:** play-overlay 4 (RES-03, UX-04/05/06) e play-protocol 4 (L-03, L-04, AS-04,
  SEC-03) — todos ajustes de contrato/comportamento, nenhum aponta redesenho.
- **Por lente:** nenhuma lente atinge todos os módulos.
- Os 2 🟡 de linguagem (L-03, L-04) mostram que o contrato ainda tinha ambiguidade de nomes e de
  sequência — o protocolo deve ser escrito como tabela fechada (mensagem × campos × quem envia).

### Gate (it.31)

🔴 0 · 🟡 5 · 🟢 7
