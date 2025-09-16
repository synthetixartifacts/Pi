#!/bin/bash

# Pi Voice Assistant - Raspberry Pi Startup Script
# Optimized for Raspberry Pi 5 with resource constraints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════╗
║    Pi Voice Assistant - Raspberry Pi  ║
║         Starting Services...          ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# Change to project root
cd "$(dirname "$0")/.."

# Check if running on Raspberry Pi
if [[ -f /proc/device-tree/model ]]; then
    MODEL=$(cat /proc/device-tree/model)
    echo -e "${MAGENTA}🍓 Running on: $MODEL${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Not running on Raspberry Pi${NC}"
fi

echo -e "${YELLOW}🔍 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Installing Docker for Raspberry Pi..."
    
    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        
        echo -e "${YELLOW}Docker installed. Please log out and back in, then run this script again.${NC}"
        exit 0
    else
        echo "Starting Docker service..."
        sudo systemctl start docker
        sleep 5
        
        if ! docker info > /dev/null 2>&1; then
            echo -e "${RED}Docker failed to start. Check: sudo systemctl status docker${NC}"
            exit 1
        fi
    fi
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check available memory
TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
echo -e "${BLUE}💾 Available RAM: ${TOTAL_MEM}MB${NC}"

if [ $TOTAL_MEM -lt 2048 ]; then
    echo -e "${YELLOW}⚠️  Low memory detected. Adjusting limits...${NC}"
    MEMORY_LIMIT="1g"
    CPU_LIMIT="2"
else
    MEMORY_LIMIT="2g"
    CPU_LIMIT="2"
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file for Raspberry Pi...${NC}"
    cat > .env << ENV_FILE
# Platform Configuration
PLATFORM=pi

# Common Settings
GENERIC_TIMEZONE=America/Toronto
CPU_LIMIT=$CPU_LIMIT
MEMORY_LIMIT=$MEMORY_LIMIT

# Service Ports
N8N_PORT=5678
STT_PORT=8000
TTS_PORT=5000
WEB_PORT=8080

# n8n Configuration
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme123
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || echo "n8n-encryption-key-min-24-chars-change-me")

# Whisper STT Configuration (using tiny model for Pi)
WHISPER_MODEL=tiny.en
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

# Enable required kernel modules for audio (if using USB audio)
if lsmod | grep -q snd_usb_audio; then
    echo -e "${GREEN}✅ USB audio module loaded${NC}"
else
    echo -e "${YELLOW}Loading USB audio module...${NC}"
    sudo modprobe snd_usb_audio 2>/dev/null || true
fi

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker compose -f docker-compose.pi.yml down 2>/dev/null || true

# Clean up to save space
echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
docker system prune -f --volumes 2>/dev/null || true

# Pull latest images
echo -e "${YELLOW}📦 Pulling Docker images (this may take a while on Pi)...${NC}"
docker compose -f docker-compose.pi.yml pull

# Build TTS with Pi-specific Dockerfile
echo -e "${YELLOW}🔨 Building TTS service for ARM64...${NC}"
docker compose -f docker-compose.pi.yml build tts

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker compose -f docker-compose.pi.yml up -d

# Wait for services to be healthy (longer wait for Pi)
echo -e "${YELLOW}⏳ Waiting for services to initialize (this takes longer on Pi)...${NC}"
sleep 10

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local max_attempts=60  # More attempts for Pi
    local attempt=1
    
    echo -n "  Checking $service"
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            return 0
        fi
        echo -n "."
        sleep 3
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}❌${NC}"
    echo -e "${YELLOW}  $service is taking longer to start. Check logs: docker compose -f docker-compose.pi.yml logs $service${NC}"
    return 1
}

# Check each service
echo -e "${YELLOW}Checking services:${NC}"
check_service "n8n" "http://localhost:5678/healthz"
check_service "STT" "http://localhost:8000/health"
check_service "TTS" "http://localhost:5000/health"
check_service "Web" "http://localhost:8080"

# Check GPIO access (if needed for wake word button)
if [ -e /dev/gpiomem ]; then
    echo -e "${GREEN}✅ GPIO access available${NC}"
else
    echo -e "${YELLOW}ℹ️  No GPIO access (normal if not using GPIO)${NC}"
fi

# Display system stats
echo ""
echo -e "${BLUE}System Status:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Display status
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   🎉 Pi Voice Assistant Ready on Pi!  ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Access Points:${NC}"
echo -e "  📊 n8n:     ${GREEN}http://$(hostname -I | cut -d' ' -f1):5678${NC} (admin/changeme123)"
echo -e "  🎙️  STT API: ${GREEN}http://$(hostname -I | cut -d' ' -f1):8000${NC}"
echo -e "  🔊 TTS API: ${GREEN}http://$(hostname -I | cut -d' ' -f1):5000${NC}"
echo -e "  🌐 Web UI:  ${GREEN}http://$(hostname -I | cut -d' ' -f1):8080${NC}"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo -e "  View logs:  ${BLUE}docker compose -f docker-compose.pi.yml logs -f${NC}"
echo -e "  Stop:       ${BLUE}docker compose -f docker-compose.pi.yml down${NC}"
echo -e "  Restart:    ${BLUE}./start/start_pi.sh${NC}"
echo -e "  Monitor:    ${BLUE}docker stats${NC}"
echo ""
echo -e "${MAGENTA}Performance Tips:${NC}"
echo -e "  • Using 'tiny.en' Whisper model for faster response"
echo -e "  • Resource limits set to ${CPU_LIMIT} CPUs, ${MEMORY_LIMIT} RAM"
echo -e "  • Access from other devices using: http://$(hostname -I | cut -d' ' -f1):8080"
echo ""

# Try to open browser if display is available
if [ -n "$DISPLAY" ]; then
    echo -e "${YELLOW}Opening Web UI in browser...${NC}"
    xdg-open "http://localhost:8080" 2>/dev/null || chromium-browser "http://localhost:8080" 2>/dev/null || echo "Open http://localhost:8080 in your browser"
else
    echo -e "${BLUE}Access the Web UI from any device: http://$(hostname -I | cut -d' ' -f1):8080${NC}"
fi

echo -e "${GREEN}Ready to use! Say 'Hey Pi' to activate.${NC}"