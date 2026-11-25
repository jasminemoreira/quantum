# v29 (cycle 29) — Lições: PLAY no manual

**L1 — Reproduzir pela MESMA rota do toque garante fidelidade.** A demo chama `routeAction(step)`
com os mesmos `steps` que o examples.spec clica; o teste de fidelidade 92/92 compara com o manual
capturado por cliques reais. Nenhuma simulação paralela que possa divergir.

**L2 — file:// torna o iframe cross-origin.** `contentWindow.*` lança SecurityError; o único canal é
postMessage (targetOrigin `'*'`, filtro por `e.source` + `runId`). Verificar no PoC ANTES de desenhar
— o 1º desenho "mexer no DOM do iframe" teria falhado só em file://.

**L3 — Trocar só o `#hash` do `src` NÃO recarrega o iframe.** É navegação de fragmento. Para estado
limpo, recriar o elemento iframe (de quebra elimina mensagens do documento anterior).

**L4 — Clique sintético × guarda de arrasto.** O handler de click compara a posição com o último
pointerdown; `el.click()` seria descartado. Disparar a ação diretamente.

**L5 — Destaque ANTES da ação.** O teclado é re-renderizado a cada ação; um destaque aplicado junto
com a ação some (PoC: 4/14 sobreviveram).

**L6 — `Function.prototype.toString()` leva os comentários.** Código injetado via `fn.toString()`
precisa de comentários em inglês (no-pt-leak) — reincidência da v26-L7 por um caminho novo.

**L7 — Golden antes de refatorar o que é exibido.** `stepsToKeys` não tinha pino; gravar a saída
atual (fixtures/v29-keys-golden.json) ANTES de reescrever deu prova byte-idêntica barata.

**L8 — Elemento `fixed` "fora do lugar" no celular = algo alargando o documento.** Medir
`scrollWidth` vs `clientWidth` e listar quem passa do viewport achou a equação KaTeX longa
(bug PRÉ-EXISTENTE); conferir a versão anterior evitou atribuir ao ciclo atual.

**L9 — Ritmo de demo é decisão do humano.** 350 ms/tecla parecia razoável e foi rápido demais;
amarelo sumia sobre teclas claras. Constantes nomeadas tornaram o ajuste trivial.

**L10 — Z: (SSHFS) é instável; `deploy-ssh.sh` publica na mesma pasta sem depender dele.**
