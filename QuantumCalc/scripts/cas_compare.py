#!/usr/bin/env python3
# Affordance comparison (Section VII, Positioning).
#
# In the engine's regime (N <= 12) a general-purpose CAS is equally exact; the
# difference is setup cost. This file is the CAS side: it reproduces, for the
# HTH-CNOT state, the SAME exact invariants the engine returns from a one-line gate
# sequence -- the Schmidt spectrum {(2+sqrt2)/4, (2-sqrt2)/4} and concurrence
# 1/sqrt2 (Table I) -- but the quantum pipeline (gate matrices, tensor products,
# state application, partial trace, eigendecomposition, AND the surd simplification
# needed to get clean output) must all be written by hand. Contrast the engine:
#     s = CX(H(T(H(State.computational(2),0),0),0),0,1)
#     Ops.vonNeumann(s,[0]); Ops.concurrencePure(s)
#
# Requires: sympy.   Run:  python scripts/cas_compare.py
from sympy import sqrt, I, Matrix, eye, simplify, radsimp, expand_complex, conjugate
from sympy.physics.quantum import TensorProduct

# exact T-phase as the ring element omega = e^{i pi/4} = (1+i)/sqrt2 (avoids exp())
w    = (1 + I) / sqrt(2)
H    = Matrix([[1, 1], [1, -1]]) / sqrt(2)
T    = Matrix([[1, 0], [0, w]])
I2   = eye(2)
CNOT = Matrix([[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]])

clean = lambda x: radsimp(simplify(expand_complex(x)))   # force surd/rational form

psi = Matrix([1, 0, 0, 0])                       # |00>
for U in (TensorProduct(H, I2), TensorProduct(T, I2), TensorProduct(H, I2)):
    psi = U * psi
psi = CNOT * psi
psi = psi.applyfunc(clean)

# reduced density matrix of qubit A (trace out qubit B), by hand
rhoA = Matrix(2, 2, lambda i, j:
              clean(sum(psi[2*i + b] * conjugate(psi[2*j + b]) for b in range(2))))

spectrum = [clean(ev) for ev in rhoA.eigenvals()]        # diagonal -> exact surds
a, b, c, d = psi
det = a*d - b*c
concurrence = clean(2 * sqrt(clean(det * conjugate(det)))) # 2|det| via |det|^2

print("rho_A       =", rhoA.tolist())
print("spectrum    =", spectrum)        # expect (2 +/- sqrt2)/4
print("concurrence =", concurrence)     # expect sqrt(2)/2 = 1/sqrt2
