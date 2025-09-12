# Pi Voice Assistant POC

A fully containerized voice assistant with wake word detection, speech-to-text, text-to-speech, and n8n automation workflows. Initially designed for Windows/WSL2 Docker environment, deployable to Raspberry Pi 5.

## Features

- 🎙️ **Wake Word Detection** - "Hey Pi" activation using browser-based detection
- 🗣️ **Speech-to-Text** - OpenAI Whisper for accurate transcription  
- 🔊 **Text-to-Speech** - Piper neural TTS for natural voice synthesis
- 🔄 **Workflow Automation** - n8n for orchestrating complex actions
- 📷 **Vision Capabilities** - Optional camera integration for object detection
- 🐳 **Fully Containerized** - Everything runs in Docker for easy deployment

## Quick Start

### Prerequisites

- Windows 10/11 with WSL2 enabled
- Docker Desktop installed and running
- Modern web browser (Chrome/Edge recommended)
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Pi
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Edit `.env` file and customize settings (especially passwords)

4. Start all services:
```bash
docker compose up -d
```

5. Wait for services to initialize (check logs):
```bash
docker compose logs -f
```

6. Access the services:
- **Web UI**: http://localhost:8080
- **n8n**: http://localhost:5678 (admin/changeme123)
- **STT API**: http://localhost:8000/docs
- **TTS API**: http://localhost:5000/health

## Usage

1. Open the Web UI at http://localhost:8080
2. Click "Start Listening" to begin
3. Say "Hey Pi" to activate
4. Speak your command
5. The assistant will process and respond

## Project Structure

```
Pi/
├── docker-compose.yml      # Main orchestration
├── .env                   # Environment configuration
├── services/              # Service-specific files
│   ├── n8n/              # Workflow automation
│   ├── stt/              # Speech-to-text
│   └── tts/              # Text-to-speech
├── web/                   # Browser UI
│   ├── index.html        # Main application
│   └── app.js            # Core JavaScript
├── tests/                 # Test files and utilities
│   ├── data/             # Test data files
│   │   ├── audio/        # Audio samples (.wav, .webm)
│   │   └── samples/      # Other test samples
│   ├── tools/            # Test utilities & debugging
│   │   ├── index.html    # Test tools directory
│   │   ├── mic_test.html # Basic microphone test
│   │   ├── mic_test_fixed.html # Enhanced mic diagnostics
│   │   ├── debug.html    # Debug dashboard
│   │   ├── debug.js      # Dashboard JavaScript
│   │   └── test_record.html # Audio recorder
│   ├── integration/      # Integration tests
│   └── unit/             # Unit tests
├── docs/                  # Documentation
├── CLAUDE.md             # AI assistant context
└── MAIN_PLAN.md          # Implementation plan
```

## Service Health Check

Run the health check script:
```bash
./scripts/test-services.sh
```

Or manually check each service:
```bash
# Check n8n
curl http://localhost:5678/healthz

# Check STT
curl http://localhost:8000/health

# Check TTS  
curl http://localhost:5000/health

# Check Web UI
curl http://localhost:8080
```

## Troubleshooting

### Services not starting
- Check Docker Desktop is running
- Verify ports are not in use: `netstat -an | grep LISTEN`
- Check logs: `docker compose logs [service-name]`

### Audio not working
- Ensure browser has microphone permissions
- Check browser console for errors (F12)
- Verify STT/TTS services are healthy

### n8n connection refused
- Wait for n8n to fully initialize (can take 30-60 seconds)
- Check credentials in `.env` file
- Verify port 5678 is not blocked

## Development

### Adding new workflows
1. Access n8n at http://localhost:5678
2. Create new workflow
3. Use webhook trigger for voice commands
4. Export and save to `services/n8n/workflows/`

### Modifying services
- Edit service files in `services/` directory
- Rebuild if needed: `docker compose build [service]`
- Restart service: `docker compose restart [service]`

### Testing

#### Test Tools
Access the test tools dashboard at http://localhost:8080/tests/tools/

Available tools:
- **Microphone Test**: Basic and enhanced microphone diagnostics
- **Debug Dashboard**: Monitor all services and system status
- **Audio Recorder**: Create test audio samples

#### Test Data
Pre-recorded audio samples are available in `tests/data/audio/`:
- `test.wav` - Basic audio test file
- `test_speech.wav` - Speech sample for STT testing
- `test_noise.webm` - Background noise sample
- `test_response.wav` - TTS response sample

#### API Testing
```bash
# Test STT with sample file
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F "audio=@tests/data/audio/test_speech.wav" \
  -F "model=small.en"

# Test TTS
curl -X POST http://localhost:5000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from Docker"}' \
  --output response.wav
```

## Deployment to Raspberry Pi

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed Pi deployment instructions.

Key differences:
- Use ARM64 compatible images
- Direct hardware audio access (no browser needed)
- GPIO and camera ribbon support
- Performance optimizations for Pi hardware

## Contributing

1. Follow the development workflow in CLAUDE.md
2. Update MAIN_PLAN.md with progress
3. Test thoroughly before committing
4. Document any new features

## License

This is a proof of concept project for educational purposes.

## Support

- Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues
- Review MAIN_PLAN.md for implementation details
- Consult CLAUDE.md for development guidelines

---
*Built with Docker, n8n, Whisper, and Piper*