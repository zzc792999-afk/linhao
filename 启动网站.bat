@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 24 first.
  pause
  exit /b 1
)
if not exist "node_modules\pg" (
  call npm ci --omit=dev
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Open http://localhost:3000 after the server starts.
call npm start
pause
