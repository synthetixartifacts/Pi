#!/bin/bash

# Pi Voice Assistant - Windows WSL Startup Script
# This script handles all setup and startup for Windows running in WSL2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║   Pi Voice Assistant - Windows/WSL2   ║
║         Starting Services...          ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# Change to project root
cd "$(dirname "$0")/.."

# Detect if running in WSL
if grep -qi microsoft /proc/version; then
    echo -e "${CYAN}🪟 Running in WSL2 environment${NC}"
    
    # Check WSL version
    if [ -f /proc/sys/fs/binfmt_misc/WSLInterop ]; then
        echo -e "${GREEN}✅ WSL2 detected${NC}"
    else
        echo -e "${YELLOW}⚠️  WSL1 detected - Docker may not work properly${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Not running in WSL - using this script anyway${NC}"
fi

echo -e "${YELLOW}🔍 Checking Docker...${NC}"

# Function to check Docker Desktop
check_docker_desktop() {
    # Check if Docker Desktop is running via Windows
    if command -v docker.exe &> /dev/null; then
        docker.exe info > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Docker Desktop (Windows) is running${NC}"
            return 0
        fi
    fi
    return 1
}

# Check if Docker is available
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not accessible from WSL!${NC}"
    
    # Try to check Docker Desktop on Windows side
    if check_docker_desktop; then
        echo -e "${YELLOW}Docker Desktop is running but not accessible from WSL${NC}"
        echo "Please ensure:"
        echo "1. Docker Desktop > Settings > Resources > WSL Integration is enabled"
        echo "2. Your WSL distro is selected in the integration list"
        echo "3. Restart WSL: wsl --shutdown (from Windows)"
        exit 1
    else
        echo -e "${YELLOW}Attempting to start Docker Desktop...${NC}"
        
        # Try to start Docker Desktop from WSL
        if [ -f "/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe" ]; then
            "/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe" &
            echo "Waiting for Docker Desktop to start (45 seconds)..."
            
            for i in {1..45}; do
                if docker info > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ Docker is now running${NC}"
                    break
                fi
                echo -n "."
                sleep 1
            done
            
            if ! docker info > /dev/null 2>&1; then
                echo -e "${RED}Docker Desktop failed to start or connect to WSL${NC}"
                echo "Please start Docker Desktop manually and ensure WSL integration is enabled"
                exit 1
            fi
        else
            echo -e "${RED}Docker Desktop not found. Please install it first.${NC}"
            echo "Download from: https://www.docker.com/products/docker-desktop"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✅ Docker is running and accessible from WSL${NC}"
fi

# Check Docker context (should be default for WSL)
DOCKER_CONTEXT=$(docker context show 2>/dev/null || echo "default")
echo -e "${BLUE}📍 Docker context: $DOCKER_CONTEXT${NC}"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cat > .env << 'ENV_FILE'
# Platform Configuration
PLATFORM=windows-wsl

# Common Settings
GENERIC_TIMEZONE=America/Toronto
CPU_LIMIT=4
MEMORY_LIMIT=4g

# Service Ports
N8N_PORT=5678
STT_PORT=8000
TTS_PORT=5000
WEB_PORT=8080

# n8n Configuration
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme123
N8N_ENCRYPTION_KEY=n8n-encryption-key-min-24-chars-change-me

# Whisper STT Configuration
WHISPER_MODEL=small.en
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

# Piper TTS Configuration
PIPER_VOICE=en_US-amy-medium
PIPER_SPEAKER=0
ENV_FILE
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p services/n8n/files
mkdir -p services/stt/config
mkdir -p services/tts/voices
mkdir -p web
echo -e "${GREEN}✅ Directories ready${NC}"

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker compose down 2>/dev/null || true

# Pull latest images
echo -e "${YELLOW}📦 Pulling Docker images...${NC}"
docker compose pull

# Build TTS service
echo -e "${YELLOW}🔨 Building TTS service...${NC}"
docker compose build tts

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "  Checking $service"
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}❌${NC}"
    echo -e "${YELLOW}  Check logs: docker compose logs $service${NC}"
    return 1
}

# Check each service
echo -e "${YELLOW}Checking services:${NC}"
check_service "n8n" "http://localhost:5678/healthz"
check_service "STT" "http://localhost:8000/health"
check_service "TTS" "http://localhost:5000/health"
check_service "Web" "http://localhost:8080"

# Get Windows host IP for network access
WIN_HOST_IP=$(ip route show | grep -i default | awk '{ print $3}')

# Display status
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}     🎉 Pi Voice Assistant Ready!      ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Access Points (from WSL/Linux):${NC}"
echo -e "  📊 n8n:     ${GREEN}http://localhost:5678${NC} (admin/changeme123)"
echo -e "  🎙️  STT API: ${GREEN}http://localhost:8000${NC}"
echo -e "  🔊 TTS API: ${GREEN}http://localhost:5000${NC}"
echo -e "  🌐 Web UI:  ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "${BLUE}Access Points (from Windows browser):${NC}"
echo -e "  📊 n8n:     ${GREEN}http://localhost:5678${NC}"
echo -e "  🌐 Web UI:  ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo -e "  View logs:  ${BLUE}docker compose logs -f${NC}"
echo -e "  Stop:       ${BLUE}docker compose down${NC}"
echo -e "  Restart:    ${BLUE}./start/start_windows.sh${NC}"
echo ""

# Try to open browser on Windows side
echo -e "${YELLOW}Opening Web UI in Windows browser...${NC}"

# Multiple methods to open browser from WSL
if command -v wslview &> /dev/null; then
    wslview "http://localhost:8080" 2>/dev/null
elif [ -f "/mnt/c/Windows/System32/cmd.exe" ]; then
    /mnt/c/Windows/System32/cmd.exe /c start http://localhost:8080 2>/dev/null
elif command -v explorer.exe &> /dev/null; then
    explorer.exe "http://localhost:8080" 2>/dev/null
else
    echo -e "${YELLOW}Could not auto-open browser. Please open: ${GREEN}http://localhost:8080${NC}"
fi

echo ""
echo -e "${CYAN}WSL Tips:${NC}"
echo -e "  • Browser audio works best from Windows side"
echo -e "  • If services are slow, increase Docker Desktop resources"
echo -e "  • Settings > Resources > WSL2 > Memory/CPU limits"
echo ""
echo -e "${GREEN}Ready to use! Say 'Hey Pi' to activate.${NC}"