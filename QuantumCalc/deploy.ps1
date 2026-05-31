# deploy.ps1 — copia os arquivos de runtime (PWA) do projeto WSL para o Z:\quantum (SSHFS → /var/www/html/quantum)
$ErrorActionPreference = 'Stop'
$src = '\\wsl.localhost\Ubuntu-22.04\home\jasmine\Doutorado\quantum\QuantumCalc'
$dst = 'Z:\quantum'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$files = 'quantum_calc.html','manual.html','manifest.webmanifest','sw.js','index.html','README.md'
foreach ($f in $files) { Copy-Item -Force (Join-Path $src $f) $dst }
foreach ($d in 'icons','vendor') {
  if (Test-Path (Join-Path $dst $d)) { Remove-Item -Recurse -Force (Join-Path $dst $d) }
  Copy-Item -Recurse -Force (Join-Path $src $d) $dst
}
Write-Output "DEPLOYED -> $dst"
Get-ChildItem -Recurse $dst | Sort-Object FullName | ForEach-Object { $_.FullName }
