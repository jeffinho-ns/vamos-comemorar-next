# Alias: mesmo fluxo que `yarn dev` (ensure-single-dev.mjs).
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
& node "./scripts/ensure-single-dev.mjs"
