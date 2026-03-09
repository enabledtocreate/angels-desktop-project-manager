@echo off
if not "%~1"=="hidden" (
  wscript //nologo "%~dp0Angels Project Manager.vbs"
  exit /b 0
)
title Angel's Project Manager
cd /d "%~dp0"
if not exist "package.json" (
  echo package.json not found.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)
npm start
exit
