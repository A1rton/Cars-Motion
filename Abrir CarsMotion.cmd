@echo off
setlocal
title CarsMotion - Vista local
set "CARSMOTION_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "CARSMOTION_NODE=%ProgramFiles%\nodejs\node.exe"
if not "%CARSMOTION_NODE%"=="node" if not exist "%CARSMOTION_NODE%" (
  echo.
  echo Para abrir CarsMotion, instala Node.js 22.12 o posterior.
  echo Despues, vuelve a abrir este archivo.
  echo.
  pause
  exit /b 1
)
"%CARSMOTION_NODE%" "%~dp0scripts\preview.mjs"
if errorlevel 1 (
  echo.
  pause
)
endlocal
