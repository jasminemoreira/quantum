# v24 (ciclo 25) — Controle generalizado (CTRL) + potência 2ʲ (POW) + card E9

DELTA brownfield. Motor ℤ[ζ₁₆]/matrizes/`applyN` INTOCADOS. Confinado a Parser + execute() + keypad + doc.
Referências de algoritmo: ver `specs/references/44` (E9 Quantum Counting) e `specs/technical/45` (verificação ciclo 24).

## Contrato da feature (decidido P1–P3)

### CTRL generalizado
- `CTRL` antes de QUALQUER porta OU preset → o operador é aplicado MULTI-CONTROLADO via `applyN` (que já existe; `opts.controls` AND-gated em |1⟩).
- **CTRL ACUMULA**: cada `n CTRL` soma `{role:'ctrl',n}` a `ops[]`. `0 CTRL 1 Q CNOT` = CCX (controle extra + CNOT). `0 CTRL 1 CTRL 2 Q X` = MCX. Sem porta nomeada nova.
- **Aridade** (`applyGate`): ALVOS estritos (`tg.length === m.targets`); CONTROLES só limite superior relaxado (`ct.length >= m.controls`). Controles efetivos passados a `applyN` = todos os `ct`. Erro de alvo inalterado (`0 Q 1 Q H` ainda erra).
- **ALL + CTRL mutuamente exclusivos** → erro com hint.
- **Preset controlado** (`execute()` preset branch): injetar os controles pendentes em CADA `OpSpec.controls` da expansão. Válido pois controlled(∏Gᵢ)=∏controlled(Gᵢ) QUANDO o controle ∉ alvos de nenhuma op (mesmo controle, fora do range). **GUARD**: controle ∈ range do preset → erro `control Qx overlaps preset targets`.
- **Concrete-only** (herdado): controle/preset sobre |ψ⟩ abstrato → erro.

### Potência 2ʲ (POW)
- Token operandos-first `j POW`: a porta/preset é aplicada **2ʲ vezes** (uma entrada por termo do QPE: q controla U^{2ʲ}).
- `j` em campo ESCALAR `pow` no Parser (NÃO em `ops[]`). Ordem-insensível (`3 POW 2 CTRL 0 Q G` ≡ `2 CTRL 0 Q 3 POW G`).
- POW sem dígito → erro `type exponent before POW`. POW repetido → último vence (KISS).
- **CAP: 2ʲ ≤ 1024 (j ≤ 10)** — erro `exponent too large (max j=10)`. Protege a UI single-thread (cobre preset×2ʲ).
- Aplica a QUALQUER operador (com/sem controle — é só repetição U^{2ʲ}).
- `command.power = j` (apply/preset). `execute()` loopa 2ʲ vezes numa ÚNICA `History.push` atômica. Label tipo `c-Grover^8` / `c-U^4 q2`.

### Contratos de comando
- `Parser.applyGate(name)` → `{kind:'apply', gate, targets, controls, params, power?}`
- `Parser.preset(name)` → `{kind:'preset', name, all|qsel, controls?, power?}`
- `execute(cmd)`: injeta `controls`, loopa `2^power`; export Qiskit expande `power`→repetições; `History.commands()` preservado.

### Keypad (M4)
- Tecla `POW` (pág.2, operandos-first); chrome mínimo, SEM gaveta nova.
- `bufferText` reflete CTRL extras + `^j` pendentes (reusa render existente).

## Card E9 — Quantum Counting (M5, doc-only, padrão E-card)
- **Ref:** N&C §6.3; Brassard, Høyer, Mosca, Tapp 2002 (arXiv:quant-ph/0005055).
- **Instância:** espaço n=2 (N=4 itens), M=2 marcados, registro de contagem t=3 (QFT†₃ exata π/2,π/4 ∈ ζ₁₆).
- **Circuito:** H em todos · controlled-G^{2ʲ} (G = operador de Grover do preset, controlado por cada qubit de contagem via CTRL+POW) · QFT†₃ · measure registro de contagem.
- **Verificado ciclo 24** (replay no motor): picos c={2,6} → θ, M = N·sin²(θ/2) = 2 EXATO. Estado em ℤ[ζ₁₆].
- **Leitura PROBABILÍSTICA**: a seção `result` EXPLICA a estimativa de fase (M≈N·sin²(θ/2)), não afirma valor exato por princípio (natureza do QPE).
- Teclas CURTAS via a nova feature: preset Grover + CTRL + POW (em vez de ~215 teclas à mão).
- Estado capturado do motor via replay dos `steps` (anti-AP7); trava anti-drift em examples.test.

## Não regredir
- Suíte do ciclo 24: 374 Node + 154 PW (100% verde). Auditar v2.test/ui.spec para mensagens de erro de aridade (relaxação é aditiva).
