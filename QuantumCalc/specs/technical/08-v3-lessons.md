# Lições do projeto — ciclo v3 (Fase 7)

> Manipulação algébrica de estado CONCRETO (ket-string, base por qubit, fatorar/evidenciar).

## 1. Domínio: base de exibição ≠ base do estado
A maior fonte de confusão (apontada pela usuária) foi trabalhar só com **bases concretas
declaradas**. Separar a BASE DE EXIBIÇÃO (por qubit, recurso de render `viewPerQubit`) do
VETOR DE ESTADO (sempre comp, ℤ[ω]) foi a chave: o estado evolui por baixo, e o usuário
escolhe em que base ler cada qubit. A base "viaja" como preferência da UI (não no State),
mantida através das portas porque o array `qbasis` persiste.

## 2. Domínio: kickback só fatora com o AUTOESTADO certo
Phase kickback / teste de Hadamard só dá `\|ψ⟩⊗(controle com fase)` quando ψ é **autoestado
da porta controlada**. `\|+⟩`/`\|−⟩` são autoestados de X (use CNOT); `\|0⟩`/`\|1⟩` de Z/Rz
(use CRz). Com ψ não-autoestado o registrador EMARANHA — e a calculadora exata REVELA isso
(não força um produto inexistente). Valor didático real: pega o erro comum de "puxar `\|ψ⟩`
para fora" quando ψ não é autoestado (descasamento autoestado↔autovalor).

## 3. Render: "não distribuir" = fatorar qubits FIXOS, sem √/divisão
A forma fatorada exata e barata: na base por qubit, um qubit é "fixo" se tem o MESMO bit em
todos os termos (checagem exata, sem √). Evita extração de fator normalizado (que exigiria √/divisão).
**ORDEM POSICIONAL (correção P5):** fatora-se só os fixos nas BORDAS (antes do 1º variável e depois
do último); o miolo `[lo..hi]` (variáveis + fixos intercalados) vira a soma. Mantém a ordem dos qubits
(q0,q1,…) — aplicar uma porta NÃO troca os qubits de lugar no display (ex.: `|0⟩|+⟩` + H(Q0) →
`((1/√2)|0⟩+(1/√2)|1⟩)⊗|+⟩`, e não `|+⟩⊗(…)`). A factoredSym (simbólico) já era posicional.
Evidenciar um qubit/ket reusa o mesmo agrupamento; escalar comum via `DIV` exato só quando
não gera colchetes aninhados.

## 4. Notação: ⊗ só quando ajuda, e cuidado com o glifo
Bases diferentes entre qubits → separar por `⊗` (`\|0⟩⊗\|+⟩`); base uniforme → compacto
(`\|++⟩`). E o glifo `⊗` (U+2297) é pesado na fonte do visor a 21px → renderizar num `span`
a 0.6em. Formas com `⊗` não passam pelo KaTeX (o gerador de LaTeX não trata `⊗`) → texto Unicode.

## 5. FSM: buffer tipado resolve coexistência sem ambiguidade
A ket-string coexiste com bitstring/contagem dando ao buffer um "tipo" travado pelo 1º token
(dígito → num; ket → ket-string). Misturar = erro no token (recuperável). O mesmo `n Q`
seleciona um qubit e, conforme a tecla seguinte (porta / base / evidenciar / ket), dispara
ações diferentes — reuso elegante da seleção da FSM.

## 6. Processo: o gate ui_runnable é onde o requisito real aparece
O requisito do v3 evoluiu MUITO no gate empírico (AP5): "preparar kets" → "manter base por
qubit" → "não distribuir" → "Collect/Expand/evidenciar" → "evidenciar ket específico" →
"|ψ⟩ genérico". Cada rodada veio de a usuária VER rodando e reproduzir física concreta.
Lição: para features de manipulação algébrica/visualização, o teste manual humano não é
formalidade — é onde o requisito de fato se revela. Implementar em incrementos verificáveis
(INC1 fatorar, INC2 evidenciar) e validar cada um evitou retrabalho maior.

## 7. Limite: símbolos abstratos exigem outro motor (→ v4)
Tudo no v1–v3 é vetor CONCRETO (2^N amplitudes ℤ[ω]). Um ket genérico `\|ψ⟩` (abstrato, com
`U\|ψ⟩=λ\|ψ⟩` simbólico) é uma representação fundamentalmente diferente — não é extensão do
motor concreto. Reconhecer isso cedo evitou tentar "encaixar" símbolos no engine de vetor.
É o escopo do ciclo v4.
