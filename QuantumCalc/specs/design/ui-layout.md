# Design de UI — Layout do Teclado + FSM de Entrada (V(N+1))

> Baseado no mockup do usuário + resoluções da Fase 3 (C2/C3). Estilo
> calculadora científica: teclado primário enxuto + painéis "2nd" rotulados.

## Display (topo) — LCD de ALTURA FIXA (v4-ui)
Painel verde de **altura fixa** (não cresce/encolhe com o conteúdo — estilo LCD de
calculadora), em coluna flex:
- **Linha de status no topo (largura total, à direita):** seleção (`ALL`/`Q3`) · base ·
  formato (exp/ret/polar) · forma (fatorado/expandido). Fica numa linha própria para o
  estado ocupar a largura toda abaixo, **sem quebrar em colunas** em torno do indicador.
- **Miolo rolável (`.disp-body`):** vetor de estado em **Dirac simbólico** (ex.:
  `(1/√2)|00⟩ + (1/√2)|11⟩`) seguido dos **resultados de operação** (`#auxOutput`:
  prob, ρ, medição…). Conteúdo longo **rola** dentro da altura fixa.
- **Rodapé fixo (`#statusLine`):** buffer de entrada da FSM + operandos pendentes +
  erros + prompt de ângulo/λ + contagem de regras.
- **Esfera de Bloch embutida (`#blochInline`, à direita do miolo):** o botão `Bloch`
  liga/desliga; renderiza dentro do LCD, **monocromática (verde, segue o tema)**, e
  **evolui a cada `refresh()`** — acompanha o estado e o **qubit selecionado** (`Q0/Q1…`).
  Some no modo simbólico (ket abstrato não tem Bloch) e no modo calc.
- Indicador `approx` quando há amplitude numérica (ângulo arbitrário).

## Teclado em ZONAS + camada 2nd (v4-ui — redesenho ergonômico)

> Pesquisa de ergonomia (Fitts/Hick, alvos WCAG 2.5.5, Gestalt região-comum;
> convenções Casio/HP-2nd, Desmos, Quirk/IBM Composer). Realiza a visão original
> "primário enxuto + 2nd" como TECLADO ÚNICO em duas colunas com camada 2nd
> estilo HP/TI (uma tecla, NÃO menu de abas). `Keymap.layout(mode, shifted)` →
> `{ strip, cols:{L,R} }`; cada grupo = painel com borda/rótulo (região comum).

**Faixa de vistas (perto do display):** `base · fmt · forma · barras` + `→ calc`.

**Coluna ESQUERDA — paleta (re-mapeada por 2nd):**
- *Primário:* portas 1q (H X Y / Z S T / Rx Ry Rz) · kets (|0⟩|1⟩|+⟩ / |−⟩|i⟩|−i⟩ / |ψ⟩|φ⟩|χ⟩ abstratos) · 2 qubits (CNOT CZ CP CRz C-U) · operações (prob medir ‖ψ‖ Bloch evidenciar).
- *2nd:* variantes (S† T† I P U) · 2q+ (SWAP iSWAP CCX CSWAP) · emaranhamento/produto (ρ ρ_A Schmidt S(ρ) C ⟨φ|ψ⟩ save φ ⊗ fase).

**Coluna DIREITA — PERSISTE em primário e 2nd:**
- *comando:* ALL Q CTRL SET ⌫ / CLR ↶ ↷ ⟲ **2nd**.
- *numérico:* bloco de calculadora 7-8-9 / 4-5-6 / 1-2-3 / 0 . ± / π 1/√2 (dígitos maiores — Fitts).

**Hierarquia (Fitts/Hick):** dígitos e teclas frequentes maiores; cauda longa só
sob 2nd. **Cor por classe** (Gestalt similaridade): 1q azul, 2q teal, kets rosa,
kets abstratos roxo, ops roxo-escuro, comando âmbar, **2nd amarelo quando ativo**
(convenção SHIFT Casio), **acento verde reservado só p/ `=`** (modo calc; no
quântico as portas aplicam-se sozinhas, sem `=`). Display ~2× maior, rola em
expressões longas; resultados de operação separados do estado.

**Modo calc:** funções (√ ^ ( ) sin cos tan ln log exp conj abs re im) · sobre o
estado (amp[] P() EV() norm) · numérico próprio com `=` (acento). Sem camada 2nd.

**Tema (v4-ui):** paleta **PANTONE do ano** aplicada como fundos vívidos dos grupos de teclas
(texto de alto contraste por grupo), sobre base escura quente. Acentos: `2nd` ativo = Mandarin,
`=` = Teaberry, avisos = Mandarin, erros = Teaberry. **Botão de tema (claro/escuro)** no cabeçalho: `data-theme` em `<html>` cascateia variáveis CSS;
o LCD (verde refinado no escuro, verde-pálido no claro) e a esfera de Bloch seguem o tema. Teclas
Pantone (mid-tone) servem aos dois temas. **Padrão = claro** (`<html data-theme="light">`).

**Idioma da UI:** **inglês** (rótulos, mensagens, prompts, ajuda e `manual.html`). Código/comentários
e estas specs permanecem em PT (não são user-facing).

**Render LaTeX UNIFICADO (v4-ui):** uma única função `Render.toKatex(dirac)` converte a string de
Dirac (Unicode) em LaTeX e o display renderiza via KaTeX para TODAS as formas — concreto, simbólico,
fatorado com `⊗`, e nós `U|ψ⟩` (antes o `⊗` derrubava o KaTeX → caía em texto). Frações **verticais**
(`\dfrac`); parênteses de coeficiente NÃO-soma são removidos (`(1/2)|0⟩`→`½|0⟩`); parênteses/colchetes
de agrupamento auto-dimensionam (`\left(…\right)`). `data-plain` (Unicode) é mantido como fallback
offline (sem KaTeX) e base dos testes. `Render.toKatex` é testado em Node (transform puro).

> NÃO reintroduzidos (escopo v2/v4): presets e export Dirac/LaTeX/Qiskit (removidos no v2).

## FSM de entrada (teclas de papel — resolve C2)
Estados: `IDLE → NUM → (ROLE) → ... → APPLY`. Dígitos acumulam `NUM`.
- `NUM` + **Q** → registra ALVO/qubit selecionado; volta a poder ler novo NUM.
- `NUM` + **CTRL** → registra CONTROLE; volta a poder ler novo NUM.
- **porta** → encerra: valida **aridade** (nº controles/alvos compatível com a porta) → aplica → `IDLE`.
- **ALL** + porta → aplica a todos os qubits.
- bitstring (só 0/1) + **SET** → estado de base; `NUM` + **Q** + **SET** → N qubits |0…0⟩.
- **CLR** → reset do buffer (sai de qualquer estado parcial → IDLE). `⌫` apaga 1 token.
- Comando incompleto/aridade inválida → estado de erro claro na linha de status (sem aplicar).

Exemplos: `1 0 Q H` → H em Q10. `1 CTRL 2 Q CNOT` → C(Q1)→X(Q2).
`1 CTRL 2 CTRL 3 Q CCX` → Toffoli. `ALL H` → H⊗…⊗H.

## Princípios de UI
UI fina (M11): só captura eventos → `parser.feed`, executa via domínio, re-renderiza.
Render por `textContent`/DOM (nunca innerHTML com entrada). Acima de limiar de
termos, vista compacta/rolável. Acessibilidade: navegação por teclado, rótulos ARIA.
