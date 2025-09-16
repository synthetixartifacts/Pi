@echo off
REM Pi Voice Assistant - Universal Startup Script for Windows
REM Auto-runs WSL with the universal start script

setlocal enabledelayedexpansion

echo ========================================
echo   Pi Voice Assistant - Windows Launcher
echo ========================================
echo.

REM Check if WSL is installed
wsl --status >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: WSL is not installed!
    echo.
    echo Please install WSL first:
    echo   1. Open PowerShell as Administrator
    echo   2. Run: wsl --install
    echo   3. Restart your computer
    echo.
    pause
    exit /b 1
)

REM Check if Docker Desktop is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Desktop is not running. Starting it now...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start (45 seconds)...
    timeout /t 45 /nobreak >nul
)

REM Get the current directory in WSL format
set "CURRENT_DIR=%cd%"
set "WSL_PATH=%CURRENT_DIR:\=/%"
set "WSL_PATH=%WSL_PATH:C:=/mnt/c%"
set "WSL_PATH=%WSL_PATH:D:=/mnt/d%"
set "WSL_PATH=%WSL_PATH:E:=/mnt/e%"

echo Running Pi Voice Assistant in WSL...
echo.

REM Run the universal start script in WSL
wsl bash -c "cd '%WSL_PATH%' && ./start.sh"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Pi Voice Assistant is running!
    echo   Access at: http://localhost:8080
    echo ========================================
) else (
    echo.
    echo ERROR: Failed to start services
    echo Check the error messages above
)

echo.
echo Press any key to exit...
pause >nul