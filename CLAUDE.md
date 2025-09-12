# CLAUDE.md - Pi Voice Assistant POC

## Project Overview
**Mission**: Build a Proof of Concept for an always-listening voice assistant with vision capabilities, running entirely in Docker containers on Windows (WSL2), then deployable to Raspberry Pi 5.

**Core Functionality**:
- Wake word detection ("Hey Pi")
- Speech-to-Text (STT) for voice commands
- Text-to-Speech (TTS) for responses
- n8n workflow automation
- Vision/camera processing capabilities
- Fully containerized architecture

## Technology Stack
- **Container Platform**: Docker (Docker Desktop on Windows/WSL2)
- **Orchestration**: Docker Compose 
- **Workflow Engine**: n8n (latest)
- **STT**: Whisper (via faster-whisper-server)
- **TTS**: Piper (neural text-to-speech)
- **Wake Word**: Porcupine or openWakeWord
- **Vision**: YOLO/OpenCV (optional)
- **Languages**: Python 3.11+, JavaScript/Node.js
- **Target Platform**: Windows (POC) → Raspberry Pi 5 (Production)

## Architecture
```
/home/tommy/Project/Pi/
├── CLAUDE.md           # This file
├── MAIN_PLAN.md        # Detailed implementation plan (to be created)
├── docker-compose.yml  # Main orchestration file
├── docs/
│   ├── project.md      # Original project specification
│   └── project_backup.md # Backup of original
├── services/           # Individual service configurations
│   ├── n8n/
│   ├── stt/
│   ├── tts/
│   └── wake-word/
├── web/                # Web UI for browser-based interaction
│   └── index.html
└── README.md           # How to run the project
```

## Key Development Commands

### Docker Commands
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f [service_name]

# Stop all services
docker compose down

# Rebuild specific service
docker compose build [service_name]

# Clean everything (including volumes)
docker compose down -v
```

### Service Access Points
- **n8n**: http://localhost:5678
- **STT API**: http://localhost:9000/v1/audio/transcriptions
- **TTS API**: http://localhost:5000/api/tts
- **Web UI**: http://localhost:8080

## Development Workflow

**IMPORTANT**: Follow this strict workflow for all changes:

1. **Plan** → Document changes in MAIN_PLAN.md
2. **Implement** → Write code following existing patterns
3. **Test** → Verify each service works independently
4. **Integrate** → Connect services via n8n workflows
5. **Document** → Update README.md with any new setup steps

## Coding Standards

### Docker/Container Rules
- **ALWAYS** use specific image tags (never `:latest` in production)
- **ALWAYS** include health checks for services
- **ALWAYS** use environment variables for configuration
- Mount volumes for persistent data
- Use networks for inter-container communication

### Python Code
- Use type hints for all functions
- Follow PEP 8 style guide
- Handle exceptions gracefully
- Log important events

### File Organization
- Keep service-specific code in `/services/[service-name]/`
- Shared utilities go in `/services/shared/`
- Configuration files use `.env` pattern

## Testing Guidelines

### Service Testing
1. Test each container individually first
2. Use curl/httpie for API endpoint testing
3. Verify inter-service communication
4. Check resource usage (CPU/Memory)

### Integration Testing
- Test wake word → STT → n8n → TTS pipeline
- Verify webhook triggers in n8n
- Test error handling and recovery

## Important Project Behaviors

### WSL2 Considerations
- Audio passthrough limitations require browser-based UI for microphone access
- Use `\\wsl$\Ubuntu\home\tommy\Project\Pi` to access from Windows
- Docker Desktop handles WSL2 integration automatically

### Service Dependencies
- n8n must start before webhook-dependent services
- STT/TTS services should have retry logic
- Wake word detection runs continuously

### Performance Notes
- Whisper "small" model balances accuracy vs speed
- Piper TTS is real-time capable
- Vision processing may need GPU acceleration in production

## Current Development Status

**Primary Developer**: Claude (AI Assistant)
**Project Phase**: Initial Setup & Planning
**Current Focus**: Creating comprehensive implementation plan

## Critical Rules

**YOU MUST**:
- Always check service health before integration
- Document any deviations from the plan
- Keep containers stateless (use volumes for state)
- Test on Windows/Docker before claiming completion

**NEVER**:
- Hardcode credentials or API keys
- Assume services are running - always verify
- Skip documentation updates
- Use deprecated or unmaintained images

## Quick Reference

### Check if services are healthy
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### View n8n workflows
Open: http://localhost:5678 (admin/change-me)

### Test STT
```bash
curl -X POST http://localhost:9000/v1/audio/transcriptions \
  -F "file=@test.wav" \
  -F "model=small"
```

### Test TTS
```bash
curl -X POST http://localhost:5000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from Docker"}' \
  --output response.wav
```

## Next Steps
1. Complete MAIN_PLAN.md with detailed implementation steps
2. Set up docker-compose.yml with all services
3. Create web UI for browser-based interaction
4. Implement n8n workflows
5. Test complete pipeline
6. Document deployment to Raspberry Pi

---
*Last Updated: 2025-09-12*
*Remember: This is a living document - update it as the project evolves*