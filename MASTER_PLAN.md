# MASTER PLAN - Pi Voice Assistant POC

## Project Overview & Goal

Build a fully containerized voice assistant POC that:
- Detects wake word ("Hey Pi") 
- Converts speech to text using Whisper STT
- Processes commands via n8n workflows
- Responds with synthesized speech using Piper TTS
- Achieves < 2 second end-to-end latency
- Runs on Windows/WSL2 Docker environment with future Raspberry Pi deployment

**Target Architecture:**
```
Browser (Web UI) → nginx (port 8080) → Services:
    - STT (port 8000) - Whisper faster-whisper-server
    - TTS (port 5000) - Piper custom wrapper  
    - n8n (port 5678) - Workflow automation
```

---

## Current Status Dashboard

### What's Working ✅
- **Docker Infrastructure**: All containers running (n8n v1.110.1, STT, TTS, nginx)
- **Service Health**: All services responding to health checks
- **TTS Service**: Generating valid WAV audio files (300-500ms response time)
- **nginx Reverse Proxy**: CORS configured, routing working
- **Debug Dashboard**: Comprehensive debugging interface at http://localhost:8080/debug.html
- **Browser Audio Recording**: WebM/Opus format recording (duration correct)
- **STT Service Backend**: Works perfectly with test audio files (both WAV and WebM)

### What's NOT Working ❌
- **STT Transcription**: Returns empty/partial results (".. Thank you" only)
- **Root Cause**: Browser recording silence - microphone permission/audio constraints issue
- **End-to-End Pipeline**: Not tested due to STT issue
- **Wake Word Detection**: Only text-based matching implemented
- **n8n Integration**: Service running but no workflows created

### Performance Metrics
- **STT Response**: ~800-1200ms (when working with valid audio)
- **TTS Response**: ~300-500ms (working correctly)
- **Current Total**: ~4-5 seconds (not optimized)
- **Target**: < 2 seconds total latency

---

## Critical Issues & Blockers

### Issue #1: STT Transcription Failure (CRITICAL)
**Status**: Root cause identified
**Problem**: Browser recording silence instead of speech
**Evidence**: 
- STT service works with test speech files
- Browser sends valid WebM files but contain no audio content
- Duration correct (3-4 seconds) but no speech captured

**Debug Tools Available**:
- Enhanced debug dashboard at http://localhost:8080/debug.html
- Microphone test page at http://localhost:8080/mic_test.html
- Audio level monitoring and WebM download for inspection

**Next Actions**:
1. Test microphone permissions and browser settings
2. Verify correct audio device selection
3. Check audio constraints (disable echo cancellation if needed)
4. Test with different browsers

### Issue #2: Wake Word Detection Not Implemented
**Status**: Deferred until STT works
**Current**: Only text matching "hey pi" in transcription
**Options**: OpenWakeWord backend, button trigger (MVP), or continuous recording

### Issue #3: Missing n8n Workflows
**Status**: Service running, no workflows
**Needed**: Webhook endpoint `/webhook/voice-command` for command processing

---

## Completed Work (Chronological)

### Phase 1: Foundation Setup ✅
- Project structure created with proper Docker orchestration
- Git repository initialized with appropriate .gitignore
- Documentation framework established

### Phase 2: Core Services Implementation ✅
- **Docker Environment**: All services deployed and configured
  - n8n v1.110.1 with basic auth (admin/changeme123)
  - faster-whisper-server STT with small.en model
  - Custom Piper TTS wrapper with HTTP API
  - nginx reverse proxy with CORS

- **Custom TTS Service**: HTTP wrapper for Piper TTS created
- **Web UI**: Basic interface with audio recording capabilities
- **Debug Dashboard**: Comprehensive debugging interface created

### Phase 3: Integration & Testing ✅ (Partial)
- **Service Integration**: All services communicating through nginx proxy
- **Audio Pipeline**: Browser → WebM recording implemented
- **Debug Tools**: Enhanced monitoring and testing capabilities
- **Root Cause Analysis**: STT issue diagnosed as browser audio capture problem

---

## Active Tasks

### Priority 1: Fix STT Issue
- [ ] Test microphone permissions and browser settings
- [ ] Verify audio device selection in browser
- [ ] Test with different audio constraints
- [ ] Validate with mic_test.html page
- [ ] Check browser console for permission errors

### Priority 2: Complete Basic Pipeline
- [ ] Get recording → STT working with real speech
- [ ] Test STT → command processing flow
- [ ] Generate appropriate TTS responses
- [ ] Implement audio playback in browser

### Priority 3: Create n8n Workflows
- [ ] Access n8n at http://localhost:5678
- [ ] Create webhook node at `/webhook/voice-command`
- [ ] Implement command routing (weather, time, hello)
- [ ] Return JSON responses with TTS text

---

## Next Steps

### Immediate (Current Iteration)
1. **Resolve STT Issue**: Use debug tools to fix browser audio capture
2. **Test End-to-End**: Record → STT → TTS → Playback
3. **Basic Commands**: Implement 3-5 simple voice commands via n8n

### Short Term (Next 2-3 Iterations)
1. **Wake Word Implementation**: Choose between button trigger (MVP) vs OpenWakeWord
2. **Performance Optimization**: Achieve < 2 second latency target
3. **Error Handling**: Robust error handling and user feedback

### Medium Term (Future Iterations)
1. **Enhanced Features**: Multi-wake-word support, conversation context
2. **Polish & UX**: Professional interface, mobile responsiveness
3. **Raspberry Pi Prep**: ARM64 compatibility, resource optimization

---

## Technical Details

### Service Endpoints (via nginx proxy)
- **STT**: `http://localhost:8080/api/stt/v1/audio/transcriptions`
- **TTS**: `http://localhost:8080/api/tts/api/tts`
- **n8n**: `http://localhost:8080/api/n8n/webhook/*`
- **Health Checks**: `/api/stt/health`, `/api/tts/health`, `/api/n8n/healthz`

### Audio Specifications
- **Browser Recording**: WebM with Opus codec, 16kHz mono
- **STT Input**: Accepts WAV, WebM, MP3 (Whisper flexible)
- **TTS Output**: WAV 22050Hz mono 16-bit PCM
- **Target Sample Rate**: 16kHz for STT processing

### Docker Configuration
- **Network**: Internal `pi-network` for service communication
- **Containers**: `pi-n8n`, `pi-stt`, `pi-tts`, `pi-web`
- **Volumes**: Persistent storage for n8n data and model caches
- **Health Checks**: Automated monitoring for all services

### Key Commands
```bash
# Quick health check
curl http://localhost:8080/api/stt/health
curl http://localhost:8080/api/tts/health
curl http://localhost:8080/api/n8n/healthz

# Test TTS (working)
curl -X POST http://localhost:8080/api/tts/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}' \
  --output test.wav

# Test STT (needs fixing)
curl -X POST http://localhost:8080/api/stt/v1/audio/transcriptions \
  -F "file=@test.wav" \
  -F "model=small.en"

# Container management
docker compose ps
docker compose logs stt --tail=100
```

---

## Iteration History

### Iteration 1: Validate Core Services ✅ 
**Completed**: Service deployment and basic testing
**Duration**: 45 minutes
**Key Achievements**: All Docker services running and responsive

### Iteration 2: Fix Web-to-Service Communication ✅
**Completed**: CORS configuration and proxy setup
**Duration**: 45 minutes  
**Key Achievements**: Browser can communicate with backend services

### Iteration 3: Debug STT Issue ✅ (Root Cause Found)
**Status**: Root cause identified, solution in progress
**Duration**: 45 minutes
**Key Findings**: STT works perfectly, browser audio capture is the issue
**Tools Created**: Debug dashboard, microphone test pages, enhanced monitoring

### Planned Iterations 4-10
- Basic Command Processing (STT → n8n → TTS)
- Wake Word Detection Implementation
- Audio Playback & Response Handling
- Error Handling & Resilience
- Performance Optimization (< 2s latency)
- Polish & UX Improvements
- Integration Testing & Validation

---

## Resources & References

### Essential URLs
- **Main UI**: http://localhost:8080
- **Debug Dashboard**: http://localhost:8080/debug.html
- **n8n Admin**: http://localhost:5678 (admin/changeme123)
- **Microphone Test**: http://localhost:8080/mic_test.html

### Key Files
- `docker-compose.yml` - Service orchestration
- `web/debug.html` & `web/debug.js` - Debug interface
- `web/app.js` - Main voice assistant logic
- `web/nginx.conf` - Proxy configuration with CORS
- `services/tts/` - Custom TTS wrapper

### Documentation
- `docs/API.md` - Service API documentation
- `docs/howto/local_run.md` - Step-by-step commands
- `docs/TROUBLESHOOTING.md` - Common issues and solutions

### External References
- [n8n Docker Guide](https://docs.n8n.io/hosting/installation/docker/)
- [Faster Whisper API](https://github.com/fedirz/faster-whisper-server)  
- [Piper TTS](https://github.com/rhasspy/piper)
- [Rhasspy Community](https://community.rhasspy.org/)

---

## Success Criteria

### Minimum Viable POC
- [ ] User can record voice input (via button or wake word)
- [ ] Speech is accurately transcribed to text
- [ ] n8n processes at least 3 command types (hello, weather, time)
- [ ] Response is synthesized and played back to user
- [ ] Complete cycle works 3 times consecutively

### Performance Targets
- **Memory Usage**: < 4GB total
- **Response Time**: < 2 seconds end-to-end
- **STT Accuracy**: > 90% for clear speech
- **TTS Quality**: Clear, understandable speech
- **Uptime**: > 99% during testing sessions

### Stretch Goals
- Wake word detection working (vs button trigger)
- < 1 second response time
- 10+ command types supported
- Conversation context maintained
- Mobile browser compatibility

---

## Risk Management

### Technical Risks
1. **Audio Compatibility**: Browser audio formats vs service expectations
   - *Mitigation*: Multiple format support, server-side conversion
2. **WSL2 Limitations**: No direct audio playback
   - *Mitigation*: Browser-based audio handling only
3. **Performance Bottlenecks**: Multiple service hops
   - *Mitigation*: Profiling, optimization, service prewarming

### Operational Risks  
1. **Service Failures**: Container crashes or network issues
   - *Mitigation*: Health checks, auto-restart policies, graceful degradation
2. **Development Complexity**: Feature creep vs POC goals
   - *Mitigation*: Iterative approach, clear success criteria

### Fallback Plans
- If wake word detection fails → Use button activation
- If latency too high → Use tiny.en Whisper model  
- If browser issues persist → Server-side audio processing
- If n8n complex → Simple command parsing logic

---

## Notes for Continuation

### Current Blocker Resolution
The main issue is browser microphone capture. The STT service itself works perfectly. Use the debug dashboard at http://localhost:8080/debug.html to:
1. Test microphone permissions
2. Verify audio recording levels
3. Download recorded WebM files for inspection
4. Check browser console for errors

### Development Philosophy
- **Debug Visibility**: More important than UI polish
- **Small Iterations**: Test each component before integration
- **POC Quality**: Functional over production-ready
- **Clear Logging**: All operations should be visible in debug dashboard

### When Resuming Work
1. Verify all services are running: `docker compose ps`
2. Open debug dashboard: http://localhost:8080/debug.html
3. Test current audio capture issue
4. Update this document with progress and findings

---

*This master plan consolidates all previous planning documents and provides a single source of truth for the Pi Voice Assistant POC project. Update this document as the project evolves.*