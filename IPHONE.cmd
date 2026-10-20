@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or newer and try again.
  pause
  exit /b 1
)
echo Connect your iPhone and computer to the same Wi-Fi.
echo If prompted by Windows, allow access on the private network.
node scripts/serve.mjs --lan
pause
