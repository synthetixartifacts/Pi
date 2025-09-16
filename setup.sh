#!/bin/bash

# Pi Voice Assistant - Cross-Platform Setup Script
set -e

echo "Pi Voice Assistant Setup"
echo "========================"

# Detect platform
detect_platform() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "mac"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [[ -f /proc/device-tree/model ]] && grep -q "Raspberry Pi" /proc/device-tree/model; then
            echo "pi"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

PLATFORM=$(detect_platform)
echo "Detected platform: $PLATFORM"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Platform Configuration
PLATFORM=$PLATFORM

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
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || echo "n8n-encryption-key-min-24-chars-change-me")

# Whisper STT Configuration
WHISPER_MODEL=small.en
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8

# Piper TTS Configuration
PIPER_VOICE=en_US-amy-medium
PIPER_SPEAKER=0
EOF
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi

# Platform-specific adjustments
case $PLATFORM in
    mac)
        echo "Configuring for macOS..."
        # For Apple Silicon Macs
        if [[ $(uname -m) == "arm64" ]]; then
            echo "Apple Silicon detected - using Rosetta emulation for x86 containers"
            export DOCKER_DEFAULT_PLATFORM=linux/amd64
        fi
        ;;
    pi)
        echo "Configuring for Raspberry Pi..."
        # Adjust memory limits for Pi
        sed -i 's/MEMORY_LIMIT=4g/MEMORY_LIMIT=2g/' .env 2>/dev/null || \
        sed -i '' 's/MEMORY_LIMIT=4g/MEMORY_LIMIT=2g/' .env
        sed -i 's/CPU_LIMIT=4/CPU_LIMIT=2/' .env 2>/dev/null || \
        sed -i '' 's/CPU_LIMIT=4/CPU_LIMIT=2/' .env
        ;;
    windows)
        echo "Configuring for Windows (WSL2)..."
        ;;
esac

# Create necessary directories
echo "Creating directories..."
mkdir -p services/n8n/files
mkdir -p services/stt/config
mkdir -p services/tts/voices
mkdir -p web

# Pull base images
echo "Pulling Docker images..."
docker pull --platform linux/amd64 n8nio/n8n:1.110.1
docker pull --platform linux/amd64 fedirz/faster-whisper-server:latest-cpu
docker pull --platform linux/amd64 nginx:1.25-alpine

# Build TTS service
echo "Building TTS service..."
docker compose build tts

echo ""
echo "Setup complete! 🎉"
echo ""
echo "To start the services, run:"
echo "  docker compose up -d"
echo ""
echo "Access points:"
echo "  - n8n:     http://localhost:5678 (admin/changeme123)"
echo "  - STT API: http://localhost:8000"
echo "  - TTS API: http://localhost:5000"
echo "  - Web UI:  http://localhost:8080"
echo ""
echo "Platform: $PLATFORM"