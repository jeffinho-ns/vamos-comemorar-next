# Backup local de todo o Firebase Storage (corre na raiz do repo ou de qualquer pasta).
# 1. Coloca o JSON da conta de serviço (Firebase Console → Definições → Contas de serviço → Gerar chave).
# 2. Ajusta $KeyJson e $Destino abaixo.
# 3. PowerShell: cd ...\vamos-comemorar-next ; .\scripts\download-firebase-storage.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

# Caminho absoluto ou relativo à raiz do repositório para o ficheiro .json
$KeyJson = Join-Path $RepoRoot "firebase-admin-key.json"
# Pasta no teu PC onde guardar os ficheiros (mantém pastas cardapio/, uploads/, etc.)
$Destino = Join-Path $env:USERPROFILE "Desktop\backup-firebase-storage"

if (-not (Test-Path -LiteralPath $KeyJson)) {
    Write-Host "Ficheiro de chave não encontrado: $KeyJson" -ForegroundColor Red
    Write-Host "Cria o JSON no Firebase Console e guarda-o nesse caminho, ou edita `$KeyJson neste .ps1."
    exit 1
}

$env:GOOGLE_APPLICATION_CREDENTIALS = (Resolve-Path -LiteralPath $KeyJson).Path
Set-Location $RepoRoot

Write-Host "Chave: $($env:GOOGLE_APPLICATION_CREDENTIALS)" -ForegroundColor Cyan
Write-Host "Destino: $Destino" -ForegroundColor Cyan

yarn download-firebase-storage -- "--out=$Destino"
