@echo off
setlocal
cd /d "%~dp0"
where bun >nul 2>nul
if errorlevel 1 goto setup
if not exist "node_modules" goto setup
if not exist "packages\web\dist\index.html" goto setup
call bun scripts/setup.ts
if errorlevel 1 goto failure
call bun scripts/start-local.ts
if errorlevel 1 goto failure
exit /b 0
:setup
echo Run SETUP-WINDOWS.bat first.
pause
exit /b 1
:failure
echo Could not start. Check whether another copy is already running on the assigned port.
pause
exit /b 1