#!/bin/bash

# Pi Voice Assistant - macOS Startup Script
# This script handles all setup and startup for macOS (including Apple Silicon)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║     Pi Voice Assistant - macOS       ║
║         Starting Services...          ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# Change to project root
cd "$(dirname "$0")/.."

echo -e "${YELLOW}🔍 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop and try again."
    
    # Try to open Docker Desktop on macOS
    if command -v open &> /dev/null; then
        echo -e "${YELLOW}Attempting to start Docker Desktop...${NC}"
        open -a Docker
        echo "Waiting for Docker to start (30 seconds)..."
        sleep 30
        
        if ! docker info > /dev/null 2>&1; then
            echo -e "${RED}Docker still not running. Please start it manually.${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check for Apple Silicon
if [[ $(uname -m) == "arm64" ]]; then
    echo -e "${BLUE}🍎 Apple Silicon detected - using Rosetta emulation${NC}"
    export DOCKER_DEFAULT_PLATFORM=linux/amd64
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cat > .env << 'ENV_FILE'
# Platform Configuration
PLATFORM=mac

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
docker compose -f docker-compose.mac.yml down 2>/dev/null || true

# Pull latest images
echo -e "${YELLOW}📦 Pulling Docker images...${NC}"
docker compose -f docker-compose.mac.yml pull

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker compose -f docker-compose.mac.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service failed to start${NC}"
    return 1
}

# Check each service
echo -e "${YELLOW}Checking services:${NC}"
check_service "n8n" "http://localhost:5678/healthz"
check_service "STT" "http://localhost:8000/health"
check_service "TTS" "http://localhost:5000/health"
check_service "Web" "http://localhost:8080"

# Display status
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}     🎉 Pi Voice Assistant Ready!      ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Access Points:${NC}"
echo -e "  📊 n8n:     ${GREEN}http://localhost:5678${NC} (admin/changeme123)"
echo -e "  🎙️  STT API: ${GREEN}http://localhost:8000${NC}"
echo -e "  🔊 TTS API: ${GREEN}http://localhost:5000${NC}"
echo -e "  🌐 Web UI:  ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo -e "  View logs:  ${BLUE}docker compose -f docker-compose.mac.yml logs -f${NC}"
echo -e "  Stop:       ${BLUE}docker compose -f docker-compose.mac.yml down${NC}"
echo -e "  Restart:    ${BLUE}./start/start_mac.sh${NC}"
echo ""

# Open browser
echo -e "${YELLOW}Opening Web UI in browser...${NC}"
sleep 2
open "http://localhost:8080" 2>/dev/null || echo "Please open http://localhost:8080 in your browser"

echo -e "${GREEN}Ready to use! Say 'Hey Pi' to activate.${NC}"