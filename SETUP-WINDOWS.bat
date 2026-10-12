@echo off
setlocal
cd /d "%~dp0"
where bun >nul 2>nul
if errorlevel 1 (
  echo Bun is required. Install it from https://bun.com/docs/installation
  echo Restart your terminal after installation, then run this file again.
  pause
  exit /b 1
)
echo Installing project dependencies. Internet is required for this step.
call bun install --frozen-lockfile
if errorlevel 1 goto failure
call bun scripts/setup.ts
if errorlevel 1 goto failure
call bun run --filter @template/web build
if errorlevel 1 goto failure
echo Setup complete. Double-click START-WINDOWS.bat to open your workspace.
pause
exit /b 0
:failure
echo Setup failed. Read the error above and consult README.md.
pause
exit /b 1