$ErrorActionPreference = "Stop"

& "$PSScriptRoot\check-backend.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& "$PSScriptRoot\check-mobile.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
