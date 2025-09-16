#!/bin/bash

# Pi Voice Assistant - Universal Startup Script
# Auto-detects platform and runs appropriate configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════╗
║        Pi Voice Assistant - Universal      ║
║           Auto-Detecting Platform...       ║
╚════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Platform detection function
detect_platform() {
    local platform=""

    # Check for Raspberry Pi first
    if [[ -f /proc/device-tree/model ]] && grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
        platform="pi"
        echo -e "${MAGENTA}🍓 Detected: Raspberry Pi${NC}" >&2
        MODEL=$(cat /proc/device-tree/model)
        echo -e "${MAGENTA}   Model: $MODEL${NC}" >&2
    # Check for WSL
    elif grep -qi microsoft /proc/version 2>/dev/null; then
        platform="wsl"
        echo -e "${CYAN}🪟 Detected: Windows WSL2${NC}" >&2
    # Check for macOS
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        platform="mac"
        echo -e "${GREEN}🍎 Detected: macOS${NC}" >&2
        if [[ $(uname -m) == "arm64" ]]; then
            echo -e "${GREEN}   Architecture: Apple Silicon (ARM64)${NC}" >&2
            export DOCKER_DEFAULT_PLATFORM=linux/amd64
        else
            echo -e "${GREEN}   Architecture: Intel x86_64${NC}" >&2
        fi
    # Check for generic Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        platform="linux"
        echo -e "${BLUE}🐧 Detected: Linux${NC}" >&2
    else
        platform="unknown"
        echo -e "${RED}❓ Unknown platform: $OSTYPE${NC}" >&2
    fi

    echo "$platform"
}

# Docker check function
check_docker() {
    local platform=$1

    echo -e "${YELLOW}🔍 Checking Docker...${NC}"

    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running!${NC}"

        case $platform in
            mac)
                echo -e "${YELLOW}Attempting to start Docker Desktop...${NC}"
                if command -v open &> /dev/null; then
                    open -a Docker
                    echo "Waiting for Docker to start (30 seconds)..."
                    sleep 30
                fi
                ;;
            wsl)
                echo -e "${YELLOW}Attempting to start Docker Desktop from WSL...${NC}"
                if [ -f "/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe" ]; then
                    "/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe" &
                    echo "Waiting for Docker to start (45 seconds)..."
                    sleep 45
                fi
                ;;
            pi|linux)
                echo "Installing Docker..."
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
                fi
                ;;
        esac

        # Final check
        if ! docker info > /dev/null 2>&1; then
            echo -e "${RED}Docker still not running. Please start it manually.${NC}"
            exit 1
        fi
    fi

    echo -e "${GREEN}✅ Docker is running${NC}"
}

# .env file creation/update function
setup_env() {
    local platform=$1
    local env_exists=false
    local env_backup=""

    if [ -f .env ]; then
        env_exists=true
        echo -e "${BLUE}📄 Found existing .env file${NC}"

        # Check if PLATFORM is already set
        if grep -q "^PLATFORM=" .env; then
            CURRENT_PLATFORM=$(grep "^PLATFORM=" .env | cut -d'=' -f2)
            echo -e "${BLUE}   Current PLATFORM=$CURRENT_PLATFORM${NC}"

            # Update platform if different
            if [ "$CURRENT_PLATFORM" != "$platform" ]; then
                echo -e "${YELLOW}   Updating PLATFORM to $platform${NC}"
                # Create backup
                cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
                # Update platform
                sed -i.tmp "s/^PLATFORM=.*/PLATFORM=$platform/" .env && rm -f .env.tmp 2>/dev/null || \
                sed -i "s/^PLATFORM=.*/PLATFORM=$platform/" .env
            fi
        else
            # Add PLATFORM if missing
            echo -e "${YELLOW}   Adding PLATFORM=$platform${NC}"
            # Create a temporary file with the platform config
            {
                echo "# Platform Configuration"
                echo "PLATFORM=$platform"
                echo ""
                cat .env
            } > .env.new
            mv .env.new .env
        fi
    else
        echo -e "${YELLOW}📝 Creating .env file...${NC}"

        # Set platform-specific defaults
        case $platform in
            pi)
                MEMORY_LIMIT="2g"
                CPU_LIMIT="2"
                WHISPER_MODEL="tiny.en"
                ;;
            mac|wsl|linux)
                MEMORY_LIMIT="4g"
                CPU_LIMIT="4"
                WHISPER_MODEL="small.en"
                ;;
            *)
                MEMORY_LIMIT="4g"
                CPU_LIMIT="4"
                WHISPER_MODEL="small.en"
                ;;
        esac

        # Generate secure encryption key
        ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || echo "n8n-encryption-key-min-32-chars-change-me")

        cat > .env << ENV_FILE
# Platform Configuration
PLATFORM=$platform

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
N8N_ENCRYPTION_KEY=$ENCRYPTION_KEY

# Whisper STT Configuration
WHISPER_MODEL=$WHISPER_MODEL
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

# Piper TTS Configuration
PIPER_VOICE=en_US-amy-medium
PIPER_SPEAKER=0
ENV_FILE

        echo -e "${GREEN}✅ .env file created with $platform defaults${NC}"
    fi
}

# Compose file selection function
get_compose_file() {
    local platform=$1

    case $platform in
        mac)
            echo "docker-compose.mac.yml"
            ;;
        pi)
            echo "docker-compose.pi.yml"
            ;;
        wsl|linux)
            echo "docker-compose.yml"
            ;;
        *)
            echo "docker-compose.yml"
            ;;
    esac
}

# Service health check function
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
    return 1
}

# Main execution
main() {
    # Detect platform
    PLATFORM=$(detect_platform)

    if [ "$PLATFORM" == "unknown" ]; then
        echo -e "${RED}Unable to detect platform. Please use platform-specific scripts in ./start/${NC}"
        exit 1
    fi

    echo ""

    # Check Docker
    check_docker "$PLATFORM"

    echo ""

    # Setup .env
    setup_env "$PLATFORM"

    echo ""

    # Create necessary directories
    echo -e "${YELLOW}📁 Creating directories...${NC}"
    mkdir -p services/n8n/files
    mkdir -p services/stt/config
    mkdir -p services/tts/voices
    mkdir -p web
    echo -e "${GREEN}✅ Directories ready${NC}"

    echo ""

    # Get appropriate compose file
    COMPOSE_FILE=$(get_compose_file "$PLATFORM")
    echo -e "${BLUE}📄 Using compose file: $COMPOSE_FILE${NC}"

    # Stop existing containers
    echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
    docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true

    echo ""

    # Pull images
    echo -e "${YELLOW}📦 Pulling Docker images...${NC}"
    docker compose -f "$COMPOSE_FILE" pull

    # Build if needed (especially for TTS on Pi)
    if [ "$PLATFORM" == "pi" ] && [ -f "services/tts/Dockerfile.pi" ]; then
        echo -e "${YELLOW}🔨 Building TTS for ARM64...${NC}"
        docker compose -f "$COMPOSE_FILE" build tts
    elif [ -f "services/tts/Dockerfile" ]; then
        echo -e "${YELLOW}🔨 Building TTS service...${NC}"
        docker compose -f "$COMPOSE_FILE" build tts
    fi

    echo ""

    # Start services
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d

    echo ""

    # Wait for services
    echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
    sleep 5

    # Check services
    echo -e "${YELLOW}Checking services:${NC}"
    check_service "n8n" "http://localhost:5678/healthz"
    check_service "STT" "http://localhost:8000/health"
    check_service "TTS" "http://localhost:5000/health"
    check_service "Web" "http://localhost:8080"

    echo ""

    # Get IP for network access
    if [ "$PLATFORM" == "pi" ]; then
        IP=$(hostname -I | cut -d' ' -f1)
    else
        IP="localhost"
    fi

    # Display success message
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}     🎉 Pi Voice Assistant Ready!      ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Platform: ${YELLOW}$PLATFORM${NC}"
    echo -e "${BLUE}Compose:  ${YELLOW}$COMPOSE_FILE${NC}"
    echo ""
    echo -e "${BLUE}Access Points:${NC}"
    echo -e "  📊 n8n:     ${GREEN}http://$IP:5678${NC} (admin/changeme123)"
    echo -e "  🎙️  STT API: ${GREEN}http://$IP:8000${NC}"
    echo -e "  🔊 TTS API: ${GREEN}http://$IP:5000${NC}"
    echo -e "  🌐 Web UI:  ${GREEN}http://$IP:8080${NC}"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo -e "  View logs:  ${BLUE}docker compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "  Stop:       ${BLUE}docker compose -f $COMPOSE_FILE down${NC}"
    echo -e "  Restart:    ${BLUE}./start.sh${NC}"
    echo ""

    # Try to open browser
    echo -e "${YELLOW}Opening Web UI in browser...${NC}"
    case $PLATFORM in
        mac)
            open "http://localhost:8080" 2>/dev/null || true
            ;;
        wsl)
            if command -v wslview &> /dev/null; then
                wslview "http://localhost:8080" 2>/dev/null || true
            elif [ -f "/mnt/c/Windows/System32/cmd.exe" ]; then
                /mnt/c/Windows/System32/cmd.exe /c start http://localhost:8080 2>/dev/null || true
            fi
            ;;
        pi|linux)
            if [ -n "$DISPLAY" ]; then
                xdg-open "http://localhost:8080" 2>/dev/null || true
            else
                echo -e "${BLUE}Access from any device: http://$IP:8080${NC}"
            fi
            ;;
    esac

    echo ""
    echo -e "${GREEN}Ready to use! Say 'Hey Pi' to activate.${NC}"
}

# Run main function
main