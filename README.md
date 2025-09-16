# Pi Voice Assistant - Quick Start

## 🚀 One-Command Start

```bash
./start.sh
```

That's it! The script auto-detects your platform (WSL2/Mac/Linux/Pi) and configures everything.

## What You Get

- 🎙️ **Wake Word** - "Hey Pi" activation
- 🗣️ **Speech-to-Text** - Whisper transcription
- 🔊 **Text-to-Speech** - Piper neural voice
- 🔄 **Automation** - n8n workflows
- 🌐 **Web UI** - Browser-based interface

## Access Points

After startup, access:
- **Web UI**: http://localhost:8080
- **n8n**: http://localhost:5678 (admin/changeme123)
- **STT API**: http://localhost:8000
- **TTS API**: http://localhost:5000

## Prerequisites

- Docker Desktop installed and running
- Modern web browser
- WSL2 (if on Windows)

## Troubleshooting

If `./start.sh` fails with "bad interpreter":
```bash
sed -i 's/\r$//' start.sh
chmod +x start.sh
./start.sh
```

## Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart
./start.sh
```

## Project Structure

```
Pi/
├── docker-compose.yml   # Main orchestration
├── start.sh            # Auto-detect & start script
├── services/           # Service configs
│   ├── n8n/
│   ├── stt/
│   └── tts/
├── web/               # Browser UI
└── README.md          # This file
```