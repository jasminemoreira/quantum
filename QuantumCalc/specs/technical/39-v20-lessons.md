# v20 — Lições aprendidas (ciclo 21)

Tema: **Per-qubit inspector**. Tornar a informação por qubit acessível em 3 surfaces complementares,
unificadas por `P(Q_q=0) = (1 + z_q) / 2`:

1. **Geométrica** — fita translúcida no eixo Z da Bloch (M3)
2. **Navegacional** — tap-cycle no centro da esfera, view-only (M4)
3. **Numérica** — `n Q prob` marginal, alinhando a gramática operandos-primeiro (M1+M2)

Suite final: **445 testes** (328 Node + 117 Playwright). +11 v20 Node, +9 v20-UI Playwright,
1 migração intencional v7-UI absorvida. **0 regressão** sobre os 425 do v19-36.

---

## v20-L0 — Pre-audit grep SIMPLIFICA o spec

**Lição**: P3 propunha overload `Ops.prob(state, q?)` com `kind` discriminator (tipo disjoint
`{dist}` vs `{marginal}`). Pre-audit revelou que `Ops.probabilities(s)` (plural) já existia
intocado.

**Solução adotada**: função NOVA `Ops.probQ(state, q)` ao lado de `Ops.probabilities`.
Sem overload, sem `kind`, sem type-confusion. Mais simples que o spec original.

**Generalização**: SEMPRE rodar grep dos símbolos a tocar **antes** de implementar — o nome
disponível pode ditar uma arquitetura mais limpa que a planejada.

---

## v20-L1 — Fórmula geométrica deve clampar ao espaço da esfera

**Bug pego em human-AV (operadora P=0.146)**: minha fórmula da fita `zTop = 2P - 1`,
`zBot = zTop - 1` punha o fundo da fita em `zBot = 2P - 2`. Para `P=0.146` isso dá `zBot = -1.708`,
**abaixo do polo |1⟩**. A fita "vazava" para fora da esfera.

**Fix**: `zTop = P`, `zBot = P - 1`. Sempre dentro de `[-1, +1]` (a fita "desliza" no eixo Z mas
nunca sai dele). `P=1` → fita `[0, 1]` (toda acima); `P=0` → `[-1, 0]` (toda abaixo); `P=0.5`
→ `[-0.5, 0.5]` (centrada).

**Generalização**: qualquer visualização geométrica derivada de uma quantidade probabilística
deve **clampar ao domínio da figura** (raio da esfera, lado do quadrado, etc.). Verificar nos
extremos (P=0, P=1) e em casos intermediários (P=0.146 é o que pegou).

**Padrão recorrente**: 6ª vez que human-AV pega bug que automated não pegou (v17-L1, v18-L1, v19-L1
× 2, v20-L1). Em todos: a lente que faltou era "como ESTE estado específico se renderiza?"

---

## v20-L2 — NÃO subtrair flow de elementos absolute-positioned

**Bug pego em human-AV ao vivo**: minha fórmula `labelChrome = 19 + (showVal ? 22 : 0)` subtraía
19px do `bodyH` para "reservar espaço para o `#blochLabel`". Mas o label tem
`position:absolute` — não toma espaço no fluxo. A subtração reduzia o tamanho da esfera
**sem razão**.

**Fix**: `labelChrome = (showVal ? 22 : 0)`. Só o `.bloch-val` (visível só no desktop, `display:flex`
column flow) deve ser subtraído.

**Generalização**: ao calcular espaço disponível para um filho `flex` ou `flex:1`, considerar
**APENAS** os irmãos em fluxo. `position:absolute` e `position:fixed` ficam **fora** do cálculo de
`offsetHeight`/`clientHeight` do pai e **não devem ser subtraídos**.

**Padrão recorrente**: terceira vez que a operadora pega bug visual relacionado a tamanho
proporcional (v19-L27 zext labels iOS, v19-L29 prop sizing inicial, v20-L2 chrome erronea).

---

## v20-L3 — PWA Android lifecycle exige `visibilitychange`

**Bug pego ao vivo**: ao alternar para outro app e voltar à calculadora (PWA standalone Android),
o `.display` encolhia para o piso (172px). Reload normalizava. O `pageshow` (já registrado em
v14) **não dispara** em standalone Android quando o WebView é pausado+resumido pelo SO.

**Fix**: adicionar `visibilitychange` (mais confiável que `pageshow` para resume) + `focus`
(fallback adicional). 80ms delay antes de chamar `fitViewport()` para o WebView reportar a
viewport correta:

```js
document.addEventListener('visibilitychange', () =>
  { if (!document.hidden) setTimeout(fitViewport, 80); });
window.addEventListener('focus', () => setTimeout(fitViewport, 80));
```

**Generalização**: PWA standalone em Android NÃO se comporta como browser tab. Eventos
relevantes para "página voltou ao foco":
- `pageshow` — funciona em bfcache navigation (back/forward), nem sempre em app-switch
- `visibilitychange` — funciona consistentemente em app-switch
- `focus` — funciona em window focus (caps de teclado, etc.)

**Sempre registrar os três** para PWA cross-platform.

---

## v20-L4 — Sobrecarga semântica de `op:prob` exige snapshot de seleção

**Decisão de design v20**: `op:prob` era toggle binário (`showProb = !showProb`, v7) ignorando
seleção. v20 estende: a tecla agora respeita `Parser.getSelection()` no momento do press.

**Solução**: `_probQ` (estado novo) faz snapshot da seleção ao ligar. Re-press com a MESMA
seleção desliga; com seleção diferente, MUDA sem desligar.

```js
const newQ = sel === 'ALL' ? null : sel;
if (showProb && _probQ === newQ){ showProb = false; _probQ = null; out(''); }
else { showProb = true; _probQ = newQ; }
```

**Generalização**: ao estender uma op de **toggle binário** para **toggle paramétrico**, o
parâmetro precisa ser **snapshot no momento do toggle**, não lido do estado global a cada render.
Permite: (a) re-press com mesmo param desliga, (b) re-press com param diferente switcha sem off
intermediário.

---

## v20-L5 — Migração intencional `v7-UI` absorvida sem regressão

**Cenário**: v20 muda a semântica de `op:prob` quando há seleção. O teste v7-UI assumia o
comportamento velho (toggle independente de seleção). Após v20, o teste falhou porque
`gate:H` no Q0 deixava seleção=0, então `op:prob` virava `0 Q prob` (marginal).

**Fix**: adicionar `key:ALL` explícito antes de `op:prob` no teste v7-UI — isola a verificação
ao path `ALL prob` que era o que o teste realmente cobria.

**Generalização**: ao **estender** uma op com sobrecarga semântica, testes antigos podem **pegar
o novo caminho por acidente**. Anti-AP7: revisar TODOS os testes que tocam a op, e quando o
teste antigo cobria implicitamente o "caso default", **fazer o default explícito** no teste —
não só ajustar a asserção.

---

## v20-L6 (carry-forward v21) — Classic Algorithms section

Operadora propôs em P6 (após estabilizar v20): seção **"Part III — Classic Algorithms"** no
`manual.html` com cards de:
1. Deutsch / Deutsch-Jozsa (2-5 qubits)
2. Bernstein-Vazirani (3-7 qubits)
3. Simon (4-6 qubits)
4. Grover (já parcial, expandir com oráculo declarado)
5. Phase Estimation (4-6 qubits)
6. Superdense Coding (2 qubits)
7. Shor compilado N=15, a=11 (5 qubits, Lucero 2012)
8. Quantum Counting (5-6 qubits)

**Pesquisa pré-v21**: investigar se `SymRules.declare` permite modelar oracles `U|x⟩=f(x)|x⟩`
diretamente, ou se precisamos novo mecanismo. Marcos:
- Cada algoritmo um card em `examples-data.mjs` tier `algorithm` (novo) ou Part III separada
- Validação contra motor (anti-AP7 herdado)
- Helper `out()` para "leitura de fração contínua" no Shor (texto, fora do motor)
- Padrão de display: motivação → key sequence → estado em pontos-chave → distribuição final →
  interpretação clássica

Esse será o **escopo do ciclo v21**.

---

## Resumo numérico

| Métrica | v19-36 | v20-7 | Δ |
|---|---|---|---|
| Testes totais | 425 | **445** | +20 |
| Node | 317 | 328 | +11 |
| Playwright | 108 | 117 | +9 |
| Módulos novos | 0 | 0 | 0 (padrões herdados) |
| Padrões novos | 0 | 0 | 0 |
| Cycle structural change | — | **0%** | 4/4 sharpened, 0 restructured |
| Deploys live | qcalc-v19-36 | qcalc-v20-7 | 7 ajustes in-loop com operadora |

**Veredito P0**: 96/100 (sem iteração extra), avançou direto. Operadora final:
"vamos encerrar V20, parece que está tudo ok".
