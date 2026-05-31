# v3 — Arquitetura do delta (preparação de estado-produto)

> Delta sobre o v2. Nenhum módulo novo; 4 extensões. Doc conciso (<2k tokens).

## Decomposição (módulos tocados e responsabilidades)
- **M14 Keymap** — adiciona 6 tokens de ket ao teclado quântico. Ação `ket:K`,
  K ∈ {`0`,`1`,`+`,`-`,`i`,`-i`}; rótulos |0⟩ |1⟩ |+⟩ |−⟩ |i⟩ |−i⟩.
- **M6 Parser (FSM)** — estende a entrada de SET com uma "ket-string":
  `ket(K)` anexa um token de ket ao buffer; `set()` materializa o buffer ativo.
  Responsável pela DESAMBIGUAÇÃO dígito×ket (mistura → erro).
- **M3 State / M4 Engine** — `State.fromKets([K…])` constrói o estado-produto puro
  (tensor de fatores de 1 qubit), exato em ℤ[ω]. Big-endian (1º ket = Q0).
- **M11 UI** — roteia `ket:K` → `Parser.ket`; exibe a ket-string no buffer; `execute()`
  materializa `{kind:'set', spec:{kets}}`. Único módulo com efeito no DOM.

## Interfaces (contratos)
| Origem → Destino | Assinatura / contrato |
|---|---|
| Botão → UI | `data-action="ket:K"` |
| UI → Parser | `Parser.ket(K)` anexa; `Parser.set()` → `{kind:'set',spec:{kets:[K…]}}` ou `{error}` |
| UI → Engine/State | `execute({kind:'set',spec:{kets}})` → `State.fromKets(kets)` |
| State.fromKets | `(kets:string[]) → State` (puro, 2^N amplitudes, exato) |

Desambiguação no `set()`: buffer só-dígitos → bitstring/contagem (v2); buffer só-kets →
produto (v3); dígito + ket no mesmo buffer → erro claro.

## Dependências (fluxo)
Keymap → UI → Parser → (Engine/State) → History → Render. UI é a única camada DOM.
O comando de SET-produto entra no History (undo/redo) como qualquer outro Command.

## Premissas (AP4)
1. Os 6 kets são exatos em ℤ[ω] (são as bases de exibição do v2).
2. Big-endian: 1º ket = Q0.
3. SET-produto cria sempre um estado-produto PURO novo; não re-prepara qubit em estado
   existente/emaranhado (isso exigiria matriz densidade → fora de escopo).
4. N = nº de kets ≤ 12. O Render atual já exibe o produto expandido (comp/had/circ).

## Escopo negativo
Sem matriz densidade/estado misto evolutível; sem reset de qubit emaranhado; sem preparar
qubit isolado dentro de estado já montado; não toca o v2 fora dos 4 módulos.

## Padrões (herdados do v2)
Command (SET-produto), Interpreter (FSM estendida), Domain Model + Immutable State,
pure core / DOM só na UI, single-threaded. SET reusado materializa o buffer ativo.
