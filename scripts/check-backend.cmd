@echo off
cmd /c pnpm --filter api build
if errorlevel 1 exit /b %errorlevel%

cmd /c pnpm --filter api exec jest --runInBand
if errorlevel 1 exit /b %errorlevel%

