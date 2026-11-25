# Cycle 29 — PLAY no manual (demo visual dos exemplos no app real)

## Problema (pedido da operadora)

Em cada exemplo do manual, um botão que EXECUTA o exemplo de forma visual: mostra o clique em cada
tecla e o resultado no visor. Hoje o leitor vê a sequência de chips (`3 Q SET · 0 H · …`) e o
resultado capturado, mas precisa reproduzir à mão no app.

## Vocabulário

- **play / demo** — reprodução animada de UM bloco de resultado (`res-block`) no app real.
- **steps** — `data-action[]` de `tests/examples-data.mjs` (fonte única; o `examples.spec` aperta os
  mesmos). **grupos** — a partição `·` que `stepsToKeys` já produz (1 grupo = 1 mudança de visor).
- **sobreposição (overlay)** — camada do manual que contém o app num `<iframe>`.
- **modo demo** — estado do app enquanto toca steps recebidos por mensagem (toques bloqueados).

## Escopo (operadora confirmou, 2026-11-25)

1. Botão ▶ em CADA `res-block` dos cards da Part II (cookbook) e Part III (algoritmos). Part I
   (referência) não tem sequências → sem botão.
2. Ao tocar: abre SOBREPOSIÇÃO com o app real (tamanho celular; tela cheia no mobile). Fecha com ×,
   swipe-down ou ESC. O manual não navega (posição de leitura preservada).
3. Animação: tecla "afunda" + anel de destaque; ritmo ~350 ms/tecla + pausa ~600 ms ao fim de cada
   grupo. O chip correspondente no manual acende em sincronia. `2nd` liga/desliga visivelmente;
   ângulos digitados na gaveta normal.
4. Cada play começa de estado LIMPO. Durante a demo, toques no teclado bloqueados; ■ interrompe.
5. Ao terminar: teclado volta a ser INTERATIVO a partir do estado final (sem aviso extra); ↻ repete
   do zero.
6. Controles mínimos: só ▶/■ e ↻ (sem velocidade/passo). Háptico desligado na demo.

## Fora de escopo

- Controles de velocidade, passo-a-passo, scrub/timeline.
- Play na Part I (referência) e no `examples.html` legado.
- Narração/legendas por passo, áudio.
- Persistir o estado da demo ou transferi-lo p/ a calculadora do usuário.
- Mudanças no motor (ℤ[ζ₁₆], SymEngine) — INTOCADO.

## Feasibility — VERIFICADA (PoC, Fase 0)

PoC em `scratchpad/poc` (fora do repo), Chromium/Playwright:

1. **file:// bloqueia acesso direto ao iframe** — `contentWindow.QC` → `SecurityError: Blocked a
   frame with origin "null"`. ⇒ o manual NÃO pode dirigir o DOM do app; **postMessage é obrigatório**
   (funciona em file://, https e PWA).
2. **postMessage manual→app funciona em file://**: app no iframe recebeu `{type:'qc-play', steps}` e
   tocou Bell + P(π/4) → `(1/√2)|00⟩ + (1/√2·e^{iπ/4})|11⟩`. Iframe 390 px renderiza o app.
3. **Fidelidade 92/92**: para TODOS os resultados de `examples-data.mjs`, tocar via
   `routeAction(step)` dá o MESMO visor que os cliques reais do Playwright (medições são amostradas —
   não comparáveis literalmente).
4. **Achados de design:**
   - O receptor deve viver DENTRO de `UI.init()` (acesso a `routeAction`/`$`); código após o
     `return { init, refresh }` do módulo UI nunca roda (erro do 1º PoC).
   - **Chamar `routeAction(step)` direto**, não `el.click()`: o handler de click tem guarda de
     arrasto (compara clientX/Y com o último pointerdown) que engoliria clique sintético.
   - **O teclado é RE-RENDERIZADO a cada ação** (só 4/14 destaques sobreviveram) ⇒ ordem por tecla:
     destacar → esperar (~250 ms) → `routeAction` → re-render apaga o destaque naturalmente.
   - Ops pesadas são adiadas (double-rAF, `busyPending`) ⇒ o runner deve esperar `busyPending=false`
     antes do próximo passo.
   - Handshake: app envia `qc-ready` ao pai ao terminar o `init`; manual só envia `qc-play` após.

## Componentes (Tier)

| Componente | Onde | Tier |
|---|---|---|
| Receptor `qc-play`/`qc-stop` + runner temporizado + `qc-ready`/`qc-step`/`qc-done` | app, `UI.init` | 2 |
| CSS destaque `.demo-hit` + bloqueio de toque no modo demo | app | 1 |
| Botão ▶ por `res-block` + `data-steps` (JSON) embutido | `examples-render.mjs` | 1 |
| Sobreposição + iframe + ▶/■/↻ + sync dos chips (step→chip map) | manual (script inline) | 2 |
| Testes PW (manual→overlay→estado final == resultado capturado) | `tests/` | 2 |

Nenhum Tier 3; PoC cobriu o risco técnico principal (file:// + fidelidade).

## Contrato (vigiar)

- Motor e caminho de clique normal INTOCADOS (delta aditivo; receptor só reage a `qc-play`).
- O app sem pai (`window.parent === window`) se comporta exatamente como hoje.
- `steps` exibidos/tocados vêm da MESMA fonte (`examples-data.mjs`) — sem string paralela.
- Origem: aceitar mensagens só do próprio `parent` (`e.source === window.parent`).

## Pesquisa técnico-científica

Domínio da feature é UI (não quântico) — sem literatura científica aplicável. Referências técnicas:
HTML Living Standard (`window.postMessage`, origem opaca de `file:`), comportamento verificado em
Chromium via PoC.

## Resultado (Fases 5–7 — CONCLUÍDAS, 2026-11-25)

- Implementação conforme `architecture.md` V(3), com 1 desvio registrado: o iframe é RECRIADO a cada
  play/↻ (atribuir um `src` que difere só no `#hash` é navegação de fragmento — sem recarga).
- Suíte: **416 Node + 181 Playwright, 100% verde**. Novos: `tests/v29.test.mjs` (5) e
  `tests/v29.spec.js` (12) — inclui fidelidade 92/92 tocando cada exemplo pelo manual.
- Human-AV (navegador + Motorola/PWA): v29-1 rápido demais → v29-2 METADE da velocidade (700/400/1200
  ms) + destaque VERMELHO; v29-2 revelou estouro lateral do manual no celular (PRÉ-EXISTENTE: equação
  KaTeX longa alargava a página) → v29-3 `.lcd{overflow-x:auto}` + teste PW12. Aprovado.
- Live: `qcalc-v29-3`. Lições: `53-v29-lessons.md`.
