@echo off
cmd /c pnpm exec tsc -p apps\mobile\tsconfig.json --noEmit
if errorlevel 1 exit /b %errorlevel%

