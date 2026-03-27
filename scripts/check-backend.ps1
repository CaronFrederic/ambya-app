param(
  [switch]$TestsOnly
)

$ErrorActionPreference = "Stop"

if (-not $TestsOnly) {
  cmd /c pnpm --filter api build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

cmd /c pnpm --filter api exec jest --runInBand
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
