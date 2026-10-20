@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or newer, then reopen this file.
  pause
  exit /b 1
)
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo Installation failed. Check the connection and try again.
  pause
  exit /b 1
)
echo Open the Local URL below. Keep this window open.
call npm run dev
pause
