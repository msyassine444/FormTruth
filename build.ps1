# FormTruth - build & verify helper (non-destructive).
#
# This script does NOT generate or overwrite extension source. It:
#   1. syncs the shared field vocabulary (backend/parsers/fields.json -> extension)
#   2. runs the Python test suite
#   3. runs the extension (Node) test suite
#
# Load the extension in Chrome:
#   chrome://extensions -> Developer mode -> Load unpacked -> select formtruth-extension/

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host '== Syncing field vocabulary ==' -ForegroundColor Cyan
python tools/sync_fields.py

Write-Host '== Python tests ==' -ForegroundColor Cyan
python -m pytest -q

Write-Host '== Extension tests (Node) ==' -ForegroundColor Cyan
Push-Location formtruth-extension
try { node --test } finally { Pop-Location }

Write-Host ''
Write-Host 'Done. Load unpacked extension from: formtruth-extension/' -ForegroundColor Green
