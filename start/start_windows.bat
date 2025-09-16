@echo off
REM Pi Voice Assistant - Windows Startup Script
REM This script handles all setup and startup for Windows with WSL2/Docker Desktop

setlocal enabledelayedexpansion

REM Colors setup (Windows 10+)
echo.

echo ========================================
echo     Pi Voice Assistant - Windows       
echo         Starting Services...          
echo ========================================
echo.

REM Change to project root
cd /d "%~dp0\.."

REM Check if Docker is running
echo Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo.
    echo Please ensure:
    echo 1. Docker Desktop is installed
    echo 2. WSL2 is enabled
    echo 3. Docker Desktop is running
    echo.
    
    REM Try to start Docker Desktop
    echo Attempting to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo Waiting for Docker to start (45 seconds)...
    timeout /t 45 /nobreak >nul
    
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo Docker still not running. Please start it manually.
        pause
        exit /b 1
    )
)
echo Docker is running
echo.

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo # Platform Configuration
        echo PLATFORM=windows
        echo.
        echo # Common Settings
        echo GENERIC_TIMEZONE=America/Toronto
        echo CPU_LIMIT=4
        echo MEMORY_LIMIT=4g
        echo.
        echo # Service Ports
        echo N8N_PORT=5678
        echo STT_PORT=8000
        echo TTS_PORT=5000
        echo WEB_PORT=8080
        echo.
        echo # n8n Configuration
        echo N8N_BASIC_AUTH_USER=admin
        echo N8N_BASIC_AUTH_PASSWORD=changeme123
        echo N8N_ENCRYPTION_KEY=n8n-encryption-key-min-24-chars-change-me
        echo.
        echo # Whisper STT Configuration
        echo WHISPER_MODEL=small.en
        echo WHISPER_DEVICE=cpu
        echo WHISPER_COMPUTE_TYPE=int8
        echo.
        echo # Piper TTS Configuration
        echo PIPER_VOICE=en_US-amy-medium
        echo PIPER_SPEAKER=0
    ) > .env
    echo .env file created
) else (
    echo .env file exists
)
echo.

REM Create necessary directories
echo Creating directories...
if not exist services\n8n\files mkdir services\n8n\files
if not exist services\stt\config mkdir services\stt\config
if not exist services\tts\voices mkdir services\tts\voices
if not exist web mkdir web
echo Directories ready
echo.

REM Stop any existing containers
echo Stopping existing containers...
docker compose down >nul 2>&1

REM Pull latest images
echo Pulling Docker images...
docker compose pull
echo.

REM Start services
echo Starting services...
docker compose up -d
echo.

REM Wait for services
echo Waiting for services to be healthy...
timeout /t 5 /nobreak >nul

REM Check service health
echo.
echo Checking services:

REM Check n8n
curl -s -f http://localhost:5678/healthz >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] n8n is ready
) else (
    echo [WAIT] n8n is starting...
)

REM Check STT
curl -s -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] STT is ready
) else (
    echo [WAIT] STT is starting...
)

REM Check TTS
curl -s -f http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] TTS is ready
) else (
    echo [WAIT] TTS is starting...
)

REM Check Web
curl -s -f http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Web UI is ready
) else (
    echo [WAIT] Web UI is starting...
)

REM Display status
echo.
echo ========================================
echo      Pi Voice Assistant Ready!         
echo ========================================
echo.
echo Access Points:
echo   n8n:     http://localhost:5678 (admin/changeme123)
echo   STT API: http://localhost:8000
echo   TTS API: http://localhost:5000
echo   Web UI:  http://localhost:8080
echo.
echo Commands:
echo   View logs:  docker compose logs -f
echo   Stop:       docker compose down
echo   Restart:    start\start_windows.bat
echo.

REM Open browser
echo Opening Web UI in browser...
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080"

echo.
echo Ready to use! Say 'Hey Pi' to activate.
echo.
echo Press any key to exit (services will continue running)...
pause >nul