#!/usr/bin/env bash
# Publica o runtime do Quantum Calculator via SSH/scp (chave id_ed25519_qcalc), SEM depender do Z: (SSHFS).
# Uso: ./deploy-ssh.sh        → 6 arquivos de runtime (rápido)
#      ./deploy-ssh.sh --full → também reenvia icons/ e vendor/ (KaTeX)
set -euo pipefail
SRC="/home/jasmine/Doutorado/quantum/QuantumCalc"
SCP="scp -i $HOME/.ssh/id_ed25519_qcalc -o BatchMode=yes -q"
DST="www-data@191.252.186.68:/var/www/html/quantum"
$SCP "$SRC/quantum_calc.html" "$SRC/manual.html" "$SRC/manifest.webmanifest" "$SRC/sw.js" "$SRC/index.html" "$SRC/README.md" "$DST/"
if [ "${1:-}" = "--full" ]; then $SCP -r "$SRC/icons" "$SRC/vendor" "$DST/"; echo "  (+ icons/ e vendor/)"; fi
echo "DEPLOYED (ssh/scp) -> $DST"
