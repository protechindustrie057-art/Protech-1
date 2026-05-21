@echo off
cd /d %~dp0
if not exist node_modules (
  echo Installing production dependencies...
  npm install --production
  if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies. Please install Node.js and rerun this script.
    pause
    exit /b 1
  )
)
echo Starting SK Parfumerie...
node server.js
