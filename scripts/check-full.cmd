@echo off
call "%~dp0check-backend.cmd"
if errorlevel 1 exit /b %errorlevel%

call "%~dp0check-mobile.cmd"
if errorlevel 1 exit /b %errorlevel%
