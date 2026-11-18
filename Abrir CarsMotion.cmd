@echo off
setlocal EnableExtensions DisableDelayedExpansion
title CarsMotion - Vista local

if not exist "%~dp0dist\index.html" goto :missing
set "CARSMOTION_ARCH=%PROCESSOR_ARCHITECTURE%"
if defined PROCESSOR_ARCHITEW6432 set "CARSMOTION_ARCH=%PROCESSOR_ARCHITEW6432%"
if /i "%CARSMOTION_ARCH%"=="AMD64" goto :amd64
if /i "%CARSMOTION_ARCH%"=="ARM64" goto :arm64
if /i "%CARSMOTION_ARCH%"=="x86" goto :x86

echo Error: esta arquitectura de Windows no es compatible.
goto :error

:amd64
set "CARSMOTION_SERVER=%~dp0runtime\CarsMotion-x64.exe"
goto :launch

:arm64
set "CARSMOTION_SERVER=%~dp0runtime\CarsMotion-arm64.exe"
goto :launch

:x86
set "CARSMOTION_SERVER=%~dp0runtime\CarsMotion-x86.exe"

:launch
if not exist "%CARSMOTION_SERVER%" goto :missing
"%CARSMOTION_SERVER%"
if "%ERRORLEVEL%"=="0" exit /b 0
echo.
echo Error: CarsMotion no pudo iniciarse o se cerro de forma inesperada.
goto :error

:missing
echo Error: faltan archivos de CarsMotion.
echo Descarga el proyecto con Code - Download ZIP y selecciona Extraer todo.
echo https://github.com/A1rton/cars-motion

:error
echo.
pause
exit /b 1
