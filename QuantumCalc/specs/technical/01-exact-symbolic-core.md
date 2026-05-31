# Núcleo de Representação Simbólica Exata (ℤ[ω])

> Fonte: pesquisa P0 (agente A), com citações. Domínio: representação exata de
> amplitudes de estados multi-qubit em JavaScript de arquivo único.
> **Veredito de viabilidade: EXATO É VIÁVEL** para Clifford+T + ângulos notáveis
> π/2^m + mudanças de base H/Y, com núcleo ℤ[ω] feito à mão sobre `BigInt`.
> Apenas ângulos arbitrários (Uθ genérico) ficam fora de qualquer anel fixo
> (resultado provado — Ross–Selinger / Solovay–Kitaev) → fallback numérico.

## 1. Fato estabelecido: fechamento algébrico dos conjuntos de portas

Giles & Selinger (arXiv:1212.0506) provam: uma unitária 2ⁿ×2ⁿ é exatamente
representável por um circuito Clifford+T **sse** suas entradas pertencem ao anel
**ℤ[1/√2, i]**. Esse anel é igual a **D[ω]** com **ω = e^{iπ/4} = (1+i)/√2**
(8ª raiz da unidade), e **ℤ[ω] = ℤ[ζ₈]** é o anel de inteiros do corpo
ciclotômico ℚ(ζ₈) (grau 4 sobre ℚ; base integral {1, ω, ω², ω³}).

- Relações fundamentais: **ω² = i**, **ω⁴ = −1**, **ω⁸ = 1**, **√2 = ω − ω³**.
- Clifford puro (H, S, CNOT) já vive em ℤ[1/√2, i] → o **mesmo anel** cobre
  Clifford e Clifford+T exatamente.
- Generalização para ângulos π/2^m: anel ℤ[ζ_{2^{m+1}}] (grau 2^m). Ex.: T usa
  ζ₈ (=ω, grau 4); porta π/8 usa ζ₁₆ (grau 8). Cobre QFT com fases notáveis.

## 2. Representação concreta em código (RECOMENDAÇÃO de engenharia)

Cada amplitude = elemento de ℤ[ω] com expoente de denominador global `k`:

```
amplitude = (a + b·ω + c·ω² + d·ω³) / (√2)^k     a,b,c,d,k ∈ ℤ (via BigInt)
```

Mantenha **um `k` global por vetor de estado** e tuplas inteiras por amplitude.
Nunca dividir em float. H introduz fator 1/√2 → incrementa `k`. T multiplica um
ramo por ω (não muda `k`).

## 3. Regras aritméticas exatas em ℤ[ω] (FATO, derivadas de ω⁴=−1)

Seja u = (a,b,c,d) = a + bω + cω² + dω³.

- **Soma:** componente a componente.
- **×ω (shift cíclico c/ sinal):** (a,b,c,d) ↦ (−d, a, b, c).
- **Multiplicação** (convolução polinomial + dobra ω⁴=−1):
  - e₀ = aa′ − bd′ − cc′ − db′
  - e₁ = ab′ + ba′ − cd′ − dc′
  - e₂ = ac′ + bb′ + ca′ − dd′
  - e₃ = ad′ + bc′ + cb′ + da′
- **Conjugado complexo** (ω† = −ω³): conj(a,b,c,d) = (a, −d, −c, −b).
- **Norma** N(t) = t·t† é um **inteiro** → usada para |amp|² exato e checagens.

### Esboço de tipo JS (sem dependências, ~80–100 linhas, inline)
```js
class Zomega {                 // a + b·ω + c·ω² + d·ω³,  ω = e^{iπ/4}
  constructor(a,b,c,d){ this.a=BigInt(a); this.b=BigInt(b); this.c=BigInt(c); this.d=BigInt(d); }
  add(o){ return new Zomega(this.a+o.a, this.b+o.b, this.c+o.c, this.d+o.d); }
  mulOmega(){ return new Zomega(-this.d, this.a, this.b, this.c); }   // ω⁴ = −1
  mul(o){ /* fórmulas e0..e3 */ }
  conj(){ return new Zomega(this.a, -this.d, -this.c, -this.b); }     // ω†=−ω³
}
```

## 4. Normalização exata
Estado de N qubits após circuito sempre tem a forma (1/√2^k)·(vetor de tuplas
ℤ[ω]). Reduzir `k` periodicamente: se toda amplitude não-nula é divisível por
√2 = (0,1,0,−1), divida e decremente `k` (menor expoente de denominador).

## 5. Display: ℤ[ω] → formas de exibição (RECOMENDAÇÃO)
Converter para a forma exata **(p + q·i + r·√2 + s·i·√2)/2^n** (Giles–Selinger §2):
- **Retangular a+bi:** Re = (p + r√2)/2ⁿ, Im = (q + s√2)/2ⁿ. Renderizar √2
  simbolicamente, nunca 1,41421…
- **Exponencial r·e^{iθ}:** magnitude exata r = √(N(t)/2^k) (N inteiro → surd
  exato). **Fase sempre múltipla de π/4** (consequência de viver em ℤ[ζ₈]); para
  ângulos π/2^m, múltiplos de π/2^m. As 8 direções ±1, ±i, ±(1±i)/√2 ↔
  θ ∈ {0, π/4, …, 7π/4}.
- **Polar (r, θ):** mesmos r e θ.
- Para amplitudes numéricas (θ arbitrário): magnitude/fase numéricas +
  reconhecimento de valores (§ fallback).

## 6. Tratamento de Uθ / rotações arbitrárias (DECISÃO PENDENTE — ver specs/validation)
Rotações de ângulo arbitrário **provadamente** não são exatas em nenhum anel fixo
(Ross–Selinger arXiv:1403.2975; Solovay–Kitaev). Estratégias:
- **Opção A (exata):** restringir Uθ a ângulos notáveis π/2^m → anel ciclotômico
  ℤ[ζ_{2^{m+1}}]. Cobre o currículo (Clifford+T, QFT).
- **Opção B (simbólica livre):** manter θ como símbolo (cos(θ/2), sin(θ/2),
  e^{iθ}) via CAS (nerdamer/algebrite). Bom para inspetor de 1 qubit; explode em
  N qubits.
- **Opção C (híbrida):** exato p/ Clifford+T e ângulos notáveis; fallback
  numérico (BigDecimal) + reconhecimento de valores (0,70710678→1/√2,
  0,8660254→√3/2, …) p/ θ arbitrário.
- **RECOMENDAÇÃO:** Opção A como núcleo exato + Opção C de fallback. Cobre a
  maioria dos circuitos de curso de forma exata e evita becos sem saída.

## 7. Tamanho do vetor de estado (FATO + RECOMENDAÇÃO)
N qubits → **2^N amplitudes** (crescimento exponencial). Simulação por vetor de
estado é limitada a ~30–50 qubits mesmo em supercomputadores (arXiv:2302.08880).
Com amplitudes exatas (4 BigInts cada), o teto prático no navegador é menor.
**RECOMENDAÇÃO: limitar N ≤ 8–12 qubits** (256–4096 amplitudes). Circuitos de
curso (Bell, GHZ, teleporte, Deutsch–Jozsa/Grover/QFT de 3–5 qubits) cabem
folgado. Exibir apenas amplitudes não-nulas.

## 8. Mudança de base é exata em ℤ[ω] (FATO)
- Base Hadamard {|+⟩,|−⟩}: H = (1/√2)[[1,1],[1,−1]], entradas ±1/√2 ∈ ℤ[ω]. Exato.
- Base circular/Y {|+i⟩,|−i⟩} = (|0⟩ ± i|1⟩)/√2: usa H e S/S†; i = ω² ∈ ℤ[ω]. Exato.
- Tensor de unitárias de 1 qubit em ℤ[ω] permanece em ℤ[ω] (anel fechado sob +,×,†).
- Medição: probabilidade |amp|² = N(t)/2^k é racional exato; renormalização só
  reescala o expoente √2 global → probabilidades de Born exibíveis como frações exatas.
