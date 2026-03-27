$ErrorActionPreference = "Stop"

cmd /c pnpm exec tsc -p apps\mobile\tsconfig.json --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
