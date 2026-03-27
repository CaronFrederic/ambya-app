$ErrorActionPreference = "Stop"

cmd /c pnpm --filter api build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

cmd /c pnpm exec tsc -p apps\mobile\tsconfig.json --noEmit
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
