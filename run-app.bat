@echo off
setlocal
cd /d %~dp0

set NODE_ENV=production
set PORT=3000
set NODE_EXE=node.exe

if exist "%~dp0node\node.exe" (
  set NODE_EXE=%~dp0node\node.exe
)

if not exist ".env.local" (
  if exist ".env.local.example" (
    copy ".env.local.example" ".env.local" >nul
    echo Le fichier .env.local a ete cree depuis l'exemple.
    echo Verifiez MONGODB_URI et MONGODB_DB avant de continuer.
    notepad ".env.local"
    pause
  )
)

if not exist "node_modules" (
  echo Le dossier node_modules est manquant.
  echo Recompilez l'installateur avec npm.cmd run prepare-release:portable.
  pause
  exit /b 1
)

if not exist "%NODE_EXE%" (
  where node >nul 2>nul
  if %ERRORLEVEL% neq 0 (
    echo Node.js est introuvable.
    echo Recompilez l'installateur avec le dossier node inclus ou installez Node.js LTS.
    pause
    exit /b 1
  )
  set NODE_EXE=node
)

echo Demarrage de ProTech Touch...
echo Adresse locale: http://localhost:%PORT%
start "" "http://localhost:%PORT%"
"%NODE_EXE%" server.js

endlocal
