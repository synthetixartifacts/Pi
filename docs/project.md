# Pi Voice Assistant POC Project

## Executive Summary
Build a Proof of Concept for an always-listening voice assistant with vision capabilities, fully containerized in Docker, initially running on Windows/WSL2, then deployable to Raspberry Pi 5.

## Project Goals

### Primary Objectives
1. **Voice Interface**: Wake word detection ("Hey Pi") with continuous listening capability
2. **Speech Processing**: Real-time STT (Speech-to-Text) and TTS (Text-to-Speech)
3. **Automation Hub**: n8n workflow engine for orchestrating actions and integrations
4. **Vision Capabilities**: Camera integration for object detection and scene analysis
5. **Full Containerization**: Everything runs in Docker for portability and isolation

### Development Approach
- **Phase 1**: Windows/WSL2 Docker POC (current focus)
- **Phase 2**: Raspberry Pi 5 deployment (future)
- **Architecture**: Microservices with Docker Compose orchestration
- **Interface**: Browser-based UI for audio/video capture (bypasses Docker audio limitations)

## Technical Architecture

### Core Services

#### 1. n8n Workflow Engine
- **Purpose**: Central automation brain
- **Image**: `n8nio/n8n:latest`
- **Port**: 5678
- **Function**: Orchestrates all interactions between services

#### 2. Speech-to-Text (STT)
- **Engine**: OpenAI Whisper
- **Implementation**: faster-whisper-server
- **API**: OpenAI-compatible REST endpoint
- **Port**: 9000
- **Model**: Small (balanced for speed/accuracy)

#### 3. Text-to-Speech (TTS)
- **Engine**: Piper Neural TTS
- **Implementation**: piper-http server
- **Port**: 5000
- **Features**: Multiple voices, real-time synthesis

#### 4. Wake Word Detection
- **Options**: 
  - Porcupine (commercial, high accuracy)
  - openWakeWord (open source alternative)
- **Implementation**: Browser-based WASM for POC
- **Wake Phrase**: "Hey Pi" (customizable)

#### 5. Web Interface
- **Purpose**: Audio/video capture bridge
- **Technology**: HTML5 + JavaScript
- **Port**: 8080
- **Features**: getUserMedia API for mic/camera access

#### 6. Vision Processing (Optional)
- **Engine**: YOLO or similar
- **Purpose**: Object detection, scene analysis
- **Implementation**: Containerized Python service

### System Flow
```
1. Browser captures audio via microphone
2. Wake word detection triggers recording
3. Audio sent to STT service
4. Text command sent to n8n
5. n8n processes and routes command
6. Response generated and sent to TTS
7. Audio played back in browser
8. Optional: Camera frames processed for vision tasks
```

## POC Limitations & Solutions

### Windows/Docker Audio Challenges
- **Problem**: Docker Desktop cannot directly access Windows audio devices
- **Solution**: Browser-based UI handles all audio I/O, communicates with containers via HTTP

### Resource Constraints
- **Consideration**: Simulate Pi-like resources with Docker CPU/memory limits
- **Testing**: Use `--cpus=4 --memory=4g` to approximate Pi 5 performance

## Implementation Requirements

### Development Environment
- Windows 10/11 with WSL2
- Docker Desktop
- Modern web browser (Chrome/Edge recommended)
- Git for version control

### Network Ports
- 5678: n8n web interface
- 9000: STT API
- 5000: TTS API  
- 8080: Web UI
- Additional ports for optional services

## Success Criteria

### Minimum Viable POC
1. ✓ Wake word triggers recording
2. ✓ Speech converted to text accurately
3. ✓ n8n receives and processes commands
4. ✓ TTS generates natural speech response
5. ✓ Complete loop works reliably

### Enhanced Features
- Vision processing integration
- Multiple wake words
- Custom n8n workflows
- Performance metrics dashboard

## Migration Path to Raspberry Pi

### Key Differences
1. **Architecture**: ARM64 vs x86_64 (most images have both)
2. **Audio**: Direct hardware access on Pi (no browser needed)
3. **Performance**: Real hardware constraints
4. **Peripherals**: GPIO, camera ribbon, DSI display

### Deployment Strategy
1. Use multi-architecture Docker images where possible
2. Maintain same docker-compose structure
3. Replace browser UI with native Python audio capture
4. Add Pi-specific optimizations

## Project Timeline

### Week 1: Foundation (Current)
- [x] Setup CLAUDE.md documentation
- [x] Create clean project structure
- [ ] Develop comprehensive MAIN_PLAN.md
- [ ] Initial Docker configuration

### Week 2: Core Services
- [ ] Deploy n8n container
- [ ] Setup STT service
- [ ] Setup TTS service
- [ ] Create web UI

### Week 3: Integration
- [ ] Wake word detection
- [ ] Service interconnection
- [ ] Basic n8n workflows
- [ ] End-to-end testing

### Week 4: Enhancement
- [ ] Vision capabilities
- [ ] Performance optimization
- [ ] Documentation
- [ ] Pi deployment prep

## References

### Documentation
- [n8n Docker Setup](https://docs.n8n.io/hosting/installation/docker/)
- [Faster Whisper](https://github.com/guillaumekln/faster-whisper)
- [Piper TTS](https://github.com/rhasspy/piper)
- [Porcupine Wake Word](https://picovoice.ai/platform/porcupine/)
- [Docker Compose](https://docs.docker.com/compose/)

### Community Resources
- [Rhasspy Voice Assistant](https://rhasspy.readthedocs.io/)
- [Home Assistant Voice](https://www.home-assistant.io/voice_control/)
- [Raspberry Pi Forums](https://www.raspberrypi.com/forums/)

## Risk Mitigation

### Technical Risks
1. **Audio Latency**: Mitigated by local processing
2. **Resource Usage**: Monitor and optimize container limits
3. **Service Failures**: Implement health checks and auto-restart
4. **Browser Compatibility**: Test across multiple browsers

### Development Risks
1. **Scope Creep**: Stick to POC objectives
2. **Complexity**: Start simple, iterate
3. **Dependencies**: Use stable, maintained images

---
*Last Updated: 2025-09-12*
*Original concept preserved in `/docs/project_backup.md`*